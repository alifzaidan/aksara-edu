import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Album, Award, BookText, BriefcaseBusiness, FileText, Home, MonitorPlay, Presentation, Search, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './language-switcher';
import { SearchCommand } from './search-command';

const serviceItems = [
    {
        titleKey: 'nav.course',
        descKey: 'nav.courseDesc',
        defaultTitle: 'Kelas Online',
        defaultDesc: 'Belajar dengan video pembelajaran terstruktur',
        href: '/course',
        icon: BookText,
    },
    {
        titleKey: 'nav.bootcamp',
        descKey: 'nav.bootcampDesc',
        defaultTitle: 'Bootcamp',
        defaultDesc: 'Program intensif dengan mentor profesional',
        href: '/bootcamp',
        icon: Presentation,
    },
    {
        titleKey: 'nav.webinar',
        descKey: 'nav.webinarDesc',
        defaultTitle: 'Webinar',
        defaultDesc: 'Seminar online dengan berbagai topik up to date',
        href: '/webinar',
        icon: MonitorPlay,
    },
    {
        titleKey: 'nav.private',
        descKey: 'nav.privateDesc',
        defaultTitle: 'Private Class',
        defaultDesc: 'Pendampingan intensif 1-on-1 secara online atau offline',
        href: '/private',
        icon: BookText,
    },
];

const activeItemStyles = 'text-primary bg-primary/10 dark:text-white dark:bg-primary/50';

interface AppHeaderProps {
    breadcrumbs?: BreadcrumbItem[];
}

function ListItem({
    title,
    children,
    href,
    icon: IconComponent,
}: {
    title: string;
    children: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
}) {
    const page = usePage<SharedData>();
    const isActive = page.url.startsWith(href);

    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    href={href}
                    className={cn(
                        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline outline-hidden transition-colors select-none',
                        isActive && 'bg-primary/10 text-primary',
                    )}
                >
                    <div className="flex items-center gap-2">
                        {IconComponent && <Icon iconNode={IconComponent} className="h-4 w-4" />}
                        <div className="text-sm leading-none font-medium">{title}</div>
                    </div>
                    <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">{children}</p>
                </Link>
            </NavigationMenuLink>
        </li>
    );
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
    const { t } = useTranslation('common');
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();
    const [searchOpen, setSearchOpen] = useState(false);
    const [servicesOpen, setServicesOpen] = useState(false);

    const isServicesActive = serviceItems.some((item) => page.url.startsWith(item.href)) || page.url.startsWith('/bundle');

    const isHomepage = page.url === '/' || page.url === '';

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setSearchOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    return (
        <>
            <div className="border-sidebar-border/80 bg-background fixed top-0 right-0 left-0 z-40 border-b shadow-xs">
                <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
                    <Link href="/" prefetch className="flex items-center space-x-2">
                        <img src="/assets/images/logo-primary.png" alt="Aksademy" className="block w-32 fill-current dark:hidden" />
                        <img src="/assets/images/logo-secondary.png" alt="Aksademy" className="hidden w-32 fill-current dark:block" />
                    </Link>

                    <div className="ml-6 hidden h-full items-center space-x-6 lg:flex">
                        <NavigationMenu className="flex h-full items-stretch">
                            <NavigationMenuList className="flex h-full items-stretch space-x-2">
                                {/* Beranda */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                        <Link
                                            href="/"
                                            className={cn(
                                                'hover:bg-primary/5 dark:hover:bg-primary/40 h-9 cursor-pointer px-3',
                                                isHomepage && activeItemStyles,
                                            )}
                                        >
                                            <Home className="mr-2 h-4 w-4" />
                                            {t('nav.home', 'Beranda')}
                                        </Link>
                                    </NavigationMenuLink>
                                    {isHomepage && (
                                        <div className="bg-primary absolute bottom-0 left-0 h-0.5 w-full translate-y-px dark:bg-white"></div>
                                    )}
                                </NavigationMenuItem>

                                {/* Layanan Mega Menu */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuTrigger
                                        className={cn('hover:bg-primary/5 dark:hover:bg-primary/40 h-9 px-3', isServicesActive && activeItemStyles)}
                                    >
                                        {t('nav.programsAndServices', 'Program & Layanan')}
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <ul className="grid w-[600px] gap-3 p-4 md:grid-cols-[.75fr_1fr]">
                                            {/* Row Span - Bundling */}
                                            <li className="row-span-4">
                                                <NavigationMenuLink asChild>
                                                    <Link
                                                        href="/bundle"
                                                        className={cn(
                                                            'from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-hidden transition-all duration-200 select-none hover:shadow-md',
                                                            page.url.startsWith('/bundle') && 'ring-primary ring-2',
                                                        )}
                                                    >
                                                        <Icon iconNode={Album} className="text-primary mb-2 h-8 w-8" />
                                                        <div className="mb-2 text-lg font-medium">{t('nav.bundling', 'Paket Bundling')}</div>
                                                        <p className="text-muted-foreground text-sm leading-tight">
                                                            {t('nav.bundlingDesc', 'Hemat lebih banyak dengan paket bundling berbagai produk edukasi kami')}
                                                        </p>
                                                    </Link>
                                                </NavigationMenuLink>
                                            </li>

                                            {/* 3 Produk Utama */}
                                            <ListItem href="/course" title={t('nav.course', 'Kelas Online')} icon={BookText}>
                                                {t('nav.courseDesc', 'Belajar dengan video pembelajaran terstruktur dan materi lengkap')}
                                            </ListItem>
                                            <ListItem href="/bootcamp" title={t('nav.bootcamp', 'Bootcamp')} icon={Presentation}>
                                                {t('nav.bootcampDesc', 'Program intensif dengan mentor profesional dan project-based learning')}
                                            </ListItem>
                                            <ListItem href="/webinar" title={t('nav.webinar', 'Webinar')} icon={MonitorPlay}>
                                                {t('nav.webinarDesc', 'Seminar online dengan topik terkini dan expert speaker')}
                                            </ListItem>
                                            <ListItem href="/private" title={t('nav.private', 'Private Class')} icon={BookText}>
                                                {t('nav.privateDesc', 'Pendampingan 1-on-1 dengan mentor untuk kebutuhan belajar yang lebih personal')}
                                            </ListItem>
                                        </ul>
                                    </NavigationMenuContent>
                                    {isServicesActive && (
                                        <div className="bg-primary absolute bottom-0 left-0 h-0.5 w-full translate-y-px dark:bg-white"></div>
                                    )}
                                </NavigationMenuItem>

                                {/* Sertifikasi */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                        <Link
                                            href="/certification-programs"
                                            className={cn(
                                                'hover:bg-primary/5 dark:hover:bg-primary/40 h-9 cursor-pointer px-3',
                                                page.url.startsWith('/certification-programs') && activeItemStyles,
                                            )}
                                        >
                                            <BriefcaseBusiness className="mr-2 h-4 w-4" />
                                            {t('nav.certification', 'Sertifikasi')}
                                        </Link>
                                    </NavigationMenuLink>
                                    {page.url.startsWith('/certification-programs') && (
                                        <div className="bg-primary absolute bottom-0 left-0 h-0.5 w-full translate-y-px dark:bg-white"></div>
                                    )}
                                </NavigationMenuItem>

                                {/* Artikel */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                        <Link
                                            href="/article"
                                            className={cn(
                                                'hover:bg-primary/5 dark:hover:bg-primary/40 h-9 cursor-pointer px-3',
                                                page.url.startsWith('/article') && activeItemStyles,
                                            )}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            {t('nav.articles', 'Artikel')}
                                        </Link>
                                    </NavigationMenuLink>
                                    {page.url.startsWith('/article') && (
                                        <div className="bg-primary absolute bottom-0 left-0 h-0.5 w-full translate-y-px dark:bg-white"></div>
                                    )}
                                </NavigationMenuItem>

                                {/* Cek Sertifikat */}
                                <NavigationMenuItem className="relative flex h-full items-center">
                                    <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                        <Link
                                            href="/check-certificate"
                                            className={cn(
                                                'hover:bg-primary/5 dark:hover:bg-primary/40 h-9 cursor-pointer px-3',
                                                page.url.startsWith('/check-certificate') && activeItemStyles,
                                            )}
                                        >
                                            <Award className="mr-2 h-4 w-4" />
                                            {t('nav.checkCertificate', 'Cek Sertifikat')}
                                        </Link>
                                    </NavigationMenuLink>
                                    {page.url.startsWith('/check-certificate') && (
                                        <div className="bg-primary absolute bottom-0 left-0 h-0.5 w-full translate-y-px dark:bg-white"></div>
                                    )}
                                </NavigationMenuItem>

                                {/* Profil Saya (if logged in) */}
                                {auth.user && (
                                    <NavigationMenuItem className="relative flex h-full items-center">
                                        <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                                            <Link
                                                href="/profile"
                                                className={cn(
                                                    'hover:bg-primary/5 dark:hover:bg-primary/40 h-9 cursor-pointer px-3',
                                                    page.url.startsWith('/profile') && activeItemStyles,
                                                )}
                                            >
                                                {t('nav.myProfile', 'Profil Saya')}
                                            </Link>
                                        </NavigationMenuLink>
                                        {page.url.startsWith('/profile') && (
                                            <div className="bg-primary absolute bottom-0 left-0 h-0.5 w-full translate-y-px dark:bg-white"></div>
                                        )}
                                    </NavigationMenuItem>
                                )}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        {/* Search Button (Responsive width) */}
                        <Button
                            variant="outline"
                            onClick={() => setSearchOpen(true)}
                            className="h-9 px-2.5 sm:px-3 text-xs gap-2 text-muted-foreground hover:text-foreground border-border/80"
                        >
                            <Search className="h-4 w-4 opacity-80" />
                            <span className="hidden xl:inline">{t('actions.searchProducts', 'Cari Produk...')}</span>
                            <span className="hidden lg:inline xl:hidden">{t('actions.search', 'Cari...')}</span>
                            <div className="hidden xl:flex items-center gap-1">
                                <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-4 items-center gap-0.5 rounded border px-1 font-mono text-[9px] font-medium opacity-100 select-none">
                                    <span className="text-[10px]">⌘</span>K
                                </kbd>
                            </div>
                        </Button>

                        {/* Language Switcher */}
                        <LanguageSwitcher variant="segmented" />

                        {auth.user ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="size-9 rounded-full p-0.5">
                                        <Avatar className="size-8 overflow-hidden rounded-full ring-1 ring-border/80">
                                            <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                            <AvatarFallback className="bg-primary text-primary-foreground rounded-lg dark:bg-neutral-700 dark:text-white">
                                                {getInitials(auth.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <Button variant="outline" size="sm" asChild className="h-9 px-3 text-xs font-medium">
                                    <Link href={route('login')}>{t('nav.login', 'Masuk')}</Link>
                                </Button>
                                <Button variant="default" size="sm" asChild className="hidden sm:inline-flex h-9 px-3.5 text-xs font-medium">
                                    <Link href={route('register')}>{t('nav.register', 'Daftar')}</Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Dock */}
            <div className="fixed right-0 bottom-0 left-0 z-50 lg:hidden">
                <div className="bg-background/95 border-border border-t pb-2 shadow-lg backdrop-blur-md">
                    <div className={`grid gap-1 px-2 py-2 ${auth.user ? 'grid-cols-4' : 'grid-cols-3'}`}>
                        <Link
                            href="/"
                            className={cn(
                                'flex flex-col items-center justify-center rounded-lg px-2 py-3 transition-colors duration-200',
                                page.url === '/' ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                            )}
                        >
                            <Home className="mb-1 h-5 w-6" />
                            <span className="text-center text-xs leading-none font-medium">{t('nav.home', 'Beranda')}</span>
                        </Link>

                        <Popover open={servicesOpen} onOpenChange={setServicesOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    className={cn(
                                        'flex flex-col items-center justify-center rounded-lg px-2 py-3 transition-colors duration-200',
                                        isServicesActive
                                            ? 'text-primary bg-primary/10'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                                    )}
                                >
                                    <Album className="mb-1 h-5 w-6" />
                                    <span className="text-center text-xs leading-none font-medium">{t('nav.services', 'Layanan')}</span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" align="center" className="mb-2 w-80 p-3" sideOffset={8}>
                                <div className="space-y-1">
                                    <h4 className="mb-3 px-2 text-sm font-semibold">{t('nav.ourServices', 'Layanan Kami')}</h4>
                                    {serviceItems.map((service) => {
                                        const isActive = page.url.startsWith(service.href);
                                        return (
                                            <Link
                                                key={service.href}
                                                href={service.href}
                                                onClick={() => setServicesOpen(false)}
                                                className={cn(
                                                    'flex items-start gap-3 rounded-lg p-3 transition-colors duration-200',
                                                    isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 hover:text-foreground',
                                                )}
                                            >
                                                <Icon
                                                    iconNode={service.icon}
                                                    className={cn(
                                                        'mt-0.5 h-5 w-5 flex-shrink-0',
                                                        isActive ? 'text-primary' : 'text-muted-foreground',
                                                    )}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="mb-1 text-sm leading-none font-medium">{t(service.titleKey, service.defaultTitle)}</p>
                                                    <p className="text-muted-foreground line-clamp-2 text-xs">{t(service.descKey, service.defaultDesc)}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                    {/* Bundling di Mobile */}
                                    <Link
                                        href="/bundle"
                                        onClick={() => setServicesOpen(false)}
                                        className={cn(
                                            'flex items-start gap-3 rounded-lg p-3 transition-colors duration-200',
                                            page.url.startsWith('/bundle') ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50 hover:text-foreground',
                                        )}
                                    >
                                        <Icon
                                            iconNode={Album}
                                            className={cn(
                                                'mt-0.5 h-5 w-5 flex-shrink-0',
                                                page.url.startsWith('/bundle') ? 'text-primary' : 'text-muted-foreground',
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-1 text-sm leading-none font-medium">{t('nav.bundling', 'Paket Bundling')}</p>
                                            <p className="text-muted-foreground line-clamp-2 text-xs">
                                                {t('nav.bundlingDesc', 'Paket bundling dengan berbagai produk edukasi')}
                                            </p>
                                        </div>
                                    </Link>
                                    {/* Sertifikasi di Mobile */}
                                    <Link
                                        href="/certification-programs"
                                        onClick={() => setServicesOpen(false)}
                                        className={cn(
                                            'flex items-start gap-3 rounded-lg p-3 transition-colors duration-200',
                                            page.url.startsWith('/certification-programs')
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-muted/50 hover:text-foreground',
                                        )}
                                    >
                                        <Icon
                                            iconNode={BriefcaseBusiness}
                                            className={cn(
                                                'mt-0.5 h-5 w-5 flex-shrink-0',
                                                page.url.startsWith('/certification-programs') ? 'text-primary' : 'text-muted-foreground',
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-1 text-sm leading-none font-medium">{t('nav.certification', 'Sertifikasi')}</p>
                                            <p className="text-muted-foreground line-clamp-2 text-xs">
                                                {t('nav.certificationDesc', 'Tingkatkan kredibilitas dengan sertifikasi profesional')}
                                            </p>
                                        </div>
                                    </Link>

                                    {/* Cek Sertifikat di Mobile */}
                                    <Link
                                        href="/check-certificate"
                                        onClick={() => setServicesOpen(false)}
                                        className={cn(
                                            'flex items-start gap-3 rounded-lg p-3 transition-colors duration-200',
                                            page.url.startsWith('/check-certificate')
                                                ? 'bg-primary/10 text-primary'
                                                : 'hover:bg-muted/50 hover:text-foreground',
                                        )}
                                    >
                                        <Icon
                                            iconNode={Award}
                                            className={cn(
                                                'mt-0.5 h-5 w-5 flex-shrink-0',
                                                page.url.startsWith('/check-certificate') ? 'text-primary' : 'text-muted-foreground',
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-1 text-sm leading-none font-medium">{t('nav.checkCertificate', 'Cek Sertifikat')}</p>
                                            <p className="text-muted-foreground line-clamp-2 text-xs">
                                                {t('nav.checkCertificateDesc', 'Lihat sertifikat Anda dengan email dan nomor WA')}
                                            </p>
                                        </div>
                                    </Link>
                                </div>
                            </PopoverContent>
                        </Popover>

                        <Link
                            href="/article"
                            className={cn(
                                'flex flex-col items-center justify-center rounded-lg px-2 py-3 transition-colors duration-200',
                                page.url.startsWith('/article')
                                    ? 'text-primary bg-primary/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                            )}
                        >
                            <FileText className="mb-1 h-5 w-6" />
                            <span className="text-center text-xs leading-none font-medium">{t('nav.articles', 'Artikel')}</span>
                        </Link>

                        {auth.user && (
                            <Link
                                href="/profile"
                                className={cn(
                                    'flex flex-col items-center justify-center rounded-lg px-2 py-3 transition-colors duration-200',
                                    page.url.startsWith('/profile')
                                        ? 'text-primary bg-primary/10'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                                )}
                            >
                                <User className="mb-1 h-5 w-6" />
                                <span className="text-center text-xs leading-none font-medium">{t('nav.profile', 'Profil')}</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

            {breadcrumbs.length > 1 && (
                <div className="border-sidebar-border/70 flex w-full border-b">
                    <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>
            )}
        </>
    );
}
