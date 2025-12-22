import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, Trash2, Calendar, FileText, ExternalLink, Download, Filter, ChevronRight, AlertCircle } from 'lucide-react';
import { historyService, HistoryEntry } from '../../services/historyService';
import { TranslationKey } from '../../translations';
import { AnalysisStatus } from '../../types';

interface HistoryPageProps {
    darkMode: boolean;
    t: (key: TranslationKey) => string;
}

type FilterStatus = 'ALL' | 'COMPLETED' | 'PENDING';

const HistoryPage: React.FC<HistoryPageProps> = ({ darkMode, t }) => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await historyService.getHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Deseja excluir esta análise do histórico?')) return;
        try {
            await historyService.deleteEntry(id);
            setHistory(prev => prev.filter(entry => entry.id !== id));
        } catch (error) {
            alert('Erro ao excluir entrada.');
        }
    };

    const exportToCSV = () => {
        if (history.length === 0) return;

        const headers = ['Data', 'Pasta', 'Status', 'Resumo', 'Observações', 'Arquivos'];
        const rows = history.map(entry => [
            new Date(entry.created_at).toLocaleString(),
            entry.folder_name,
            entry.status,
            entry.summary || '',
            entry.observation || '',
            entry.selected_files.join('; ')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `historico_analises_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    };

    const filteredHistory = history.filter(entry => {
        const matchesSearch = entry.folder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (entry.summary?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || (entry.status as string) === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const bgClass = darkMode ? 'bg-gray-950' : 'bg-[#F8F9FA]';
    const cardClass = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100 shadow-sm';
    const textClass = darkMode ? 'text-white' : 'text-gray-900';
    const subtextClass = darkMode ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className={`flex-1 flex flex-col h-full overflow-hidden ${bgClass} font-['Rethink_Sans']`}>
            {/* Header */}
            <div className={`p-6 sm:p-8 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-[#FF4D00]'}`}>
                                <History className="w-5 h-5" />
                            </div>
                            <h1 className={`text-2xl font-bold ${textClass}`}>{t('historico')}</h1>
                        </div>
                        <p className={subtextClass}>Visualize e gerencie seu histórico de análises realizadas</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={exportToCSV}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            <Download className="w-4 h-4" />
                            <span>Exportar CSV</span>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-800' : 'border-gray-200'} bg-opacity-50`}>
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por pasta ou resultado..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all ${darkMode ? 'bg-gray-900 border-gray-800 focus:border-orange-500' : 'bg-white border-gray-200 focus:border-orange-500 shadow-sm'}`}
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['ALL', 'COMPLETED', 'PENDING'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === status
                                    ? 'bg-[#FF4D00] text-white shadow-lg shadow-orange-500/20'
                                    : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {status === 'ALL' ? 'Todos' : status === 'COMPLETED' ? 'Concluídos' : 'Pendentes'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                <div className="max-w-7xl mx-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
                            <p className={subtextClass}>Carregando histórico...</p>
                        </div>
                    ) : filteredHistory.length === 0 ? (
                        <div className={`p-12 rounded-3xl border-2 border-dashed text-center ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className={`text-lg font-bold mb-1 ${textClass}`}>Nenhuma análise encontrada</h3>
                            <p className={subtextClass}>O histórico de suas análises aparecerá aqui quando você começar a usar o sistema.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence mode="popLayout">
                                {filteredHistory.map((entry) => (
                                    <motion.div
                                        key={entry.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center gap-6 group transition-all ${cardClass} hover:border-orange-500/30 hover:shadow-md`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${entry.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                    {entry.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(entry.created_at).toLocaleString()}
                                                </div>
                                            </div>
                                            <h3 className={`text-lg font-bold truncate ${textClass}`}>{entry.folder_name}</h3>
                                            {entry.summary && (
                                                <p className={`text-sm mt-1 line-clamp-1 ${subtextClass}`}>{entry.summary}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 border-gray-100 dark:border-gray-800">
                                            <div className="flex -space-x-2">
                                                {entry.selected_files.slice(0, 3).map((f, i) => (
                                                    <div key={i} className={`w-8 h-8 rounded-full border-2 ${darkMode ? 'border-gray-900 bg-gray-800' : 'border-white bg-gray-200'} flex items-center justify-center text-[10px] font-bold`}>
                                                        {i < 3 ? f.charAt(0).toUpperCase() : `+${entry.selected_files.length - 3}`}
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-red-500/10 text-gray-500 hover:text-red-500' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                                                title="Excluir do histórico"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
