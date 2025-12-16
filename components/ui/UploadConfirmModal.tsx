import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderUp, X, ArrowRight, FileText } from 'lucide-react';

import { TranslationKey } from '../../translations';

interface UploadConfirmModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    fileCount: number;
    folderName: string;
    darkMode?: boolean;
    t: (key: TranslationKey) => string;
}

const UploadConfirmModal: React.FC<UploadConfirmModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    fileCount,
    folderName,
    darkMode = false,
    t
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
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md transition-all duration-300"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className={`relative w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden pb-6 pt-8 px-6 text-center ring-1 ring-black/5 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onCancel}
                            className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
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
                        <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('confirmUploadTitle')}</h3>
                        <p className={`text-sm leading-relaxed mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('confirmUploadDesc')} <br />
                            <span className={`font-semibold px-2 py-0.5 rounded border text-xs mt-1 inline-block truncate max-w-[200px] align-middle ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>
                                {folderName}
                            </span>
                            <span className="block mt-1 text-xs text-gray-400">
                                {t('containing')} {fileCount} {t('files')}
                            </span>
                        </p>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <motion.button
                                onClick={onConfirm}
                                className={`w-full py-3.5 font-medium rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 hover:bg-black text-white'}`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>{t('startAnalysis')}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </motion.button>

                            <motion.button
                                onClick={onCancel}
                                className={`w-full py-3 font-medium text-sm transition-colors ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800'}`}
                                whileTap={{ scale: 0.98 }}
                            >
                                {t('cancel')}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UploadConfirmModal;
