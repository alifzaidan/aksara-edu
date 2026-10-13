import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { SharedData, type User } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { AppWindow, Globe, LogOut, Settings, UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const { t } = useTranslation('common');
    const cleanup = useMobileNavigation();

    const handleLogout = () => {
        cleanup();
        router.flushAll();
    };

    const { auth } = usePage<SharedData>().props;
    const isUser = auth.role.includes('user');
    const isAdmin = auth.role.includes('admin');
    const isAffiliate = auth.role.includes('affiliate');
    const isMentor = auth.role.includes('mentor');

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                {isUser && (
                    <DropdownMenuItem asChild>
                        <Link className="block w-full hover:cursor-pointer" href={route('profile.index')} as="button" prefetch onClick={cleanup}>
                            <UserIcon className="mr-2" />
                            {t('nav.profile', 'Profil')}
                        </Link>
                    </DropdownMenuItem>
                )}
                {(isAdmin || isAffiliate || isMentor) && (
                    <DropdownMenuItem asChild>
                        <Link className="block w-full hover:cursor-pointer" href={route('home')} as="button" prefetch onClick={cleanup}>
                            <AppWindow className="mr-2" />
                            {t('nav.userPage', 'User Page')}
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link className="block w-full hover:cursor-pointer" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        {t('nav.settings', 'Pengaturan')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{t('language.switch', 'Bahasa')}</span>
                </span>
                <LanguageSwitcher variant="segmented" className="scale-90 origin-right" />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full hover:cursor-pointer" method="post" href={route('logout')} as="button" onClick={handleLogout}>
                    <LogOut className="mr-2" />
                    {t('nav.logout', 'Keluar')}
                </Link>
            </DropdownMenuItem>
        </>
    );
}
