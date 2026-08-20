import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { SharedData, type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    Banknote,
    BookText,
    BriefcaseBusiness,
    Dock,
    DollarSign,
    FileText,
    Gift,
    LayoutGrid,
    List,
    Megaphone,
    MonitorPlay,
    Presentation,
    Proportions,

    SquareMousePointer,
    User,
    UserCheck,
    Users,
} from 'lucide-react';

const allNavItems: (NavItem & { roles: string[] })[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
        roles: ['admin', 'mentor', 'affiliate'],
    },
    {
        title: 'Manajemen Pengguna',
        href: '#',
        icon: Users,
        roles: ['admin'],
        items: [
            {
                title: 'Pengguna',
                href: '/admin/users',
                roles: ['admin'],
            } as any,
            {
                title: 'Afiliasi',
                href: '/admin/affiliates',
                roles: ['admin'],
            } as any,
            {
                title: 'Mentor',
                href: '/admin/mentors',
                roles: ['admin'],
            } as any,
        ],
    },
    {
        title: 'Program Pelatihan',
        href: '#',
        icon: BookText,
        roles: ['admin', 'mentor', 'affiliate'],
        items: [
            {
                title: 'Kelas Online',
                href: '/admin/courses',
                roles: ['admin', 'mentor', 'affiliate'],
            } as any,
            {
                title: 'Bootcamp',
                href: '/admin/bootcamps',
                roles: ['admin', 'affiliate'],
            } as any,
            {
                title: 'Webinar',
                href: '/admin/webinars',
                roles: ['admin', 'affiliate'],
            } as any,
            {
                title: 'Sertifikasi Program',
                href: '/admin/certification-programs',
                roles: ['admin', 'affiliate'],
            } as any,
            {
                title: 'Private Class',
                href: '/admin/privates',
                roles: ['admin', 'affiliate'],
            } as any,
        ],
    },
    {
        title: 'Data Master',
        href: '#',
        icon: List,
        roles: ['admin', 'mentor'],
        items: [
            {
                title: 'Kategori',
                href: '/admin/categories',
                roles: ['admin', 'mentor'],
            } as any,
            {
                title: 'Tools',
                href: '/admin/tools',
                roles: ['admin', 'mentor'],
            } as any,
            {
                title: 'Sertifikat',
                href: '/admin/certificates',
                roles: ['admin'],
                activeUrls: ['/admin/certificates', '/admin/certificate-designs', '/admin/certificate-signs'],
            } as any,
        ],
    },
    {
        title: 'Promosi & Marketing',
        href: '#',
        icon: Megaphone,
        roles: ['admin'],
        items: [
            {
                title: 'Kode Diskon',
                href: '/admin/discount-codes',
                roles: ['admin'],
            } as any,
            {
                title: 'Flyer Promosi',
                href: '/admin/promotions',
                roles: ['admin'],
            } as any,
            {
                title: 'Banner Carousel',
                href: '/admin/carousels',
                roles: ['admin'],
            } as any,
            {
                title: 'Broadcast',
                href: '/admin/broadcasts',
                roles: ['admin'],
            } as any,
        ],
    },
    {
        title: 'Paket Bundling',
        href: '/admin/bundles',
        icon: Gift,
        roles: ['admin', 'affiliate'],
    },
    {
        title: 'Referral & Poin',
        href: '#',
        icon: Gift,
        roles: ['admin'],
        items: [
            {
                title: 'Pengaturan',
                href: '/admin/referral/settings',
                roles: ['admin'],
            } as any,
            {
                title: 'Laporan Performa',
                href: '/admin/referral/report',
                roles: ['admin'],
            } as any,
            {
                title: 'Riwayat Transaksi',
                href: '/admin/referral/transactions',
                roles: ['admin'],
            } as any,
        ],
    },
    {
        title: 'Transaksi',
        href: '/admin/transactions',
        icon: DollarSign,
        roles: ['admin'],
    },
    {
        title: 'Artikel',
        href: '/admin/articles',
        icon: FileText,
        roles: ['admin', 'mentor'],
    },
    {
        title: 'Pendapatan',
        href: '/admin/affiliate-earnings',
        icon: DollarSign,
        roles: ['affiliate', 'mentor'],
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];

    const mainNavItems = allNavItems
        .filter((item) => item.roles.includes(role))
        .map((item) => {
            if (item.items) {
                return {
                    ...item,
                    items: (item.items as (NavItem & { roles: string[] })[]).filter((subItem) => subItem.roles?.includes(role) ?? true),
                };
            }
            return item;
        });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/dashboard" prefetch>
                                {/* Logo untuk light mode */}
                                <img src="/assets/images/logo-primary.png" alt="Aksademy" className="block w-32 fill-current dark:hidden" />
                                {/* Logo untuk dark mode */}
                                <img src="/assets/images/logo-secondary.png" alt="Aksademy" className="hidden w-32 fill-current dark:block" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
