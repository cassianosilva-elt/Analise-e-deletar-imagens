import { create } from 'zustand';
import { GeminiModel } from '../services/geminiService';
import { VerificationItemType, VERIFICATION_ITEMS, Breadcrumb } from '../types';
import { PageId } from '../components/Sidebar';
import { PageVisibility } from '../components/pages/ConfiguracoesPage';

interface UIState {
    hasData: boolean;
    selectedModel: GeminiModel;
    activePage: PageId;
    pageVisibility: PageVisibility;
    sidebarCollapsed: boolean;
    currentPath: Breadcrumb[];
    selectedFolders: Set<string>;
    selectedVerificationItems: VerificationItemType[];
    isEnrichingEquipment: boolean;
    showProgressPanel: boolean;
    progressMinimized: boolean;
    darkMode: boolean;
    searchQuery: string;

    // Actions
    setHasData: (hasData: boolean) => void;
    setSelectedModel: (model: GeminiModel) => void;
    setActivePage: (page: PageId) => void;
    setPageVisibility: (visibility: PageVisibility) => void;
    togglePageVisibility: (pageId: keyof PageVisibility) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setCurrentPath: (path: Breadcrumb[] | ((prev: Breadcrumb[]) => Breadcrumb[])) => void;
    setSelectedFolders: (folders: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
    toggleFolderSelection: (folderPath: string) => void;
    setSelectedVerificationItems: (items: VerificationItemType[]) => void;
    setIsEnrichingEquipment: (isEnriching: boolean) => void;
    setShowProgressPanel: (show: boolean) => void;
    setProgressMinimized: (minimized: boolean) => void;
    setDarkMode: (darkMode: boolean) => void;
    toggleDarkMode: () => void;
    setSearchQuery: (query: string) => void;
    resetNavigation: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    hasData: false,
    selectedModel: 'gemini-flash-latest',
    activePage: 'dashboard',
    pageVisibility: {
        relatorios: true,
        configuracoes: true,
        ajuda: true
    },
    sidebarCollapsed: false,
    currentPath: [],
    selectedFolders: new Set(),
    selectedVerificationItems: VERIFICATION_ITEMS.map(item => item.id),
    isEnrichingEquipment: false,
    showProgressPanel: false,
    progressMinimized: false,
    darkMode: false,
    searchQuery: '',

    setHasData: (hasData) => set({ hasData }),
    setSelectedModel: (selectedModel) => set({ selectedModel }),
    setActivePage: (activePage) => set({ activePage }),
    setPageVisibility: (pageVisibility) => set({ pageVisibility }),
    togglePageVisibility: (pageId) => set((state) => {
        const newVisibility = { ...state.pageVisibility, [pageId]: !state.pageVisibility[pageId] };
        let newActivePage = state.activePage;
        if (pageId === state.activePage && state.pageVisibility[pageId]) {
            newActivePage = 'dashboard';
        }
        return { pageVisibility: newVisibility, activePage: newActivePage };
    }),
    setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    setCurrentPath: (path) => set((state) => ({
        currentPath: typeof path === 'function' ? path(state.currentPath) : path
    })),
    setSelectedFolders: (folders) => set((state) => ({
        selectedFolders: typeof folders === 'function' ? folders(state.selectedFolders) : folders
    })),
    toggleFolderSelection: (folderPath) => set((state) => {
        const newSet = new Set(state.selectedFolders);
        if (newSet.has(folderPath)) {
            newSet.delete(folderPath);
        } else {
            newSet.add(folderPath);
        }
        return { selectedFolders: newSet };
    }),
    setSelectedVerificationItems: (selectedVerificationItems) => set({ selectedVerificationItems }),
    setIsEnrichingEquipment: (isEnrichingEquipment) => set({ isEnrichingEquipment }),
    setShowProgressPanel: (showProgressPanel) => set({ showProgressPanel }),
    setProgressMinimized: (progressMinimized) => set({ progressMinimized }),
    setDarkMode: (darkMode) => set({ darkMode }),
    toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    resetNavigation: () => set((state) => ({
        hasData: false,
        currentPath: [],
        selectedFolders: new Set(),
        activePage: 'dashboard',
        showProgressPanel: false,
        searchQuery: ''
    }))
}));
