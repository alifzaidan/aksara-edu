import { Toaster } from '@/components/ui/sonner';
import UserLayoutTemplate from '@/layouts/app/app-header-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface UserLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: UserLayoutProps) => (
    <UserLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <Toaster position="top-center" richColors />
    </UserLayoutTemplate>
);
