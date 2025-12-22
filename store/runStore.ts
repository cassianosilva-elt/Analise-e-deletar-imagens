import { create } from 'zustand';

import { RunStatus } from '../types';

interface RunState {
    isProcessing: boolean;
    runStatus: RunStatus;
    queue: string[];
    processing: string[];
    processedCount: number;
    activeCount: number;
    currentProcessingFolder: string;
    isPaused: boolean;
    cancelRequested: boolean;

    // Actions
    setIsProcessing: (isProcessing: boolean) => void;
    setRunStatus: (status: RunStatus) => void;
    setQueue: (queue: string[]) => void;
    addToQueue: (folderPath: string) => void;
    removeFromQueue: (folderPath: string) => void;
    setProcessing: (processing: string[]) => void;
    addProcessing: (folderPath: string) => void;
    removeProcessing: (folderPath: string) => void;
    setActiveCount: (count: number | ((prev: number) => number)) => void;
    setProcessedCount: (count: number | ((prev: number) => number)) => void;
    setCurrentProcessingFolder: (folder: string) => void;
    setIsPaused: (isPaused: boolean) => void;
    setCancelRequested: (cancelRequested: boolean) => void;
    resetRun: () => void;
}

export const useRunStore = create<RunState>((set) => ({
    isProcessing: false,
    runStatus: RunStatus.IDLE,
    queue: [],
    processing: [],
    processedCount: 0,
    activeCount: 0,
    currentProcessingFolder: '',
    isPaused: false,
    cancelRequested: false,

    setIsProcessing: (isProcessing) => set({ isProcessing }),
    setRunStatus: (runStatus) => set({ runStatus }),
    setQueue: (queue) => set({ queue }),
    addToQueue: (folderPath) => set((state) => ({ queue: [...state.queue, folderPath] })),
    removeFromQueue: (folderPath) => set((state) => ({ queue: state.queue.filter(p => p !== folderPath) })),
    setProcessing: (processing) => set({ processing }),
    addProcessing: (folderPath) => set((state) => ({
        processing: [...state.processing, folderPath],
        activeCount: state.activeCount + 1
    })),
    removeProcessing: (folderPath) => set((state) => ({
        processing: state.processing.filter(p => p !== folderPath),
        activeCount: Math.max(0, state.activeCount - 1)
    })),
    setActiveCount: (activeCount) => set((state) => ({
        activeCount: typeof activeCount === 'function' ? activeCount(state.activeCount) : activeCount
    })),
    setProcessedCount: (count) => set((state) => ({
        processedCount: typeof count === 'function' ? count(state.processedCount) : count
    })),
    setCurrentProcessingFolder: (currentProcessingFolder) => set({ currentProcessingFolder }),
    setIsPaused: (isPaused) => set({ isPaused }),
    setCancelRequested: (cancelRequested) => set({ cancelRequested }),
    resetRun: () => set({
        isProcessing: false,
        runStatus: RunStatus.IDLE,
        queue: [],
        processing: [],
        processedCount: 0,
        activeCount: 0,
        currentProcessingFolder: '',
        isPaused: false,
        cancelRequested: false
    })
}));
