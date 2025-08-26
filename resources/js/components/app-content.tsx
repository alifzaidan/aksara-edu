import { SidebarInset } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid } from 'lucide-react';
import * as React from 'react';
import { Button } from './ui/button';

interface AppContentProps extends React.ComponentProps<'main'> {
    variant?: 'header' | 'sidebar';
}

export function AppContent({ variant = 'header', children, ...props }: AppContentProps) {
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.role.includes('admin');

    if (variant === 'sidebar') {
        return (
            <SidebarInset className="flex-1 overflow-x-hidden" {...props}>
                {children}
            </SidebarInset>
        );
    }

    return (
        <main className={`${isAdmin ? 'pt-34' : 'pt-18'} mx-auto flex h-full w-full flex-1 flex-col gap-4 overflow-x-hidden`} {...props}>
            {isAdmin && (
                <div className="bg-secondary fixed top-16 right-0 left-0 z-40">
                    <div className="flex max-w-7xl items-center justify-between gap-4 px-4 py-2 md:mx-auto">
                        <div>
                            <h2 className="font-semibold text-white md:text-lg">Anda Login Sebagai Admin</h2>
                            <p className="text-muted text-xs md:text-sm">Kelola pengaturan aplikasi dan peran pengguna Anda pada Panel Admin.</p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={route('dashboard')}>
                                <LayoutGrid />
                                Buka Panel Admin
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
            {children}
        </main>
    );
}
