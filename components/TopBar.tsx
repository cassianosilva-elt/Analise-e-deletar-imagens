import React from 'react';
import { FolderOpen, Wand2, ArrowLeft, FileSpreadsheet, Archive, Trash2 } from 'lucide-react';
import { Breadcrumb } from '../types';

interface TopBarProps {
  currentPath: Breadcrumb[];
  onNavigateUp: () => void;
  onOpenFolder: () => void;
  onRunAI: () => void;
  onExportReport: () => void;
  onExportSelectedZip: () => void;
  onDeleteEmptyFolders: () => void;
  isProcessing: boolean;
  totalPending: number;
}

const TopBar: React.FC<TopBarProps> = ({
  currentPath,
  onNavigateUp,
  onOpenFolder,
  onRunAI,
  onExportReport,
  onExportSelectedZip,
  onDeleteEmptyFolders,
  isProcessing,
  totalPending
}) => {
  return (
    <div className="bg-white flex flex-col border-b border-gray-200 z-10">

      <div className="flex items-center justify-between px-6 py-4">

        {/* Left: Breadcrumbs & Navigation */}
        <div className="flex items-center flex-1 mr-8">
          <button
            onClick={onNavigateUp}
            disabled={currentPath.length <= 1}
            className="mr-4 p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex items-center text-sm font-medium text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            <FolderOpen className="w-4 h-4 text-[#FF4D00] mr-2" />
            {currentPath.map((crumb, idx) => (
              <React.Fragment key={crumb.path}>
                <span className={`${idx === currentPath.length - 1 ? 'text-gray-900' : 'text-gray-400'} cursor-default`}>
                  {crumb.name}
                </span>
                {idx < currentPath.length - 1 && <span className="text-gray-300 mx-2">/</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenFolder}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Importar
          </button>

          <button
            onClick={onDeleteEmptyFolders}
            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
            title="Excluir pastas sem imagens"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Vazias
          </button>

          <button
            onClick={onExportReport}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
            Excel
          </button>

          <button
            onClick={onExportSelectedZip}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm"
            title="Baixar ZIP apenas com fotos selecionadas dos concluídos"
          >
            <Archive className="w-4 h-4 mr-2" />
            ZIP
          </button>

          <button
            onClick={onRunAI}
            disabled={isProcessing}
            className={`
                flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-all
                ${isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#FF4D00] hover:bg-[#E64500] hover:shadow-orange-500/30'}
              `}
          >
            {isProcessing ? (
              <>
                <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                <span>Processando {totalPending}...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                <span>Iniciar Análise AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;