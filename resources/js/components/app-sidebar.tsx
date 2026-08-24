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

const allNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
        roles: ['admin', 'mentor', 'affiliate', 'staff'],
    },
    {
        title: 'Manajemen Pengguna',
        href: '#',
        icon: Users,
        roles: ['admin', 'staff'],
        items: [
            {
                title: 'Pengguna',
                href: '/admin/users',
                roles: ['admin', 'staff'],
                permissionKey: 'users',
            },
            {
                title: 'Afiliasi',
                href: '/admin/affiliates',
                roles: ['admin', 'staff'],
                permissionKey: 'affiliates',
            },
            {
                title: 'Mentor',
                href: '/admin/mentors',
                roles: ['admin', 'staff'],
                permissionKey: 'mentors',
            },
            {
                title: 'Staff',
                href: '/admin/staff',
                roles: ['admin'],
            },
        ],
    },
    {
        title: 'Program Pelatihan',
        href: '#',
        icon: BookText,
        roles: ['admin', 'mentor', 'affiliate', 'staff'],
        items: [
            {
                title: 'Kelas Online',
                href: '/admin/courses',
                roles: ['admin', 'mentor', 'affiliate', 'staff'],
                permissionKey: 'courses',
            },
            {
                title: 'Bootcamp',
                href: '/admin/bootcamps',
                roles: ['admin', 'affiliate', 'staff'],
                permissionKey: 'bootcamps',
            },
            {
                title: 'Webinar',
                href: '/admin/webinars',
                roles: ['admin', 'affiliate', 'staff'],
                permissionKey: 'webinars',
            },
            {
                title: 'Sertifikasi Program',
                href: '/admin/certification-programs',
                roles: ['admin', 'affiliate', 'staff'],
                permissionKey: 'certification-programs',
            },
            {
                title: 'Private Class',
                href: '/admin/privates',
                roles: ['admin', 'affiliate', 'staff'],
                permissionKey: 'privates',
            },
        ],
    },
    {
        title: 'Data Master',
        href: '#',
        icon: List,
        roles: ['admin', 'mentor', 'staff'],
        items: [
            {
                title: 'Kategori',
                href: '/admin/categories',
                roles: ['admin', 'mentor', 'staff'],
                permissionKey: 'categories',
            },
            {
                title: 'Tools',
                href: '/admin/tools',
                roles: ['admin', 'mentor', 'staff'],
                permissionKey: 'tools',
            },
            {
                title: 'Sertifikat',
                href: '/admin/certificates',
                roles: ['admin', 'staff'],
                permissionKey: 'certificates',
                activeUrls: ['/admin/certificates', '/admin/certificate-designs', '/admin/certificate-signs'],
            },
        ],
    },
    {
        title: 'Promosi & Marketing',
        href: '#',
        icon: Megaphone,
        roles: ['admin', 'staff'],
        items: [
            {
                title: 'Kode Diskon',
                href: '/admin/discount-codes',
                roles: ['admin', 'staff'],
                permissionKey: 'discount-codes',
            },
            {
                title: 'Flyer Promosi',
                href: '/admin/promotions',
                roles: ['admin', 'staff'],
                permissionKey: 'promotions',
            },
            {
                title: 'Banner Carousel',
                href: '/admin/carousels',
                roles: ['admin', 'staff'],
                permissionKey: 'carousels',
            },
            {
                title: 'Broadcast',
                href: '/admin/broadcasts',
                roles: ['admin', 'staff'],
                permissionKey: 'broadcasts',
            },
        ],
    },
    {
        title: 'Paket Bundling',
        href: '/admin/bundles',
        icon: Gift,
        roles: ['admin', 'affiliate', 'staff'],
        permissionKey: 'bundles',
    },
    {
        title: 'Referral & Poin',
        href: '#',
        icon: Gift,
        roles: ['admin', 'staff'],
        items: [
            {
                title: 'Pengaturan',
                href: '/admin/referral/settings',
                roles: ['admin', 'staff'],
                permissionKey: 'referral',
            },
            {
                title: 'Laporan Performa',
                href: '/admin/referral/report',
                roles: ['admin', 'staff'],
                permissionKey: 'referral',
            },
            {
                title: 'Riwayat Transaksi',
                href: '/admin/referral/transactions',
                roles: ['admin', 'staff'],
                permissionKey: 'referral',
            },
        ],
    },
    {
        title: 'Transaksi',
        href: '/admin/transactions',
        icon: DollarSign,
        roles: ['admin', 'staff'],
        permissionKey: 'transactions',
    },
    {
        title: 'Artikel',
        href: '/admin/articles',
        icon: FileText,
        roles: ['admin', 'mentor', 'staff'],
        permissionKey: 'articles',
    },
    {
        title: 'Pendapatan',
        href: '/admin/affiliate-earnings',
        icon: DollarSign,
        roles: ['affiliate', 'mentor', 'admin', 'staff'],
        permissionKey: 'earnings',
    },
];

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role?.[0];
    const permissions = auth.permissions || [];

    const hasPermission = (permissionKey?: string) => {
        if (!permissionKey) return false;
        return permissions.includes(`${permissionKey}.view`) || permissions.includes(`${permissionKey}.manage`);
    };

    const isItemAllowed = (item: NavItem) => {
        if (role === 'admin') {
            return item.roles?.includes('admin') ?? true;
        }
        if (role === 'staff') {
            if (item.roles?.includes('staff')) {
                if (item.permissionKey) {
                    return hasPermission(item.permissionKey);
                }
                return true;
            }
            return false;
        }
        return item.roles?.includes(role) ?? false;
    };

    const mainNavItems = allNavItems
        .filter((item) => isItemAllowed(item))
        .map((item) => {
            if (item.items) {
                const filteredSubItems = item.items.filter((subItem) => {
                    if (role === 'admin') {
                        return subItem.roles?.includes('admin') ?? true;
                    }
                    if (role === 'staff') {
                        if (subItem.roles?.includes('staff')) {
                            if (subItem.permissionKey) {
                                return hasPermission(subItem.permissionKey);
                            }
                            return true;
                        }
                        return false;
                    }
                    return subItem.roles?.includes(role) ?? false;
                });
                return {
                    ...item,
                    items: filteredSubItems,
                };
            }
            return item;
        })
        .filter((item) => {
            if (item.items !== undefined) {
                return item.items.length > 0;
            }
            return true;
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
