/// <reference types="vite/client" />
import { AIAnalysisResult, VerificationItemType, VERIFICATION_ITEMS, EquipmentInfo } from "../types";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Get API key from environment
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Helper to resize and convert File to Base64
const resizeAndEncodeImage = (file: File | Blob, maxSize = 1024): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file instanceof File ? file : new File([file], 'image.jpg'));
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height *= maxSize / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width *= maxSize / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl.split(',')[1]);
      } else {
        reject(new Error("Canvas context failed"));
      }
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};

const cropImage = async (file: File, cropX: number, cropY: number, cropW: number, cropH: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 800;
      if (ctx) {
        ctx.drawImage(img, img.width * cropX, img.height * cropY, img.width * cropW, img.height * cropH, 0, 0, 800, 800);
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      } else reject("Canvas error");
    };
    img.onerror = reject;
  });
};

export const generateImageVariations = async (file: File): Promise<{ name: string, data: string }[]> => {
  const original = await resizeAndEncodeImage(file);
  const bottomCrop = await cropImage(file, 0, 0.6, 1, 0.4);
  const sideCrop = await cropImage(file, 0, 0, 0.4, 1);

  return [
    { name: `orig_${file.name}`, data: original },
    { name: `crop_base_${file.name}`, data: bottomCrop },
    { name: `crop_wiring_${file.name}`, data: sideCrop }
  ];
};

export type GeminiModel = 'gemini-flash-latest' | 'gemini-flash-lite-latest';

const getItemCriteria = (itemType: VerificationItemType): string => {
  switch (itemType) {
    case 'abrigo':
      return `ABRIGO DE ÔNIBUS:
      - Verificar se o abrigo está montado/instalado (estrutura metálica + teto + lateral/vidros)
      - NÃO precisa estar 100% perfeito. Se estiver claramente pronto para uso, considere OK
      - Pequenas imperfeições ou lixo NÃO impedem a aprovação`;
    case 'luminaria':
      return `LUMINÁRIAS:
      - Verificar se há luminárias instaladas na estrutura do abrigo
      - Podem ser luminárias internas (iluminação do abrigo) ou externas
      - Verificar se parecem estar funcionais (não quebradas)`;
    case 'totem_estatico':
      return `TOTEM ESTÁTICO:
      - Verificar se há totem publicitário estático (sem tela digital)
      - Geralmente é um painel vertical com espaço para cartaz/banner
      - Pode estar integrado ao abrigo ou separado`;
    case 'totem_digital':
      return `TOTEM DIGITAL:
      - Verificar se há totem publicitário digital (com tela/display)
      - Geralmente é uma tela vertical para exibição de conteúdo digital
      - Pode estar ligado ou desligado`;
    case 'fundacao':
      return `FUNDAÇÃO/BASE:
      - Verificar se a fundação/base da estrutura está visível e completa
      - Pode ser base de concreto, metal ou outro material
      - Verificar se parece estável e bem instalada`;
    case 'eletrica':
      return `ELÉTRICA (ALTA e BAIXA) - ITEM CRÍTICO E PRIORITÁRIO:
       *** REGRA DE OURO: A ELÉTRICA É INDEPENDENTE DO ABRIGO ***
       - Verifique a elétrica (fios/cabos) COMO SE O ABRIGO NÃO EXISTISSE.
       - Mesmo que o abrigo esteja quebrado, incompleto, ou seja apenas uma base de concreto: SE TIVER FIO, A ELÉTRICA ESTÁ FEITA (COMPLETED).
       1. ELÉTRICA ALTA (POSTE/REDE AÉREA):
       - FOCO TOTAL NO TOPO DO POSTE. Procure por fios pretos (drop) que saem da rede da rua e conectam no poste do abrigo.
       - Se houver QUALQUER fio chegando do ar e conectando no poste, CONSIDERE FEITA (COMPLETED).
       2. ELÉTRICA BAIXA (BASE/FUNDAÇÃO):
       - FOCO NA BASE DO ABRIGO. Procure por fios, cabos ou eletrodutos saindo do chão/concreto.
       - Se houver fios visíveis na base (mesmo sem abrigo montado), CONSIDERE FEITA (COMPLETED).`;
    default:
      return '';
  }
};

// Direct Gemini API call (fallback when Supabase proxy is not available)
const callGeminiDirect = async (model: string, contents: any[], config: any, signal?: AbortSignal) => {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY não configurada no .env.local');
  }

  const modelName = model === 'gemini-flash-latest' ? 'gemini-1.5-flash-latest' : 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: config || {}
    }),
    signal
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { text };
};

// Try Supabase proxy first, fallback to direct API
const callGeminiApi = async (model: string, contents: any[], config: any, signal?: AbortSignal) => {
  // If Supabase is configured, try the proxy first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { model, contents, config }
      });

      if (!error && data?.text) {
        return data;
      }
      console.warn('[Gemini] Proxy failed, falling back to direct API:', error);
    } catch (e) {
      console.warn('[Gemini] Proxy error, falling back to direct API:', e);
    }
  }

  // Fallback to direct API call
  return callGeminiDirect(model, contents, config, signal);
};

export const analyzeFolderImages = async (
  folderName: string,
  files: File[],
  model: GeminiModel = 'gemini-flash-latest',
  selectedItems: VerificationItemType[] = ['abrigo'],
  equipmentInfo?: EquipmentInfo,
  signal?: AbortSignal
): Promise<AIAnalysisResult> => {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    return {
      folderName,
      status: 'PENDING',
      selectedFiles: [],
      reason: "Pasta vazia ou sem imagens."
    };
  }

  const baseFiles = imageFiles.slice(0, 2);
  const otherFiles = imageFiles.slice(2, 4);

  const selectedLabels = selectedItems.map(id => {
    const item = VERIFICATION_ITEMS.find(v => v.id === id);
    return item?.label || id;
  }).join(', ');

  const itemCriteria = selectedItems.map(item => getItemCriteria(item)).join('\n\n');

  const MAX_RETRIES = 3;
  const INITIAL_DELAY = 1000;

  const delayWait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (signal?.aborted) throw new Error("Cancelled");

      console.log(`[Gemini] Analisando pasta: "${folderName}" (tentativa ${attempt + 1})...`);

      const equipmentContext = equipmentInfo ? `
        INFORMAÇÕES DO EQUIPAMENTO:
        - Endereço: ${equipmentInfo.endereco}, ${equipmentInfo.bairro}
        - Modelo: ${equipmentInfo.modeloAbrigo}
        - Tipo: ${equipmentInfo.tipoEquipamento}
      ` : '';

      const prompt = `
        Você é um auditor de obras da Eletromidia.
        Analise a pasta: "${folderName}".
        ${equipmentContext}
        ITENS SELECIONADOS: ${selectedLabels}

        CRV (Critérios de Resposta Visual):
        ${itemCriteria}

        REGRAS CRÍTICAS PARA ELÉTRICA (PRIORIDADE MÁXIMA):
        1. Se houver QUALQUER fio ou cabo visivelmente conectado ao poste, base ou abrigo -> status = CONCLUIDA.
        2. NÃO confunda fios com: SOMBRAS, RACHADURAS, GALHOS ou LINHAS PINTADAS.
        3. Exija evidência visual OBJETIVA.
        
        RETORNO OBRIGATÓRIO (JSON):
        {
          "status": "COMPLETED" | "PENDING",
          "reason": "Resumo objetivo",
          "selectedFiles": ["nome_do_arquivo"],
          "eletrica": {
            "status": "CONCLUIDA" | "NAO_CONCLUIDA",
            "confidence": 0.0 a 1.0,
            "evidence": ["descrição curta"],
            "imagesUsed": [índices das imagens na lista enviada]
          }
        }
      `;

      const contents = [{ role: 'user', parts: [{ text: prompt }] }];

      for (const file of baseFiles) {
        const variations = await generateImageVariations(file);
        for (const v of variations) {
          contents[0].parts.push({
            inlineData: { mimeType: 'image/jpeg', data: v.data }
          } as any);
          contents[0].parts.push({ text: `Arquivo: ${v.name}` } as any);
        }
      }

      for (const file of otherFiles) {
        const data = await resizeAndEncodeImage(file);
        contents[0].parts.push({
          inlineData: { mimeType: 'image/jpeg', data }
        } as any);
        contents[0].parts.push({ text: `Arquivo: ${file.name}` } as any);
      }

      if (signal?.aborted) throw new Error("Cancelled");

      const data = await callGeminiApi(model, contents, { responseMimeType: "application/json" }, signal);

      if (signal?.aborted) throw new Error("Cancelled");

      const result = JSON.parse(data.text) as AIAnalysisResult;
      result.folderName = folderName;
      return result;

    } catch (error: any) {
      if (error.message === "Cancelled") throw error;

      const isRetryable = error.message?.includes('429') || error.message?.includes('503') || attempt < MAX_RETRIES;
      if (isRetryable && attempt < MAX_RETRIES) {
        console.warn(`[Gemini] Tentativa ${attempt + 1} falhou, aguardando retry...`);
        await delayWait(INITIAL_DELAY * Math.pow(2, attempt));
        continue;
      }

      console.error(`[Gemini] Erro na análise de ${folderName}:`, error);
      return {
        folderName,
        status: 'PENDING',
        selectedFiles: [],
        reason: `Erro: ${error.message || "Falha na análise"}`
      };
    }
  }

  return { folderName, status: 'PENDING', selectedFiles: [], reason: "Erro ao processar" };
};

export const sendChatMessage = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  context?: string
): Promise<string> => {
  const systemPrompt = "Você é um assistente inteligente e amigável da Eletromidia. Responda de forma DIRETA, CURTA e OBJETIVA.";

  const fullHistory: any[] = [
    { role: "user", parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Entendido!" }] },
    ...history
  ];

  const currentMessageParts = [{ text: message }];
  if (context) {
    currentMessageParts.push({ text: `\n\nCONTEXTO:\n${context}` });
  }

  fullHistory.push({ role: "user", parts: currentMessageParts });

  try {
    const data = await callGeminiApi('gemini-flash-latest', fullHistory, {});
    return data.text || "Sem resposta.";
  } catch (error: any) {
    console.error("[Gemini] Erro no chat:", error);
    return "Ocorreu um erro ao processar sua mensagem.";
  }
};
