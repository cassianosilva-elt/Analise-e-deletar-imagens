import React from 'react';
import { FileSpreadsheet, Archive, Download, TrendingUp, FolderCheck, Clock, BarChart3 } from 'lucide-react';
import { TranslationKey } from '../../translations';

interface RelatoriosPageProps {
    onExportReport: (type: 'analysis') => void;
    onExportZip: () => void;
    stats: {
        totalFolders: number;
        completedFolders: number;
        pendingFolders: number;
        totalImages: number;
        selectedImages: number;
    };
    darkMode?: boolean;
    t?: (key: TranslationKey) => string;
}

const StatCard = ({ icon: Icon, label, value, color, darkMode }: { icon: React.ElementType; label: string; value: number | string; color: string; darkMode?: boolean }) => (
    <div className={`rounded-xl border p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{value}</p>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
            </div>
        </div>
    </div>
);

const RelatoriosPage: React.FC<RelatoriosPageProps> = ({ onExportReport, onExportZip, stats, darkMode = false, t }) => {
    const translate = (key: TranslationKey): string => {
        if (t) return t(key);
        return key;
    };
    const completionRate = stats.totalFolders > 0
        ? Math.round((stats.completedFolders / stats.totalFolders) * 100)
        : 0;

    const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const headerBgClass = darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50';

    return (
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-[#F8F9FA]'}`}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{translate('relatorios')}</h1>
                    <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{translate('reportsDesc')}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <StatCard
                        icon={FolderCheck}
                        label={translate('analyzedFolders')}
                        value={stats.totalFolders}
                        color="bg-purple-500"
                        darkMode={darkMode}
                    />
                    <StatCard
                        icon={TrendingUp}
                        label={translate('completionRate')}
                        value={`${completionRate}%`}
                        color="bg-green-500"
                        darkMode={darkMode}
                    />
                    <StatCard
                        icon={Clock}
                        label={translate('pendingStats')}
                        value={stats.pendingFolders}
                        color="bg-amber-500"
                        darkMode={darkMode}
                    />
                    <StatCard
                        icon={BarChart3}
                        label={translate('selectedImages')}
                        value={stats.selectedImages}
                        color="bg-blue-500"
                        darkMode={darkMode}
                    />
                </div>

                {/* Export Actions */}
                <div className={`rounded-xl border shadow-sm overflow-hidden ${cardClass}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} ${headerBgClass}`}>
                        <h2 className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{translate('exportData')}</h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                        {/* Excel Export */}
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${darkMode ? 'bg-green-950/20 border-green-900/40' : 'bg-green-50 border-green-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-green-500 rounded-xl shadow-sm">
                                    <FileSpreadsheet className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{translate('excelReport')}</h3>
                                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{translate('excelDesc')}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onExportReport('analysis')}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>{translate('exportBtn')}</span>
                            </button>
                        </div>

                        {/* ZIP Export */}
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${darkMode ? 'bg-blue-950/20 border-blue-900/40' : 'bg-blue-50 border-blue-100'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500 rounded-xl shadow-sm">
                                    <Archive className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{translate('zipArchive')}</h3>
                                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{translate('zipDesc')}</p>
                                </div>
                            </div>
                            <button
                                onClick={onExportZip}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>{translate('downloadZip')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="mt-6 bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] rounded-xl p-5 sm:p-6 text-white shadow-lg">
                    <h3 className="font-semibold text-lg mb-2">{translate('campaignSummary')}</h3>
                    <p className="text-white/80 text-sm">
                        {stats.completedFolders} {translate('campaignStats1')} {stats.totalFolders} {translate('campaignStats2')}
                        {stats.selectedImages > 0 && ` ${stats.selectedImages} ${translate('campaignSelected1')}`}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RelatoriosPage;
