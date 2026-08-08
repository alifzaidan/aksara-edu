import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Users, BarChart3 } from 'lucide-react';
import { columns, Referrer } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Referral & Poin',
        href: '#',
    },
    {
        title: 'Laporan Performa',
        href: '/admin/referral/report',
    },
];

interface ReportProps {
    referrers: {
        data: Referrer[];
        current_page: number;
        last_page: number;
        total: number;
        links: any[];
    };
}

export default function ReferralReport({ referrers }: ReportProps) {
    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Laporan Performa Referral" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 space-y-1">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-foreground" />
                        Laporan Performa Referral
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Analisis data kontribusi perujuk dan jumlah transaksi rujukan sukses.
                    </p>
                </div>

                <div className="grid gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/10 shadow-sm border-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Akun Perujuk Aktif</CardTitle>
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{referrers.total} <span className="text-sm font-normal text-muted-foreground">User</span></div>
                            <p className="text-xs text-muted-foreground mt-1">Pengguna yang sukses membagikan rujukan setidaknya sekali.</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Perujuk (Referrers)</CardTitle>
                        <CardDescription>
                            Daftar pengguna dengan kontribusi rujukan tertinggi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={referrers.data} searchKey="name" searchPlaceholder="Cari perujuk..." />

                        {/* Simple pagination controls */}
                        {referrers.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4 mt-4 border-t">
                                <span className="text-xs text-muted-foreground">
                                    Halaman {referrers.current_page} dari {referrers.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {referrers.links.map((link, idx) => {
                                        if (link.url === null) return null;
                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                className={`px-3 py-1 text-xs border rounded-md ${
                                                    link.active
                                                        ? 'bg-primary text-primary-foreground font-bold'
                                                        : 'bg-background text-foreground hover:bg-muted'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
