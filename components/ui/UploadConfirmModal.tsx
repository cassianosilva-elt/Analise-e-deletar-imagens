import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Upload, X, FolderUp, AlertTriangle } from 'lucide-react';

interface UploadConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    fileCount: number;
    folderName: string;
}

const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

const modalVariants: Variants = {
    hidden: {
        opacity: 0,
        scale: 0.9,
        y: 20
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring' as const,
            stiffness: 300,
            damping: 25
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 20,
        transition: {
            duration: 0.2
        }
    }
};

const iconContainerVariants: Variants = {
    hidden: { scale: 0 },
    visible: {
        scale: 1,
        transition: {
            type: 'spring' as const,
            stiffness: 400,
            damping: 20,
            delay: 0.1
        }
    }
};

const UploadConfirmModal: React.FC<UploadConfirmModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    fileCount,
    folderName
}) => {
    // Handle escape key press
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onCancel]);

    // Prevent body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        variants={backdropVariants}
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        variants={modalVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header gradient accent */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4D00] via-[#FF6B00] to-[#FF8C00]" />

                        {/* Close button */}
                        <motion.button
                            onClick={onCancel}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <X className="w-4 h-4" />
                        </motion.button>

                        {/* Content */}
                        <div className="p-6 pt-8">
                            {/* Icon */}
                            <motion.div
                                className="flex justify-center mb-6"
                                variants={iconContainerVariants}
                            >
                                <div className="relative">
                                    <motion.div
                                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] flex items-center justify-center shadow-xl shadow-orange-500/25"
                                        animate={{
                                            y: [-2, 2, -2],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    >
                                        <FolderUp className="w-10 h-10 text-white" />
                                    </motion.div>
                                    {/* Decorative glow */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-br from-[#FF4D00]/30 to-[#FF6B00]/20 rounded-2xl blur-xl -z-10"
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.5, 0.8, 0.5]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    />
                                </div>
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                className="text-xl font-bold text-gray-900 text-center mb-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                Confirmar Upload
                            </motion.h2>

                            {/* Description */}
                            <motion.div
                                className="text-center mb-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <p className="text-gray-600 mb-3">
                                    Você está prestes a fazer upload de{' '}
                                    <span className="font-semibold text-gray-900">{fileCount} arquivos</span>
                                    {' '}da pasta:
                                </p>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                                    <FolderUp className="w-4 h-4 text-[#FF4D00]" />
                                    <span className="font-medium text-gray-800 truncate max-w-[200px]">
                                        {folderName}
                                    </span>
                                </div>
                            </motion.div>

                            {/* Warning */}
                            <motion.div
                                className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                            >
                                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    Faça isso apenas se você confia no conteúdo desta pasta.
                                    Os arquivos serão processados pela IA para análise.
                                </p>
                            </motion.div>

                            {/* Actions */}
                            <motion.div
                                className="flex gap-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <motion.button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Cancelar
                                </motion.button>
                                <motion.button
                                    onClick={onConfirm}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FF4D00] to-[#FF6B00] hover:from-[#E64500] hover:to-[#E66000] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02, boxShadow: '0 20px 40px -10px rgba(255, 77, 0, 0.4)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Upload className="w-4 h-4" />
                                    Fazer Upload
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UploadConfirmModal;
