import Dexie, { Table } from 'dexie';
import { FolderItem, AIAnalysisResult } from '../types';

export interface ProjectSession {
    id?: number;
    rootFolder: FolderItem;
    timestamp: number;
    schemaVersion: number;
    appVersion: string;
    restoredFromCache?: boolean;
}

export interface FolderCache {
    path: string;
    hash: string;
    result: AIAnalysisResult;
    timestamp: number;
}

export interface SyncQueueItem {
    id?: number;
    folderName: string;
    payload: any;
    timestamp: number;
}

export class ShelterAIDatabase extends Dexie {
    sessions!: Table<ProjectSession>;
    folderCache!: Table<FolderCache>;
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('ShelterAIDB');
        this.version(3).stores({
            sessions: '++id, timestamp',
            folderCache: 'path, hash',
            syncQueue: '++id, folderName, timestamp'
        });
    }
}

export const db = new ShelterAIDatabase();
