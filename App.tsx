import React, { useState, useRef, useCallback, useMemo } from 'react';
import { FolderItem, FileItem, ItemType, AnalysisStatus, Breadcrumb, AIModelType } from './types';
import { GeminiModel, analyzeFolderImages } from './services/geminiService';
import OnboardingScreen from './components/OnboardingScreen';
import Sidebar, { PageId } from './components/Sidebar';
import TopBar from './components/TopBar';
import MainView from './components/MainView';
import AnalysisProgressPanel from './components/AnalysisProgressPanel';
import RelatoriosPage from './components/pages/RelatoriosPage';
import ConfiguracoesPage, { PageVisibility } from './components/pages/ConfiguracoesPage';
import AjudaPage from './components/pages/AjudaPage';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';

const App: React.FC = () => {
  // Onboarding state
  const [hasData, setHasData] = useState(false);
  const [selectedModel, setSelectedModel] = useState<GeminiModel>('gemini-flash-latest');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation state
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [pageVisibility, setPageVisibility] = useState<PageVisibility>({
    relatorios: true,
    configuracoes: true,
    ajuda: true
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Folder data state
  const [rootFolder, setRootFolder] = useState<FolderItem | null>(null);
  const [currentPath, setCurrentPath] = useState<Breadcrumb[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

  // AI Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingFolder, setCurrentProcessingFolder] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [showProgressPanel, setShowProgressPanel] = useState(false);
  const [progressMinimized, setProgressMinimized] = useState(false);

  // Handle page visibility toggle
  const handleTogglePageVisibility = (pageId: keyof PageVisibility) => {
    setPageVisibility(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
    // If hiding the current page, go back to dashboard
    if (pageId === activePage && pageVisibility[pageId]) {
      setActivePage('dashboard');
    }
  };

  // Handle model change
  const handleModelChange = (model: GeminiModel) => {
    setSelectedModel(model);
  };

  // Process uploaded files into folder structure
  const processFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
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

      // Add file to its parent folder
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
      setRootFolder(root);
      setCurrentPath([{ name: root.name, path: root.path }]);
      setHasData(true);
    }
  }, []);

  // Handle folder selection from onboarding
  const handleFolderSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  // Get current folder items
  const currentItems = useMemo(() => {
    if (!rootFolder || currentPath.length === 0) return [];

    let current: FolderItem | undefined = rootFolder;
    for (let i = 1; i < currentPath.length; i++) {
      const found = current.children.find(
        child => child.type === ItemType.FOLDER && child.path === currentPath[i].path
      ) as FolderItem | undefined;
      if (!found) return [];
      current = found;
    }
    return current?.children || [];
  }, [rootFolder, currentPath]);

  // Navigation handlers
  const handleNavigate = (folder: FolderItem) => {
    setCurrentPath(prev => [...prev, { name: folder.name, path: folder.path }]);
  };

  const handleNavigateUp = () => {
    if (currentPath.length > 1) {
      setCurrentPath(prev => prev.slice(0, -1));
    }
  };

  // Folder selection handlers
  const handleToggleFolderSelection = (folderPath: string) => {
    setSelectedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allFolderPaths = currentItems
      .filter(item => item.type === ItemType.FOLDER)
      .map(item => item.path);
    setSelectedFolders(new Set(allFolderPaths));
  };

  const handleClearSelection = () => {
    setSelectedFolders(new Set());
  };

  // Update folder status in tree
  const updateFolderStatus = useCallback((folderPath: string, status: AnalysisStatus, summary?: string) => {
    const updateRecursive = (folder: FolderItem): FolderItem => {
      if (folder.path === folderPath) {
        return { ...folder, status, analysisSummary: summary };
      }
      return {
        ...folder,
        children: folder.children.map(child =>
          child.type === ItemType.FOLDER ? updateRecursive(child as FolderItem) : child
        )
      };
    };

    if (rootFolder) {
      setRootFolder(updateRecursive(rootFolder));
    }
  }, [rootFolder]);

  // Run AI analysis
  const handleRunAI = async () => {
    if (!rootFolder || isProcessing) return;

    const foldersToAnalyze = selectedFolders.size > 0
      ? Array.from(selectedFolders)
      : currentItems.filter(item => item.type === ItemType.FOLDER).map(f => f.path);

    if (foldersToAnalyze.length === 0) return;

    setIsProcessing(true);
    setShowProgressPanel(true);
    setProcessedCount(0);

    for (const folderPath of foldersToAnalyze) {
      setCurrentProcessingFolder(folderPath.split('/').pop() || folderPath);
      updateFolderStatus(folderPath, AnalysisStatus.PROCESSING);

      // Get files from folder
      const findFolder = (folder: FolderItem): FolderItem | null => {
        if (folder.path === folderPath) return folder;
        for (const child of folder.children) {
          if (child.type === ItemType.FOLDER) {
            const found = findFolder(child as FolderItem);
            if (found) return found;
          }
        }
        return null;
      };

      const targetFolder = findFolder(rootFolder);
      if (targetFolder) {
        const files = targetFolder.children
          .filter(c => c.type === ItemType.IMAGE && (c as FileItem).fileObject)
          .map(c => (c as FileItem).fileObject!);

        try {
          const result = await analyzeFolderImages(targetFolder.name, files, selectedModel);
          const newStatus = result.status === 'COMPLETED' ? AnalysisStatus.COMPLETED : AnalysisStatus.PENDING;
          updateFolderStatus(folderPath, newStatus, result.reason);
        } catch (error) {
          updateFolderStatus(folderPath, AnalysisStatus.PENDING, 'Erro na análise');
        }
      }

      setProcessedCount(prev => prev + 1);
    }

    setIsProcessing(false);
    setCurrentProcessingFolder('');
    setSelectedFolders(new Set());
  };

  // Delete folder
  const handleDeleteFolder = (folderPath: string) => {
    if (!rootFolder) return;

    const removeFolder = (folder: FolderItem): FolderItem => ({
      ...folder,
      children: folder.children
        .filter(child => child.path !== folderPath)
        .map(child => child.type === ItemType.FOLDER ? removeFolder(child as FolderItem) : child)
    });

    setRootFolder(removeFolder(rootFolder));
  };

  // Delete empty folders
  const handleDeleteEmptyFolders = () => {
    if (!rootFolder) return;

    const removeEmpty = (folder: FolderItem): FolderItem => ({
      ...folder,
      children: folder.children
        .map(child => child.type === ItemType.FOLDER ? removeEmpty(child as FolderItem) : child)
        .filter(child => {
          if (child.type === ItemType.FOLDER) {
            const f = child as FolderItem;
            return f.children.some(c => c.type !== ItemType.FOLDER || (c as FolderItem).children.length > 0);
          }
          return true;
        })
    });

    setRootFolder(removeEmpty(rootFolder));
  };

  // Manual status change
  const handleManualStatusChange = (folderPath: string, status: AnalysisStatus) => {
    updateFolderStatus(folderPath, status);
  };

  // Toggle image selection
  const handleToggleImageSelection = (imagePath: string) => {
    if (!rootFolder) return;

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

    setRootFolder(toggleImage(rootFolder));
  };

  // Export to Excel
  const handleExportReport = async () => {
    if (!rootFolder) return;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Análise');

    sheet.columns = [
      { header: 'Pasta', key: 'folder', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Resumo', key: 'summary', width: 50 }
    ];

    const addRows = (folder: FolderItem) => {
      if (folder.status !== AnalysisStatus.UNCHECKED) {
        sheet.addRow({
          folder: folder.name,
          status: folder.status === AnalysisStatus.COMPLETED ? 'Concluído' : 'Pendente',
          summary: folder.analysisSummary || ''
        });
      }
      folder.children.forEach(child => {
        if (child.type === ItemType.FOLDER) {
          addRows(child as FolderItem);
        }
      });
    };

    addRows(rootFolder);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export ZIP
  const handleExportZip = async (statuses: AnalysisStatus[] = [AnalysisStatus.COMPLETED]) => {
    if (!rootFolder) return;

    const zip = new JSZip();

    const addFiles = (folder: FolderItem, zipFolder: JSZip) => {
      if (statuses.includes(folder.status)) {
        const folderZip = zipFolder.folder(folder.name);
        if (folderZip) {
          folder.children.forEach(child => {
            if (child.type === ItemType.IMAGE && (child as FileItem).fileObject) {
              folderZip.file(child.name, (child as FileItem).fileObject!);
            }
          });
        }
      }
      folder.children.forEach(child => {
        if (child.type === ItemType.FOLDER) {
          addFiles(child as FolderItem, zipFolder);
        }
      });
    };

    addFiles(rootFolder, zip);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fotos_${new Date().toISOString().split('T')[0]}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats for reports page
  const stats = useMemo(() => {
    if (!rootFolder) {
      return { totalFolders: 0, completedFolders: 0, pendingFolders: 0, totalImages: 0, selectedImages: 0 };
    }

    let totalFolders = 0;
    let completedFolders = 0;
    let pendingFolders = 0;
    let totalImages = 0;
    let selectedImages = 0;

    const countRecursive = (folder: FolderItem) => {
      folder.children.forEach(child => {
        if (child.type === ItemType.FOLDER) {
          totalFolders++;
          const f = child as FolderItem;
          if (f.status === AnalysisStatus.COMPLETED) completedFolders++;
          if (f.status === AnalysisStatus.PENDING) pendingFolders++;
          countRecursive(f);
        } else if (child.type === ItemType.IMAGE) {
          totalImages++;
          if ((child as FileItem).selectedByAI) selectedImages++;
        }
      });
    };

    countRecursive(rootFolder);
    return { totalFolders, completedFolders, pendingFolders, totalImages, selectedImages };
  }, [rootFolder]);

  // Current folder info
  const currentFolderInfo = useMemo(() => {
    if (!rootFolder || currentPath.length <= 1) return { status: undefined, reason: undefined };

    let current: FolderItem | undefined = rootFolder;
    for (let i = 1; i < currentPath.length; i++) {
      const found = current.children.find(
        child => child.type === ItemType.FOLDER && child.path === currentPath[i].path
      ) as FolderItem | undefined;
      if (!found) return { status: undefined, reason: undefined };
      current = found;
    }
    return { status: current?.status, reason: current?.analysisSummary };
  }, [rootFolder, currentPath]);

  // Render onboarding if no data
  if (!hasData) {
    return (
      <OnboardingScreen
        onFolderSelect={handleFolderSelect}
        onModelSelect={setSelectedModel}
        selectedModel={selectedModel}
        fileInputRef={fileInputRef}
      />
    );
  }

  // Render main app with sidebar navigation
  return (
    <div className="h-screen flex font-['Rethink_Sans']">
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        pageVisibility={pageVisibility}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {activePage === 'dashboard' && (
          <>
            <TopBar
              currentPath={currentPath}
              onNavigateUp={handleNavigateUp}
              onOpenFolder={() => fileInputRef.current?.click()}
              onRunAI={handleRunAI}
              onExportReport={handleExportReport}
              onExportSelectedZip={handleExportZip}
              onDeleteEmptyFolders={handleDeleteEmptyFolders}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              isProcessing={isProcessing}
              totalPending={stats.pendingFolders}
              selectedCount={selectedFolders.size}
              totalFolders={stats.totalFolders}
            />
            <MainView
              items={currentItems}
              onNavigate={handleNavigate}
              onDeleteFolder={handleDeleteFolder}
              onToggleFolderSelection={handleToggleFolderSelection}
              onManualStatusChange={handleManualStatusChange}
              onToggleImageSelection={handleToggleImageSelection}
              selectedFolders={selectedFolders}
              currentFolderStatus={currentFolderInfo.status}
              currentFolderReason={currentFolderInfo.reason}
            />
          </>
        )}

        {activePage === 'relatorios' && (
          <RelatoriosPage
            onExportReport={handleExportReport}
            onExportZip={() => handleExportZip([AnalysisStatus.COMPLETED])}
            stats={stats}
          />
        )}

        {activePage === 'configuracoes' && (
          <ConfiguracoesPage
            pageVisibility={pageVisibility}
            onTogglePageVisibility={handleTogglePageVisibility}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
          />
        )}

        {activePage === 'ajuda' && <AjudaPage />}
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        // @ts-ignore
        webkitdirectory=""
        multiple
        className="hidden"
        onChange={handleFolderSelect}
      />

      {/* Progress Panel */}
      <AnalysisProgressPanel
        isVisible={showProgressPanel}
        isProcessing={isProcessing}
        currentFolder={currentProcessingFolder}
        totalFolders={selectedFolders.size || stats.totalFolders}
        processedCount={processedCount}
        completedCount={stats.completedFolders}
        pendingCount={stats.pendingFolders}
        onClose={() => setShowProgressPanel(false)}
        onToggle={() => setProgressMinimized(!progressMinimized)}
        isMinimized={progressMinimized}
      />
    </div>
  );
};

export default App;
