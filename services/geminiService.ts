import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

// Helper to resize and convert File to Base64
// This prevents "Payload Too Large" errors with high-res smartphone photos
const resizeAndEncodeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Resize to max 1024px (sufficient for AI analysis, drastically reduces size)
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
        // Compress to JPEG 0.7 quality
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

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite';

export const analyzeFolderImages = async (
  folderName: string,
  files: File[],
  model: GeminiModel = 'gemini-2.0-flash'
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

  // Filter for images only
  const imageFiles = files.filter(f => f.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    return {
      folderName,
      status: 'PENDING',
      selectedFiles: [],
      reason: "Pasta vazia ou sem imagens."
    };
  }

  // LIMIT: Analyze max 6 images to balance speed and accuracy.
  // We prefer newer images if possible, or just the first 6.
  const processedFiles = imageFiles.slice(0, 6);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      Você é um auditor de obras da Eletromidia.
      Analise as imagens da pasta: "${folderName}".
      
      OBJETIVO: Identificar se o abrigo de ônibus está PRONTO (construído e instalado).

      CRITÉRIOS PARA "COMPLETED":
      - O abrigo está montado/instalado (estrutura metálica + teto + lateral/vidros).
      - NÃO precisa estar 100% perfeito. Se estiver claramente pronto para uso, marque COMPLETED.
      - Selecione até 3 fotos que mostrem o abrigo pronto (ângulos variados se possível).
      - Se tiver 1 ou 2 fotos boas, ainda pode ser COMPLETED.

      CRITÉRIOS PARA "PENDING":
      - Se a pasta SÓ contém fotos de: buracos no chão, obras em andamento com operários trabalhando, apenas fundação/base sem estrutura montada.
      - Se não há NENHUMA foto mostrando um abrigo instalado.

      IMPORTANTE:
      - Na dúvida, prefira marcar como COMPLETED se houver pelo menos UMA foto mostrando um abrigo visivelmente pronto/instalado.
      - Lixo ou pequenas imperfeições NÃO devem impedir o status COMPLETED.

      SAÍDA JSON:
      {
        "status": "COMPLETED" | "PENDING",
        "selectedFiles": ["arquivo1.jpg", "arquivo2.jpg", "arquivo3.jpg"], (Pode ter 1, 2 ou 3 fotos. Vazio apenas se PENDING)
        "reason": "Explicação curta em PT-BR."
      }
    `;

    const parts: any[] = [{ text: prompt }];

    // Prepare images with resizing
    for (const file of processedFiles) {
      try {
        const base64Data = await resizeAndEncodeImage(file);
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg', // Always sending JPEG after resize
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