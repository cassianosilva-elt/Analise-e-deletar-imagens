import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderUp, X, ArrowRight, FileText } from 'lucide-react';

interface UploadConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    fileCount: number;
    folderName: string;
}

const UploadConfirmModal: React.FC<UploadConfirmModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    fileCount,
    folderName
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-gray-900/30 backdrop-blur-md transition-all duration-300"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden pb-6 pt-8 px-6 text-center ring-1 ring-black/5"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Icon */}
                        <div className="relative w-20 h-20 mx-auto mb-6">
                            <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-20" />
                            <div className="relative w-full h-full bg-gradient-to-tr from-[#FF4D00] to-[#FF8C00] rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <FolderUp className="w-9 h-9 text-white -rotate-3" />
                            </div>
                        </div>

                        {/* Text Content */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirmar Upload?</h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8">
                            Você está prestes a analisar a pasta <br />
                            <span className="font-semibold text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-xs mt-1 inline-block truncate max-w-[200px] align-middle">
                                {folderName}
                            </span>
                            <span className="block mt-1 text-xs text-gray-400">
                                Contendo {fileCount} arquivos
                            </span>
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <motion.button
                                onClick={onConfirm}
                                className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>Iniciar Análise</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </motion.button>

                            <motion.button
                                onClick={onCancel}
                                className="w-full py-3 text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors"
                                whileTap={{ scale: 0.98 }}
                            >
                                Cancelar
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UploadConfirmModal;
