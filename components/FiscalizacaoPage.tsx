import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { AnalysisStatus, FolderItem, ItemType, FileItem } from '../types';
import { getAllSubfolders } from '../utils/folderUtils';
import { Search, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

const FiscalizacaoPage = () => {
    const { rootFolder } = useAppContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<AnalysisStatus | 'ALL'>('ALL');

    if (!rootFolder) {
        return <div className="p-8 text-center text-gray-500">Nenhuma pasta carregada. Vá ao Dashboard para iniciar.</div>;
    }

    const subfolders = getAllSubfolders(rootFolder);

    const filteredFolders = subfolders.filter(folder => {
        const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || folder.status === filterStatus;
        // Only show folders that have images or status (skip empty intermediate folders if useful)
        // For now show all analyzed or relevant folders.
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: AnalysisStatus) => {
        switch (status) {
            case AnalysisStatus.COMPLETED: return <CheckCircle className="w-5 h-5 text-green-500" />;
            case AnalysisStatus.PENDING: return <Clock className="w-5 h-5 text-yellow-500" />;
            case AnalysisStatus.ERROR: return <XCircle className="w-5 h-5 text-red-500" />;
            case AnalysisStatus.PROCESSING: return <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />;
            default: return <AlertCircle className="w-5 h-5 text-gray-300" />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] p-6 overflow-hidden">
            <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fiscalização</h1>
                    <p className="text-gray-500 text-sm">Gerencie e analise o status das paradas.</p>
                </div>

                <div className="flex space-x-3 items-center">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar parada..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] w-64"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as AnalysisStatus | 'ALL')}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF4D00] bg-white"
                    >
                        <option value="ALL">Todos os Status</option>
                        <option value={AnalysisStatus.COMPLETED}>Concluído</option>
                        <option value={AnalysisStatus.PENDING}>Pendente</option>
                        <option value={AnalysisStatus.ERROR}>Erro</option>
                        <option value={AnalysisStatus.UNCHECKED}>Não verificado</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Parada / Pasta</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Resumo da Análise</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b text-right">Imagens</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredFolders.length > 0 ? (
                                filteredFolders.map((folder) => (
                                    <tr key={folder.path} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{folder.name}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(folder.status)}
                                                <span className={`
                                            ${folder.status === AnalysisStatus.COMPLETED ? 'text-green-700' : ''}
                                            ${folder.status === AnalysisStatus.PENDING ? 'text-yellow-700' : ''}
                                            ${folder.status === AnalysisStatus.ERROR ? 'text-red-700' : ''}
                                            ${folder.status === AnalysisStatus.UNCHECKED ? 'text-gray-500' : ''}
                                        `}>
                                                    {folder.status === AnalysisStatus.COMPLETED ? 'Concluído' :
                                                        folder.status === AnalysisStatus.PENDING ? 'Pendente' :
                                                            folder.status === AnalysisStatus.ERROR ? 'Erro' : 'Não verificado'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate" title={folder.analysisSummary}>
                                            {folder.analysisSummary || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 text-right">
                                            {folder.children.filter(c => c.type === ItemType.IMAGE).length}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Nenhuma pasta encontrada com os filtros atuais.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
                    Total de {filteredFolders.length} registros listados.
                </div>
            </div>
        </div>
    );
};

export default FiscalizacaoPage;
