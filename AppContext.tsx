import React, { createContext, useContext, useState, ReactNode } from 'react';
import { FolderItem, Breadcrumb, AnalysisStatus, ItemType } from './types'; // Adjust path if necessary
import { GeminiModel } from './services/geminiService'; // Adjust path

interface AppContextType {
    rootFolder: FolderItem | null;
    setRootFolder: React.Dispatch<React.SetStateAction<FolderItem | null>>;
    currentFolder: FolderItem | null;
    setCurrentFolder: React.Dispatch<React.SetStateAction<FolderItem | null>>;
    path: Breadcrumb[];
    setPath: React.Dispatch<React.SetStateAction<Breadcrumb[]>>;
    selectedModel: GeminiModel;
    setSelectedModel: React.Dispatch<React.SetStateAction<GeminiModel>>;
    // Add other shared state here as needed
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [rootFolder, setRootFolder] = useState<FolderItem | null>(null);
    const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
    const [path, setPath] = useState<Breadcrumb[]>([]);
    const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-flash-latest'); // Default

    return (
        <AppContext.Provider
            value={{
                rootFolder,
                setRootFolder,
                currentFolder,
                setCurrentFolder,
                path,
                setPath,
                selectedModel,
                setSelectedModel,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
