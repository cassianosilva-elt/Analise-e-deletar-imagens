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

export interface Breadcrumb {
    name: string;
    path: string;
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
    latitude?: number;
    longitude?: number;
    areaTrabalho?: string;
    status?: string;
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
    enrichedAddress?: string;
}

export interface FileItem {
    name: string;
    path: string;
    type: ItemType;
    url?: string;
    fileObject?: File;
    selectedByAI?: boolean;
}

export type VerificationItemType = 'abrigo' | 'luminaria' | 'totem_estatico' | 'totem_digital' | 'fundacao' | 'eletrica';

export const VERIFICATION_ITEMS: { id: VerificationItemType; label: string }[] = [
    { id: 'abrigo', label: 'Abrigo de Ônibus' },
    { id: 'luminaria', label: 'Luminária' },
    { id: 'totem_estatico', label: 'Totem Estático' },
    { id: 'totem_digital', label: 'Totem Digital' },
    { id: 'fundacao', label: 'Fundação' },
    { id: 'eletrica', label: 'Elétrica (Alta/Baixa)' }
];

export interface AIAnalysisResult {
    folderName: string;
    status: 'COMPLETED' | 'PENDING';
    selectedFiles: string[];
    reason: string;
    observation?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}
