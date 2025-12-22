import { db } from '../db/db';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { FolderItem, ItemType, FileItem } from '../types';

const SCHEMA_VERSION = 2;
const APP_VERSION = '1.1.0';

let autoSaveTimer: any = null;

export const startAutoSave = () => {
    if (autoSaveTimer) return;

    autoSaveTimer = setInterval(async () => {
        const { rootFolder } = useProjectStore.getState();
        if (rootFolder) {
            await db.sessions.put({
                id: 1, // Only keeping one session for now
                rootFolder,
                timestamp: Date.now(),
                schemaVersion: SCHEMA_VERSION,
                appVersion: APP_VERSION
            });
            console.log('[Persistence] Auto-saved progress.');
        }
    }, 2000);
};

export const stopAutoSave = () => {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
    }
};

const rehydrateBlobUrls = (folder: FolderItem) => {
    folder.children.forEach(child => {
        if (child.type === ItemType.FOLDER) {
            rehydrateBlobUrls(child as FolderItem);
        } else if (child.type === ItemType.IMAGE && (child as FileItem).fileObject) {
            (child as FileItem).url = URL.createObjectURL((child as FileItem).fileObject!);
        }
    });
};

export const restoreSession = async (): Promise<boolean> => {
    const session = await db.sessions.get(1);
    if (session && session.rootFolder) {
        // Version Check
        if (session.schemaVersion !== SCHEMA_VERSION) {
            console.warn('[Persistence] Versão do schema incompatível. Limpando cache.');
            await db.sessions.clear();
            await db.folderCache.clear();
            return false;
        }

        const projectStore = useProjectStore.getState();
        const uiStore = useUIStore.getState();

        // Rehydrate Blob URLs from File objects
        rehydrateBlobUrls(session.rootFolder);

        projectStore.setRootFolder(session.rootFolder);
        projectStore.setRestoredFromCache(true);
        uiStore.setHasData(true);
        uiStore.setCurrentPath([{ name: session.rootFolder.name, path: session.rootFolder.path }]);

        console.log(`[Persistence] Restored session from cache (v${session.appVersion}).`);
        return true;
    }
    return false;
};
