import AdminLayout from '@/layouts/admin-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import AdminDashboard from './admin-dashboard';
import AffiliateDashboard from './affiliate-dashboard';
import MentorDashboard from './mentor-dashboard';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

export default function Dashboard() {
    const { auth, stats, filters } = usePage<SharedData>().props;
    const user = auth.user;
    const role = auth.role[0];

    const renderDashboardContent = () => {
        switch (role) {
            case 'admin':
                return (
                    <AdminDashboard
                        stats={stats as Parameters<typeof AdminDashboard>[0]['stats']}
                        filters={filters as Parameters<typeof AdminDashboard>[0]['filters']}
                    />
                );
            case 'mentor':
                return (
                    <MentorDashboard
                        stats={stats as Parameters<typeof MentorDashboard>[0]['stats']}
                        filters={filters as Parameters<typeof AdminDashboard>[0]['filters']}
                    />
                );
            case 'affiliate':
                return (
                    <AffiliateDashboard
                        user={user}
                        stats={stats as Parameters<typeof AffiliateDashboard>[0]['stats']}
                        filters={filters as Parameters<typeof AdminDashboard>[0]['filters']}
                    />
                );
            default:
                return <p>Anda tidak memiliki akses ke dashboard ini.</p>;
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Selamat datang, {user.name}!</h1>
                </div>

                {renderDashboardContent()}
            </div>
        </AdminLayout>
    );
}
