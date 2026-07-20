import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CircleX, Copy, EyeOff, Send, SquarePen, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Invoice } from './columns-transactions';
import CertificationProgramApplications from './show-applications';
import CertificationProgramDetail from './show-details';
import CertificationProgramRecordings from './show-recordings';
import CertificationProgramTransaction from './show-transactions';

interface Schedule {
    id: string;
    title?: string | null;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
    recording_url?: string | null;
}

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}

interface CertificationProgram {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    status: 'draft' | 'published' | 'archived' | 'hidden';
    category?: { name: string };
    mentors?: Mentor[];
    schedules?: Schedule[];
    socializationSchedules?: Schedule[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    scholarship_price?: number;
    scholarship_flow?: string | null;
    registration_deadline?: string | null;
    socialization_registration_deadline?: string | null;
    short_description?: string | null;
    description?: string | null;
    benefits?: string | null;
    terms_conditions?: string | null;
    group_url?: string | null;
    socialization_group_url?: string | null;
    program_url: string;
    registration_url: string;
    thumbnail?: string | null;
    document_required?: boolean;
    created_at: string;
}

interface Application {
    id: string;
    user?: { id: string; name: string; email: string; phone_number?: string };
    name?: string;
    email?: string;
    phone?: string;
    status: string;
    created_at: string;
}

interface ShowCertificationProgramProps {
    program: CertificationProgram;
    applications: Application[];
    transactions: Invoice[];
    flash?: { success?: string; error?: string };
}

export default function ShowCertificationProgram({ program, applications, transactions, flash }: ShowCertificationProgramProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const isAffiliate = role === 'affiliate';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Program Sertifikasi', href: route('certification-programs.index') },
        { title: program.title, href: route('certification-programs.show', program.id) },
    ];

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleDelete = () => {
        router.delete(route('certification-programs.destroy', program.id));
    };

    const statusMap: Record<string, { label: string; color: string }> = {
        draft: { label: 'Draft', color: 'bg-gray-200 text-gray-800' },
        published: { label: 'Published', color: 'bg-blue-100 text-blue-800' },
        archived: { label: 'Archived', color: 'bg-zinc-300 text-zinc-700' },
        hidden: { label: 'Hidden', color: 'bg-yellow-300 text-yellow-700' },
    };

    const statusInfo = statusMap[program.status] ?? { label: program.status, color: 'bg-gray-200 text-gray-800' };
    const typeLabel = program.type === 'scholarship' ? 'Beasiswa' : 'Reguler';
    const typeColor = program.type === 'scholarship' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';

    const approvedApplications = applications.filter((a) => a.status === 'approved');
    const paidTransactionsCount = transactions.filter((t) => t.status === 'paid').length;

    const totalSchedules = (program.schedules?.length ?? 0) + (program.type === 'scholarship' ? (program.socializationSchedules?.length ?? 0) : 0);
    const uploadedRecordings = (program.schedules?.filter((s) => s.recording_url).length ?? 0) + (program.type === 'scholarship' ? (program.socializationSchedules?.filter((s) => s.recording_url).length ?? 0) : 0);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Program - ${program.title}`} />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold">{program.title}</h1>
                    <Badge className={`border-0 ${typeColor}`}>{typeLabel}</Badge>
                    <Badge className={`border-0 ${statusInfo.color}`}>{statusInfo.label}</Badge>
                </div>

                <div className={`${!isAffiliate ? 'lg:grid-cols-3' : ''} grid grid-cols-1 gap-4 lg:gap-6`}>
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="detail">
                            <TabsList>
                                <TabsTrigger value="detail">Detail</TabsTrigger>
                                {!isAffiliate && (
                                    <>
                                        <TabsTrigger value="pendaftar">
                                            Pendaftar
                                            {applications.length > 0 && (
                                                <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">
                                                    {approvedApplications.length}/{applications.length}
                                                </span>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="transaksi">
                                            Transaksi
                                            {transactions.length > 0 && (
                                                <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">
                                                    {paidTransactionsCount}/{transactions.length}
                                                </span>
                                            )}
                                        </TabsTrigger>
                                        <TabsTrigger value="rekaman">
                                            Rekaman
                                            {totalSchedules > 0 && (
                                                <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">
                                                    {uploadedRecordings}/{totalSchedules}
                                                </span>
                                            )}
                                        </TabsTrigger>
                                    </>
                                )}
                            </TabsList>

                            <TabsContent value="detail">
                                <CertificationProgramDetail program={program} />
                            </TabsContent>

                            <TabsContent value="pendaftar">
                                <CertificationProgramApplications applications={applications} programType={program.type} programId={program.id} />
                            </TabsContent>

                            <TabsContent value="transaksi">
                                <CertificationProgramTransaction transactions={transactions} programId={program.id} />
                            </TabsContent>

                            <TabsContent value="rekaman">
                                <CertificationProgramRecordings
                                    programId={program.id}
                                    programType={program.type}
                                    schedules={program.schedules ?? []}
                                    socializationSchedules={program.socializationSchedules ?? []}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar Actions */}
                    {!isAffiliate && (
                        <div>
                            <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {/* Publish / Hide / Archive actions */}
                                {(program.status === 'draft' || program.status === 'archived' || program.status === 'hidden') && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('certification-programs.publish', { program: program.id })}>
                                            <Send /> Terbitkan
                                        </Link>
                                    </Button>
                                )}
                                {program.status === 'published' && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('certification-programs.hidden', { program: program.id })}>
                                            <EyeOff /> Sembunyikan
                                        </Link>
                                    </Button>
                                )}
                                {(program.status === 'published' || program.status === 'hidden') && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('certification-programs.archive', { program: program.id })}>
                                            <CircleX /> Tutup
                                        </Link>
                                    </Button>
                                )}

                                <Separator />

                                <div className="space-y-2">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href={route('certification-programs.edit', program.id)}>
                                            <SquarePen /> Edit
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link method="post" href={route('certification-programs.duplicate', { program: program.id })}>
                                            <Copy /> Duplicate
                                        </Link>
                                    </Button>
                                    <DeleteConfirmDialog
                                        trigger={
                                            <Button variant="destructive" className="w-full">
                                                <Trash /> Hapus
                                            </Button>
                                        }
                                        title="Apakah Anda yakin ingin menghapus program ini?"
                                        itemName={program.title}
                                        onConfirm={handleDelete}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada: {format(new Date(program.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
