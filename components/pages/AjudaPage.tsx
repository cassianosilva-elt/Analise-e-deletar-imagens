import React from 'react';
import { HelpCircle, Keyboard, MessageCircle, Book, ExternalLink, Zap, FolderUp, Wand2, FileSpreadsheet } from 'lucide-react';
import { TranslationKey } from '../../translations';

const ShortcutItem = ({ keys, description, darkMode }: { keys: string[]; description: string; darkMode?: boolean }) => (
    <div className={`flex items-center justify-between py-2 ${darkMode ? 'border-gray-800' : ''}`}>
        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{description}</span>
        <div className="flex items-center gap-1">
            {keys.map((key, idx) => (
                <React.Fragment key={idx}>
                    <kbd className={`px-2 py-1 border rounded text-xs font-mono shadow-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-100 border-gray-300 text-gray-700'}`}>
                        {key}
                    </kbd>
                    {idx < keys.length - 1 && <span className={`${darkMode ? 'text-gray-600' : 'text-gray-400'} text-xs mx-0.5`}>+</span>}
                </React.Fragment>
            ))}
        </div>
    </div>
);

const StepItem = ({ icon: Icon, step, title, description, darkMode }: { icon: React.ElementType; step: number; title: string; description: string; darkMode?: boolean }) => (
    <div className={`flex items-start gap-4 p-4 rounded-xl transition-colors ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        <div className="flex-shrink-0 w-10 h-10 bg-[#FF4D00] rounded-xl flex items-center justify-center text-white font-bold shadow-sm">
            {step}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-[#FF4D00]" />
                <h4 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{title}</h4>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
        </div>
    </div>
);

const AjudaPage: React.FC<{ darkMode?: boolean; t?: (key: TranslationKey) => string }> = ({ darkMode = false, t }) => {
    const translate = (key: TranslationKey): string => {
        if (t) return t(key);
        return key;
    };
    const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const headerBgClass = darkMode ? 'bg-gray-700/50 border-gray-700' : 'bg-gray-50/50 border-gray-100';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-900';
    const subtextClass = darkMode ? 'text-gray-400' : 'text-gray-500';

    return (
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${darkMode ? 'bg-gray-950' : 'bg-[#F8F9FA]'}`}>
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${textClass}`}>{translate('ajuda')}</h1>
                    <p className={`text-sm sm:text-base ${subtextClass}`}>{translate('helpDesc')}</p>
                </div>

                {/* Quick Start Guide */}
                <div className={`rounded-xl border shadow-sm overflow-hidden mb-6 ${cardClass}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b flex items-center gap-2 ${headerBgClass}`}>
                        <Zap className="w-4 h-4 text-[#FF4D00]" />
                        <h2 className={`font-semibold text-sm sm:text-base ${textClass}`}>{translate('quickStart')}</h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3">
                        <StepItem
                            icon={FolderUp}
                            step={1}
                            title={translate('step1Title')}
                            description={translate('step1Desc')}
                            darkMode={darkMode}
                        />
                        <StepItem
                            icon={Wand2}
                            step={2}
                            title={translate('step2Title')}
                            description={translate('step2Desc')}
                            darkMode={darkMode}
                        />
                        <StepItem
                            icon={FileSpreadsheet}
                            step={3}
                            title={translate('step3Title')}
                            description={translate('step3Desc')}
                            darkMode={darkMode}
                        />
                    </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className={`rounded-xl border shadow-sm overflow-hidden mb-6 ${cardClass}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b flex items-center gap-2 ${headerBgClass}`}>
                        <Keyboard className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <h2 className={`font-semibold text-sm sm:text-base ${textClass}`}>{translate('shortcutsTitle')}</h2>
                    </div>

                    <div className={`p-4 sm:p-6 divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        <ShortcutItem keys={['Esc']} description={translate('scClose')} darkMode={darkMode} />
                        <ShortcutItem keys={['←', '→']} description={translate('scNav')} darkMode={darkMode} />
                        <ShortcutItem keys={['+']} description={translate('scZoomIn')} darkMode={darkMode} />
                        <ShortcutItem keys={['-']} description={translate('scZoomOut')} darkMode={darkMode} />
                        <ShortcutItem keys={['0']} description={translate('scReset')} darkMode={darkMode} />
                    </div>
                </div>

                {/* FAQ */}
                <div className={`rounded-xl border shadow-sm overflow-hidden mb-6 ${cardClass}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b flex items-center gap-2 ${headerBgClass}`}>
                        <MessageCircle className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <h2 className={`font-semibold text-sm sm:text-base ${textClass}`}>{translate('faqTitle')}</h2>
                    </div>

                    <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                        <details className="group">
                            <summary className={`px-4 sm:px-6 py-4 cursor-pointer transition-colors list-none flex items-center justify-between ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                <span className={`font-medium text-sm ${textClass}`}>{translate('faq1Q')}</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className={`px-4 sm:px-6 pb-4 text-sm ${subtextClass}`}>
                                {translate('faq1A')}
                            </div>
                        </details>

                        <details className="group">
                            <summary className={`px-4 sm:px-6 py-4 cursor-pointer transition-colors list-none flex items-center justify-between ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                <span className={`font-medium text-sm ${textClass}`}>{translate('faq2Q')}</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className={`px-4 sm:px-6 pb-4 text-sm ${subtextClass}`}>
                                {translate('faq2A')}
                            </div>
                        </details>

                        <details className="group">
                            <summary className={`px-4 sm:px-6 py-4 cursor-pointer transition-colors list-none flex items-center justify-between ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                <span className={`font-medium text-sm ${textClass}`}>{translate('faq3Q')}</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className={`px-4 sm:px-6 pb-4 text-sm ${subtextClass}`}>
                                {translate('faq3A')}
                            </div>
                        </details>
                    </div>
                </div>

                {/* Support Contact */}
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-xl p-5 sm:p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#FF4D00] rounded-lg">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg">{translate('needHelp')}</h3>
                    </div>
                    <p className="text-white/70 text-sm mb-4">
                        {translate('contactSupport')}
                    </p>
                    <a
                        href="mailto:suporte@eletromidia.com.br"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        suporte@eletromidia.com.br
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AjudaPage;
