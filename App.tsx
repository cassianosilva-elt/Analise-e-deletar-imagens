import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { FolderItem, FileItem, ItemType, AnalysisStatus, Breadcrumb, VerificationItemType, VERIFICATION_ITEMS, EquipmentInfo } from './types';
import { GeminiModel, analyzeFolderImages } from './services/geminiService';
import { getEquipmentCount, lookupFromFolderName } from './services/equipmentService';
import OnboardingScreen from './components/OnboardingScreen';
import Sidebar, { PageId } from './components/Sidebar';
import TopBar from './components/TopBar';
import MainView from './components/MainView';
import AnalysisProgressPanel from './components/AnalysisProgressPanel';
import RelatoriosPage from './components/pages/RelatoriosPage';
import FerramentasPage from './components/pages/FerramentasPage';
import ConfiguracoesPage, { PageVisibility } from './components/pages/ConfiguracoesPage';
import AjudaPage from './components/pages/AjudaPage';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { useSettings } from './hooks/useSettings';
import { naturalCompare } from './utils/sorting';
import ChatDialog from './components/ChatDialog';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/pages/LoginPage';
import HistoryPage from './components/pages/HistoryPage';
import { historyService } from './services/historyService';
import { useProjectStore } from './store/projectStore';
import { useUIStore } from './store/uiStore';
import { useRunStore } from './store/runStore';
import { runAnalysisQueue, cancelAllAnalysis as cancelCurrentRun } from './services/queueService';
import { syncService } from './services/syncService';
import { restoreSession, startAutoSave } from './services/persistenceService';

const App: React.FC = () => {
  useEffect(() => {
    const init = async () => {
      await restoreSession();
      startAutoSave();
      syncService.startSyncListeners();
    };
    init();
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading, signOut } = useAuth();
  const { t, darkMode, setDarkMode, language, setLanguage } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    progressMinimized,
    setProgressMinimized,
    currentPath,
    setCurrentPath,
    selectedFolders,
    toggleFolderSelection,
    setSelectedFolders,
    togglePageVisibility,
    hasData,
    activePage,
    setActivePage,
    resetNavigation,
    selectedVerificationItems,
    setSelectedVerificationItems,
    selectedModel,
    setSelectedModel,
    isEnrichingEquipment,
    showProgressPanel,
    setShowProgressPanel,
    sidebarCollapsed,
    setSidebarCollapsed,
    pageVisibility
  } = useUIStore();

  const {
    rootFolder,
    processFiles,
    deleteFolder,
    deleteEmptyFolders,
    toggleImageSelection,
    updateFolderStatus,
    updateFolderObservation
  } = useProjectStore();

  const {
    isProcessing,
    currentFolder: currentProcessingFolder,
    processedCount
  } = useRunStore();

  const handleNavigateToStart = useCallback(() => {
    resetNavigation();
    useProjectStore.getState().resetProject();
    const input = document.getElementById('folder-upload') as HTMLInputElement;
    if (input) input.value = '';
  }, [resetNavigation]);

  const handleFolderSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
      event.target.value = '';
    }
  }, [processFiles]);

  const handleTogglePageVisibility = (pageId: keyof PageVisibility) => {
    togglePageVisibility(pageId);
  };

  const handleModelChange = (model: GeminiModel) => {
    setSelectedModel(model);
  };

  const handleItemsChange = (items: VerificationItemType[]) => {
    setSelectedVerificationItems(items);
  };

  const handleNavigate = (folder: FolderItem) => {
    setCurrentPath(prev => [...prev, { name: folder.name, path: folder.path }]);
  };

  const handleNavigateUp = () => {
    if (currentPath.length > 1) {
      setCurrentPath(prev => prev.slice(0, -1));
    }
  };

  const handleToggleFolderSelection = (folderPath: string) => {
    toggleFolderSelection(folderPath);
  };

  const handleSelectAll = () => {
    if (!rootFolder) return;

    // Find current folder children
    let current: FolderItem | undefined = rootFolder;
    for (let i = 1; i < currentPath.length; i++) {
      const found = current.children.find(
        child => child.type === ItemType.FOLDER && child.path === currentPath[i].path
      ) as FolderItem | undefined;
      if (!found) break;
      current = found;
    }

    if (current) {
      const allFolderPaths = current.children
        .filter(item => item.type === ItemType.FOLDER)
        .map(item => item.path);
      setSelectedFolders(new Set(allFolderPaths));
    }
  };

  const handleClearSelection = () => {
    setSelectedFolders(new Set());
  };

  const handleRunAI = async () => {
    if (!rootFolder) return;

    const runStore = useRunStore.getState();

    // Clear previous run state
    runStore.resetRun();

    // Get all folders to process
    const collectFolders = (folder: FolderItem): string[] => {
      const paths: string[] = [];
      folder.children.forEach(child => {
        if (child.type === ItemType.FOLDER) {
          const f = child as FolderItem;
          // Only add folders that haven't been completed
          if (f.status !== AnalysisStatus.COMPLETED) {
            paths.push(f.path);
          }
          paths.push(...collectFolders(f));
        }
      });
      return paths;
    };

    // Use selected folders or all folders if none selected
    let foldersToProcess: string[] = [];
    if (selectedFolders.size > 0) {
      foldersToProcess = Array.from(selectedFolders);
    } else {
      foldersToProcess = collectFolders(rootFolder);
    }

    if (foldersToProcess.length === 0) {
      console.log('[Queue] No folders to process');
      return;
    }

    // Add folders to queue
    foldersToProcess.forEach(path => runStore.addToQueue(path));

    // Show progress panel
    setShowProgressPanel(true);

    // Start processing
    runAnalysisQueue();
  };



  // Export to Excel
  const handleExportReport = async (type: 'analysis' | 'simple' | 'glass' = 'analysis') => {
    if (!rootFolder) return;

    const workbook = new ExcelJS.Workbook();
    let sheetName = 'Relatório';
    if (type === 'analysis') sheetName = 'Análise de Imagens';
    if (type === 'simple') sheetName = 'Lista de Pastas';
    if (type === 'glass') sheetName = 'Troca de Vidros';

    const sheet = workbook.addWorksheet(sheetName);

    // Styling constants
    const headerFont = { name: 'Rethink Sans', family: 4, size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF37021' } }; // Eletromidia Orange
    const cellFont = { name: 'Rethink Sans', family: 4, size: 11 };
    const borderStyle: ExcelJS.Borders = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      diagonal: { style: 'thin', color: { argb: 'FFFFFFFF' }, down: false, up: false }
    };
    const centerAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };
    const leftAlign: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left', wrapText: true };

    // Define Columns based on type
    if (type === 'analysis') {
      sheet.columns = [
        { header: 'N° Eletro', key: 'neletro', width: 15 },
        { header: 'N° Parada', key: 'code', width: 15 },
        { header: 'Endereço', key: 'address', width: 40 },
        { header: 'N°', key: 'number', width: 10 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Resumo', key: 'summary', width: 80 }
      ];
    } else if (type === 'simple') {
      sheet.columns = [
        { header: 'N° Eletro', key: 'neletro', width: 15 },
        { header: 'N° Parada', key: 'code', width: 15 },
        { header: 'Endereço', key: 'address', width: 40 },
        { header: 'N°', key: 'number', width: 10 },
        { header: 'Bairro', key: 'neighborhood', width: 20 },
        { header: 'Cidade', key: 'city', width: 20 }
      ];
    } else if (type === 'glass') {
      // Columns based on standard maintenance needs + placeholder for user verification
      sheet.columns = [
        { header: 'N° Eletro', key: 'neletro', width: 12 },
        { header: 'N° Parada', key: 'code', width: 12 },
        { header: 'Endereço', key: 'address', width: 40 },
        { header: 'N°', key: 'number', width: 8 },
        { header: 'Bairro', key: 'neighborhood', width: 20 },
        { header: 'Modelo', key: 'model', width: 25 }, // Modelo de Abrigo
        { header: 'Tipo', key: 'type', width: 20 }, // Tipo de Equipamento
        { header: 'Qtd. Vidros', key: 'glass_qty', width: 15 }, // Placeholder
        { header: 'Medidas', key: 'dimensions', width: 20 }, // Placeholder
        { header: 'Observações', key: 'observations', width: 40 }
      ];
    }

    // Apply header styles
    const headerRow = sheet.getRow(1);
    headerRow.font = headerFont;
    headerRow.fill = headerFill;
    headerRow.alignment = centerAlign;

    // Iterate through cells in header to apply border
    headerRow.eachCell((cell) => {
      cell.border = borderStyle;
    });

    const addRows = (folder: FolderItem) => {
      // Logic for including rows:
      // Analysis: Only if status is NOT UNCHECKED (processed folders)
      // Simple/Glass: All folders
      const shouldInclude = type === 'analysis' ? folder.status !== AnalysisStatus.UNCHECKED : true;

      if (shouldInclude) {
        // Parse folder name
        const match = folder.name.match(/^(\d+)\s+(.*?)(?:\s+(\d+))?$/);
        const codeFromName = match ? match[1] : '';
        const addressFromName = match ? match[2] : folder.name;
        const numberFromName = match ? match[3] || '' : '';

        // Use equipment info if available, otherwise fallback to parsed name
        const eq = folder.equipmentInfo;

        const rowData: any = {
          neletro: eq?.nEletro || '',
          code: eq?.nParada || codeFromName,
          address: eq?.endereco || addressFromName,
          number: numberFromName, // Equipment info usually puts number in address, keeping parsed for now
          neighborhood: eq?.bairro || '',
          city: eq?.cidade || '',
          status: folder.status === AnalysisStatus.COMPLETED ? 'Concluído' : 'Pendente',
          summary: folder.analysisSummary || '',
          model: eq?.modeloAbrigo || '',
          type: eq?.tipoEquipamento || '',
          glass_qty: '', // Placeholder
          dimensions: '', // Placeholder
          observations: folder.observation || ''
        };

        const row = sheet.addRow(rowData);

        // Apply styles to the new row
        const isEven = row.number % 2 === 0;
        const rowFill: ExcelJS.Fill | undefined = isEven ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } } : undefined;

        // Common cell style application
        const applyStyle = (cellKey: string, align: Partial<ExcelJS.Alignment> = centerAlign) => {
          // Only apply if column exists
          if (!sheet.getColumn(cellKey)) return;

          const cell = row.getCell(cellKey);
          cell.font = cellFont;
          cell.alignment = align;
          cell.border = borderStyle;
          if (rowFill) cell.fill = rowFill;
          return cell;
        };

        if (type === 'analysis') {
          applyStyle('neletro');
          applyStyle('code');
          applyStyle('address', leftAlign);
          applyStyle('number');
          const statusCell = applyStyle('status');
          if (statusCell) {
            statusCell.font = {
              ...cellFont,
              bold: true,
              color: { argb: folder.status === AnalysisStatus.COMPLETED ? 'FF16A34A' : 'FFEA580C' }
            };
          }
          applyStyle('summary', leftAlign);
        } else if (type === 'simple') {
          applyStyle('neletro');
          applyStyle('code');
          applyStyle('address', leftAlign);
          applyStyle('number');
          applyStyle('neighborhood');
          applyStyle('city');
        } else if (type === 'glass') {
          applyStyle('neletro');
          applyStyle('code');
          applyStyle('address', leftAlign);
          applyStyle('number');
          applyStyle('neighborhood');
          applyStyle('model');
          applyStyle('type');
          applyStyle('glass_qty');
          applyStyle('dimensions');
          applyStyle('observations', leftAlign);
        }
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

    // File name based on type
    let fileName = `relatorio_${new Date().toISOString().split('T')[0]}`;
    if (type === 'simple') fileName = `pastas_${new Date().toISOString().split('T')[0]}`;
    if (type === 'glass') fileName = `troca_vidros_${new Date().toISOString().split('T')[0]}`;

    a.download = `${fileName}.xlsx`;
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
      if (!found) return { status: undefined, reason: undefined, observation: undefined, path: undefined };
      current = found;
    }
    return {
      status: current?.status,
      reason: current?.analysisSummary,
      observation: current?.observation,
      path: current?.path,
      equipmentInfo: current?.equipmentInfo,
      enrichedAddress: current?.enrichedAddress
    };
  }, [rootFolder, currentPath]);

  // Chat context
  const chatContext = useMemo(() => {
    if (!currentFolderInfo || !currentFolderInfo.path) return '';

    let context = `Pasta Atual: ${currentFolderInfo.path}\n`;
    context += `Status: ${currentFolderInfo.status || 'N/A'}\n`;
    if (currentFolderInfo.reason) context += `Resumo da Análise: ${currentFolderInfo.reason}\n`;
    if (currentFolderInfo.observation) context += `Observação: ${currentFolderInfo.observation}\n`;

    if (currentFolderInfo.equipmentInfo) {
      context += `\nEquipamento:\n`;
      context += `Modelo: ${currentFolderInfo.equipmentInfo.modeloAbrigo || 'N/A'}\n`;
      context += `Endereço: ${currentFolderInfo.equipmentInfo.endereco || 'N/A'}\n`;
    }

    return context;
  }, [currentFolderInfo]);

  // Render login if not authenticated
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-950' : 'bg-[#FAFAFA]'}`}>
        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage darkMode={darkMode} t={t} />;
  }

  // Render onboarding if no data
  if (!hasData) {
    return (
      <OnboardingScreen
        onFolderSelect={handleFolderSelect}
        onModelSelect={handleModelChange}
        onItemsSelect={handleItemsChange}
        selectedModel={selectedModel}
        selectedItems={selectedVerificationItems}
        fileInputRef={fileInputRef}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        language={language}
        onLanguageChange={setLanguage}
        t={t}
      />
    );
  }

  // Render main app with sidebar navigation
  return (
    <div className={`h-screen flex font-['Rethink_Sans'] transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-white'}`}>
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        pageVisibility={pageVisibility}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onNavigateToStart={handleNavigateToStart}
        onLogout={signOut}
        userEmail={user.email}
        darkMode={darkMode}
        t={t}
      />

      <div className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-[#F8F9FA]'}`}>
        {activePage === 'dashboard' && (
          <>
            <TopBar
              currentPath={currentPath}
              onNavigateUp={handleNavigateUp}
              onOpenFolder={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                } else {
                  // Fallback in case ref is lost
                  (document.getElementById('folder-select-input') as HTMLInputElement)?.click();
                }
              }}
              onRunAI={handleRunAI}
              onExportReport={handleExportReport}
              onExportSelectedZip={handleExportZip}
              onDeleteEmptyFolders={deleteEmptyFolders}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              isProcessing={isProcessing}
              totalPending={stats.pendingFolders}
              selectedCount={selectedFolders.size}
              totalFolders={stats.totalFolders}
              equipmentCacheReady={!isEnrichingEquipment}
              equipmentCount={getEquipmentCount()}
              darkMode={darkMode}
              t={t}
            />
            <MainView />
          </>
        )}

        {activePage === 'history' && (
          <HistoryPage
            darkMode={darkMode}
            t={t}
          />
        )}

        {activePage === 'relatorios' && (
          <RelatoriosPage
            onExportReport={handleExportReport}
            onExportZip={() => handleExportZip([AnalysisStatus.COMPLETED])}
            stats={stats}
            darkMode={darkMode}
            t={t}
          />
        )}

        {activePage === 'ferramentas' && (
          <FerramentasPage
            onExportReport={handleExportReport}
            darkMode={darkMode}
            t={t}
          />
        )}

        {activePage === 'configuracoes' && (
          <ConfiguracoesPage
            pageVisibility={pageVisibility}
            onTogglePageVisibility={handleTogglePageVisibility}
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
            language={language}
            onLanguageChange={setLanguage}
            t={t}
          />
        )}

        {activePage === 'ajuda' && <AjudaPage darkMode={darkMode} t={t} />}
      </div>

      {/* Hidden file input */}
      {/* Hidden file input */}
      <input
        id="folder-select-input"
        type="file"
        ref={fileInputRef}
        // @ts-ignore
        webkitdirectory=""
        multiple
        className="hidden"
        onChange={(e) => {
          handleFolderSelect(e);
          e.target.value = ''; // Reset to allow selecting same folder
        }}
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
        onCancel={cancelCurrentRun}
        isMinimized={progressMinimized}
        darkMode={darkMode}
        t={t}
      />

      <ChatDialog context={chatContext} darkMode={darkMode} />
    </div>
  );
};

export default App;
