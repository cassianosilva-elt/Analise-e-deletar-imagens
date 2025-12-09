import React, { useState } from 'react';
import { FolderOpen, Wand2, ArrowLeft, FileSpreadsheet, Archive, Trash2, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 z-20 relative">
      {/* Main Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Left: Breadcrumbs & Navigation */}
        <div className="flex items-center flex-1 min-w-0 mr-2 sm:mr-4">
          <button
            onClick={onNavigateUp}
            disabled={currentPath.length <= 1}
            className="mr-2 sm:mr-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>

          <div className="flex items-center text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 min-w-0 overflow-hidden">
            <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF4D00] mr-1.5 sm:mr-2 flex-shrink-0" />
            <div className="flex items-center min-w-0 overflow-hidden">
              {currentPath.length > 2 ? (
                <>
                  <span className="text-gray-400 truncate">{currentPath[0].name}</span>
                  <span className="text-gray-300 mx-1 sm:mx-2 flex-shrink-0">/</span>
                  <span className="text-gray-400 flex-shrink-0">...</span>
                  <span className="text-gray-300 mx-1 sm:mx-2 flex-shrink-0">/</span>
                  <span className="text-gray-900 truncate">{currentPath[currentPath.length - 1].name}</span>
                </>
              ) : (
                currentPath.map((crumb, idx) => (
                  <React.Fragment key={crumb.path}>
                    <span className={`${idx === currentPath.length - 1 ? 'text-gray-900' : 'text-gray-400'} truncate`}>
                      {crumb.name}
                    </span>
                    {idx < currentPath.length - 1 && <span className="text-gray-300 mx-1 sm:mx-2 flex-shrink-0">/</span>}
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-2">
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
            Vazias
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
                <span>Analisando {totalPending}...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                <span>Iniciar Análise</span>
              </>
            )}
          </button>
        </div>

        {/* Mobile: AI Button + Menu */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onRunAI}
            disabled={isProcessing}
            className={`
              flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg shadow-md transition-all
              ${isProcessing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#FF4D00] hover:bg-[#E64500]'}
            `}
          >
            <Wand2 className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span className="ml-1.5 hidden sm:inline">{isProcessing ? `${totalPending}...` : 'Analisar'}</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white shadow-lg absolute top-full left-0 right-0 z-50">
          <div className="p-3 space-y-2">
            <button
              onClick={() => { onOpenFolder(); setMobileMenuOpen(false); }}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <FolderOpen className="w-4 h-4 mr-3 text-gray-500" />
              Importar Pasta
            </button>

            <button
              onClick={() => { onExportReport(); setMobileMenuOpen(false); }}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 mr-3 text-green-600" />
              Exportar Excel
            </button>

            <button
              onClick={() => { onExportSelectedZip(); setMobileMenuOpen(false); }}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Archive className="w-4 h-4 mr-3 text-blue-600" />
              Exportar ZIP
            </button>

            <button
              onClick={() => { onDeleteEmptyFolders(); setMobileMenuOpen(false); }}
              className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-3" />
              Excluir Pastas Vazias
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;