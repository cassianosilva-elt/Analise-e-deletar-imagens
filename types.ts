export enum ItemType {
  FOLDER = 'FOLDER',
  IMAGE = 'IMAGE',
  FILE = 'FILE'
}

export enum AnalysisStatus {
  UNCHECKED = 'UNCHECKED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING', // Used if photos are missing or shelter incomplete
  ERROR = 'ERROR'
}

// AI Model Types
export type AIModelType = 'gemini-2.0-flash' | 'gemini-2.0-flash-lite';

// Verification Item Types for onboarding selection
export type VerificationItemType = 'abrigo' | 'luminaria' | 'totem_estatico' | 'totem_digital' | 'fundacao';

export const VERIFICATION_ITEMS: { id: VerificationItemType; label: string; description: string }[] = [
  { id: 'abrigo', label: 'Abrigo', description: 'Abrigo de ônibus completo' },
  { id: 'luminaria', label: 'Luminárias', description: 'Luminárias do abrigo' },
  { id: 'totem_estatico', label: 'Totem Estático', description: 'Totem publicitário estático' },
  { id: 'totem_digital', label: 'Totem Digital', description: 'Totem publicitário digital' },
  { id: 'fundacao', label: 'Fundação', description: 'Base/fundação da estrutura' }
];

export interface FileItem {
  name: string;
  path: string;
  type: ItemType;
  url?: string; // Blob URL for preview
  fileObject?: File; // Actual file object
  selectedByAI?: boolean; // If true, this is one of the 3 chosen photos
  aiReason?: string; // Why it was chosen or rejected
}

// Equipment Info from external API
export interface EquipmentInfo {
  nEletro: string;
  nParada: number;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  modeloAbrigo: string;
  linkOperacoes: string;
  tipoEquipamento: string;
  painelDigital: string;
  painelEstatico: string;
  latitude: number;
  longitude: number;
  ponto: string;
  areaTrabalho: string;
  status: string;
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  type: ItemType.FOLDER;
  children: (FolderItem | FileItem)[];
  status: AnalysisStatus;
  analysisSummary?: string;
  observation?: string;
  lastModified?: string;
  equipmentInfo?: EquipmentInfo;  // Enriched data from API
  enrichedAddress?: string;        // Resolved address from API
}

export interface Breadcrumb {
  name: string;
  path: string;
}

// AI Service Types
export interface AIAnalysisResult {
  folderName: string;
  status: 'COMPLETED' | 'PENDING';
  selectedFiles: string[]; // Names of the 3 selected files
  reason: string;
  observation?: string; // Auto-generated observation notes
}