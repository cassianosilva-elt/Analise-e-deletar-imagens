import React from 'react';
import { Upload, X, Folder, Image } from 'lucide-react';

interface UploadConfirmationModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    folderCount: number;
    fileCount: number;
}

const UploadConfirmationModal: React.FC<UploadConfirmationModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    folderCount,
    fileCount,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-[#FF4D00] p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Upload className="w-24 h-24 transform translate-x-4 -translate-y-4" />
                    </div>
                    <h2 className="text-2xl font-bold relative z-10">Confirmar Upload</h2>
                    <p className="text-orange-100 mt-1 relative z-10">
                        Verifique os arquivos antes de continuar
                    </p>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 mb-6">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                            Resumo da Seleção
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-orange-100">
                                        <Folder className="w-5 h-5 text-[#FF4D00]" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Pastas Identificadas</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">{folderCount}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg border border-orange-100">
                                        <Image className="w-5 h-5 text-[#FF4D00]" />
                                    </div>
                                    <span className="text-gray-700 font-medium">Imagens Encontradas</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">{fileCount}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-500 text-sm mb-6 text-center">
                        Deseja prosseguir com a análise destes arquivos?
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-3 rounded-xl bg-[#FF4D00] text-white font-medium hover:bg-[#E64500] shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            <Upload className="w-4 h-4" />
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadConfirmationModal;
