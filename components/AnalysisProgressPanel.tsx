import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, X, ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';

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
    isMinimized: boolean;
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
    isMinimized
}) => {
    if (!isVisible) return null;

    const progressPercent = totalFolders > 0 ? Math.round((processedCount / totalFolders) * 100) : 0;

    return (
        <div className="fixed bottom-4 right-4 z-40 w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#FF4D00] to-orange-500 text-white cursor-pointer"
                    onClick={onToggle}
                >
                    <div className="flex items-center gap-2">
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5" />
                        )}
                        <span className="font-semibold text-sm">
                            {isProcessing ? 'Analisando...' : 'Análise Concluída'}
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
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progresso</span>
                                <span className="font-medium text-gray-700">{progressPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-[#FF4D00] to-orange-400 transition-all duration-300 ease-out"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Current Folder */}
                        {isProcessing && currentFolder && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <FolderOpen className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs font-medium truncate">{currentFolder}</span>
                                </div>
                            </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <div>
                                    <div className="text-lg font-bold text-green-700">{completedCount}</div>
                                    <div className="text-[10px] text-green-600 uppercase tracking-wide">Concluídas</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                                <div>
                                    <div className="text-lg font-bold text-amber-700">{pendingCount}</div>
                                    <div className="text-[10px] text-amber-600 uppercase tracking-wide">Pendentes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisProgressPanel;
