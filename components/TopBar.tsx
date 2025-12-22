import React, { useState, useRef, useEffect } from 'react';
import { FolderOpen, Wand2, ArrowLeft, FileSpreadsheet, Archive, Trash2, Check, Download, Menu, X, CheckSquare, Square, Database, Loader2 } from 'lucide-react';
import { Breadcrumb, AnalysisStatus } from '../types';
import { TranslationKey } from '../translations';

interface TopBarProps {
  currentPath: Breadcrumb[];
  onNavigateUp: () => void;
  onOpenFolder: () => void;
  onRunAI: () => void;
  onExportReport: (type: 'analysis') => void;
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
  darkMode?: boolean;
  t?: (key: TranslationKey) => string;
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
  equipmentCount = 0,
  darkMode = false,
  t
}) => {
  const translate = (key: TranslationKey): string => {
    if (t) return t(key);
    return key;
  };
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

  // Dark mode classes
  const bgClass = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-gray-200' : 'text-gray-700';
  const breadcrumbBgClass = darkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700';
  const hoverClass = darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100';
  const buttonBgClass = darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700';

  return (
    <div className={`${bgClass} border-b z-10 transition-colors duration-300`}>
      {/* Main Row */}
      <div className="flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3">

        {/* Left: Navigation */}
        <div className="flex items-center min-w-0 flex-1">
          <button
            onClick={onNavigateUp}
            disabled={currentPath.length <= 1}
            className={`mr-2 sm:mr-3 p-1.5 sm:p-2 rounded-full ${hoverClass} disabled:opacity-30 transition-colors flex-shrink-0`}
          >
            <ArrowLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>

          {/* Breadcrumb */}
          <div className={`flex items-center text-xs sm:text-sm font-medium ${textClass} ${breadcrumbBgClass} px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border min-w-0 max-w-[120px] sm:max-w-[200px] lg:max-w-none overflow-hidden`}>
            <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4 text-[#FF4D00] mr-1.5 sm:mr-2 flex-shrink-0" />
            <span className="truncate">
              {currentPath.length > 1 ? currentPath[currentPath.length - 1]?.name : currentPath[0]?.name}
            </span>
          </div>

          {/* Counts - Desktop */}
          {totalFolders > 0 && (
            <div className="hidden md:flex items-center gap-2 ml-3">
              <div className={`flex items-center px-2 py-1 rounded-md border text-xs font-medium ${darkMode ? 'bg-purple-900/40 text-purple-300 border-purple-800/50' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                <FolderOpen className="w-3 h-3 mr-1" />
                {totalFolders}
              </div>
              {selectedCount > 0 && (
                <div className={`flex items-center px-2 py-1 rounded-md border text-xs font-semibold ${darkMode ? 'bg-blue-900/40 text-blue-300 border-blue-800/50' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                  <CheckSquare className="w-3 h-3 mr-1" />
                  {selectedCount}
                </div>
              )}
            </div>
          )}

          {/* Equipment Cache Status - Desktop */}
          <div className="hidden lg:flex items-center ml-2">
            {equipmentCacheReady ? (
              <div className={`flex items-center px-2 py-1 rounded-md border text-xs font-medium ${darkMode ? 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`} title={`${equipmentCount.toLocaleString()} ${translate('loadedEquipments')}`}>
                <Database className="w-3 h-3 mr-1" />
                {equipmentCount.toLocaleString()}
              </div>
            ) : (
              <div className={`flex items-center px-2 py-1 rounded-md border text-xs font-medium animate-pulse ${darkMode ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {translate('loading')}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile counts */}
          {totalFolders > 0 && (
            <div className="flex md:hidden items-center gap-1">
              <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${darkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
                {totalFolders}
              </div>
              {selectedCount > 0 && (
                <div className={`px-1.5 py-0.5 rounded text-xs font-bold ${darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
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
              {isProcessing ? `${totalPending}...` : selectedCount > 0 ? `${translate('analyzeBtn')} (${selectedCount})` : translate('analyzeBtn')}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`lg:hidden p-1.5 sm:p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
          >
            {mobileMenuOpen ? <X className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} /> : <Menu className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />}
          </button>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-px h-6 bg-gray-200" />

            {/* Selection controls */}
            {totalFolders > 0 && (
              <>
                <button
                  onClick={onSelectAll}
                  className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-purple-400 bg-gray-800 border-purple-900/50 hover:bg-gray-700' : 'text-purple-600 bg-white border-purple-200 hover:bg-purple-50'}`}
                  title={translate('selectAll')}
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                  {translate('allBtn')}
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={onClearSelection}
                    className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'}`}
                    title={translate('clearSelection')}
                  >
                    <Square className="w-3.5 h-3.5 mr-1.5" />
                    {translate('clearBtn')}
                  </button>
                )}
              </>
            )}

            <div className={`w-px h-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} />

            <button
              onClick={onOpenFolder}
              className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1.5" />
              {translate('importBtn')}
            </button>

            <button
              onClick={onDeleteEmptyFolders}
              className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-red-400 bg-gray-800 border-red-900/50 hover:bg-gray-700' : 'text-red-600 bg-white border-red-200 hover:bg-red-50'}`}
              title={translate('deleteEmpty')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Excel Button - Now Single Again */}
            <button
              onClick={() => onExportReport('analysis')}
              className={`flex items-center px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-green-400 bg-gray-800 border-green-900/50 hover:bg-gray-700' : 'text-green-600 bg-white border-green-200 hover:bg-green-50'}`}
              title={translate('exportReport')}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </button>

            {/* ZIP Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setZipDropdownOpen(!zipDropdownOpen)}
                className={`flex items-center px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-all ${zipDropdownOpen ? (darkMode ? 'text-[#FF4D00] bg-orange-950 border-[#FF4D00]' : 'text-[#FF4D00] bg-orange-50 border-[#FF4D00]') : (darkMode ? 'text-blue-400 bg-gray-800 border-blue-900/50 hover:bg-gray-700' : 'text-blue-600 bg-white border-blue-200 hover:bg-blue-50')
                  }`}
                title={translate('downloadZip')}
              >
                <Archive className="w-3.5 h-3.5" />
              </button>

              {zipDropdownOpen && (
                <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl border p-4 z-50 animate-in fade-in zoom-in-95 duration-200 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
                  <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{translate('exportPhotos')}</div>

                  <div className="space-y-2 mb-4">
                    <label
                      className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-colors group select-none ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-orange-50'}`}
                      onClick={(e) => { e.preventDefault(); toggleZipStatus(AnalysisStatus.COMPLETED); }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-all ${zipStatuses.includes(AnalysisStatus.COMPLETED) ? 'bg-[#FF4D00] border-[#FF4D00]' : (darkMode ? 'border-gray-700' : 'border-gray-300') + ' group-hover:border-[#FF4D00]'
                        }`}>
                        {zipStatuses.includes(AnalysisStatus.COMPLETED) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <span className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{translate('completed')}</span>
                        <span className={`block text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{translate('finishedFolders')}</span>
                      </div>
                    </label>

                    <label
                      className={`flex items-center p-2.5 rounded-lg cursor-pointer transition-colors group select-none ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-orange-50'}`}
                      onClick={(e) => { e.preventDefault(); toggleZipStatus(AnalysisStatus.PENDING); }}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 transition-all ${zipStatuses.includes(AnalysisStatus.PENDING) ? 'bg-[#FF4D00] border-[#FF4D00]' : (darkMode ? 'border-gray-700' : 'border-gray-300') + ' group-hover:border-[#FF4D00]'
                        }`}>
                        {zipStatuses.includes(AnalysisStatus.PENDING) && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div>
                        <span className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{translate('pending')}</span>
                        <span className={`block text-[10px] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{translate('foldersInAnalysis')}</span>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={() => { onExportSelectedZip(zipStatuses); setZipDropdownOpen(false); }}
                    disabled={zipStatuses.length === 0}
                    className="w-full flex items-center justify-center gap-2 bg-[#FF4D00] hover:bg-[#E64500] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-orange-500/20"
                  >
                    <Download className="w-4 h-4" />
                    {translate('downloadZip')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className={`lg:hidden border-t px-3 py-3 transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {totalFolders > 0 && (
              <>
                <button
                  onClick={() => { onSelectAll(); setMobileMenuOpen(false); }}
                  className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-purple-400 bg-gray-800 border-purple-900/50 hover:bg-gray-700' : 'text-purple-600 bg-white border-purple-200 hover:bg-purple-50'}`}
                >
                  <CheckSquare className="w-4 h-4 mr-1.5" />
                  {translate('allBtn')}
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={() => { onClearSelection(); setMobileMenuOpen(false); }}
                    className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-gray-400 bg-gray-800 border-gray-700 hover:bg-gray-700' : 'text-gray-600 bg-white border-gray-300 hover:bg-gray-50'}`}
                  >
                    <Square className="w-4 h-4 mr-1.5" />
                    {translate('clearBtn')}
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => { onOpenFolder(); setMobileMenuOpen(false); }}
              className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700' : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'}`}
            >
              <FolderOpen className="w-4 h-4 mr-1.5" />
              {translate('importBtn')}
            </button>

            <button
              onClick={() => { onDeleteEmptyFolders(); setMobileMenuOpen(false); }}
              className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-red-400 bg-gray-800 border-red-900/50 hover:bg-gray-700' : 'text-red-600 bg-white border-red-200 hover:bg-red-50'}`}
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              {translate('emptyBtn')}
            </button>

            {/* Mobile Excel Button */}
            <button
              onClick={() => { onExportReport('analysis'); setMobileMenuOpen(false); }}
              className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-green-400 bg-gray-800 border-green-900/50 hover:bg-gray-700' : 'text-green-600 bg-white border-green-200 hover:bg-green-50'}`}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Excel
            </button>

            <button
              onClick={() => { onExportSelectedZip([AnalysisStatus.COMPLETED]); setMobileMenuOpen(false); }}
              className={`flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border transition-all ${darkMode ? 'text-blue-400 bg-gray-800 border-blue-900/50 hover:bg-gray-700' : 'text-blue-600 bg-white border-blue-200 hover:bg-blue-50'}`}
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