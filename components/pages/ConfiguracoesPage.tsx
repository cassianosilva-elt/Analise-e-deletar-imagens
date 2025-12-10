import React from 'react';
import { Settings, Eye, EyeOff, Sparkles, Zap, Monitor, Palette } from 'lucide-react';

export type PageId = 'dashboard' | 'relatorios' | 'configuracoes' | 'ajuda';

export interface PageVisibility {
    relatorios: boolean;
    configuracoes: boolean;
    ajuda: boolean;
}

interface ConfiguracoesPageProps {
    pageVisibility: PageVisibility;
    onTogglePageVisibility: (pageId: keyof PageVisibility) => void;
    selectedModel: string;
    onModelChange: (model: 'gemini-flash-latest' | 'gemini-flash-lite-latest') => void;
}

const ToggleSwitch = ({ enabled, onChange, label, description }: {
    enabled: boolean;
    onChange: () => void;
    label: string;
    description: string;
}) => (
    <div
        className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
        onClick={onChange}
    >
        <div className="flex items-center gap-3">
            {enabled ? (
                <Eye className="w-5 h-5 text-green-600" />
            ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-xs sm:text-sm text-gray-500">{description}</p>
            </div>
        </div>
        <button
            onClick={(e) => { e.stopPropagation(); onChange(); }}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-[#FF4D00]' : 'bg-gray-300'}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}
            />
        </button>
    </div>
);

const ConfiguracoesPage: React.FC<ConfiguracoesPageProps> = ({
    pageVisibility,
    onTogglePageVisibility,
    selectedModel,
    onModelChange
}) => {
    return (
        <div className="flex-1 bg-[#F8F9FA] overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Personalize sua experiência no sistema</p>
                </div>

                {/* Page Visibility Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-600" />
                        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Visibilidade das Páginas</h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3">
                        <ToggleSwitch
                            enabled={pageVisibility.relatorios}
                            onChange={() => onTogglePageVisibility('relatorios')}
                            label="Relatórios"
                            description="Estatísticas e exportação de dados"
                        />
                        <ToggleSwitch
                            enabled={pageVisibility.configuracoes}
                            onChange={() => onTogglePageVisibility('configuracoes')}
                            label="Configurações"
                            description="Personalização do sistema"
                        />
                        <ToggleSwitch
                            enabled={pageVisibility.ajuda}
                            onChange={() => onTogglePageVisibility('ajuda')}
                            label="Ajuda"
                            description="Guias e documentação"
                        />

                        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                            <strong>Nota:</strong> O Dashboard é sempre visível por ser a página principal.
                        </p>
                    </div>
                </div>

                {/* AI Model Section */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-gray-600" />
                        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Modelo de IA</h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3">
                        <button
                            onClick={() => onModelChange('gemini-flash-latest')}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedModel === 'gemini-flash-latest'
                                ? 'border-[#FF4D00] bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className={`p-2.5 rounded-xl ${selectedModel === 'gemini-flash-latest' ? 'bg-[#FF4D00]' : 'bg-gray-200'}`}>
                                <Sparkles className={`w-5 h-5 ${selectedModel === 'gemini-flash-latest' ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-gray-900">Gemini Flash</p>
                                <p className="text-xs sm:text-sm text-gray-500">Alta precisão na identificação</p>
                            </div>
                            {selectedModel === 'gemini-flash-latest' && (
                                <span className="px-2 py-0.5 bg-[#FF4D00] text-white text-xs font-bold rounded-full">Ativo</span>
                            )}
                        </button>

                        <button
                            onClick={() => onModelChange('gemini-flash-lite-latest')}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedModel === 'gemini-flash-lite-latest'
                                ? 'border-[#FF4D00] bg-orange-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className={`p-2.5 rounded-xl ${selectedModel === 'gemini-flash-lite-latest' ? 'bg-[#FF4D00]' : 'bg-gray-200'}`}>
                                <Zap className={`w-5 h-5 ${selectedModel === 'gemini-flash-lite-latest' ? 'text-white' : 'text-gray-600'}`} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="font-medium text-gray-900">Gemini Flash Lite</p>
                                <p className="text-xs sm:text-sm text-gray-500">Processamento mais rápido</p>
                            </div>
                            {selectedModel === 'gemini-flash-lite-latest' && (
                                <span className="px-2 py-0.5 bg-[#FF4D00] text-white text-xs font-bold rounded-full">Ativo</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Version Info */}
                <div className="text-center text-xs text-gray-400 mt-8">
                    <p>Eletromidia Fiscalização AI v1.0</p>
                    <p className="mt-1">© 2024 Eletromidia. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracoesPage;
