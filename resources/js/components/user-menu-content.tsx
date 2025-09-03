import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { SharedData, type User } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { AppWindow, LogOut, Settings, UserIcon } from 'lucide-react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
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
                            Profil
                        </Link>
                    </DropdownMenuItem>
                )}
                {(isAdmin || isAffiliate || isMentor) && (
                    <DropdownMenuItem asChild>
                        <Link className="block w-full hover:cursor-pointer" href={route('home')} as="button" prefetch onClick={cleanup}>
                            <AppWindow className="mr-2" />
                            User Page
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                    <Link className="block w-full hover:cursor-pointer" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Pengaturan
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link className="block w-full hover:cursor-pointer" method="post" href={route('logout')} as="button" onClick={handleLogout}>
                    <LogOut className="mr-2" />
                    Keluar
                </Link>
            </DropdownMenuItem>
        </>
    );
}
