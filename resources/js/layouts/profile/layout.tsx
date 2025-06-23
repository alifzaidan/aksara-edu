import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Banknote, BookText, LayoutDashboard, MonitorPlay, Presentation, Settings } from 'lucide-react';
import { type PropsWithChildren } from 'react';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/profile/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Kelas Online',
        href: '/profile/my-courses',
        icon: BookText,
    },
    {
        title: 'Bootcamp',
        href: '/profile/my-bootcamps',
        icon: Presentation,
    },
    {
        title: 'Webinar',
        href: '/profile/my-webinars',
        icon: MonitorPlay,
    },
    {
        title: 'Transaksi',
        href: '/profile/transactions',
        icon: Banknote,
    },
    {
        title: 'Pengaturan Akun',
        href: '/settings/profile',
        icon: Settings,
    },
];

export default function ProfileLayout({ children }: PropsWithChildren) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const getInitials = useInitials();

    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    return (
        <div className="px-4 py-6">
            <div className="mx-auto w-full max-w-7xl sm:px-4">
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-8">
                    <aside className="w-full rounded-xl border p-2 lg:w-52 lg:max-w-xl">
                        <div className="mb-4 p-2 text-center">
                            <Avatar className="mx-auto mb-2 size-16 overflow-hidden rounded-full">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-2xl dark:bg-neutral-700 dark:text-white">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <h1 className="text-xl font-bold italic">{auth.user.name}</h1>
                            <p className="text-muted-foreground text-sm">Lifetime Learner</p>
                        </div>
                        <nav className="flex flex-col space-y-1 space-x-0">
                            {sidebarNavItems.map((item, index) => (
                                <Button
                                    key={`${item.href}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn('w-full justify-start', {
                                        'bg-muted': currentPath === item.href,
                                    })}
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />} {item.title}
                                    </Link>
                                </Button>
                            ))}
                        </nav>
                    </aside>

                    <div className="max-w-4xl flex-1 xl:max-w-5xl">{children}</div>
                </div>
            </div>
        </div>
    );
}
