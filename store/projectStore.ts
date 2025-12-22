import { create } from 'zustand';
import { FolderItem, AnalysisStatus, EquipmentInfo, ItemType, FileItem } from '../types';
import { useUIStore } from './uiStore';
import { lookupFromFolderName } from '../services/equipmentService';
import { naturalCompare } from '../utils/sorting';
import { syncService } from '../services/syncService';

interface ProjectState {
    rootFolder: FolderItem | null;
    restoredFromCache: boolean;

    // Actions
    setRootFolder: (folder: FolderItem | null) => void;
    setRestoredFromCache: (restored: boolean) => void;
    setHasData: (has: boolean) => void;
    processFiles: (files: FileList | File[]) => Promise<void>;
    enrichFoldersAsync: (root: FolderItem) => Promise<void>;
    updateFolderStatus: (
        folderPath: string,
        status: AnalysisStatus,
        analysisSummary?: string,
        observation?: string,
        selectedFiles?: string[],
        eletrica?: any, // Will refine type
        isOverride?: boolean,
        isHuman?: boolean
    ) => void;
    updateFolderEquipment: (folderPath: string, equipmentInfo: EquipmentInfo) => void;
    updateFolderObservation: (folderPath: string, observation: string) => void;
    deleteFolder: (folderPath: string) => void;
    deleteEmptyFolders: () => void;
    toggleImageSelection: (imagePath: string) => void;
    resetProject: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    rootFolder: null,
    restoredFromCache: false,

    setRootFolder: (rootFolder) => set({ rootFolder }),
    setRestoredFromCache: (restoredFromCache) => set({ restoredFromCache }),
    setHasData: (hasData) => {
        // Managed by uiStore
    },

    processFiles: async (files) => {
        const fileArray = (files instanceof FileList ? Array.from(files) : files) as File[];
        if (fileArray.length === 0) return;

        const folderMap = new Map<string, FolderItem>();
        let rootName = '';

        fileArray.forEach(file => {
            const pathParts = file.webkitRelativePath.split('/');
            if (!rootName && pathParts.length > 0) {
                rootName = pathParts[0];
            }

            let currentPath = '';
            for (let i = 0; i < pathParts.length - 1; i++) {
                const part = pathParts[i];
                const parentPath = currentPath;
                currentPath = currentPath ? `${currentPath}/${part}` : part;

                if (!folderMap.has(currentPath)) {
                    const newFolder: FolderItem = {
                        id: currentPath,
                        name: part,
                        path: currentPath,
                        type: ItemType.FOLDER,
                        children: [],
                        status: AnalysisStatus.UNCHECKED
                    };
                    folderMap.set(currentPath, newFolder);

                    if (parentPath && folderMap.has(parentPath)) {
                        folderMap.get(parentPath)!.children.push(newFolder);
                    }
                }
            }

            const parentPath = pathParts.slice(0, -1).join('/');
            if (folderMap.has(parentPath)) {
                const fileItem: FileItem = {
                    name: file.name,
                    path: file.webkitRelativePath,
                    type: file.type.startsWith('image/') ? ItemType.IMAGE : ItemType.FILE,
                    url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
                    fileObject: file
                };
                folderMap.get(parentPath)!.children.push(fileItem);
            }
        });

        const root = folderMap.get(rootName);
        if (root) {
            set({ rootFolder: root });
            const ui = useUIStore.getState();
            ui.setCurrentPath([{ name: root.name, path: root.path }]);
            ui.setHasData(true);

            // Auto-enrich
            useProjectStore.getState().enrichFoldersAsync(root);
        }
    },

    enrichFoldersAsync: async (root) => {
        const ui = useUIStore.getState();
        ui.setIsEnrichingEquipment(true);

        const collectFolders = (folder: FolderItem): FolderItem[] => {
            const folders: FolderItem[] = [folder];
            folder.children.forEach(child => {
                if (child.type === ItemType.FOLDER) {
                    folders.push(...collectFolders(child as FolderItem));
                }
            });
            return folders;
        };

        const allFolders = collectFolders(root);
        allFolders.sort((a, b) => naturalCompare(a.name, b.name));

        for (const folder of allFolders) {
            try {
                const equipmentInfo = await lookupFromFolderName(folder.name);
                if (equipmentInfo) {
                    useProjectStore.getState().updateFolderEquipment(folder.path, equipmentInfo);
                }
            } catch (error) {
                console.warn(`[Equipment] Failed to enrich folder ${folder.name}:`, error);
            }
        }

        ui.setIsEnrichingEquipment(false);
    },

    updateFolderStatus: (folderPath, status, summary, observation, selectedFiles, eletrica, isOverride, isHuman) => set((state) => {
        if (!state.rootFolder) return state;

        const updateRecursive = (folder: FolderItem): FolderItem => {
            if (folder.path === folderPath) {
                let updatedChildren = folder.children;
                if (selectedFiles) {
                    updatedChildren = folder.children.map(child => {
                        if (child.type === ItemType.IMAGE) {
                            return {
                                ...child,
                                selectedByAI: selectedFiles.includes(child.name)
                            };
                        }
                        return child;
                    });
                }

                const resultUpdate = {
                    folderName: folder.name,
                    status: (status === AnalysisStatus.COMPLETED ? 'COMPLETED' : 'PENDING') as 'COMPLETED' | 'PENDING',
                    selectedFiles: selectedFiles || [],
                    reason: summary || '',
                    observation: observation,
                    eletrica,
                    timestamp: Date.now()
                };

                const updatedFolder = {
                    ...folder,
                    status,
                    aiResult: isOverride ? folder.aiResult : resultUpdate,
                    humanOverride: isOverride ? resultUpdate : folder.humanOverride,
                    analysisSummary: summary,
                    observation: observation || folder.observation,
                    children: updatedChildren
                };

                // Trigger Sync (Manual Override or Status Change)
                if (isOverride || isHuman || status === AnalysisStatus.COMPLETED) {
                    syncService.enqueueSync(folder.name, {
                        folder_name: folder.name,
                        status: status,
                        summary: summary || null,
                        observation: observation || folder.observation || null,
                        selected_files: selectedFiles || []
                    });
                }

                return updatedFolder;
            }
            return {
                ...folder,
                children: folder.children.map(child =>
                    child.type === ItemType.FOLDER ? updateRecursive(child as FolderItem) : child
                )
            };
        };

        return { rootFolder: updateRecursive(state.rootFolder) };
    }),

    updateFolderEquipment: (folderPath, equipmentInfo) => set((state) => {
        if (!state.rootFolder) return state;

        const updateRecursive = (folder: FolderItem): FolderItem => {
            if (folder.path === folderPath) {
                return {
                    ...folder,
                    equipmentInfo,
                    enrichedAddress: `${equipmentInfo.endereco}, ${equipmentInfo.bairro} - ${equipmentInfo.cidade}/${equipmentInfo.estado}`
                };
            }
            return {
                ...folder,
                children: folder.children.map(child =>
                    child.type === ItemType.FOLDER ? updateRecursive(child as FolderItem) : child
                )
            };
        };

        return { rootFolder: updateRecursive(state.rootFolder) };
    }),

    updateFolderObservation: (folderPath, observation) => set((state) => {
        if (!state.rootFolder) return state;

        const updateRecursive = (folder: FolderItem): FolderItem => {
            if (folder.path === folderPath) {
                const updatedFolder = { ...folder, observation };

                syncService.enqueueSync(folder.name, {
                    folder_name: folder.name,
                    status: folder.status,
                    summary: folder.analysisSummary || null,
                    observation: observation,
                    selected_files: folder.aiResult?.selectedFiles || []
                });

                return updatedFolder;
            }
            return {
                ...folder,
                children: folder.children.map(child =>
                    child.type === ItemType.FOLDER ? updateRecursive(child as FolderItem) : child
                )
            };
        };

        return { rootFolder: updateRecursive(state.rootFolder) };
    }),

    deleteFolder: (folderPath) => set((state) => {
        if (!state.rootFolder) return state;

        const removeFolder = (folder: FolderItem): FolderItem => ({
            ...folder,
            children: folder.children
                .filter(child => child.path !== folderPath)
                .map(child => child.type === ItemType.FOLDER ? removeFolder(child as FolderItem) : child)
        });

        // Special case: if removing the root itself
        if (state.rootFolder.path === folderPath) return { rootFolder: null };

        return { rootFolder: removeFolder(state.rootFolder) };
    }),

    deleteEmptyFolders: () => set((state) => {
        if (!state.rootFolder) return state;

        const hasImages = (folder: FolderItem): boolean => {
            return folder.children.some(child => {
                if (child.type === ItemType.IMAGE) return true;
                if (child.type === ItemType.FOLDER) return hasImages(child as FolderItem);
                return false;
            });
        };

        const removeEmpty = (folder: FolderItem): FolderItem => {
            const processedChildren = folder.children.map(child =>
                child.type === ItemType.FOLDER ? removeEmpty(child as FolderItem) : child
            );

            const filteredChildren = processedChildren.filter(child => {
                if (child.type === ItemType.FOLDER) {
                    return hasImages(child as FolderItem);
                }
                return true;
            });

            return { ...folder, children: filteredChildren };
        };

        return { rootFolder: removeEmpty(state.rootFolder) };
    }),

    toggleImageSelection: (imagePath) => set((state) => {
        if (!state.rootFolder) return state;

        const toggleImage = (folder: FolderItem): FolderItem => ({
            ...folder,
            children: folder.children.map(child => {
                if (child.type === ItemType.FOLDER) {
                    return toggleImage(child as FolderItem);
                }
                if (child.path === imagePath) {
                    return { ...child, selectedByAI: !(child as FileItem).selectedByAI };
                }
                return child;
            })
        });

        return { rootFolder: toggleImage(state.rootFolder) };
    }),

    resetProject: () => set({ rootFolder: null, restoredFromCache: false })
}));
