import React from 'react';
import { FileSpreadsheet, Construction, Hammer, Wrench } from 'lucide-react'; // Using Wrench (Construction/Hammer alternatives)
import { TranslationKey } from '../../translations';

interface FerramentasPageProps {
    onExportReport: (type: 'analysis' | 'simple' | 'glass') => void;
    darkMode?: boolean;
    t?: (key: TranslationKey) => string;
}

const FerramentasPage: React.FC<FerramentasPageProps> = ({ onExportReport, darkMode = false, t }) => {
    const translate = (key: TranslationKey): string => {
        if (t) return t(key);
        return key;
    };

    const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const headerTextClass = darkMode ? 'text-gray-100' : 'text-gray-900';
    const descTextClass = darkMode ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-[#F8F9FA]'}`}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${headerTextClass}`}>Ferramentas e Exportação</h1>
                    <p className={`text-sm sm:text-base ${descTextClass}`}>Relatórios auxiliares para manutenção e inventário.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Simple Folder Report Card */}
                    <div className={`rounded-xl border shadow-sm p-6 ${cardClass} flex flex-col`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`text-lg font-semibold ${headerTextClass}`}>Lista de Pastas</h3>
                                <p className={`text-sm ${descTextClass}`}>Inventário Simples</p>
                            </div>
                        </div>

                        <p className={`text-sm mb-6 flex-1 ${descTextClass}`}>
                            Gera uma planilha simples listando <span className="font-semibold">todas</span> as pastas encontradas, independentemente do status da análise.
                            Útil para conferência de inventário básico (Nº Parada, Endereço, Bairro).
                        </p>

                        <button
                            onClick={() => onExportReport('simple')}
                            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Baixar Lista de Pastas
                        </button>
                    </div>

                    {/* Glass Replacement Report Card */}
                    <div className={`rounded-xl border shadow-sm p-6 ${cardClass} flex flex-col`}>
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 rounded-lg ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                                <Hammer className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className={`text-lg font-semibold ${headerTextClass}`}>Troca de Vidros</h3>
                                <p className={`text-sm ${descTextClass}`}>Relatório de Manutenção</p>
                            </div>
                        </div>

                        <p className={`text-sm mb-6 flex-1 ${descTextClass}`}>
                            Gera uma planilha formatada especificamente para equipes de manutenção de vidros/layout.
                            Inclui colunas para modelo, tipo, quantidades e medidas (em branco para preenchimento).
                        </p>

                        <button
                            onClick={() => onExportReport('glass')}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Baixar Relatório de Vidros
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FerramentasPage;
