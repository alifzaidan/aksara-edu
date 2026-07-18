import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Award, Users, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

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

interface Referrer {
    id: string;
    name: string;
    email: string;
    referral_code: string;
    point_balance: number;
    referrals_count: number;
    created_at: string;
}

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
                        <BarChart3 className="h-6 w-6 text-gray-700" />
                        Laporan Performa Referral
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Analisis data kontribusi perujuk dan jumlah transaksi rujukan sukses.
                    </p>
                </div>

                <div className="grid gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Akun Perujuk Aktif</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
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
                        {referrers.data.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Award className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                <p className="text-sm">Belum ada rujukan transaksi sukses yang tercatat.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama Pengguna</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Kode Referral</TableHead>
                                            <TableHead>Saldo Poin</TableHead>
                                            <TableHead className="text-right">Total Transaksi Rujukan</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {referrers.data.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-semibold">{user.name}</TableCell>
                                                <TableCell className="text-gray-500">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-mono">
                                                        {user.referral_code}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-mono font-semibold">
                                                    {user.point_balance.toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-blue-600">
                                                    {user.referrals_count} ×
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

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
                                                                ? 'bg-primary text-white font-bold'
                                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
