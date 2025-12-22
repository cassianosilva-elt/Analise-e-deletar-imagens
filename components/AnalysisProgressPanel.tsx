import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';
import { TranslationKey } from '../translations';

interface AnalysisProgressPanelProps {
    isVisible: boolean;
    isProcessing: boolean;
    currentFolder: string;
    totalFolders: number;
    processedCount: number;
    completedCount: number;
    pendingCount: number;
    onClose: () => void;
    onToggle: () => void;
    onCancel?: () => void;
    isMinimized: boolean;
    darkMode?: boolean;
    t?: (key: TranslationKey) => string;
}

const AnalysisProgressPanel: React.FC<AnalysisProgressPanelProps> = ({
    isVisible,
    isProcessing,
    currentFolder,
    totalFolders,
    processedCount,
    completedCount,
    pendingCount,
    onClose,
    onToggle,
    onCancel,
    isMinimized,
    darkMode = false,
    t
}) => {
    const translate = (key: TranslationKey): string => {
        if (t) return t(key);
        return key;
    };

    if (!isVisible) return null;

    const progressPercent = totalFolders > 0 ? Math.round((processedCount / totalFolders) * 100) : 0;

    return (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className={`rounded-xl shadow-2xl border transition-colors ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} overflow-hidden`}>
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#FF4D00] to-orange-500 text-white cursor-pointer shadow-md"
                    onClick={onToggle}
                >
                    <div className="flex items-center gap-2">
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5" />
                        )}
                        <span className="font-semibold text-sm">
                            {isProcessing ? translate('processing') : translate('analysisComplete')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                            {processedCount}/{totalFolders}
                        </span>
                        {isMinimized ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                        {!isProcessing && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onClose(); }}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Content - collapsible */}
                {!isMinimized && (
                    <div className="p-4">
                        {/* Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>{translate('progress')}</span>
                                <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{progressPercent}%</span>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <div
                                    className="h-full bg-gradient-to-r from-[#FF4D00] to-orange-400 transition-all duration-300 ease-out shadow-sm"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Current Folder */}
                        {isProcessing && currentFolder && (
                            <div className={`mb-4 p-3 rounded-lg border transition-colors ${darkMode ? 'bg-blue-900/20 border-blue-900/40' : 'bg-blue-50 border-blue-100'}`}>
                                <div className={`flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                                    <FolderOpen className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs font-medium truncate">{currentFolder}</span>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${darkMode ? 'bg-green-950/30 border-green-900/40' : 'bg-green-50 border-green-100'}`}>
                                <CheckCircle2 className={`w-5 h-5 ${darkMode ? 'text-green-500' : 'text-green-600'}`} />
                                <div>
                                    <div className={`text-lg font-bold ${darkMode ? 'text-green-400' : 'text-green-700'}`}>{completedCount}</div>
                                    <div className={`text-[10px] uppercase tracking-wide ${darkMode ? 'text-green-600' : 'text-green-600'}`}>{translate('completedStats')}</div>
                                </div>
                            </div>
                            <div className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${darkMode ? 'bg-amber-950/30 border-amber-900/40' : 'bg-amber-50 border-amber-100'}`}>
                                <AlertCircle className={`w-5 h-5 ${darkMode ? 'text-amber-500' : 'text-amber-600'}`} />
                                <div>
                                    <div className={`text-lg font-bold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{pendingCount}</div>
                                    <div className={`text-[10px] uppercase tracking-wide ${darkMode ? 'text-amber-600' : 'text-amber-600'}`}>{translate('pendingStats')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Cancel Button */}
                        {isProcessing && onCancel && (
                            <button
                                onClick={onCancel}
                                className={`w-full py-2 px-4 rounded-lg border text-sm font-medium transition-all ${darkMode
                                        ? 'border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-900/30'
                                        : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                            >
                                {translate('cancel')}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisProgressPanel;
