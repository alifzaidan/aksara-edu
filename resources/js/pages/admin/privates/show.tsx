import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CircleX, Copy, Send, SquarePen, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface PrivateClass {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    mode: 'online' | 'offline';
    location?: string | null;
    description?: string | null;
    price: number;
    strikethrough_price: number;
    thumbnail?: string | null;
    registration_deadline?: string | null;
    group_url?: string | null;
    created_at?: string;
    category?: { name: string };
    user?: { name: string; email?: string; avatar?: string };
    schedules?: Array<{
        id: string; start_time: string; end_time: string;
        registration_deadline?: string | null; max_participants?: number; is_active?: boolean;
    }>;
}

interface Transaction {
    id: string; invoice_code: string; status: string; nett_amount: number; created_at: string;
    user?: { name: string; email: string };
    private_items?: Array<{ private_class_schedule?: { start_time?: string; end_time?: string } }>;
}

interface Props {
    privateClass: PrivateClass;
    transactions: Transaction[];
    flash?: { success?: string; error?: string };
}

export default function ShowPrivate({ privateClass, transactions, flash }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Private Class', href: route('privates.index') },
        { title: privateClass.title, href: route('privates.show', { private: privateClass.id }) },
    ];

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleDelete = () => {
        router.delete(route('privates.destroy', { private: privateClass.id }));
    };

    const paidTransactions = transactions.filter((t) => t.status === 'paid');
    const statusColor: Record<string, string> = {
        draft: 'bg-gray-200 text-gray-800', published: 'bg-blue-100 text-blue-800', archived: 'bg-zinc-300 text-zinc-700',
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${privateClass.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${privateClass.title}`}</h1>

                <div className={`${!isAffiliate ? 'lg:grid-cols-3' : ''} grid grid-cols-1 gap-4 lg:gap-6`}>
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            {!isAffiliate && (
                                <TabsTrigger value="transaksi">
                                    Transaksi
                                    {transactions.length > 0 && (
                                        <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{paidTransactions.length}</span>
                                    )}
                                </TabsTrigger>
                            )}
                        </TabsList>
                        <TabsContent value="detail">
                            <div className="space-y-6 rounded-lg border p-4">
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Status</TableCell>
                                            <TableCell><Badge className={`capitalize ${statusColor[privateClass.status] || ''} border-0`}>{privateClass.status}</Badge></TableCell>
                                        </TableRow>
                                        <TableRow><TableCell>Kategori</TableCell><TableCell>{privateClass.category?.name || '-'}</TableCell></TableRow>
                                        <TableRow><TableCell>Mentor</TableCell>
                                            <TableCell>
                                                {privateClass.user ? (
                                                    <div className="flex items-center gap-3">
                                                        {privateClass.user.avatar ? (
                                                            <img src={`/storage/${privateClass.user.avatar}`} alt={privateClass.user.name} className="h-10 w-10 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600">{privateClass.user.name.charAt(0)}</div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{privateClass.user.name}</div>
                                                            {privateClass.user.email && <div className="text-sm text-gray-500">{privateClass.user.email}</div>}
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                        <TableRow><TableCell>Mode</TableCell><TableCell><Badge variant="outline">{privateClass.mode === 'offline' ? 'Offline' : 'Online'}</Badge></TableCell></TableRow>
                                        {privateClass.location && <TableRow><TableCell>Lokasi</TableCell><TableCell>{privateClass.location}</TableCell></TableRow>}
                                        <TableRow><TableCell>Harga</TableCell>
                                            <TableCell>
                                                {privateClass.price === 0 ? <span>Gratis</span> : (
                                                    <span>
                                                        {privateClass.strikethrough_price > 0 && <span className="text-xs text-gray-500 line-through">{rupiahFormatter.format(privateClass.strikethrough_price)} </span>}
                                                        <span className="text-base font-semibold">{rupiahFormatter.format(privateClass.price)}</span>
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                        {privateClass.registration_deadline && (
                                            <TableRow><TableCell>Deadline Pendaftaran</TableCell><TableCell>{format(new Date(privateClass.registration_deadline), 'dd MMMM yyyy HH:mm', { locale: localeId })}</TableCell></TableRow>
                                        )}
                                        {privateClass.group_url && <TableRow><TableCell>Link Group</TableCell><TableCell>{privateClass.group_url}</TableCell></TableRow>}
                                        <TableRow><TableCell>Deskripsi</TableCell>
                                            <TableCell><div className="prose prose-sm max-w-md text-wrap whitespace-pre-line">{privateClass.description || '-'}</div></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>

                                {/* Schedules */}
                                <div>
                                    <h3 className="mb-2 font-semibold">Jadwal Slot</h3>
                                    {privateClass.schedules && privateClass.schedules.length > 0 ? (
                                        <div className="space-y-2">
                                            {privateClass.schedules.map((s) => (
                                                <div key={s.id} className="rounded-md border p-3 text-sm">
                                                    <p>{format(new Date(s.start_time), 'dd MMMM yyyy HH:mm', { locale: localeId })} - {format(new Date(s.end_time), 'dd MMMM yyyy HH:mm', { locale: localeId })}</p>
                                                    <p className="text-muted-foreground">Kuota: {s.max_participants || 1} | Deadline: {s.registration_deadline ? format(new Date(s.registration_deadline), 'dd MMM yyyy HH:mm', { locale: localeId }) : '-'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">Belum ada slot jadwal.</p>
                                    )}
                                </div>

                                {/* Thumbnail */}
                                <div>
                                    <span className="font-semibold">Thumbnail:</span>
                                    <img src={privateClass.thumbnail ? `/storage/${privateClass.thumbnail}` : '/assets/images/placeholder.png'} alt={privateClass.title} className="my-1 mt-2 h-40 w-64 rounded border object-cover" />
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <div className="space-y-4 rounded-lg border p-4">
                                <h2 className="text-lg font-medium">Transaksi</h2>
                                <p className="text-muted-foreground text-sm">Total: {transactions.length} | Paid: {paidTransactions.length}</p>
                                {transactions.length > 0 ? (
                                    <div className="overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableBody>
                                                {transactions.map((trx) => (
                                                    <TableRow key={trx.id}>
                                                        <TableCell className="font-medium">{trx.invoice_code}</TableCell>
                                                        <TableCell>{trx.user?.name || '-'}</TableCell>
                                                        <TableCell>{trx.user?.email || '-'}</TableCell>
                                                        <TableCell><Badge className={`capitalize border-0 ${trx.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{trx.status}</Badge></TableCell>
                                                        <TableCell>{rupiahFormatter.format(trx.nett_amount || 0)}</TableCell>
                                                        <TableCell className="text-muted-foreground text-xs">{format(new Date(trx.created_at), 'dd MMM yyyy', { locale: localeId })}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center text-sm">Belum ada transaksi.</p>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Sidebar Actions */}
                    {!isAffiliate && (
                        <div>
                            <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {(privateClass.status === 'draft' || privateClass.status === 'archived') && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('privates.publish', { private: privateClass.id })}><Send />Terbitkan</Link>
                                    </Button>
                                )}
                                {privateClass.status === 'published' && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('privates.archive', { private: privateClass.id })}><CircleX />Tutup</Link>
                                    </Button>
                                )}
                                <Separator />
                                <div className="space-y-2">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href={route('privates.edit', { private: privateClass.id })}><SquarePen /> Edit</Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link method="post" href={route('privates.duplicate', { private: privateClass.id })}><Copy /> Duplicate</Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary" disabled={privateClass.status === 'archived'}>
                                        <Link method="post" href={route('privates.archive', { private: privateClass.id })}><CircleX /> Tutup</Link>
                                    </Button>
                                    <DeleteConfirmDialog
                                        trigger={<Button variant="destructive" className="w-full"><Trash /> Hapus</Button>}
                                        title="Apakah Anda yakin ingin menghapus private class ini?"
                                        itemName={privateClass.title}
                                        onConfirm={handleDelete}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {privateClass.created_at && (
                    <div className="mt-4 rounded-lg border p-4">
                        <h3 className="text-muted-foreground text-center text-sm">
                            Dibuat pada : {format(new Date(privateClass.created_at), 'dd MMMM yyyy HH:mm', { locale: localeId })}
                        </h3>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
