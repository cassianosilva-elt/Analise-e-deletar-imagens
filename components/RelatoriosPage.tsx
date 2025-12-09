import React from 'react';
import { useAppContext } from '../AppContext';
import { getAllSubfolders } from '../utils/folderUtils';
import { AnalysisStatus, ItemType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { FileCheck, AlertTriangle, Clock, FolderArchive } from 'lucide-react';

const RelatoriosPage = () => {
    const { rootFolder } = useAppContext();

    if (!rootFolder) {
        return <div className="p-8 text-center text-gray-500">Nenhuma pasta carregada. Vá ao Dashboard para iniciar.</div>;
    }

    const subfolders = getAllSubfolders(rootFolder);

    // Calculate Stats
    const totalFolders = subfolders.length;
    const completed = subfolders.filter(f => f.status === AnalysisStatus.COMPLETED).length;
    const pending = subfolders.filter(f => f.status === AnalysisStatus.PENDING).length;
    const error = subfolders.filter(f => f.status === AnalysisStatus.ERROR).length;
    const unchecked = subfolders.filter(f => f.status === AnalysisStatus.UNCHECKED).length;

    const totalImages = subfolders.reduce((acc, folder) => {
        return acc + folder.children.filter(c => c.type === ItemType.IMAGE).length;
    }, 0);

    const dataStatus = [
        { name: 'Concluído', value: completed, color: '#22c55e' }, // green-500
        { name: 'Pendente', value: pending, color: '#eab308' },  // yellow-500
        { name: 'Erro', value: error, color: '#ef4444' },      // red-500
        { name: 'Não Verificado', value: unchecked, color: '#9ca3af' }, // gray-400
    ].filter(d => d.value > 0);

    // Mock data for issues (in a real app, parse `analysisSummary`)
    // Trying to extract simple keywords from summaries if possible, else generic
    const dataIssues = [
        { name: 'Vidro Sujo', count: subfolders.filter(f => f.analysisSummary?.toLowerCase().includes('sujo')).length },
        { name: 'Pichação', count: subfolders.filter(f => f.analysisSummary?.toLowerCase().includes('picha')).length },
        { name: 'Quebrado', count: subfolders.filter(f => f.analysisSummary?.toLowerCase().includes('quebrado')).length },
        { name: 'Iluminação', count: subfolders.filter(f => f.analysisSummary?.toLowerCase().includes('luz') || f.analysisSummary?.toLowerCase().includes('apaga')).length },
    ].filter(d => d.count > 0);

    const StatCard = ({ icon: Icon, label, value, colorClass }: any) => (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-3 rounded-lg ${colorClass} bg-opacity-10`}>
                <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Relatórios de Análise</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard icon={FolderArchive} label="Total Analisado" value={totalFolders} colorClass="bg-blue-600 text-blue-600" />
                <StatCard icon={FileCheck} label="Concluídos" value={completed} colorClass="bg-green-600 text-green-600" />
                <StatCard icon={Clock} label="Pendentes" value={pending} colorClass="bg-yellow-600 text-yellow-600" />
                <StatCard icon={AlertTriangle} label="Erros/Problemas" value={error} colorClass="bg-red-600 text-red-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Distribuição de Status</h2>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataStatus}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {dataStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Issues Chart (if any data) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Principais Problemas Detectados</h2>
                    {dataIssues.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dataIssues}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#FF4D00" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                            <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                            <p>Dados insuficientes para gerar gráfico de problemas.</p>
                            <p>As análises precisam conter palavras-chave (sujo, quebrado, etc).</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Resumo Geral</h2>
                <div className="text-sm text-gray-600 space-y-2">
                    <p>• <strong>{totalImages}</strong> imagens foram processadas no total.</p>
                    <p>• A taxa de conclusão atual é de <strong>{((completed / totalFolders) * 100).toFixed(1)}%</strong>.</p>
                    <p>• <strong>{unchecked}</strong> pastas ainda não foram verificadas.</p>
                </div>
            </div>
        </div>
    );
};

export default RelatoriosPage;
