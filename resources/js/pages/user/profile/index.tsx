import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Invoice } from '@/pages/admin/transactions/columns';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookTextIcon, GraduationCap, MonitorPlay, Presentation } from 'lucide-react';

interface ProfileProps {
    stats: {
        courses: number;
        bootcamps: number;
        webinars: number;
        total: number;
    };
    recentTransactions: Invoice[];
}

export default function Profile({ stats, recentTransactions }: ProfileProps) {
    const getInvoiceItemName = (invoice: Invoice): string => {
        if (invoice.course_items && invoice.course_items.length > 0) {
            let name = invoice.course_items[0].course.title;
            if (invoice.course_items.length > 1) {
                name += ` (+${invoice.course_items.length - 1} lainnya)`;
            }
            return name;
        }
        if (invoice.bootcamp_items && invoice.bootcamp_items.length > 0) {
            let name = invoice.bootcamp_items[0].bootcamp.title;
            if (invoice.bootcamp_items.length > 1) {
                name += ` (+${invoice.bootcamp_items.length - 1} lainnya)`;
            }
            return name;
        }
        if (invoice.webinar_items && invoice.webinar_items.length > 0) {
            let name = invoice.webinar_items[0].webinar.title;
            if (invoice.webinar_items.length > 1) {
                name += ` (+${invoice.webinar_items.length - 1} lainnya)`;
            }
            return name;
        }
        return 'Pembelian Produk';
    };

    const getInvoiceItemType = (invoice: Invoice): string => {
        if (invoice.course_items && invoice.course_items.length > 0) {
            return 'Kelas Online';
        }
        if (invoice.bootcamp_items && invoice.bootcamp_items.length > 0) {
            return 'Bootcamp';
        }
        if (invoice.webinar_items && invoice.webinar_items.length > 0) {
            return 'Webinar';
        }
        return 'Produk';
    };

    return (
        <UserLayout>
            <Head title="Profil" />
            <ProfileLayout>
                <Heading title="Dashboard" description="Pantau aktivitas dan progres belajar Anda di sini." />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                            <GraduationCap className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-muted-foreground text-xs">Total item yang Anda ikuti</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kelas Online</CardTitle>
                            <BookTextIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.courses}</div>
                            <p className="text-muted-foreground text-xs">Kelas yang telah Anda beli</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bootcamp</CardTitle>
                            <Presentation className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.bootcamps}</div>
                            <p className="text-muted-foreground text-xs">Bootcamp yang Anda ikuti</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Webinar</CardTitle>
                            <MonitorPlay className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.webinars}</div>
                            <p className="text-muted-foreground text-xs">Webinar yang akan datang</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <Heading title="Aktivitas Terakhir" description="Daftar pembelian terakhir Anda." />
                    <Card className="p-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Judul</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentTransactions.length > 0 ? (
                                    recentTransactions.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">
                                                <div>
                                                    <Link href={route('invoice.show', { id: invoice.id })} className="hover:text-primary">
                                                        {getInvoiceItemName(invoice)}
                                                    </Link>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getInvoiceItemType(invoice)}</TableCell>
                                            <TableCell>{invoice.invoice_code}</TableCell>
                                            <TableCell>{format(new Date(invoice.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        invoice.status === 'paid'
                                                            ? 'border-green-500 bg-green-100 text-green-700'
                                                            : 'border-yellow-500 bg-yellow-100 text-yellow-700'
                                                    }
                                                    variant="outline"
                                                >
                                                    {invoice.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">Rp {Number(invoice.amount).toLocaleString('id-ID')}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center">
                                            Belum ada aktivitas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </ProfileLayout>
        </UserLayout>
    );
}
