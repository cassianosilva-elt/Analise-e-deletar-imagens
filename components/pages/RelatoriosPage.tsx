import React from 'react';
import { FileSpreadsheet, Archive, Download, TrendingUp, FolderCheck, Clock, BarChart3 } from 'lucide-react';

interface RelatoriosPageProps {
    onExportReport: () => void;
    onExportZip: () => void;
    stats: {
        totalFolders: number;
        completedFolders: number;
        pendingFolders: number;
        totalImages: number;
        selectedImages: number;
    };
}

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-xs sm:text-sm text-gray-500">{label}</p>
            </div>
        </div>
    </div>
);

const RelatoriosPage: React.FC<RelatoriosPageProps> = ({ onExportReport, onExportZip, stats }) => {
    const completionRate = stats.totalFolders > 0
        ? Math.round((stats.completedFolders / stats.totalFolders) * 100)
        : 0;

    return (
        <div className="flex-1 bg-[#F8F9FA] overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Relatórios</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Visualize estatísticas e exporte seus dados</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <StatCard
                        icon={FolderCheck}
                        label="Pastas Analisadas"
                        value={stats.totalFolders}
                        color="bg-purple-500"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Taxa de Conclusão"
                        value={`${completionRate}%`}
                        color="bg-green-500"
                    />
                    <StatCard
                        icon={Clock}
                        label="Pendentes"
                        value={stats.pendingFolders}
                        color="bg-amber-500"
                    />
                    <StatCard
                        icon={BarChart3}
                        label="Imagens Selecionadas"
                        value={stats.selectedImages}
                        color="bg-blue-500"
                    />
                </div>

                {/* Export Actions */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Exportar Dados</h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4">
                        {/* Excel Export */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-green-50 border border-green-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-green-500 rounded-xl">
                                    <FileSpreadsheet className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Relatório Excel</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">Exportar todas as análises em formato .xlsx</p>
                                </div>
                            </div>
                            <button
                                onClick={onExportReport}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>Exportar</span>
                            </button>
                        </div>

                        {/* ZIP Export */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500 rounded-xl">
                                    <Archive className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Arquivo ZIP</h3>
                                    <p className="text-xs sm:text-sm text-gray-500">Baixar fotos selecionadas compactadas</p>
                                </div>
                            </div>
                            <button
                                onClick={onExportZip}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                <span>Baixar ZIP</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="mt-6 bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] rounded-xl p-5 sm:p-6 text-white shadow-lg">
                    <h3 className="font-semibold text-lg mb-2">Resumo da Campanha</h3>
                    <p className="text-white/80 text-sm">
                        {stats.completedFolders} de {stats.totalFolders} abrigos foram analisados e marcados como concluídos.
                        {stats.selectedImages > 0 && ` ${stats.selectedImages} fotos foram selecionadas para o relatório final.`}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RelatoriosPage;
