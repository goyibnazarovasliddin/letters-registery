import React from 'react';
import { Globe, Check } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useT } from '../contexts/LanguageContext';
import { LANGS, Lang } from '../i18n/translations';
import { cn } from './ui/utils';

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
    const { lang, setLang } = useT();
    const current = LANGS.find(l => l.code === lang);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'gap-1.5 font-medium transition-all hover:bg-gray-100 dark:hover:bg-gray-800',
                        compact ? 'h-8 px-2' : 'h-9 px-3'
                    )}
                >
                    <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm">{current?.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
                {LANGS.map(l => (
                    <DropdownMenuItem
                        key={l.code}
                        onClick={() => setLang(l.code as Lang)}
                        className="flex items-center justify-between gap-3"
                    >
                        <span className="font-medium">{l.label}</span>
                        {l.code === lang && <Check className="w-4 h-4 text-green-600" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
