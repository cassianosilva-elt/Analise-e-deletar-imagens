import React from 'react';
import { Settings, Eye, EyeOff, Sparkles, Zap, Monitor, Palette, Moon, Sun, Globe } from 'lucide-react';
import { Language, TranslationKey } from '../../translations';

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
    darkMode: boolean;
    onDarkModeChange: (enabled: boolean) => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
    t: (key: TranslationKey) => string;
}

const ToggleSwitch = ({ enabled, onChange, label, description, darkMode }: {
    enabled: boolean;
    onChange: () => void;
    label: string;
    description: string;
    darkMode?: boolean;
}) => (
    <div
        className={`flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
            }`}
        onClick={onChange}
    >
        <div className="flex items-center gap-3">
            {enabled ? (
                <Eye className="w-5 h-5 text-green-500" />
            ) : (
                <EyeOff className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            )}
            <div>
                <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{label}</p>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
            </div>
        </div>
        <button
            onClick={(e) => { e.stopPropagation(); onChange(); }}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-[#FF4D00]' : darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}
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
    onModelChange,
    darkMode,
    onDarkModeChange,
    language,
    onLanguageChange,
    t
}) => {
    const cardClass = darkMode
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-200';

    const headerClass = darkMode
        ? 'bg-gray-700/50 border-gray-700'
        : 'bg-gray-50/50 border-gray-100';

    return (
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${darkMode ? 'bg-gray-900' : 'bg-[#F8F9FA]'}`}>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        {t('settingsTitle')}
                    </h1>
                    <p className={`text-sm sm:text-base ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {t('settingsSubtitle')}
                    </p>
                </div>

                {/* Appearance Section - Dark Mode */}
                <div className={`rounded-xl border shadow-sm overflow-hidden mb-6 ${cardClass}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b flex items-center gap-2 ${headerClass}`}>
                        <Moon className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        <h2 className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t('appearance')}
                        </h2>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div
                            className={`flex items-center justify-between p-4 rounded-xl transition-colors cursor-pointer ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                            onClick={() => onDarkModeChange(!darkMode)}
                        >
                            <div className="flex items-center gap-3">
                                {darkMode ? (
                                    <Moon className="w-5 h-5 text-indigo-400" />
                                ) : (
                                    <Sun className="w-5 h-5 text-amber-500" />
                                )}
                                <div>
                                    <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                        {t('darkMode')}
                                    </p>
                                    <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {t('darkModeDesc')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDarkModeChange(!darkMode); }}
                                className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-500' : 'bg-gray-300'
                                    }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Language Section */}
                <div className={`rounded-xl border shadow-sm overflow-hidden mb-6 ${cardClass}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b flex items-center gap-2 ${headerClass}`}>
                        <Globe className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        <h2 className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t('language')}
                        </h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3">
                        <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {t('languageDesc')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => onLanguageChange('pt')}
                                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${language === 'pt'
                                        ? 'border-[#FF4D00] bg-orange-50 dark:bg-orange-900/20'
                                        : darkMode
                                            ? 'border-gray-600 hover:border-gray-500'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-2xl">🇧🇷</span>
                                <span className={`font-medium ${language === 'pt'
                                        ? 'text-[#FF4D00]'
                                        : darkMode ? 'text-gray-100' : 'text-gray-900'
                                    }`}>
                                    {t('portuguese')}
                                </span>
                                {language === 'pt' && (
                                    <span className="px-2 py-0.5 bg-[#FF4D00] text-white text-xs font-bold rounded-full">
                                        {t('active')}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => onLanguageChange('en')}
                                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${language === 'en'
                                        ? 'border-[#FF4D00] bg-orange-50 dark:bg-orange-900/20'
                                        : darkMode
                                            ? 'border-gray-600 hover:border-gray-500'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className="text-2xl">🇺🇸</span>
                                <span className={`font-medium ${language === 'en'
                                        ? 'text-[#FF4D00]'
                                        : darkMode ? 'text-gray-100' : 'text-gray-900'
                                    }`}>
                                    {t('english')}
                                </span>
                                {language === 'en' && (
                                    <span className="px-2 py-0.5 bg-[#FF4D00] text-white text-xs font-bold rounded-full">
                                        {t('active')}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page Visibility Section */}
                <div className={`rounded-xl border shadow-sm overflow-hidden mb-6 ${cardClass}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b flex items-center gap-2 ${headerClass}`}>
                        <Monitor className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        <h2 className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t('pageVisibility')}
                        </h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3">
                        <ToggleSwitch
                            enabled={pageVisibility.relatorios}
                            onChange={() => onTogglePageVisibility('relatorios')}
                            label={t('relatoriosLabel')}
                            description={t('relatoriosDesc')}
                            darkMode={darkMode}
                        />
                        <ToggleSwitch
                            enabled={pageVisibility.configuracoes}
                            onChange={() => onTogglePageVisibility('configuracoes')}
                            label={t('configuracoesLabel')}
                            description={t('configuracoesDesc')}
                            darkMode={darkMode}
                        />
                        <ToggleSwitch
                            enabled={pageVisibility.ajuda}
                            onChange={() => onTogglePageVisibility('ajuda')}
                            label={t('ajudaLabel')}
                            description={t('ajudaDesc')}
                            darkMode={darkMode}
                        />

                        <p className={`text-xs mt-4 pt-3 border-t ${darkMode ? 'text-gray-500 border-gray-700' : 'text-gray-400 border-gray-100'
                            }`}>
                            <strong>{language === 'pt' ? 'Nota:' : 'Note:'}</strong> {t('dashboardNote')}
                        </p>
                    </div>
                </div>

                {/* AI Model Section */}
                <div className={`rounded-xl border shadow-sm overflow-hidden mb-6 ${cardClass}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b flex items-center gap-2 ${headerClass}`}>
                        <Palette className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                        <h2 className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                            {t('aiModel')}
                        </h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3">
                        <button
                            onClick={() => onModelChange('gemini-flash-latest')}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedModel === 'gemini-flash-latest'
                                    ? 'border-[#FF4D00] bg-orange-50 dark:bg-orange-900/20'
                                    : darkMode
                                        ? 'border-gray-600 hover:border-gray-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className={`p-2.5 rounded-xl ${selectedModel === 'gemini-flash-latest' ? 'bg-[#FF4D00]' : darkMode ? 'bg-gray-600' : 'bg-gray-200'
                                }`}>
                                <Sparkles className={`w-5 h-5 ${selectedModel === 'gemini-flash-latest' ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`} />
                            </div>
                            <div className="text-left flex-1">
                                <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {t('geminiFlash')}
                                </p>
                                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('geminiFlashDesc')}
                                </p>
                            </div>
                            {selectedModel === 'gemini-flash-latest' && (
                                <span className="px-2 py-0.5 bg-[#FF4D00] text-white text-xs font-bold rounded-full">
                                    {t('active')}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => onModelChange('gemini-flash-lite-latest')}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedModel === 'gemini-flash-lite-latest'
                                    ? 'border-[#FF4D00] bg-orange-50 dark:bg-orange-900/20'
                                    : darkMode
                                        ? 'border-gray-600 hover:border-gray-500'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className={`p-2.5 rounded-xl ${selectedModel === 'gemini-flash-lite-latest' ? 'bg-[#FF4D00]' : darkMode ? 'bg-gray-600' : 'bg-gray-200'
                                }`}>
                                <Zap className={`w-5 h-5 ${selectedModel === 'gemini-flash-lite-latest' ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`} />
                            </div>
                            <div className="text-left flex-1">
                                <p className={`font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                                    {t('geminiFlashLite')}
                                </p>
                                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {t('geminiFlashLiteDesc')}
                                </p>
                            </div>
                            {selectedModel === 'gemini-flash-lite-latest' && (
                                <span className="px-2 py-0.5 bg-[#FF4D00] text-white text-xs font-bold rounded-full">
                                    {t('active')}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Version Info */}
                <div className={`text-center text-xs mt-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <p>{t('appName')} {t('version')}</p>
                    <p className="mt-1">{t('copyright')}</p>
                </div>
            </div>
        </div>
    );
};

export default ConfiguracoesPage;

