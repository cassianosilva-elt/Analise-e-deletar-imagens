import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, VerificationItemType, VERIFICATION_ITEMS, EquipmentInfo } from "../types";

// Helper to resize and convert File to Base64
const resizeAndEncodeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const MAX_SIZE = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
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

export type GeminiModel = 'gemini-flash-latest' | 'gemini-flash-lite-latest';

// Helper to generate item-specific criteria for the prompt
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
      return `ELÉTRICA (ALTA e BAIXA) - ITEM CRÍTICO E PRIORITÁRIO:
       
       *** REGRA DE OURO: A ELÉTRICA É INDEPENDENTE DO ABRIGO ***
       - Verifique a elétrica (fios/cabos) COMO SE O ABRIGO NÃO EXISTISSE.
       - Mesmo que o abrigo esteja quebrado, incompleto, ou seja apenas uma base de concreto: SE TIVER FIO, A ELÉTRICA ESTÁ FEITA (COMPLETED).
       
       1. ELÉTRICA ALTA (POSTE/REDE AÉREA):
       - FOCO TOTAL NO TOPO DO POSTE. Procure por fios pretos (drop) que saem da rede da rua e conectam no poste do abrigo.
       - Se houver QUALQUER fio chegando do ar e conectando no poste, CONSIDERE FEITA (COMPLETED).
       - NÃO importa se o abrigo embaixo está destruído. Tem fio no poste? Então está OK.
       - EVIDÊNCIA FOTOGRÁFICA OBRIGATÓRIA: Selecione a foto que mostra o TOPO do poste com os fios.

       2. ELÉTRICA BAIXA (BASE/FUNDAÇÃO):
       - FOCO NA BASE DO ABRIGO. Procure por fios, cabos ou eletrodutos saindo do chão/concreto.
       - Se houver fios visíveis na base (mesmo sem abrigo montado), CONSIDERE FEITA (COMPLETED).
       - EVIDÊNCIA FOTOGRÁFICA OBRIGATÓRIA: Selecione a foto que mostra a BASE com os fios.`;
    default:
      return '';
  }
};

export const analyzeFolderImages = async (
  folderName: string,
  files: File[],
  model: GeminiModel = 'gemini-flash-latest',
  selectedItems: VerificationItemType[] = ['abrigo'],
  equipmentInfo?: EquipmentInfo
): Promise<AIAnalysisResult> => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("API Key is missing in process.env");
    return {
      folderName,
      status: 'PENDING',
      selectedFiles: [],
      reason: "Erro: API Key não configurada."
    };
  }

  const imageFiles = files.filter(f => f.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    return {
      folderName,
      status: 'PENDING',
      selectedFiles: [],
      reason: "Pasta vazia ou sem imagens."
    };
  }

  const processedFiles = imageFiles.slice(0, 6);

  // Get labels for selected items
  const selectedLabels = selectedItems.map(id => {
    const item = VERIFICATION_ITEMS.find(v => v.id === id);
    return item?.label || id;
  }).join(', ');

  // Generate criteria for each selected item
  const itemCriteria = selectedItems.map(item => getItemCriteria(item)).join('\n\n');

  // Retry configuration - increased for handling overload
  const MAX_RETRIES = 5;
  const INITIAL_DELAY = 8000; // 8 seconds

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[IA] Analisando pasta: "${folderName}" (tentativa ${attempt + 1}/${MAX_RETRIES + 1})...`);
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Build equipment context section if available
      const equipmentContext = equipmentInfo ? `
        INFORMAÇÕES DO EQUIPAMENTO (da base de dados):
        - Endereço: ${equipmentInfo.endereco}, ${equipmentInfo.bairro}, ${equipmentInfo.cidade}-${equipmentInfo.estado}
        - Modelo de Abrigo: ${equipmentInfo.modeloAbrigo}
        - Tipo de Equipamento: ${equipmentInfo.tipoEquipamento || 'Não especificado'}
        - Painel Digital: ${equipmentInfo.painelDigital}
        - Painel Estático: ${equipmentInfo.painelEstatico}
        - Ponto: ${equipmentInfo.ponto}
        
        Use essas informações para contextualizar sua análise. O modelo de abrigo pode ajudar a identificar o tipo de estrutura esperada.
      ` : '';

      const prompt = `
        Você é um auditor de obras da Eletromidia.
        Analise as imagens da pasta: "${folderName}".
        ${equipmentContext}
        
        >>> ITENS SELECIONADOS PARA ANÁLISE: ${selectedLabels} <<<
        (IGNORE COMPLETAMENTE qualquer item que NÃO esteja listado acima. Ex: se "Abrigo" não está na lista, NÃO reclame de vidros quebrados, sujeira ou pichação. Fale APENAS sobre o que foi pedido.)

        CRITÉRIOS DETALHADOS DOS ITENS SELECIONADOS:
        ${itemCriteria}

        LÓGICA DE AVALIAÇÃO RÍGIDA:
        1. STATUS GERAL:
           - "COMPLETED": TODOS os itens listados acima foram encontrados conforme os critérios.
           - "PENDING": Pelo menos um item da lista está ausente ou incompleto.
        
        2. REGRA ESPECÍFICA DA ELÉTRICA:
           - Se o item "ELÉTRICA" foi solicitado:
             - Considere "COMPLETED" se houver evidência visual de RAMAL (Alta) OU INFRAESTRUTURA DE BASE (Baixa).
             - PENDING apenas se NENHUMA das duas existir.
             - É CRUCIAL selecionar a foto correta (poste para Alta, chão para Baixa). NÃO selecione foto geral do abrigo se ela não mostrar o fio.

        3. SELEÇÃO DE EVIDÊNCIAS (MUITO IMPORTANTE):
           - Selecione de 1 a 3 fotos que PROVEM o status.
           - Para ELÉTRICA, a foto TEM QUE MOSTRAR O FIO. Não serve foto da frente do abrigo. Busque fotos de detalhe, fotos olhando para cima (poste) ou para o chão.
           - Se status for COMPLETED, é OBRIGATÓRIO ter pelo menos 1 foto selecionada.

        SAÍDA JSON:
        {
          "status": "COMPLETED" | "PENDING",
          "selectedFiles": ["arquivo1.jpg", "arquivo2.jpg", "arquivo3.jpg"],
          "reason": "DEVE SEGUIR ESTRITAMENTE O PADRÃO: 'Após análise, <resumo>'. Ex: 'Após análise, foi identificado o ramal de ligação no poste (Elétrica Alta).', 'Após análise, identificada infraestrutura elétrica na base.'",
          "observation": "Observações estritamente sobre os itens analisados. Se analisou só elétrica, NÃO comente sobre avarias no abrigo."
        }
      `;

      const parts: any[] = [{ text: prompt }];

      for (const file of processedFiles) {
        try {
          const base64Data = await resizeAndEncodeImage(file);
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          });
          parts.push({ text: `Arquivo ID: ${file.name}` });
        } catch (e) {
          console.warn(`Failed to process file ${file.name}`, e);
        }
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          role: 'user',
          parts: parts
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, enum: ["COMPLETED", "PENDING"] },
              selectedFiles: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              reason: { type: Type.STRING },
              observation: { type: Type.STRING }
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error(`Sem resposta da IA para pasta "${folderName}"`);
      }

      const result = JSON.parse(text) as AIAnalysisResult;
      result.folderName = folderName;
      console.log(`[IA] Pasta "${folderName}" concluída: ${result.status}`);
      return result;

    } catch (error: any) {
      const isOverloaded = error?.message?.includes('503') ||
        error?.message?.includes('overloaded') ||
        error?.message?.includes('Sem resposta') ||
        error?.status === 503;

      // If it's an overload error or empty response and we have retries left, wait and retry
      if (isOverloaded && attempt < MAX_RETRIES) {
        const waitTime = INITIAL_DELAY * Math.pow(2, attempt); // Exponential backoff: 8s, 16s, 32s...
        console.log(`[IA] Erro na pasta "${folderName}", retentando em ${waitTime / 1000}s (tentativa ${attempt + 1}/${MAX_RETRIES})...`);
        await delay(waitTime);
        continue;
      }

      console.error(`[IA] Erro ao analisar pasta "${folderName}":`, error.message || error);
      return {
        folderName,
        status: 'PENDING',
        selectedFiles: [],
        reason: isOverloaded
          ? `Erro: API sobrecarregada após ${MAX_RETRIES} tentativas. Tente novamente mais tarde.`
          : `Erro: ${error.message || "Falha desconhecida na API"}`
      };
    }
  }

  // This should never be reached, but TypeScript needs it
  return {
    folderName,
    status: 'PENDING',
    selectedFiles: [],
    reason: "Erro: Número máximo de tentativas excedido."
  };
};

export const sendChatMessage = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  context?: string
): Promise<string> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("API Key não configurada");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const systemPrompt = "Você é um assistente inteligente e amigável da Eletromidia. \n\nIMPORTANTE: Responda de forma DIRETA, CURTA e OBJETIVA. Evite enrolação ou formalidades excessivas. Vá direto ao ponto da dúvida do usuário. Seja natural e prestativo, mas valorize o tempo do usuário com respostas concisas.";

  const fullHistory: any[] = [
    {
      role: "user",
      parts: [{ text: systemPrompt }]
    },
    {
      role: "model",
      parts: [{ text: "Entendido! Serei super natural, prestativo e humano nas respostas, como um colega de trabalho. Pode deixar comigo." }]
    },
    ...history
  ];

  const currentMessageParts = [{ text: message }];
  if (context) {
    currentMessageParts.push({ text: `\n\nCONTEXTO ATUAL DO USUÁRIO:\n${context}` });
  }

  fullHistory.push({
    role: "user",
    parts: currentMessageParts
  });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: fullHistory,
      config: {
        responseMimeType: "text/plain"
      }
    });

    return response.text || "Sem resposta.";
  } catch (error: any) {
    console.error("Erro no chat:", error);
    return "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.";
  }
};
