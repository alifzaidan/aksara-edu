import { Toaster } from '@/components/ui/sonner';
import AdminLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AdminLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AdminLayoutProps) => (
    <AdminLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <Toaster position="top-center" richColors />
    </AdminLayoutTemplate>
);
