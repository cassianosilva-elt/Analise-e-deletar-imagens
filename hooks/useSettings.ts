import { useState, useEffect, useCallback } from 'react';
import { Language, translations, TranslationKey } from '../translations';

const LANGUAGE_STORAGE_KEY = 'eletromidia-language';
const DARK_MODE_STORAGE_KEY = 'eletromidia-dark-mode';

export const useSettings = () => {
    // Language state
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return (saved as Language) || 'pt';
    });

    // Dark mode state
    const [darkMode, setDarkModeState] = useState<boolean>(() => {
        const saved = localStorage.getItem(DARK_MODE_STORAGE_KEY);
        return saved === 'true';
    });

    // Translation function
    const t = useCallback((key: TranslationKey): string => {
        return translations[language][key] || key;
    }, [language]);

    // Language setter with persistence
    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }, []);

    // Dark mode setter with persistence
    const setDarkMode = useCallback((enabled: boolean) => {
        setDarkModeState(enabled);
        localStorage.setItem(DARK_MODE_STORAGE_KEY, String(enabled));
    }, []);

    // Apply dark mode class to document
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    return {
        language,
        setLanguage,
        darkMode,
        setDarkMode,
        t
    };
};

export type UseSettingsReturn = ReturnType<typeof useSettings>;
