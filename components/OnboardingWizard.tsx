import React, { useState, useRef, useEffect } from 'react';
import { FolderSearch, Sparkles, ChevronRight, ChevronLeft, Check, Zap, Loader2, FolderOpen } from 'lucide-react';
import { AIModelType } from '../types';

interface OnboardingWizardProps {
    onComplete: (files: FileList, aiModel: AIModelType) => void;
}

interface StepIndicatorProps {
    currentStep: number;
    totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
    return (
        <div className="flex items-center justify-center space-x-2 mb-8">
            {Array.from({ length: totalSteps }, (_, i) => (
                <React.Fragment key={i}>
                    <div
                        className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all
              ${i < currentStep
                                ? 'bg-green-500 text-white'
                                : i === currentStep
                                    ? 'bg-[#FF4D00] text-white shadow-lg shadow-orange-500/30'
                                    : 'bg-gray-200 text-gray-500'}
            `}
                    >
                        {i < currentStep ? <Check className="w-5 h-5" /> : i + 1}
                    </div>
                    {i < totalSteps - 1 && (
                        <div className={`w-12 h-1 rounded ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
    const [selectedModel, setSelectedModel] = useState<AIModelType>('gemini-flash-latest');
    const [folderCount, setFolderCount] = useState(0);
    const [fileCount, setFileCount] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Count folders when files are selected
    useEffect(() => {
        if (selectedFiles) {
            const folderPaths = new Set<string>();
            let imageCount = 0;

            Array.from(selectedFiles).forEach((file: File & { webkitRelativePath?: string }) => {
                if (file.webkitRelativePath) {
                    const parts = file.webkitRelativePath.split('/');
                    // Get all folder paths except the root and filename
                    for (let i = 1; i < parts.length - 1; i++) {
                        folderPaths.add(parts.slice(0, i + 1).join('/'));
                    }
                }
                if (file.type.startsWith('image/')) {
                    imageCount++;
                }
            });

            setFolderCount(folderPaths.size);
            setFileCount(imageCount);
        }
    }, [selectedFiles]);

    const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFiles(files);
            // Auto-advance to next step
            setTimeout(() => setCurrentStep(1), 500);
        }
    };

    const handleComplete = () => {
        if (selectedFiles) {
            setIsProcessing(true);
            // Small delay to show processing state
            setTimeout(() => {
                onComplete(selectedFiles, selectedModel);
            }, 300);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="text-center">
                        <div className="bg-orange-100 p-6 rounded-full inline-block mb-6">
                            <FolderSearch className="w-16 h-16 text-[#FF4D00]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900">Selecionar Pasta de Fiscalização</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Escolha a pasta raiz contendo as subpastas de cada ponto de obra. O sistema identificará automaticamente os equipamentos.
                        </p>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-[#FF4D00] hover:bg-[#E64500] text-white font-medium px-8 py-4 rounded-xl shadow-lg shadow-orange-500/20 flex items-center justify-center w-full sm:w-auto mx-auto transition-all transform hover:-translate-y-1"
                        >
                            <FolderOpen className="w-6 h-6 mr-3" />
                            Selecionar Pasta
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            // @ts-ignore
                            webkitdirectory=""
                            multiple
                            className="hidden"
                            onChange={handleFolderSelect}
                        />

                        {selectedFiles && (
                            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200 inline-flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="text-green-700 font-medium">
                                    {folderCount} pastas • {fileCount} imagens
                                </span>
                            </div>
                        )}
                    </div>
                );

            case 1:
                return (
                    <div className="text-center">
                        <div className="bg-purple-100 p-6 rounded-full inline-block mb-6">
                            <Sparkles className="w-16 h-16 text-purple-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900">Escolher Modelo de IA</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Selecione o modelo de inteligência artificial para análise das imagens.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
                            {/* Flash Model */}
                            <button
                                onClick={() => setSelectedModel('gemini-flash-latest')}
                                className={`
                  flex-1 p-6 rounded-2xl border-2 transition-all text-left
                  ${selectedModel === 'gemini-flash-latest'
                                        ? 'border-[#FF4D00] bg-orange-50 shadow-lg shadow-orange-500/10'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                `}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${selectedModel === 'gemini-flash-latest' ? 'bg-[#FF4D00]' : 'bg-gray-200'}`}>
                                        <Zap className={`w-5 h-5 ${selectedModel === 'gemini-flash-latest' ? 'text-white' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Gemini Flash</h3>
                                        <span className="text-xs text-gray-500">Recomendado</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Análise balanceada com alta precisão. Ideal para a maioria dos casos.
                                </p>
                                {selectedModel === 'gemini-flash-latest' && (
                                    <div className="mt-3 flex items-center gap-2 text-[#FF4D00] text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                        Selecionado
                                    </div>
                                )}
                            </button>

                            {/* Flash Lite Model */}
                            <button
                                onClick={() => setSelectedModel('gemini-flash-lite-latest')}
                                className={`
                  flex-1 p-6 rounded-2xl border-2 transition-all text-left
                  ${selectedModel === 'gemini-flash-lite-latest'
                                        ? 'border-[#FF4D00] bg-orange-50 shadow-lg shadow-orange-500/10'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                `}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${selectedModel === 'gemini-flash-lite-latest' ? 'bg-[#FF4D00]' : 'bg-gray-200'}`}>
                                        <Zap className={`w-5 h-5 ${selectedModel === 'gemini-flash-lite-latest' ? 'text-white' : 'text-gray-600'}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">Gemini Flash Lite</h3>
                                        <span className="text-xs text-gray-500">Mais rápido</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Análise mais rápida com menor custo. Bom para volumes grandes.
                                </p>
                                {selectedModel === 'gemini-flash-lite-latest' && (
                                    <div className="mt-3 flex items-center gap-2 text-[#FF4D00] text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                        Selecionado
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="text-center">
                        <div className="bg-green-100 p-6 rounded-full inline-block mb-6">
                            <Check className="w-16 h-16 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900">Pronto para Iniciar!</h2>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">
                            Revise as configurações e clique em "Iniciar Análise" quando estiver pronto.
                        </p>

                        {/* Summary Card */}
                        <div className="max-w-md mx-auto bg-gray-50 rounded-2xl p-6 border border-gray-200 text-left mb-8">
                            <h3 className="font-semibold text-gray-700 mb-4">Resumo da Configuração</h3>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-600">Pastas para análise</span>
                                    <span className="font-bold text-gray-900">{folderCount}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                    <span className="text-gray-600">Total de imagens</span>
                                    <span className="font-bold text-gray-900">{fileCount}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-600">Modelo de IA</span>
                                    <span className="font-bold text-[#FF4D00]">
                                        {selectedModel === 'gemini-flash-latest' ? 'Gemini Flash' : 'Gemini Flash Lite'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={isProcessing}
                            className={`
                px-8 py-4 rounded-xl font-medium text-white shadow-lg flex items-center justify-center w-full sm:w-auto mx-auto transition-all
                ${isProcessing
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-[#FF4D00] hover:bg-[#E64500] shadow-orange-500/20 transform hover:-translate-y-1'}
              `}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Carregando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5 mr-2" />
                                    Iniciar Análise
                                </>
                            )}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="h-screen w-screen bg-[#F3F4F6] flex items-center justify-center font-['Inter'] p-4">
            <div className="bg-white p-6 sm:p-12 rounded-2xl shadow-xl max-w-2xl w-full border border-gray-100 overflow-y-auto max-h-[90vh]">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Fiscalização <span className="text-[#FF4D00]">AI</span>
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Configuração inicial</p>
                </div>

                {/* Step Indicator */}
                <StepIndicator currentStep={currentStep} totalSteps={3} />

                {/* Step Content */}
                <div className="min-h-[320px] flex flex-col justify-center">
                    {renderStep()}
                </div>

                {/* Navigation */}
                {currentStep > 0 && currentStep < 2 && (
                    <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Voltar
                        </button>
                        <button
                            onClick={() => setCurrentStep(prev => prev + 1)}
                            className="flex items-center gap-2 px-6 py-2 bg-[#FF4D00] text-white rounded-lg hover:bg-[#E64500] transition-colors"
                        >
                            Próximo
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="flex justify-center mt-8 pt-6 border-t border-gray-100">
                        <button
                            onClick={() => setCurrentStep(prev => prev - 1)}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Voltar para configurações
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingWizard;
