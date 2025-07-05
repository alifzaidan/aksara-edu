import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { ReactNode } from 'react';

export function AppSidebarHeader({ 
    breadcrumbs = [], 
    children, 
    hideSidebarTrigger = false,
    courseTitle
}: { 
    breadcrumbs?: BreadcrumbItemType[]; 
    children?: ReactNode;
    hideSidebarTrigger?: boolean;
    courseTitle?: string;
}) {
    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                {!hideSidebarTrigger && <SidebarTrigger className="-ml-1" />}
                {courseTitle ? (
                    <h1 className="text-lg font-semibold text-sidebar-foreground">
                        {courseTitle}
                    </h1>
                ) : (
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                )}
            </div>
            {children}
        </header>
    );
}
