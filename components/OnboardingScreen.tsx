import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FolderUp, Sparkles, Zap, ChevronRight, Check, ArrowRight, Layers, FileCheck, FolderArchive, BarChart3, AlertCircle } from 'lucide-react';
import { GeminiModel } from '../services/geminiService';
import UploadConfirmModal from './ui/UploadConfirmModal';

interface OnboardingScreenProps {
    onFolderSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onModelSelect: (model: GeminiModel) => void;
    selectedModel: GeminiModel;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

// Animation variants with proper types
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring' as const, stiffness: 300, damping: 24 }
    }
};

const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 300, damping: 25 }
    },
    hover: {
        scale: 1.02,
        transition: { type: 'spring' as const, stiffness: 400, damping: 20 }
    },
    tap: { scale: 0.98 }
};

const uploadAreaVariants: Variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.2 }
    }
};

// These use direct animation props instead of variants to avoid TypeScript issues
const floatingAnimation = {
    y: [-5, 5, -5],
    transition: {
        duration: 3,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1] as const // easeInOut cubic-bezier
    }
};

const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1] as const
    }
};

const slideInVariants: Variants = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 20 } },
    exit: { opacity: 0, x: -30, transition: { duration: 0.2 } }
};

const slideVariants: Variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 50 : -50,
        opacity: 0
    }),
    center: {
        x: 0,
        opacity: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 50 : -50,
        opacity: 0
    })
};

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
    onFolderSelect,
    onModelSelect,
    selectedModel,
    fileInputRef
}) => {
    const [[activeStep, direction], setActiveStep] = useState<[1 | 2, number]>([1, 0]);

    // Upload confirmation modal state
    const [showUploadConfirm, setShowUploadConfirm] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [pendingFolderName, setPendingFolderName] = useState('');

    const handleStepChange = (newStep: 1 | 2) => {
        if (newStep === activeStep) return;
        setActiveStep([newStep, newStep > activeStep ? 1 : -1]);
    };
    const [hoveredModel, setHoveredModel] = useState<GeminiModel | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragError, setDragError] = useState<string | null>(null);

    // Refs and state for measured height animation
    const contentRef = useRef<HTMLDivElement>(null);
    const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

    // ResizeObserver for measured height animation
    useEffect(() => {
        if (!contentRef.current) return;

        // Height threshold to ensure all content is visible
        const HEIGHT_BUFFER = 52;

        const measureHeight = () => {
            if (contentRef.current) {
                setContentHeight(contentRef.current.scrollHeight + HEIGHT_BUFFER);
            }
        };

        // Measure immediately
        measureHeight();

        const resizeObserver = new ResizeObserver(() => {
            measureHeight();
        });

        resizeObserver.observe(contentRef.current);

        return () => resizeObserver.disconnect();
    }, [activeStep]);

    const models = [
        {
            id: 'gemini-flash-latest' as GeminiModel,
            name: 'Gemini Flash',
            subtitle: 'Recomendado',
            description: 'Alta precisão na identificação de abrigos',
            icon: Sparkles,
            recommended: true
        },
        {
            id: 'gemini-flash-lite-latest' as GeminiModel,
            name: 'Gemini Flash Lite',
            subtitle: 'Rápido',
            description: 'Ideal para grandes volumes de análise',
            icon: Zap,
            recommended: false
        }
    ];

    const features = [
        { icon: FileCheck, label: 'Detecção automática de abrigos concluídos' },
        { icon: Layers, label: 'Seleção inteligente das melhores fotos' },
        { icon: BarChart3, label: 'Relatórios estruturados em Excel' },
        { icon: FolderArchive, label: 'Exportação em ZIP organizado' }
    ];

    // Drag and drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragError(null);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if leaving the drop zone entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    // Recursive function to read all files from a directory entry
    const readAllEntries = async (dirEntry: FileSystemDirectoryEntry): Promise<File[]> => {
        const files: File[] = [];

        const readEntries = (reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> => {
            return new Promise((resolve, reject) => {
                reader.readEntries(resolve, reject);
            });
        };

        const getFile = (fileEntry: FileSystemFileEntry): Promise<File> => {
            return new Promise((resolve, reject) => {
                fileEntry.file(resolve, reject);
            });
        };

        const processEntry = async (entry: FileSystemEntry, path: string = ''): Promise<void> => {
            if (entry.isFile) {
                const fileEntry = entry as FileSystemFileEntry;
                try {
                    const file = await getFile(fileEntry);
                    // Attach the relative path to the file
                    Object.defineProperty(file, 'webkitRelativePath', {
                        value: path + file.name,
                        writable: false
                    });
                    files.push(file);
                } catch (err) {
                    console.warn('Could not read file:', entry.name, err);
                }
            } else if (entry.isDirectory) {
                const dirEntry = entry as FileSystemDirectoryEntry;
                const reader = dirEntry.createReader();
                let entries: FileSystemEntry[] = [];

                // Read all entries (may need multiple calls for large directories)
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

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setDragError(null);

        const items = e.dataTransfer.items;

        if (!items || items.length === 0) {
            setDragError('Nenhum arquivo detectado. Por favor, use o botão para selecionar pasta.');
            return;
        }

        // Check if we have folder support
        const item = items[0];
        const entry = item.webkitGetAsEntry?.();

        if (!entry) {
            setDragError('Seu navegador não suporta arrastar pastas. Use o botão para selecionar.');
            return;
        }

        if (!entry.isDirectory) {
            setDragError('Por favor, arraste uma pasta, não arquivos individuais.');
            return;
        }

        try {
            // Read all files from the dropped folder
            const files = await readAllEntries(entry as FileSystemDirectoryEntry);

            if (files.length === 0) {
                setDragError('A pasta parece estar vazia ou não contém arquivos acessíveis.');
                return;
            }

            // Store files and show confirmation modal
            setPendingFiles(files);
            setPendingFolderName(entry.name);
            setShowUploadConfirm(true);
        } catch (err) {
            console.error('Error processing dropped folder:', err);
            setDragError('Erro ao processar pasta. Tente usar o botão de seleção.');
        }
    }, []);

    // Handle file input change (click to select folder)
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Extract folder name from the first file's path
        const firstFilePath = files[0].webkitRelativePath;
        const folderName = firstFilePath.split('/')[0] || 'Pasta selecionada';

        // Convert FileList to array
        const filesArray = Array.from(files);

        // Store files and show confirmation modal
        setPendingFiles(filesArray);
        setPendingFolderName(folderName);
        setShowUploadConfirm(true);
    }, []);

    // Confirm upload handler
    const handleConfirmUpload = useCallback(() => {
        setShowUploadConfirm(false);

        // Create a synthetic event-like object that mimics file input change
        const syntheticEvent = {
            target: {
                files: pendingFiles
            }
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        onFolderSelect(syntheticEvent);

        // Clean up pending state
        setPendingFiles([]);
        setPendingFolderName('');
    }, [pendingFiles, onFolderSelect]);

    // Cancel upload handler
    const handleCancelUpload = useCallback(() => {
        setShowUploadConfirm(false);
        setPendingFiles([]);
        setPendingFolderName('');
    }, []);

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] overflow-y-auto overflow-x-hidden font-['Rethink_Sans']">
            {/* Animated background decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-orange-100/60 via-orange-50/30 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/4"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                    className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-gray-100/80 to-transparent rounded-full blur-2xl transform -translate-x-1/4 translate-y-1/4"
                />
                {/* Floating particles */}
                <motion.div
                    animate={floatingAnimation}
                    className="absolute top-1/4 right-1/4 w-3 h-3 bg-orange-300/40 rounded-full blur-sm"
                />
                <motion.div
                    animate={floatingAnimation}
                    className="absolute top-2/3 left-1/3 w-2 h-2 bg-orange-200/50 rounded-full blur-sm"
                />
            </div>

            <div className="relative z-10 min-h-screen flex flex-col">
                {/* Compact Header */}
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6"
                >
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <motion.div
                            className="flex items-center gap-3"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                        >
                            {/* Desktop logo */}
                            <img
                                src="./assets/ELETRO-DESKTOP.png"
                                alt="Eletromidia"
                                className="hidden sm:block h-10 sm:h-11"
                            />
                            {/* Mobile logo */}
                            <img
                                src="./assets/ELETRO-MOBILE.png"
                                alt="Eletromidia"
                                className="block sm:hidden h-8"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm"
                        >
                            <motion.div
                                className="w-2 h-2 bg-emerald-500 rounded-full"
                                animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="text-xs text-gray-600 font-medium">Online</span>
                        </motion.div>
                    </div>
                </motion.header>

                {/* Main Content */}
                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Welcome Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="text-center mb-8 sm:mb-12"
                        >
                            <motion.h2
                                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                            >
                                Bem-vindo ao sistema de <span className="text-[#FF4D00]">Fiscalização</span>
                            </motion.h2>
                            <motion.p
                                className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Configure a análise em dois passos simples e deixe a IA identificar automaticamente os abrigos concluídos.
                            </motion.p>
                        </motion.div>

                        {/* Steps Container */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, type: 'spring', stiffness: 150 }}
                            className="bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 overflow-hidden"
                        >

                            {/* Steps Header */}
                            <div className="flex border-b border-gray-100">
                                {[1, 2].map((step) => (
                                    <motion.button
                                        key={step}
                                        onClick={() => handleStepChange(step as 1 | 2)}
                                        className={`flex-1 px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-center gap-2 sm:gap-3 transition-colors ${activeStep === step
                                            ? 'bg-gradient-to-r from-[#FF4D00]/5 to-transparent border-b-2 border-[#FF4D00]'
                                            : 'hover:bg-gray-50'
                                            }`}
                                        whileHover={{ backgroundColor: activeStep !== step ? 'rgba(0,0,0,0.02)' : undefined }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <motion.div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm font-bold ${activeStep === step
                                                ? 'bg-[#FF4D00] text-white shadow-lg shadow-orange-500/30'
                                                : selectedModel && step === 1 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
                                                }`}
                                            animate={activeStep === step ? { scale: [1, 1.1, 1] } : {}}
                                            transition={{ duration: 0.3 }}
                                        >
                                            {selectedModel && step === 1 && activeStep !== 1 ? <Check className="w-4 h-4" /> : step}
                                        </motion.div>
                                        <span className={`font-medium text-sm sm:text-base ${activeStep === step ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {step === 1 ? 'Modelo IA' : 'Selecionar Pasta'}
                                        </span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Step Content with smooth height transition */}
                            <motion.div
                                className="p-5 sm:p-8 lg:p-10 overflow-hidden"
                                animate={{ height: contentHeight }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            >
                                <div ref={contentRef}>
                                    <AnimatePresence mode="wait" custom={direction}>
                                        {activeStep === 1 ? (
                                            /* Step 1: Model Selection */
                                            <motion.div
                                                key="step1"
                                                custom={direction}
                                                variants={slideVariants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{
                                                    opacity: { duration: 0.2 },
                                                    x: { type: 'spring', stiffness: 300, damping: 30 }
                                                }}
                                            >
                                                <motion.p
                                                    className="text-gray-600 text-sm sm:text-base mb-6 text-center"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    Escolha o modelo de IA que será usado para analisar suas fotos.
                                                </motion.p>

                                                <motion.div
                                                    className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8"
                                                    variants={containerVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                >
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
                                                                className={`
                                relative p-5 sm:p-6 rounded-2xl text-left transition-colors border-2
                                ${isSelected
                                                                        ? 'border-[#FF4D00] bg-gradient-to-br from-orange-50 to-white shadow-lg shadow-orange-500/10'
                                                                        : 'border-gray-200 bg-white hover:border-gray-300'
                                                                    }
                              `}
                                                            >
                                                                {model.recommended && (
                                                                    <motion.div
                                                                        className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-gradient-to-r from-[#FF4D00] to-[#FF6B00] text-white text-[10px] font-bold uppercase rounded-full shadow-sm"
                                                                        initial={{ opacity: 0, y: -10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: 0.3 }}
                                                                    >
                                                                        Recomendado
                                                                    </motion.div>
                                                                )}

                                                                <div className="flex items-start gap-4">
                                                                    <motion.div
                                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected
                                                                            ? 'bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] shadow-lg shadow-orange-500/30'
                                                                            : 'bg-gray-100'
                                                                            }`}
                                                                        animate={isSelected ? { rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] } : {}}
                                                                        transition={{ duration: 0.5 }}
                                                                    >
                                                                        <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                                                                    </motion.div>

                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="font-semibold text-gray-900">{model.name}</h3>
                                                                            <AnimatePresence>
                                                                                {isSelected && (
                                                                                    <motion.div
                                                                                        initial={{ scale: 0, opacity: 0 }}
                                                                                        animate={{ scale: 1, opacity: 1 }}
                                                                                        exit={{ scale: 0, opacity: 0 }}
                                                                                        className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center"
                                                                                    >
                                                                                        <Check className="w-3 h-3 text-white" />
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                        <p className="text-sm text-gray-500 mt-1">{model.description}</p>
                                                                    </div>
                                                                </div>
                                                            </motion.button>
                                                        );
                                                    })}
                                                </motion.div>

                                                <motion.div
                                                    className="flex justify-center"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.4 }}
                                                >
                                                    <motion.button
                                                        onClick={() => handleStepChange(2)}
                                                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
                                                        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Continuar
                                                        <motion.span
                                                            animate={{ x: [0, 4, 0] }}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                        >
                                                            <ArrowRight className="w-4 h-4" />
                                                        </motion.span>
                                                    </motion.button>
                                                </motion.div>
                                            </motion.div>
                                        ) : (
                                            /* Step 2: Folder Selection */
                                            <motion.div
                                                key="step2"
                                                custom={direction}
                                                variants={slideVariants}
                                                initial="enter"
                                                animate="center"
                                                exit="exit"
                                                transition={{
                                                    opacity: { duration: 0.2 },
                                                    x: { type: 'spring', stiffness: 300, damping: 30 }
                                                }}
                                            >
                                                <motion.p
                                                    className="text-gray-600 text-sm sm:text-base mb-6 text-center"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    Selecione a pasta raiz contendo as subpastas dos abrigos para análise.
                                                </motion.p>

                                                {/* Error message */}
                                                <AnimatePresence>
                                                    {dragError && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: -10 }}
                                                            className="max-w-xl mx-auto mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-sm text-amber-800"
                                                        >
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                            <span>{dragError}</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Upload Area with Drag and Drop */}
                                                <motion.div
                                                    onDragEnter={handleDragEnter}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="relative max-w-xl mx-auto cursor-pointer"
                                                    variants={uploadAreaVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                >
                                                    {/* Animated glow behind */}
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-br from-[#FF4D00]/20 to-[#FF6B00]/10 rounded-2xl blur-xl"
                                                        animate={pulseAnimation}
                                                    />

                                                    <motion.div
                                                        className={`
                            relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center bg-gradient-to-br from-gray-50/50 to-white transition-all duration-300
                            ${isDragging
                                                                ? 'border-[#FF4D00] bg-orange-50/50 scale-[1.02] shadow-xl shadow-orange-500/20'
                                                                : 'border-gray-300 hover:border-[#FF4D00] hover:shadow-lg'
                                                            }
                          `}
                                                        animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
                                                        whileHover={!isDragging ? { scale: 1.01, boxShadow: '0 25px 50px -12px rgba(255, 77, 0, 0.15)' } : {}}
                                                    >
                                                        <motion.div
                                                            className="relative inline-block mb-5"
                                                            animate={floatingAnimation}
                                                        >
                                                            <motion.div
                                                                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${isDragging
                                                                    ? 'bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] shadow-orange-500/40 scale-110'
                                                                    : 'bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] shadow-orange-500/25'
                                                                    }`}
                                                                animate={isDragging ? { rotate: [0, -5, 5, 0], scale: 1.1 } : {}}
                                                                transition={{ duration: 0.5, repeat: isDragging ? Infinity : 0 }}
                                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                            >
                                                                <FolderUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                                            </motion.div>
                                                        </motion.div>

                                                        <h3 className={`text-lg sm:text-xl font-bold mb-2 transition-colors ${isDragging ? 'text-[#FF4D00]' : 'text-gray-900'}`}>
                                                            {isDragging ? 'Solte a pasta aqui!' : 'Clique ou arraste a pasta'}
                                                        </h3>
                                                        <p className="text-gray-500 text-sm mb-6">
                                                            {isDragging ? 'Libere para carregar a pasta' : 'Selecione a pasta "Fiscalização" com as subpastas dos abrigos'}
                                                        </p>

                                                        <motion.div
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF4D00] to-[#FF6B00] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25"
                                                            whileHover={{ scale: 1.05, y: -2 }}
                                                            whileTap={{ scale: 0.95 }}
                                                        >
                                                            <span>Selecionar Pasta</span>
                                                            <motion.span
                                                                animate={{ x: [0, 4, 0] }}
                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                            >
                                                                <ChevronRight className="w-4 h-4" />
                                                            </motion.span>
                                                        </motion.div>
                                                    </motion.div>
                                                </motion.div>

                                                {/* Model indicator */}
                                                <motion.div
                                                    className="max-w-xl mx-auto mt-6 p-4 bg-gray-50 rounded-xl flex items-center gap-3"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 }}
                                                >
                                                    <motion.div
                                                        className="w-10 h-10 bg-gradient-to-br from-[#FF4D00] to-[#FF6B00] rounded-lg flex items-center justify-center flex-shrink-0"
                                                        animate={{ rotate: [0, 5, -5, 0] }}
                                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                                    >
                                                        {selectedModel === 'gemini-flash-latest' ? (
                                                            <Sparkles className="w-5 h-5 text-white" />
                                                        ) : (
                                                            <Zap className="w-5 h-5 text-white" />
                                                        )}
                                                    </motion.div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            Modelo: {selectedModel === 'gemini-flash-latest' ? 'Gemini Flash' : 'Gemini Flash Lite'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {selectedModel === 'gemini-flash-latest' ? 'Alta precisão' : 'Processamento rápido'}
                                                        </p>
                                                    </div>
                                                    <motion.button
                                                        onClick={() => handleStepChange(1)}
                                                        className="text-sm text-[#FF4D00] hover:underline font-medium"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Alterar
                                                    </motion.button>
                                                </motion.div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Features Grid */}
                        <motion.div
                            className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {features.map((feature, idx) => {
                                const Icon = feature.icon;
                                return (
                                    <motion.div
                                        key={idx}
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        className="flex items-center gap-3 p-3 sm:p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-default"
                                    >
                                        <motion.div
                                            className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0"
                                            whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
                                        >
                                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF4D00]" />
                                        </motion.div>
                                        <span className="text-xs sm:text-sm text-gray-700 font-medium leading-tight">{feature.label}</span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    </div>
                </main>
            </div >

            {/* Hidden file input */}
            < input
                type="file"
                ref={fileInputRef}
                // @ts-ignore
                webkitdirectory=""
                multiple
                className="hidden"
                onChange={handleFileInputChange}
            />

            {/* Upload Confirmation Modal */}
            <UploadConfirmModal
                isOpen={showUploadConfirm}
                onConfirm={handleConfirmUpload}
                onCancel={handleCancelUpload}
                fileCount={pendingFiles.length}
                folderName={pendingFolderName}
            />
        </div >
    );
};

export default OnboardingScreen;
