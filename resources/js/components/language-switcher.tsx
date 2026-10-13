import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const LANGUAGES = [
    { code: 'id', label: 'Bahasa Indonesia', shortLabel: 'ID', flag: '🇮🇩' },
    { code: 'en', label: 'English', shortLabel: 'EN', flag: '🇬🇧' },
] as const;

export interface LanguageSwitcherProps {
    variant?: 'segmented' | 'dropdown' | 'compact' | 'footer';
    className?: string;
}

export function LanguageSwitcher({ variant = 'segmented', className }: LanguageSwitcherProps) {
    const { t, i18n } = useTranslation('common');
    const page = usePage<{ locale?: string }>();
    const serverLocale = page.props.locale;

    // Keep i18n in sync with server locale from Inertia shared data
    useEffect(() => {
        if (serverLocale && i18n.language !== serverLocale) {
            i18n.changeLanguage(serverLocale);
        }
    }, [serverLocale, i18n]);

    const currentLang = (i18n.language || serverLocale || 'id').substring(0, 2);
    const activeLanguage = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

    const switchLanguage = (code: string) => {
        if (code === currentLang) return;
        i18n.changeLanguage(code);

        router.post(
            route('locale.switch'),
            { locale: code },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    if (variant === 'segmented') {
        return (
            <div
                className={cn(
                    'inline-flex items-center rounded-full border border-border/70 bg-muted/40 p-0.5 shadow-2xs backdrop-blur-xs transition-colors hover:border-border',
                    className,
                )}
                role="group"
                aria-label={t('language.switch', 'Pilih Bahasa')}
            >
                {LANGUAGES.map((lang) => {
                    const isActive = lang.code === currentLang;
                    return (
                        <button
                            key={lang.code}
                            type="button"
                            onClick={() => switchLanguage(lang.code)}
                            className={cn(
                                'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-200 select-none cursor-pointer',
                                isActive
                                    ? 'bg-background text-foreground font-semibold shadow-xs ring-1 ring-black/5 dark:ring-white/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                            )}
                            title={lang.label}
                            aria-pressed={isActive}
                        >
                            <span className="text-[11px] leading-none">{lang.flag}</span>
                            <span className="text-[11px] font-semibold tracking-tight">{lang.shortLabel}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'h-8 rounded-full border border-border/70 bg-background/80 px-2.5 text-xs font-medium gap-1.5 hover:bg-muted/70 hover:border-border transition-all shadow-2xs text-muted-foreground hover:text-foreground',
                        className,
                    )}
                >
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs leading-none">{activeLanguage.flag}</span>
                    <span className="font-semibold text-xs text-foreground">{activeLanguage.shortLabel}</span>
                    <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl p-1.5 shadow-lg border-border/80">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('language.switch', 'Pilih Bahasa')}
                </div>
                {LANGUAGES.map((lang) => {
                    const isActive = lang.code === currentLang;
                    return (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => switchLanguage(lang.code)}
                            className={cn(
                                'cursor-pointer flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors',
                                isActive ? 'font-semibold bg-accent text-accent-foreground' : 'hover:bg-muted/60',
                            )}
                        >
                            <span className="flex items-center gap-2">
                                <span className="text-sm">{lang.flag}</span>
                                <span>{lang.label}</span>
                            </span>
                            {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
