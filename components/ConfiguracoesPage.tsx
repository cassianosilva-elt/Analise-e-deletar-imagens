import React from 'react';
import { useAppContext } from '../AppContext';
import { Save, Monitor, Cpu } from 'lucide-react';

const ConfiguracoesPage = () => {
    const { selectedModel, setSelectedModel } = useAppContext();

    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h1>

            <div className="space-y-6 max-w-2xl">
                {/* AI Model Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Cpu className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Modelo de IA</h2>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Selecione o modelo Gemini para análise
                        </label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as any)}
                            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4D00] bg-gray-50"
                        >
                            <option value="gemini-flash-latest">Gemini 1.5 Flash (Rápido & Econômico)</option>
                            <option value="gemini-pro">Gemini 1.5 Pro (Maior Precisão)</option>
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Experimental)</option>
                            <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Experimental)</option>
                        </select>
                        <p className="text-xs text-gray-500">
                            Modelos "Flash" são recomendados para grandes volumes de imagens. O modelo "Pro" oferece descrições mais detalhadas mas pode ser mais lento.
                        </p>
                    </div>
                </div>

                {/* Appearance Section (Mock) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Monitor className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800">Aparência</h2>
                    </div>

                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-700">Modo Escuro</span>
                        <div className="w-11 h-6 bg-gray-200 rounded-full cursor-not-allowed relative">
                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">O modo escuro será habilitado em futuras atualizações.</p>
                </div>

                <div className="flex justify-end">
                    <button className="flex items-center px-6 py-2 bg-[#FF4D00] text-white rounded-lg hover:bg-[#ff6a00] transition-colors shadow-sm">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracoesPage;
