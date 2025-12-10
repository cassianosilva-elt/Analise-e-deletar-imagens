import React, { useState, useRef, useEffect } from 'react';
import { FolderOpen, Wand2, ArrowLeft, FileSpreadsheet, Archive, Trash2, Check, Download, Menu, X, CheckSquare, Square, Database, Loader2 } from 'lucide-react';
import { Breadcrumb, AnalysisStatus } from '../types';

interface TopBarProps {
  currentPath: Breadcrumb[];
  onNavigateUp: () => void;
  onOpenFolder: () => void;
  onRunAI: () => void;
  onExportReport: () => void;
  onExportSelectedZip: (statuses: AnalysisStatus[]) => void;
  onDeleteEmptyFolders: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  isProcessing: boolean;
  totalPending: number;
  selectedCount: number;
  totalFolders: number;
  equipmentCacheReady?: boolean;
  equipmentCount?: number;
}

const TopBar: React.FC<TopBarProps> = ({
  currentPath,
  onNavigateUp,
  onOpenFolder,
  onRunAI,
  onExportReport,
  onExportSelectedZip,
  onDeleteEmptyFolders,
  onSelectAll,
  onClearSelection,
  isProcessing,
  totalPending,
  selectedCount,
  totalFolders,
  equipmentCacheReady = false,
  equipmentCount = 0
}) => {
  const [zipDropdownOpen, setZipDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [zipStatuses, setZipStatuses] = useState<AnalysisStatus[]>([AnalysisStatus.COMPLETED]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setZipDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleZipStatus = (status: AnalysisStatus) => {
    setZipStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 z-10">
      {/* Main Row */}
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3">

        {/* Left: Navigation */}
        <div className="flex items-center min-w-0 flex-1">
          <button
            onClick={onNavigateUp}
            disabled={currentPath.length <= 1}
            className="mr-2 sm:mr-3 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center text-xs sm:text-sm font-medium text-gray-700 bg-gray-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-gray-200 min-w-0 max-w-[120px] sm:max-w-[200px] lg:max-w-none overflow-hidden">
            <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF4D00] mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="truncate">
              {currentPath.length > 1 ? currentPath[currentPath.length - 1]?.name : currentPath[0]?.name}
            </span>
          </div>

          {/* Counts - Desktop */}
          {totalFolders > 0 && (
            <div className="hidden md:flex items-center gap-2 ml-3">
              <div className="flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-md border border-purple-200 text-xs font-medium">
                <FolderOpen className="w-3 h-3 mr-1" />
                {totalFolders}
              </div>
              {selectedCount > 0 && (
                <div className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs font-semibold">
                  <CheckSquare className="w-3 h-3 mr-1" />
                  {selectedCount}
                </div>
              )}
            </div>
          )}

          {/* Equipment Cache Status - Desktop */}
          <div className="hidden lg:flex items-center ml-2">
            {equipmentCacheReady ? (
              <div className="flex items-center px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200 text-xs font-medium" title={`${equipmentCount.toLocaleString()} equipamentos carregados`}>
                <Database className="w-3 h-3 mr-1" />
                {equipmentCount.toLocaleString()}
              </div>
            ) : (
              <div className="flex items-center px-2 py-1 bg-gray-50 text-gray-500 rounded-md border border-gray-200 text-xs font-medium animate-pulse">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Carregando...
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile counts */}
          {totalFolders > 0 && (
            <div className="flex md:hidden items-center gap-1">
              <div className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                {totalFolders}
              </div>
              {selectedCount > 0 && (
                <div className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                  {selectedCount}
                </div>
              )}
            </div>
          )}

          {/* AI Button */}
          <button
            onClick={onRunAI}
            disabled={isProcessing}
            className={`flex items-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-lg shadow-md transition-all ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#FF4D00] hover:bg-[#E64500]'
              }`}
          >
            <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="ml-1.5 hidden sm:inline">
              {isProcessing ? `${totalPending}...` : selectedCount > 0 ? `Analisar (${selectedCount})` : 'Analisar'}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-px h-6 bg-gray-200" />

            {/* Selection controls */}
            {totalFolders > 0 && (
              <>
                <button
                  onClick={onSelectAll}
                  className="flex items-center px-2.5 py-1.5 text-xs font-medium text-purple-600 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-all"
                  title="Selecionar todas"
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                  Todas
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={onClearSelection}
                    className="flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                    title="Limpar seleção"
                  >
                    <Square className="w-3.5 h-3.5 mr-1.5" />
                    Limpar
                  </button>
                )}
              </>
            )}

            <div className="w-px h-6 bg-gray-200" />

            <button
              onClick={onOpenFolder}
              className="flex items-center px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
              Importar
            </button>

            <button
              onClick={onDeleteEmptyFolders}
              className="flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-all"
              title="Excluir vazias"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onExportReport}
              className="flex items-center px-2.5 py-1.5 text-xs font-medium text-green-600 bg-white border border-green-200 rounded-lg hover:bg-green-50 transition-all"
              title="Exportar Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>

            {/* ZIP Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setZipDropdownOpen(!zipDropdownOpen)}
                className={`flex items-center px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-all ${zipDropdownOpen ? 'text-[#FF4D00] bg-orange-50 border-[#FF4D00]' : 'text-blue-600 bg-white border-blue-200 hover:bg-blue-50'
                  }`}
                title="Baixar ZIP"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>

              {zipDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Exportar Fotos</div>

                  <div className="space-y-2 mb-4">
                    <label
                      className="flex items-center p-2.5 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors group select-none"
                      onClick={(e) => { e.preventDefault(); toggleZipStatus(AnalysisStatus.COMPLETED); }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-all ${zipStatuses.includes(AnalysisStatus.COMPLETED) ? 'bg-[#FF4D00] border-[#FF4D00]' : 'border-gray-300 group-hover:border-[#FF4D00]'
                        }`}>
                        {zipStatuses.includes(AnalysisStatus.COMPLETED) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700">Concluídos</span>
                        <span className="block text-[10px] text-gray-400">Pastas finalizadas</span>
                      </div>
                    </label>

                    <label
                      className="flex items-center p-2.5 hover:bg-orange-50 rounded-lg cursor-pointer transition-colors group select-none"
                      onClick={(e) => { e.preventDefault(); toggleZipStatus(AnalysisStatus.PENDING); }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-all ${zipStatuses.includes(AnalysisStatus.PENDING) ? 'bg-[#FF4D00] border-[#FF4D00]' : 'border-gray-300 group-hover:border-[#FF4D00]'
                        }`}>
                        {zipStatuses.includes(AnalysisStatus.PENDING) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <span className="block text-sm font-medium text-gray-700">Pendentes</span>
                        <span className="block text-[10px] text-gray-400">Pastas em análise</span>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={() => { onExportSelectedZip(zipStatuses); setZipDropdownOpen(false); }}
                    disabled={zipStatuses.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-orange-500/20"
                  >
                    <Download className="w-4 h-4" />
                    Baixar ZIP
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 px-3 py-3 bg-gray-50/50">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {totalFolders > 0 && (
              <>
                <button
                  onClick={() => { onSelectAll(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-center px-3 py-2 text-xs font-medium text-purple-600 bg-white border border-purple-200 rounded-lg hover:bg-purple-50"
                >
                  <CheckSquare className="w-4 h-4 mr-1.5" />
                  Todas
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={() => { onClearSelection(); setMobileMenuOpen(false); }}
                    className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Square className="w-4 h-4 mr-1.5" />
                    Limpar
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => { onOpenFolder(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <FolderOpen className="w-4 h-4 mr-1.5" />
              Importar
            </button>

            <button
              onClick={() => { onDeleteEmptyFolders(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Vazias
            </button>

            <button
              onClick={() => { onExportReport(); setMobileMenuOpen(false); }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-green-600 bg-white border border-green-200 rounded-lg hover:bg-green-50"
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Excel
            </button>

            <button
              onClick={() => { onExportSelectedZip([AnalysisStatus.COMPLETED]); setMobileMenuOpen(false); }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              <Archive className="w-4 h-4 mr-1.5" />
              ZIP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;