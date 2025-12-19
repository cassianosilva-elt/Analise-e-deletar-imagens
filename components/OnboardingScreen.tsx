import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FolderUp, Sparkles, Zap, ChevronRight, Check, ArrowRight, Layers, FileCheck, FolderArchive, BarChart3, AlertCircle, Moon, Sun, Globe } from 'lucide-react';
import { GeminiModel } from '../services/geminiService';
import { VerificationItemType, VERIFICATION_ITEMS } from '../types';
import UploadConfirmModal from './ui/UploadConfirmModal';
import { Language, TranslationKey } from '../translations';

interface OnboardingScreenProps {
    onFolderSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onModelSelect: (model: GeminiModel) => void;
    onItemsSelect: (items: VerificationItemType[]) => void;
    selectedModel: GeminiModel;
    selectedItems: VerificationItemType[];
    fileInputRef: React.RefObject<HTMLInputElement>;
    darkMode: boolean;
    onDarkModeChange: (enabled: boolean) => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

// Animation variants
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 25 } },
    hover: { scale: 1.02, transition: { type: 'spring' as const, stiffness: 400, damping: 20 } },
    tap: { scale: 0.98 }
};

const uploadAreaVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.2 } }
};

const floatingAnimation = {
    y: [-5, 5, -5],
    transition: { duration: 3, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }
};

const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: { duration: 2, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }
};

const slideVariants: Variants = {
    enter: (direction: number) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? 50 : -50, opacity: 0 })
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
    onFolderSelect,
    onModelSelect,
    onItemsSelect,
    selectedModel,
    selectedItems,
    fileInputRef,
    darkMode,
    onDarkModeChange,
    language,
    onLanguageChange,
    t
}) => {
    const [[activeStep, direction], setActiveStep] = useState<[1 | 2 | 3, number]>([1, 0]);
    const [showUploadConfirm, setShowUploadConfirm] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingFolderName, setPendingFolderName] = useState('');
    const [hoveredModel, setHoveredModel] = useState<GeminiModel | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragError, setDragError] = useState<string | null>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

    const handleStepChange = (newStep: 1 | 2 | 3) => {
        if (newStep === activeStep) return;
        setActiveStep([newStep, newStep > activeStep ? 1 : -1]);
    };

    useEffect(() => {
        if (!contentRef.current) return;
        const HEIGHT_BUFFER = 52;
        const measureHeight = () => {
            if (contentRef.current) {
                setContentHeight(contentRef.current.scrollHeight + HEIGHT_BUFFER);
            }
        };
        measureHeight();
        const resizeObserver = new ResizeObserver(() => measureHeight());
        resizeObserver.observe(contentRef.current);
        return () => resizeObserver.disconnect();
    }, [activeStep]);

    const models = [
        {
            id: 'gemini-flash-latest' as GeminiModel,
            name: t('geminiFlash'),
            subtitle: t('recommended'),
            description: t('highPrecision'),
            icon: Sparkles,
            recommended: true
        },
        {
            id: 'gemini-flash-lite-latest' as GeminiModel,
            name: t('geminiFlashLite'),
            subtitle: t('fast'),
            description: t('fastProcessing'),
            icon: Zap,
            recommended: false
        }
    ];

    const features = [
        { icon: FileCheck, label: t('featureAutoDetect') },
        { icon: Layers, label: t('featureSmartSelect') },
        { icon: BarChart3, label: t('featureReports') },
        { icon: FolderArchive, label: t('featureZip') }
    ];

    const handleToggleItem = (itemId: VerificationItemType) => {
        const newItems = selectedItems.includes(itemId)
            ? selectedItems.length === 1 ? selectedItems : selectedItems.filter(id => id !== itemId)
            : [...selectedItems, itemId];
        onItemsSelect(newItems);
    };

    const readAllEntries = async (dirEntry: FileSystemDirectoryEntry): Promise<File[]> => {
        const files: File[] = [];
        const readEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
            return new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        };
        const getFile = (fileEntry: FileSystemFileEntry): Promise<File> => {
            return new Promise((resolve, reject) => fileEntry.file(resolve, reject));
        };
        const processEntry = async (entry: FileSystemEntry, path: string = ''): Promise<void> => {
            if (entry.isFile) {
                const fileEntry = entry as FileSystemFileEntry;
                try {
                    const file = await getFile(fileEntry);
                    Object.defineProperty(file, 'webkitRelativePath', { value: path + file.name, writable: false });
                    files.push(file);
                } catch (err) {
                    console.warn('Could not read file:', entry.name, err);
                }
            } else if (entry.isDirectory) {
                const dirEntry = entry as FileSystemDirectoryEntry;
                const reader = dirEntry.createReader();
                let entries: FileSystemEntry[] = [];
                let batch: FileSystemEntry[];
                do {
                    batch = await readEntries(reader);
                    entries = entries.concat(batch);
                } while (batch.length > 0);
                for (const subEntry of entries) {
                    await processEntry(subEntry, path + entry.name + '/');
                }
            }
        };
        await processEntry(dirEntry, '');
        return files;
    };

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragError(null);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setDragError(null);
        const items = e.dataTransfer.items;
        if (!items || items.length === 0) {
            setDragError('Nenhum arquivo detectado.');
            return;
        }
        const item = items[0];
        const entry = item.webkitGetAsEntry?.();
        if (!entry) {
            setDragError(t('dragErrorNoFile'));
            return;
        }
        if (!entry.isDirectory) {
            setDragError(t('dragErrorNoFile'));
            return;
        }
        try {
            const files = await readAllEntries(entry as FileSystemDirectoryEntry);
            if (files.length === 0) {
                setDragError(t('dragErrorEmpty'));
                return;
            }
            setPendingFiles(files);
            setPendingFolderName(entry.name);
            setShowUploadConfirm(true);
        } catch (err) {
            console.error('Error processing dropped folder:', err);
            setDragError(t('dragErrorNoFile'));
        }
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);
        // Reset value to allow re-selection
        e.target.value = '';

        const firstFilePath = filesArray[0].webkitRelativePath;
        const folderName = firstFilePath.split('/')[0] || 'Pasta selecionada';
        setPendingFiles(filesArray);
        setPendingFolderName(folderName);
        setShowUploadConfirm(true);
    }, []);

    const handleConfirmUpload = useCallback(() => {
        setShowUploadConfirm(false);
        const syntheticEvent = { target: { files: pendingFiles } } as unknown as React.ChangeEvent<HTMLInputElement>;
        onFolderSelect(syntheticEvent);
        setPendingFiles([]);
        setPendingFolderName('');
    }, [pendingFiles, onFolderSelect]);

    const handleCancelUpload = useCallback(() => {
        setShowUploadConfirm(false);
        setPendingFiles([]);
        setPendingFolderName('');
    }, []);

    return (
        <div className={`min-h-screen w-full overflow-y-auto overflow-x-hidden font-['Rethink_Sans'] transition-colors duration-300 ${darkMode ? 'bg-gray-900' : 'bg-[#FAFAFA]'}`}>
            {/* Background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/4 ${darkMode ? 'from-orange-900/20 via-orange-900/10 to-transparent' : 'from-orange-100/60 via-orange-50/30 to-transparent'}`} />
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }} className={`absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr rounded-full blur-2xl transform -translate-x-1/4 translate-y-1/4 ${darkMode ? 'from-gray-800/80 to-transparent' : 'from-gray-100/80 to-transparent'}`} />
                <motion.div animate={floatingAnimation} className="absolute top-1/4 right-1/4 w-3 h-3 bg-orange-300/40 rounded-full blur-sm" />
                <motion.div animate={floatingAnimation} className="absolute top-2/3 left-1/3 w-2 h-2 bg-orange-200/50 rounded-full blur-sm" />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Header */}
                <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }} transition={{ type: 'spring', stiffness: 400 }}>
                            <img src="./assets/ELETRO-DESKTOP.png" alt="Eletromidia" className="hidden sm:block h-10 sm:h-11" />
                            <img src="./assets/ELETRO-MOBILE.png" alt="Eletromidia" className="block sm:hidden h-8" />
                        </motion.div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Language Toggle */}
                            <motion.button
                                onClick={() => onLanguageChange(language === 'pt' ? 'en' : 'pt')}
                                className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-full border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
                            >
                                <span className="text-sm">{language === 'pt' ? '🇧🇷' : '🇺🇸'}</span>
                                <span className="text-xs font-medium hidden sm:inline">{language === 'pt' ? 'PT' : 'EN'}</span>
                            </motion.button>

                            {/* Dark Mode Toggle */}
                            <motion.button
                                onClick={() => onDarkModeChange(!darkMode)}
                                className={`p-2 rounded-full border transition-colors ${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-yellow-400' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title={darkMode ? 'Light Mode' : 'Dark Mode'}
                            >
                                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </motion.button>

                            {/* Online Indicator */}
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <motion.div className="w-2 h-2 bg-emerald-500 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                                <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Online</span>
                            </motion.div>
                        </div>
                    </div>
                </motion.header>

                {/* Main Content */}
                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Welcome Section */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="text-center mb-8 sm:mb-12">
                            <motion.h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {t('welcomeTitle')} <span className="text-[#FF4D00]">{t('fiscalizacao')}</span>
                            </motion.h2>
                            <motion.p className={`text-sm sm:text-base max-w-xl mx-auto ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('welcomeDesc')}
                            </motion.p>
                        </motion.div>

                        {/* Steps Container */}
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: 'spring', stiffness: 150 }} className={`rounded-2xl sm:rounded-3xl shadow-xl border overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700 shadow-black/30' : 'bg-white border-gray-100 shadow-gray-200/60'}`}>
                            {/* Steps Header - 3 steps */}
                            <div className={`flex border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                {[1, 2, 3].map((step) => (
                                    <motion.button
                                        key={step}
                                        onClick={() => handleStepChange(step as 1 | 2 | 3)}
                                        className={`flex-1 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-center gap-2 sm:gap-3 transition-colors ${activeStep === step ? 'bg-gradient-to-r from-[#FF4D00]/5 to-transparent border-b-2 border-[#FF4D00]' : darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                                        whileHover={{ backgroundColor: activeStep !== step ? (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : undefined }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <motion.div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeStep === step ? 'bg-[#FF4D00] text-white shadow-lg shadow-orange-500/30' : step < activeStep ? 'bg-emerald-500 text-white' : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'}`}
                                            animate={activeStep === step ? { scale: [1, 1.1, 1] } : {}}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {step < activeStep ? <Check className="w-4 h-4" /> : step}
                                        </motion.div>
                                        <span className={`font-medium text-sm sm:text-base ${activeStep === step ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                                            {step === 1 ? t('stepModel') : step === 2 ? t('stepItems') : t('stepFolder')}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Step Content */}
                            <motion.div className="p-5 sm:p-8 lg:p-10 overflow-hidden" animate={{ height: contentHeight }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
                                <div ref={contentRef}>
                                    <AnimatePresence mode="wait" custom={direction}>
                                        {activeStep === 1 ? (
                                            /* Step 1: Model Selection */
                                            <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ opacity: { duration: 0.2 }, x: { type: 'spring', stiffness: 300, damping: 30 } }}>
                                                <motion.p className={`text-sm sm:text-base mb-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {t('stepModelDesc')}
                                                </motion.p>
                                                <motion.div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8" variants={containerVariants} initial="hidden" animate="visible">
                                                    {models.map((model) => {
                                                        const isSelected = selectedModel === model.id;
                                                        const Icon = model.icon;
                                                        return (
                                                            <motion.button
                                                                key={model.id}
                                                                onClick={() => onModelSelect(model.id)}
                                                                onMouseEnter={() => setHoveredModel(model.id)}
                                                                onMouseLeave={() => setHoveredModel(null)}
                                                                variants={cardVariants}
                                                                whileHover="hover"
                                                                whileTap="tap"
                                                                className={`relative p-5 sm:p-6 rounded-2xl text-left transition-colors border-2 ${isSelected ? 'border-[#FF4D00] bg-gradient-to-br from-orange-50 to-white shadow-lg shadow-orange-500/10' : darkMode ? 'border-gray-700 bg-gray-700 hover:border-gray-600' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                                            >
                                                                {model.recommended && (
                                                                    <motion.div className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-[#FF4D00] to-[#FF6B00] text-white text-[10px] font-bold uppercase rounded-full shadow-sm">
                                                                        {t('recommended')}
                                                                    </motion.div>
                                                                )}
                                                                <div className="flex items-start gap-4">
                                                                    <motion.div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] shadow-lg shadow-orange-500/30' : darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                                                                    </motion.div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{model.name}</h3>
                                                                            {isSelected && (
                                                                                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                                                    <Check className="w-3 h-3 text-white" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{model.description}</p>
                                                                    </div>
                                                                </div>
                                                            </motion.button>
                                                        );
                                                    })}
                                                </motion.div>
                                                <motion.div className="flex justify-center">
                                                    <motion.button onClick={() => handleStepChange(2)} className={`inline-flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-colors shadow-lg ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                        {t('continue')}
                                                        <ArrowRight className="w-4 h-4" />
                                                    </motion.button>
                                                </motion.div>
                                            </motion.div>
                                        ) : activeStep === 2 ? (
                                            /* Step 2: Item Selection */
                                            <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ opacity: { duration: 0.2 }, x: { type: 'spring', stiffness: 300, damping: 30 } }}>
                                                <motion.p className={`text-sm sm:text-base mb-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {t('stepItemsDesc')}
                                                </motion.p>
                                                <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto mb-6" variants={containerVariants} initial="hidden" animate="visible">
                                                    {VERIFICATION_ITEMS.map(item => {
                                                        const isSelected = selectedItems?.includes(item.id) ?? false;
                                                        return (
                                                            <motion.button
                                                                key={item.id}
                                                                onClick={() => handleToggleItem(item.id)}
                                                                variants={cardVariants}
                                                                whileHover="hover"
                                                                whileTap="tap"
                                                                className={`p-4 rounded-xl border-2 transition-all text-left ${isSelected ? 'border-[#FF4D00] bg-orange-50 dark:bg-orange-900/20 shadow-md' : darkMode ? 'border-gray-700 bg-gray-700 hover:border-gray-600 hover:bg-gray-600' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                                            >
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <h3 className={`font-semibold ${isSelected ? 'text-[#FF4D00]' : darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t(`item_${item.id}_label` as TranslationKey)}</h3>
                                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#FF4D00] border-[#FF4D00]' : darkMode ? 'border-gray-500' : 'border-gray-300'}`}>
                                                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                    </div>
                                                                </div>
                                                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t(`item_${item.id}_desc` as TranslationKey)}</p>
                                                            </motion.button>
                                                        );
                                                    })}
                                                </motion.div>
                                                <p className={`text-xs text-center mb-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('selectAtLeastOne')}</p>
                                                <motion.div className="flex justify-center gap-3">
                                                    <motion.button onClick={() => handleStepChange(1)} className={`inline-flex items-center gap-2 px-4 py-2.5 font-medium transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                        {t('back')}
                                                    </motion.button>
                                                    <motion.button onClick={() => handleStepChange(3)} className={`inline-flex items-center gap-2 px-6 py-3 font-medium rounded-xl transition-colors shadow-lg ${darkMode ? 'bg-white text-gray-900 hover:bg-gray-200' : 'bg-gray-900 text-white hover:bg-gray-800'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                                        {t('continue')}
                                                        <ArrowRight className="w-4 h-4" />
                                                    </motion.button>
                                                </motion.div>
                                            </motion.div>
                                        ) : (
                                            /* Step 3: Folder Selection */
                                            <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ opacity: { duration: 0.2 }, x: { type: 'spring', stiffness: 300, damping: 30 } }}>
                                                <motion.p className={`text-sm sm:text-base mb-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {t('stepFolderDesc')}
                                                </motion.p>
                                                <AnimatePresence>
                                                    {dragError && (
                                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-xl mx-auto mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-sm text-amber-800">
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                            <span>{dragError}</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <motion.div onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="relative max-w-xl mx-auto cursor-pointer" variants={uploadAreaVariants} initial="hidden" animate="visible">
                                                    <motion.div className="absolute inset-0 bg-gradient-to-br from-[#FF4D00]/20 to-[#FF6B00]/10 rounded-2xl blur-xl" animate={pulseAnimation} />
                                                    <motion.div className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-300 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-gray-50/50 to-white'} ${isDragging ? 'border-[#FF4D00] bg-orange-50/50 scale-[1.02] shadow-xl shadow-orange-500/20' : darkMode ? 'border-gray-600 hover:border-[#FF4D00]' : 'border-gray-300 hover:border-[#FF4D00] hover:shadow-lg'}`}>
                                                        <motion.div className="relative inline-block mb-5" animate={floatingAnimation}>
                                                            <motion.div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${isDragging ? 'bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] shadow-orange-500/40 scale-110' : 'bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] shadow-orange-500/25'}`}>
                                                                <FolderUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                                            </motion.div>
                                                        </motion.div>
                                                        <h3 className={`text-lg sm:text-xl font-bold mb-2 transition-colors ${isDragging ? 'text-[#FF4D00]' : darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                                            {isDragging ? t('folderDragDrop') : t('folderDragTitle')}
                                                        </h3>
                                                        <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {isDragging ? t('folderDragRelease') : t('folderDragDesc')}
                                                        </p>
                                                        <motion.div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF4D00] to-[#FF6B00] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                                                            <span>{t('selectFolderBtn')}</span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </motion.div>
                                                    </motion.div>
                                                </motion.div>

                                                {/* Config Summary */}
                                                <motion.div className={`max-w-xl mx-auto mt-6 p-4 rounded-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50'}`}>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <motion.div className="w-10 h-10 bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] rounded-lg flex items-center justify-center flex-shrink-0">
                                                            {selectedModel === 'gemini-flash-latest' ? <Sparkles className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
                                                        </motion.div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                                {t('configSummaryModel')}: {selectedModel === 'gemini-flash-latest' ? t('geminiFlash') : t('geminiFlashLite')}
                                                            </p>
                                                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                {selectedModel === 'gemini-flash-latest' ? t('highPrecision') : t('fastProcessing')}
                                                            </p>
                                                        </div>
                                                        <motion.button onClick={() => handleStepChange(1)} className="text-sm text-[#FF4D00] hover:underline font-medium">
                                                            {t('change')}
                                                        </motion.button>
                                                    </div>
                                                    <div className={`flex flex-wrap gap-2 pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                        {selectedItems.map(itemId => {
                                                            const item = VERIFICATION_ITEMS.find(v => v.id === itemId);
                                                            return item ? (
                                                                <span key={itemId} className={`px-2 py-1 text-xs rounded-full font-medium ${darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-[#FF4D00]'}`}>
                                                                    {t(`item_${item.id}_label` as TranslationKey)}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                        <motion.button onClick={() => handleStepChange(2)} className="text-xs text-[#FF4D00] hover:underline font-medium ml-auto">
                                                            {t('editItems')}
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Features Grid */}
                        <motion.div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" variants={containerVariants} initial="hidden" animate="visible">
                            {features.map((feature, idx) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div key={idx} variants={itemVariants} whileHover={{ scale: 1.03, y: -2 }} className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl border shadow-sm cursor-default ${darkMode ? 'bg-gray-800 border-gray-700 transition-colors' : 'bg-white border-gray-100'}`}>
                                        <motion.div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-orange-900/30' : 'bg-orange-100'}`}>
                                            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-orange-400' : 'text-[#FF4D00]'}`} />
                                        </motion.div>
                                        <span className={`text-xs sm:text-sm font-medium leading-tight ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{feature.label}</span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </main>
            </div>

            {/* Hidden file input */}
            {/* @ts-ignore */}
            <input type="file" ref={fileInputRef} webkitdirectory="" multiple className="hidden" onChange={handleFileInputChange} />

            {/* Upload Confirmation Modal */}
            {/* Upload Confirmation Modal */}
            <UploadConfirmModal isOpen={showUploadConfirm} onConfirm={handleConfirmUpload} onCancel={handleCancelUpload} fileCount={pendingFiles.length} folderName={pendingFolderName} darkMode={darkMode} t={t} />
        </div>
    );
};

export default OnboardingScreen;
