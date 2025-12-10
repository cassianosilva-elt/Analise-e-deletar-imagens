import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, VerificationItemType, VERIFICATION_ITEMS } from "../types";

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
    default:
      return '';
  }
};

export const analyzeFolderImages = async (
  folderName: string,
  files: File[],
  model: GeminiModel = 'gemini-flash-latest',
  selectedItems: VerificationItemType[] = ['abrigo']
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

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      Você é um auditor de obras da Eletromidia.
      Analise as imagens da pasta: "${folderName}".
      
      ITENS A VERIFICAR: ${selectedLabels}

      CRITÉRIOS DE VERIFICAÇÃO:
      ${itemCriteria}

      LÓGICA DE AVALIAÇÃO:
      - Status "COMPLETED": TODOS os itens selecionados foram encontrados e estão OK nas imagens
      - Status "PENDING": Um ou mais itens NÃO foram encontrados ou estão incompletos
      
      IMPORTANTE:
      - Analise apenas os itens listados acima
      - Na dúvida sobre um item específico, se houver evidência parcial, considere como presente
      - Selecione até 3 fotos que melhor demonstrem os itens verificados

      SAÍDA JSON:
      {
        "status": "COMPLETED" | "PENDING",
        "selectedFiles": ["arquivo1.jpg", "arquivo2.jpg", "arquivo3.jpg"],
        "reason": "Explicação curta em PT-BR indicando quais itens foram encontrados e quais estão faltando."
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
            reason: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AIAnalysisResult;
    return result;

  } catch (error: any) {
    console.error("Error analyzing folder:", error);
    return {
      folderName,
      status: 'PENDING',
      selectedFiles: [],
      reason: `Erro: ${error.message || "Falha desconhecida na API"}`
    };
  }
};