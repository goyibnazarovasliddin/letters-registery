import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Lang, dictionaries } from '../i18n/translations';

interface LanguageContextType {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'app_lang';

function detectInitial(): Lang {
    if (typeof window === 'undefined') return 'uz';
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && ['uz', 'en', 'ru'].includes(stored)) return stored;
    return 'uz';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>(() => detectInitial());

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const setLang = useCallback((l: Lang) => setLangState(l), []);

    const t = useCallback(
        (key: string) => dictionaries[lang][key] ?? dictionaries.uz[key] ?? key,
        [lang]
    );

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useT() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useT must be used within LanguageProvider');
    return ctx;
}
