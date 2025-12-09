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
export type AIModelType = 'gemini-flash-latest' | 'gemini-flash-lite-latest';

export interface FileItem {
  name: string;
  path: string;
  type: ItemType;
  url?: string; // Blob URL for preview
  fileObject?: File; // Actual file object
  selectedByAI?: boolean; // If true, this is one of the 3 chosen photos
  aiReason?: string; // Why it was chosen or rejected
}

export interface FolderItem {
  id: string;
  name: string;
  path: string;
  type: ItemType.FOLDER;
  children: (FolderItem | FileItem)[];
  status: AnalysisStatus;
  analysisSummary?: string;
  lastModified?: string;
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
}