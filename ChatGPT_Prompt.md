# PROMPT PARA ANÁLISE E MELHORIA DO APP (SHELTERAI)

Copie e cole o conteúdo abaixo no ChatGPT ou Codex para obter uma análise profunda e sugestões de melhoria.

---

**Role:** Você é um Engenheiro de Software Sênior, Especialista em IA e Arquiteto de Soluções com foco em Cloud e Web Analytics.

**Contexto do Projeto:** 
O projeto se chama **ShelterAI (Eletromidia)**. É uma aplicação web inovadora desenvolvida para automatizar o processo de auditoria de instalações de mobiliário urbano (abrigos de ônibus, totens, etc.). O fluxo principal consiste em um usuário importar uma estrutura de pastas (onde cada pasta representa um equipamento/ponto), e uma IA (Google Gemini) analisa as fotos de cada pasta sequencialmente para verificar se a instalação (elétrica, estrutural, etc.) foi concluída corretamente.

**Stack Tecnológica:**
- **Frontend:** React + Vite + TypeScript.
- **Estilo:** CSS Moderno (Glassmorphism, Dark Mode, animações sutis).
- **IA:** Google Gemini API (modelos Flash 1.5 e Lite).
- **Backend/Storage:** Supabase (Autenticação e Histórico).
- **Processamento de Arquivos:** JSZip, ExcelJS.

**Desafios Atuais:**
1. **Precisão da Elétrica:** Identificar fios em postes ou bases de concreto é um desafio visual para a IA.
2. **Performance:** Processar centenas de pastas sequencialmente pode sofrer com limites de quota da API.
3. **Escalabilidade do Estado:** O `App.tsx` está crescendo muito e gerencia quase todo o estado global.

---

### CÓDIGO FONTE PRINCIPAL

Abaixo estão os arquivos mais importantes do sistema para sua análise:

#### 1. Tipagem Global (`types.ts`)
```typescript
export enum ItemType {
    FOLDER = 'folder',
    IMAGE = 'image',
    FILE = 'file'
}

export enum AnalysisStatus {
    UNCHECKED = 'UNCHECKED',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    PENDING = 'PENDING'
}

export interface EquipmentInfo {
    nEletro?: string;
    nParada?: number;
    endereco?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    modeloAbrigo?: string;
    tipoEquipamento?: string;
    painelDigital?: string;
    painelEstatico?: string;
    ponto?: string;
    linkOperacoes?: string;
}

export interface FolderItem {
    id: string;
    name: string;
    path: string;
    type: ItemType;
    children: (FolderItem | FileItem)[];
    status: AnalysisStatus;
    analysisSummary?: string;
    observation?: string;
    equipmentInfo?: EquipmentInfo;
}
```

#### 2. Lógica de IA (`services/geminiService.ts`)
```typescript
// Resumo do Prompt de Análise:
// A IA recebe até 6 imagens por pasta.
// Recebe critérios específicos para 'abrigo', 'luminaria', 'eletrica', etc.
// A lógica da Elétrica é prioritária: "Se tiver fio no poste ou base, está concluído, independente do estado do abrigo".
// O retorno deve ser um JSON rígidamente estruturado.

export const analyzeFolderImages = async (
  folderName: string,
  files: File[],
  model: GeminiModel,
  selectedItems: VerificationItemType[],
  equipmentInfo?: EquipmentInfo
): Promise<AIAnalysisResult> => {
  // ... lógica de resize e encode (base64) ...
  // ... lógica de Retry (Exponential Backoff) para lidar com 503 Overloaded ...
  // ... chamada ao GoogleGenAI ...
}
```

#### 3. Orquestrador (`App.tsx` - Trechos de Fluxo)
```typescript
// O App gerencia o processamento sequencial:
const handleRunAI = async () => {
    for (const folderPath of foldersToAnalyze) {
        // ... update status to PROCESSING ...
        const result = await analyzeFolderImages(...);
        // ... update status to COMPLETED/PENDING ...
        await historyService.saveAnalysis(result);
    }
}
```

---

### PERGUNTAS PARA ANÁLISE

Com base no projeto acima, por favor responda as seguintes questões para me ajudar a melhorar o app:

1. **Refatoração de Estado:** Dado que o `App.tsx` está centralizando muita lógica, como você recomendaria quebrar esse estado usando Context API, Redux ou Zustand para melhorar a manutenibilidade?
2. **Melhoria do Prompt de Elétrica:** Como posso tornar o prompt da `geminiService.ts` ainda mais robusto para evitar "Falsos Negativos" na análise de elétrica alta/baixa? Alguma técnica de Chain-of-Thought ou Context-Length ajudaria?
3. **Paralelismo vs. Rate Limit:** Atualmente o processamento é 100% sequencial. Como eu poderia implementar um paralelismo controlado (ex: 3 pastas por vez) para ganhar velocidade sem estourar as quotas "Free/Standard" do Gemini?
4. **UX/UI de Auditoria:** O que você mudaria visualmente no `MainView` (Dashboard) para que um auditor consiga identificar rapidamente erros da IA e fazer correções manuais?
5. **Caching e Offline:** Como posso implementar um sistema de cache (IndexedDB) para que o progresso da análise não seja perdido se o usuário fechar o browser acidentalmente no meio do processamento?
6. **Segurança:** Existem riscos em passar o `process.env.GEMINI_API_KEY` diretamente no frontend? Como eu poderia "esconder" isso de forma eficiente sem necessariamente subir um servidor Node.js completo?

---

**Aguardando sua análise detalhada!**
