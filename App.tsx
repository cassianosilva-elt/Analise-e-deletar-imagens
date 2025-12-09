import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import MainView from './components/MainView';
import AnalysisProgressPanel from './components/AnalysisProgressPanel';
import { Breadcrumb, FolderItem, FileItem, ItemType, AnalysisStatus } from './types';
import { analyzeFolderImages } from './services/geminiService';
import { FolderSearch, UploadCloud, AlertTriangle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

const App = () => {
  const [rootFolder, setRootFolder] = useState<FolderItem | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [path, setPath] = useState<Breadcrumb[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());

  // Progress tracking state
  const [showProgress, setShowProgress] = useState(false);
  const [progressMinimized, setProgressMinimized] = useState(false);
  const [currentAnalyzingFolder, setCurrentAnalyzingFolder] = useState('');
  const [totalToAnalyze, setTotalToAnalyze] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingResultCount, setPendingResultCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (rootFolder) {
      setPath([{ name: rootFolder.name, path: rootFolder.path }]);
      setCurrentFolder(rootFolder);
    }
  }, [rootFolder]);

  // Recursively update status
  const updateFolderStatus = (
    root: FolderItem,
    targetPath: string,
    status: AnalysisStatus,
    reason: string,
    selectedFiles: string[] = []
  ): FolderItem => {
    if (root.path === targetPath) {
      const updatedChildren = root.children.map(child => {
        if (child.type === ItemType.IMAGE) {
          return {
            ...child,
            selectedByAI: (selectedFiles || []).includes(child.name)
          };
        }
        return child;
      });

      return {
        ...root,
        status,
        analysisSummary: reason,
        children: updatedChildren
      };
    }

    if (root.children) {
      const newChildren = root.children.map(child => {
        if (child.type === ItemType.FOLDER) {
          return updateFolderStatus(child as FolderItem, targetPath, status, reason, selectedFiles);
        }
        return child;
      });
      return { ...root, children: newChildren };
    }

    return root;
  };

  const refreshTree = (targetPath: string, status: AnalysisStatus, reason: string, selectedFiles: string[]) => {
    setRootFolder(prev => {
      if (!prev) return null;
      return updateFolderStatus(prev, targetPath, status, reason, selectedFiles || []);
    });
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const fileList = Array.from(files) as (File & { webkitRelativePath: string })[];
    const rootName = fileList[0].webkitRelativePath.split('/')[0];

    const newRoot: FolderItem = {
      id: 'root',
      name: rootName,
      path: rootName,
      type: ItemType.FOLDER,
      children: [],
      status: AnalysisStatus.UNCHECKED
    };

    const findFolder = (parent: FolderItem, pathParts: string[]): FolderItem => {
      if (pathParts.length === 0) return parent;

      const currentName = pathParts[0];
      let found = parent.children.find(c => c.name === currentName && c.type === ItemType.FOLDER) as FolderItem;

      if (!found) {
        found = {
          id: parent.path + '/' + currentName,
          name: currentName,
          path: parent.path + '/' + currentName,
          type: ItemType.FOLDER,
          children: [],
          status: AnalysisStatus.UNCHECKED
        };
        parent.children.push(found);
      }

      return findFolder(found, pathParts.slice(1));
    };

    fileList.forEach(file => {
      // Ignore hidden files (starting with .)
      if (file.name.startsWith('.')) return;

      const pathParts = file.webkitRelativePath.split('/');
      const folderParts = pathParts.slice(1, -1);
      const fileName = pathParts[pathParts.length - 1];

      const parentFolder = findFolder(newRoot, folderParts);

      const fileItem: FileItem = {
        name: fileName,
        path: file.webkitRelativePath,
        type: file.type.startsWith('image/') ? ItemType.IMAGE : ItemType.FILE,
        fileObject: file,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };
      parentFolder.children.push(fileItem);
    });

    setRootFolder(newRoot);
    setPendingCount(countFolders(newRoot));
  };

  const countFolders = (folder: FolderItem): number => {
    let count = 0;
    folder.children.forEach(child => {
      if (child.type === ItemType.FOLDER) {
        count += 1 + countFolders(child as FolderItem);
      }
    });
    return count;
  };

  const getAllSubfolders = (folder: FolderItem): FolderItem[] => {
    let folders: FolderItem[] = [];
    folder.children.forEach(child => {
      if (child.type === ItemType.FOLDER) {
        folders.push(child as FolderItem);
        folders = folders.concat(getAllSubfolders(child as FolderItem));
      }
    });
    return folders;
  };

  // ---- FOLDER SELECTION ----
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

  const handleSelectAllFolders = () => {
    if (!rootFolder) return;
    const subfolders = getAllSubfolders(rootFolder);
    const uncompletedPaths = subfolders
      .filter(f => f.status !== AnalysisStatus.COMPLETED)
      .map(f => f.path);
    setSelectedFolders(new Set(uncompletedPaths));
  };

  const handleClearSelection = () => {
    setSelectedFolders(new Set());
  };

  // ---- FOLDER DELETION ----
  const handleDeleteFolder = (folderPath: string) => {
    if (!rootFolder) return;

    const deleteFromTree = (folder: FolderItem): FolderItem => {
      const filteredChildren = folder.children
        .filter(child => {
          if (child.type === ItemType.FOLDER) {
            return (child as FolderItem).path !== folderPath;
          }
          return true;
        })
        .map(child => {
          if (child.type === ItemType.FOLDER) {
            return deleteFromTree(child as FolderItem);
          }
          return child;
        });

      return { ...folder, children: filteredChildren };
    };

    const newRoot = deleteFromTree(rootFolder);
    setRootFolder(newRoot);

    // If we deleted the current folder, navigate to root
    if (currentFolder?.path === folderPath) {
      setCurrentFolder(newRoot);
      setPath([{ name: newRoot.name, path: newRoot.path }]);
    }
  };

  const handleDeleteEmptyFolders = () => {
    if (!rootFolder) return;

    const removeEmpty = (folder: FolderItem): FolderItem => {
      const filteredChildren = folder.children
        .map(child => {
          if (child.type === ItemType.FOLDER) {
            return removeEmpty(child as FolderItem);
          }
          return child;
        })
        .filter(child => {
          if (child.type === ItemType.FOLDER) {
            const subFolder = child as FolderItem;
            // Check if folder has any images
            const hasImages = subFolder.children.some(c => c.type === ItemType.IMAGE);
            // Keep if has images OR has subfolders with content
            const hasSubfolders = subFolder.children.some(c => c.type === ItemType.FOLDER);
            return hasImages || hasSubfolders;
          }
          return true;
        });

      return { ...folder, children: filteredChildren };
    };

    const newRoot = removeEmpty(rootFolder);
    setRootFolder(newRoot);
    setCurrentFolder(newRoot);
    setPath([{ name: newRoot.name, path: newRoot.path }]);
  };

  const handleRunAI = async () => {
    if (!rootFolder) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setShowProgress(true);
    setProgressMinimized(false);
    setProcessedCount(0);
    setCompletedCount(0);
    setPendingResultCount(0);

    const subfolders = getAllSubfolders(rootFolder);

    // If folders are selected, only process those. Otherwise, process all non-completed.
    let foldersToProcess: FolderItem[];
    if (selectedFolders.size > 0) {
      foldersToProcess = subfolders.filter(f => selectedFolders.has(f.path) && f.status !== AnalysisStatus.COMPLETED);
    } else {
      foldersToProcess = subfolders.filter(f => f.status !== AnalysisStatus.COMPLETED);
    }

    setTotalToAnalyze(foldersToProcess.length);
    setPendingCount(foldersToProcess.length);

    if (foldersToProcess.length === 0) {
      setErrorMessage("Todas as pastas já foram analisadas e estão concluídas.");
      setIsProcessing(false);
      setShowProgress(false);
      return;
    }

    try {
      let localCompleted = 0;
      let localPending = 0;

      for (const folder of foldersToProcess) {
        setCurrentAnalyzingFolder(folder.name);

        try {
          const imageFiles = folder.children
            .filter(c => c.type === ItemType.IMAGE && (c as FileItem).fileObject)
            .map(c => (c as FileItem).fileObject!);

          if (imageFiles.length > 0) {
            refreshTree(folder.path, AnalysisStatus.PROCESSING, "Analisando...", []);

            // Use a small delay to prevent browser UI freezing
            await new Promise(r => setTimeout(r, 100));

            const result = await analyzeFolderImages(folder.name, imageFiles);

            const finalStatus = result.status === 'COMPLETED' ? AnalysisStatus.COMPLETED : AnalysisStatus.PENDING;
            refreshTree(folder.path, finalStatus, result.reason, result.selectedFiles);

            if (finalStatus === AnalysisStatus.COMPLETED) {
              localCompleted++;
            } else {
              localPending++;
            }
          } else {
            refreshTree(folder.path, AnalysisStatus.PENDING, "Pasta sem imagens", []);
            localPending++;
          }
        } catch (innerError) {
          console.error(`Failed to analyze folder ${folder.name}`, innerError);
          refreshTree(folder.path, AnalysisStatus.ERROR, "Erro ao processar pasta", []);
          localPending++;
        }

        setProcessedCount(prev => prev + 1);
        setCompletedCount(localCompleted);
        setPendingResultCount(localPending);
        setPendingCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Critical error in AI loop", error);
      setErrorMessage("Erro crítico ao executar análise. Verifique se as imagens não são grandes demais.");
    } finally {
      setIsProcessing(false);
      setCurrentAnalyzingFolder('');
      setSelectedFolders(new Set()); // Clear selection after analysis
    }
  };

  // ---- EXPORT LOGIC ----
  const handleExportReport = async () => {
    if (!rootFolder) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Fiscalização AI';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Relatório', {
      properties: { tabColor: { argb: 'FF4D00' } }
    });

    // Define columns with headers
    worksheet.columns = [
      { header: 'N° PARADA', key: 'codigo', width: 15 },
      { header: 'ENDEREÇO', key: 'endereco', width: 50 },
      { header: 'STATUS', key: 'status', width: 18 },
      { header: 'OBSERVAÇÃO', key: 'observacao', width: 45 }
    ];

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4D00' } // Orange brand color
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    const subfolders = getAllSubfolders(rootFolder);

    // Process each analyzed folder
    subfolders.forEach(folder => {
      // Only export if it was analyzed (has status) or has content
      if (folder.status === AnalysisStatus.UNCHECKED && folder.children.length === 0) return;

      // Parse Name: "409082 AV. AGUIAR DA BEIRA"
      const match = folder.name.match(/^(\d+)\s*[-_.]?\s*(.*)$/);

      let code = 'N/A';
      let address = folder.name;

      if (match) {
        code = match[1];
        address = match[2];
      }

      // Translate status to PT-BR
      let statusText = folder.status as string;
      if (folder.status === AnalysisStatus.COMPLETED) statusText = 'CONCLUÍDO';
      else if (folder.status === AnalysisStatus.PENDING) statusText = 'PENDENTE';
      else if (folder.status === AnalysisStatus.PROCESSING) statusText = 'PROCESSANDO';
      else if (folder.status === AnalysisStatus.ERROR) statusText = 'ERRO';
      else if (folder.status === AnalysisStatus.UNCHECKED) statusText = 'NÃO VERIFICADO';

      const row = worksheet.addRow({
        codigo: code,
        endereco: address,
        status: statusText,
        observacao: folder.analysisSummary || ''
      });

      // Style status cell based on value
      const statusCell = row.getCell('status');
      statusCell.alignment = { horizontal: 'center' };

      if (folder.status === AnalysisStatus.COMPLETED) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'DCFCE7' } // Light green
        };
        statusCell.font = { color: { argb: '166534' }, bold: true };
      } else if (folder.status === AnalysisStatus.PENDING) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEF3C7' } // Light yellow
        };
        statusCell.font = { color: { argb: 'B45309' }, bold: true };
      } else if (folder.status === AnalysisStatus.ERROR) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FEE2E2' } // Light red
        };
        statusCell.font = { color: { argb: 'DC2626' }, bold: true };
      }

      // Add borders to all cells
      row.eachCell(cell => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'E5E7EB' } },
          left: { style: 'thin', color: { argb: 'E5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
          right: { style: 'thin', color: { argb: 'E5E7EB' } }
        };
      });
    });

    // Add borders to header
    headerRow.eachCell(cell => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'E5E7EB' } },
        left: { style: 'thin', color: { argb: 'E5E7EB' } },
        bottom: { style: 'medium', color: { argb: 'FF4D00' } },
        right: { style: 'thin', color: { argb: 'E5E7EB' } }
      };
    });

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Relatorio_Fiscalizacao_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ---- EXPORT SELECTED PHOTOS AS ZIP ----
  const handleExportSelectedPhotosZip = async (statuses: AnalysisStatus[] = [AnalysisStatus.COMPLETED]) => {
    if (!rootFolder) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const zip = new JSZip();
      const subfolders = getAllSubfolders(rootFolder);
      let addedFiles = 0;
      let completedFolders = 0;

      console.log("Total subfolders found:", subfolders.length);

      for (const folder of subfolders) {
        console.log(`Folder: ${folder.name}, Status: ${folder.status}`);

        // Filter by selected statuses
        if (!statuses.includes(folder.status)) continue;

        completedFolders++;

        // Get selected photos from this folder
        const selectedPhotos = folder.children.filter(
          child => child.type === ItemType.IMAGE && (child as FileItem).selectedByAI
        ) as FileItem[];

        console.log(`  - Selected photos in ${folder.name}:`, selectedPhotos.length);

        // If no selected photos, include ALL images from the completed folder
        const photosToExport = selectedPhotos.length > 0
          ? selectedPhotos
          : folder.children.filter(child => child.type === ItemType.IMAGE) as FileItem[];

        for (const photo of photosToExport) {
          if (photo.fileObject) {
            // Create folder structure in ZIP: FolderName/PhotoName
            const zipPath = `${folder.name}/${photo.name}`;
            zip.file(zipPath, photo.fileObject);
            addedFiles++;
            console.log(`    Added: ${zipPath}`);
          } else {
            console.log(`    MISSING fileObject for: ${photo.name}`);
          }
        }
      }

      console.log(`Total completed folders: ${completedFolders}, Total files added: ${addedFiles}`);

      if (addedFiles === 0) {
        setErrorMessage(`Nenhuma foto encontrada. ${completedFolders} pastas concluídas, mas sem fotos com fileObject.`);
        setIsProcessing(false);
        return;
      }

      // Generate and download ZIP
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Fotos_Selecionadas_${new Date().toISOString().slice(0, 10)}.zip`);

    } catch (error) {
      console.error("Error creating ZIP:", error);
      setErrorMessage("Erro ao criar arquivo ZIP.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNavigate = (folder: FolderItem) => {
    setCurrentFolder(folder);
    const newPathParts = folder.path.split('/');
    const breadcrumbs = newPathParts.map((part, index) => ({
      name: part,
      path: newPathParts.slice(0, index + 1).join('/')
    }));
    setPath(breadcrumbs);
  };

  const handleNavigateUp = () => {
    if (path.length <= 1 || !rootFolder) return;
    const newPath = path.slice(0, -1);
    const parentPathStr = newPath[newPath.length - 1].path;

    const findByPath = (node: FolderItem, target: string): FolderItem | null => {
      if (node.path === target) return node;
      for (const child of node.children) {
        if (child.type === ItemType.FOLDER) {
          const found = findByPath(child as FolderItem, target);
          if (found) return found;
        }
      }
      return null;
    };

    const parentNode = findByPath(rootFolder, parentPathStr);
    if (parentNode) {
      setPath(newPath);
      setCurrentFolder(parentNode);
    }
  };

  if (!rootFolder) {
    return (
      <div className="h-screen w-screen bg-[#F3F4F6] flex items-center justify-center font-['Inter']">
        <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-lg border border-gray-100">
          <div className="bg-orange-100 p-6 rounded-full inline-block mb-6">
            <FolderSearch className="w-16 h-16 text-[#FF4D00]" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-gray-900">Fiscalização <span className="text-[#FF4D00]">AI</span></h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Importe sua pasta raiz "Fiscalização". O sistema identificará automaticamente os abrigos concluídos e selecionará as melhores evidências fotográficas.
          </p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-[#FF4D00] hover:bg-[#E64500] text-white font-medium px-8 py-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center w-full transition-all transform hover:-translate-y-1"
          >
            <UploadCloud className="w-6 h-6 mr-3" />
            Selecionar Pasta Fiscalização
          </button>
          <input
            type="file"
            ref={fileInputRef}
            // @ts-ignore 
            webkitdirectory=""
            multiple
            className="hidden"
            onChange={handleFolderSelect}
          />
          <div className="mt-8 flex justify-center space-x-2">
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
            <div className="h-1.5 w-1.5 rounded-full bg-[#FF4D00]"></div>
          </div>
        </div>
      </div>
    );
  }

  const getActiveFolder = (): FolderItem => {
    if (!currentFolder) return rootFolder;
    const find = (node: FolderItem): FolderItem | null => {
      if (node.path === currentFolder.path) return node;
      for (const child of node.children) {
        if (child.type === ItemType.FOLDER) {
          const res = find(child as FolderItem);
          if (res) return res;
        }
      }
      return null;
    };
    return find(rootFolder) || rootFolder;
  };

  const activeFolder = getActiveFolder();

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FA] text-gray-900 font-['Inter']">
      <TopBar
        currentPath={path}
        onNavigateUp={handleNavigateUp}
        onOpenFolder={() => fileInputRef.current?.click()}
        onRunAI={handleRunAI}
        onExportReport={handleExportReport}
        onExportSelectedZip={handleExportSelectedPhotosZip}
        onDeleteEmptyFolders={handleDeleteEmptyFolders}
        onSelectAll={handleSelectAllFolders}
        onClearSelection={handleClearSelection}
        isProcessing={isProcessing}
        totalPending={pendingCount}
        selectedCount={selectedFolders.size}
        totalFolders={rootFolder ? countFolders(rootFolder) : 0}
      />

      {errorMessage && (
        <div className="bg-red-50 text-red-700 px-4 py-2 text-sm flex items-center justify-center border-b border-red-200 animate-pulse">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {errorMessage}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainView
          items={activeFolder.children}
          onNavigate={handleNavigate}
          onDeleteFolder={handleDeleteFolder}
          onToggleFolderSelection={handleToggleFolderSelection}
          selectedFolders={selectedFolders}
          currentFolderStatus={activeFolder.status}
          currentFolderReason={activeFolder.analysisSummary}
        />
      </div>

      {/* Progress Panel */}
      <AnalysisProgressPanel
        isVisible={showProgress}
        isProcessing={isProcessing}
        currentFolder={currentAnalyzingFolder}
        totalFolders={totalToAnalyze}
        processedCount={processedCount}
        completedCount={completedCount}
        pendingCount={pendingResultCount}
        onClose={() => setShowProgress(false)}
        onToggle={() => setProgressMinimized(!progressMinimized)}
        isMinimized={progressMinimized}
      />

      <input
        type="file"
        ref={fileInputRef}
        // @ts-ignore 
        webkitdirectory=""
        multiple
        className="hidden"
        onChange={handleFolderSelect}
      />
    </div>
  );
};

export default App;