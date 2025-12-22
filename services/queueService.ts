import pLimit from 'p-limit';
import { useRunStore } from '../store/runStore';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { analyzeFolderImages } from './geminiService';
import { AnalysisStatus, FolderItem, FileItem, ItemType, AIAnalysisResult, RunStatus } from '../types';
import { syncService } from './syncService';
import { historyService } from './historyService';
import { generateFolderHash } from '../utils/hashing';
import { db } from '../db/db';

const limit = pLimit(3);
const RATE_LIMIT_DELAY = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const abortControllers = new Map<string, AbortController>();

export const runAnalysisQueue = async () => {
    const runStore = useRunStore.getState();
    const projectStore = useProjectStore.getState();
    const uiStore = useUIStore.getState();

    if (runStore.isProcessing || runStore.queue.length === 0) return;

    runStore.setIsProcessing(true);
    runStore.setRunStatus(RunStatus.RUNNING);
    runStore.setCancelRequested(false);

    const root = projectStore.rootFolder;
    if (!root) {
        runStore.setIsProcessing(false);
        runStore.setRunStatus(RunStatus.IDLE);
        return;
    }

    const processQueue = async () => {
        while (useRunStore.getState().queue.length > 0 && !useRunStore.getState().cancelRequested) {
            const nextPath = useRunStore.getState().queue[0];
            if (!nextPath) break;

            await limit(async () => {
                const folderPath = nextPath; // Capture for this task
                if (useRunStore.getState().cancelRequested) return;

                // --- FIND FOLDER ---
                const currentRoot = useProjectStore.getState().rootFolder;
                if (!currentRoot) return;

                const findFolder = (f: FolderItem): FolderItem | null => {
                    if (f.path === folderPath) return f;
                    for (const child of f.children) {
                        if (child.type === ItemType.FOLDER) {
                            const found = findFolder(child as FolderItem);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const targetFolder = findFolder(currentRoot);
                if (!targetFolder) {
                    useRunStore.getState().removeFromQueue(folderPath);
                    return;
                }

                runStore.setCurrentProcessingFolder(targetFolder.name);

                // --- IDEMPOTENCY CHECK (HASHING) ---
                const folderHash = await generateFolderHash(targetFolder);
                const cached = await db.folderCache.get({ path: folderPath, hash: folderHash });

                if (cached) {
                    console.log(`[Cache] Usando resultado cacheado para: ${folderPath}`);
                    projectStore.updateFolderStatus(
                        folderPath,
                        cached.result.status as AnalysisStatus,
                        cached.result.reason,
                        cached.result.observation,
                        cached.result.selectedFiles,
                        cached.result.eletrica
                    );
                    runStore.removeFromQueue(folderPath);
                    runStore.setProcessedCount(prev => prev + 1);
                    return;
                }

                projectStore.updateFolderStatus(folderPath, AnalysisStatus.PROCESSING);
                runStore.addProcessing(folderPath);

                const files = targetFolder.children
                    .filter(c => c.type === ItemType.IMAGE && (c as FileItem).fileObject)
                    .map(c => (c as FileItem).fileObject!);

                const controller = new AbortController();
                abortControllers.set(folderPath, controller);

                try {
                    const result = await analyzeFolderImages(
                        targetFolder.name,
                        files,
                        uiStore.selectedModel,
                        uiStore.selectedVerificationItems,
                        targetFolder.equipmentInfo,
                        controller.signal
                    );

                    const isElectricalLowConfidence = result.eletrica && result.eletrica.confidence < 0.6;
                    const newStatus = (result.status === 'COMPLETED' && !isElectricalLowConfidence)
                        ? AnalysisStatus.COMPLETED
                        : AnalysisStatus.PENDING;

                    projectStore.updateFolderStatus(
                        folderPath,
                        newStatus,
                        result.reason,
                        result.observation,
                        result.selectedFiles,
                        result.eletrica
                    );

                    await db.folderCache.put({
                        path: folderPath,
                        hash: folderHash,
                        result: result,
                        timestamp: Date.now()
                    });

                    try {
                        await syncService.enqueueSync(targetFolder.name, {
                            folder_name: targetFolder.name,
                            status: newStatus,
                            summary: result.reason || null,
                            observation: result.observation || null,
                            selected_files: result.selectedFiles || []
                        });
                    } catch (e) {
                        console.warn('[History] Failed to enqueue sync:', e);
                    }

                } catch (error: any) {
                    if (error.message === 'Cancelled' || error.name === 'AbortError') {
                        console.log(`[Queue] Análise cancelada para: ${folderPath}`);
                        projectStore.updateFolderStatus(folderPath, AnalysisStatus.PENDING, 'Análise cancelada');
                        return;
                    }
                    console.error(`Error analyzing ${folderPath}:`, error);
                    projectStore.updateFolderStatus(folderPath, AnalysisStatus.PENDING, 'Erro na análise');
                } finally {
                    abortControllers.delete(folderPath);
                    runStore.removeProcessing(folderPath);
                    runStore.removeFromQueue(folderPath);
                    runStore.setProcessedCount(prev => prev + 1);
                }
            });
        }
    };

    await processQueue();

    runStore.setIsProcessing(false);
    runStore.setRunStatus(runStore.cancelRequested ? RunStatus.CANCELLED : RunStatus.DONE);
};

export const cancelAllAnalysis = () => {
    const runStore = useRunStore.getState();
    runStore.setCancelRequested(true);
    runStore.setRunStatus(RunStatus.CANCELLED);

    abortControllers.forEach(controller => controller.abort());
    abortControllers.clear();
};
