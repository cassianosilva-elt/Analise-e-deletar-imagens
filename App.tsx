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

const App: React.FC = () => {
  // Settings (dark mode and language)
  const { language, setLanguage, darkMode, setDarkMode, t } = useSettings();

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

  // Verification items state
  const [selectedVerificationItems, setSelectedVerificationItems] = useState<VerificationItemType[]>(
    VERIFICATION_ITEMS.map(item => item.id)
  );

  // Equipment enrichment state
  const [isEnrichingEquipment, setIsEnrichingEquipment] = useState(false);

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

  // Handle items change
  const handleItemsChange = (items: VerificationItemType[]) => {
    setSelectedVerificationItems(items);
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
      // Set folder structure immediately (without equipment data yet)
      setRootFolder(root);
      setCurrentPath([{ name: root.name, path: root.path }]);
      setHasData(true);

      // Enrich folders with equipment data in background
      enrichFoldersAsync(root);
    }
  }, []);

  // Async function to enrich all folders with equipment data
  const enrichFoldersAsync = async (root: FolderItem) => {
    setIsEnrichingEquipment(true);

    // Collect all folders to enrich
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
    console.log(`[Equipment] Enriching ${allFolders.length} folders...`);

    // Enrich each folder (sequentially to avoid overwhelming API)
    for (const folder of allFolders) {
      try {
        const equipmentInfo = await lookupFromFolderName(folder.name);
        if (equipmentInfo) {
          // Update folder with equipment info
          updateFolderEquipment(folder.path, equipmentInfo);
        }
      } catch (error) {
        console.warn(`[Equipment] Failed to enrich folder ${folder.name}:`, error);
      }
    }

    setIsEnrichingEquipment(false);
    console.log(`[Equipment] Enrichment complete. ${getEquipmentCount()} equipment cached.`);
  };

  // Update folder with equipment info
  const updateFolderEquipment = useCallback((folderPath: string, equipmentInfo: EquipmentInfo) => {
    setRootFolder(currentRoot => {
      if (!currentRoot) return null;

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

      return updateRecursive(currentRoot);
    });
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
  const updateFolderStatus = useCallback((folderPath: string, status: AnalysisStatus, summary?: string, observation?: string) => {
    setRootFolder(currentRoot => {
      if (!currentRoot) return null;

      const updateRecursive = (folder: FolderItem): FolderItem => {
        if (folder.path === folderPath) {
          return { ...folder, status, analysisSummary: summary, observation: observation || folder.observation };
        }
        return {
          ...folder,
          children: folder.children.map(child =>
            child.type === ItemType.FOLDER ? updateRecursive(child as FolderItem) : child
          )
        };
      };

      return updateRecursive(currentRoot);
    });
  }, []);

  // Run AI analysis
  const handleRunAI = async () => {
    if (!rootFolder || isProcessing) return;

    const foldersToAnalyze = selectedFolders.size > 0
      ? Array.from(selectedFolders)
      : currentItems.filter(item => item.type === ItemType.FOLDER).map(f => f.path);

    if (foldersToAnalyze.length === 0) return;

    // Sort folders naturally (alphanumeric) to match UI order
    foldersToAnalyze.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

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
          // Pass equipment info to AI for better context
          const result = await analyzeFolderImages(
            targetFolder.name,
            files,
            selectedModel,
            selectedVerificationItems,
            targetFolder.equipmentInfo
          );
          const newStatus = result.status === 'COMPLETED' ? AnalysisStatus.COMPLETED : AnalysisStatus.PENDING;
          updateFolderStatus(folderPath, newStatus, result.reason, result.observation);
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

  // Delete empty folders (folders without images)
  const handleDeleteEmptyFolders = () => {
    if (!rootFolder) return;

    // Helper: check if folder contains any images (directly or in subfolders)
    const hasImages = (folder: FolderItem): boolean => {
      return folder.children.some(child => {
        if (child.type === ItemType.IMAGE) return true;
        if (child.type === ItemType.FOLDER) return hasImages(child as FolderItem);
        return false;
      });
    };

    // Recursively remove folders without images
    const removeEmpty = (folder: FolderItem): FolderItem => {
      // First, process all subfolders recursively
      const processedChildren = folder.children.map(child =>
        child.type === ItemType.FOLDER ? removeEmpty(child as FolderItem) : child
      );

      // Then filter out folders that have no images
      const filteredChildren = processedChildren.filter(child => {
        if (child.type === ItemType.FOLDER) {
          return hasImages(child as FolderItem);
        }
        return true; // Keep all non-folder items (images, files)
      });

      return { ...folder, children: filteredChildren };
    };

    const updatedRoot = removeEmpty(rootFolder);
    const removedCount = countFolders(rootFolder) - countFolders(updatedRoot);

    setRootFolder(updatedRoot);

    // Log for debugging
    console.log(`Pastas vazias removidas: ${removedCount}`);
  };

  // Helper to count folders
  const countFolders = (folder: FolderItem): number => {
    let count = 0;
    folder.children.forEach(child => {
      if (child.type === ItemType.FOLDER) {
        count += 1 + countFolders(child as FolderItem);
      }
    });
    return count;
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

  // Update folder observation
  const handleUpdateObservation = (folderPath: string, observation: string) => {
    setRootFolder(currentRoot => {
      if (!currentRoot) return null;

      const updateRecursive = (folder: FolderItem): FolderItem => {
        if (folder.path === folderPath) {
          return { ...folder, observation };
        }
        return {
          ...folder,
          children: folder.children.map(child =>
            child.type === ItemType.FOLDER ? updateRecursive(child as FolderItem) : child
          )
        };
      };

      return updateRecursive(currentRoot);
    });
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
    <div className={`h-screen flex font-['Rethink_Sans'] transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <Sidebar
        activePage={activePage}
        onPageChange={setActivePage}
        pageVisibility={pageVisibility}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        darkMode={darkMode}
        t={t}
      />

      <div className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-[#F8F9FA]'}`}>
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
              onDeleteEmptyFolders={handleDeleteEmptyFolders}
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
            <MainView
              items={currentItems}
              onNavigate={handleNavigate}
              onDeleteFolder={handleDeleteFolder}
              onToggleFolderSelection={handleToggleFolderSelection}
              onManualStatusChange={handleManualStatusChange}
              onToggleImageSelection={handleToggleImageSelection}
              onUpdateObservation={handleUpdateObservation}
              selectedFolders={selectedFolders}
              currentFolderStatus={currentFolderInfo.status}
              currentFolderReason={currentFolderInfo.reason}
              currentFolderObservation={currentFolderInfo.observation}
              currentFolderPath={currentFolderInfo.path}
              currentFolderEquipmentInfo={currentFolderInfo.equipmentInfo}
              currentFolderEnrichedAddress={currentFolderInfo.enrichedAddress}
              darkMode={darkMode}
              t={t}
            />
          </>
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
        isMinimized={progressMinimized}
        t={t}
      />
    </div>
  );
};

export default App;
