import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    BookOpen,
    BookText,
    ChevronDown,
    ChevronUp,
    DollarSign,
    FileText,
    MonitorPlay,
    Plus,
    Presentation,
    UserCheck,
    Users as UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { columns, Mentor } from './columns';
import CreateMentor from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Mentor',
        href: 'admin/mentors',
    },
];

interface Statistics {
    overview: {
        total_mentors: number;
        active_mentors: number;
        inactive_mentors: number;
    };
    content: {
        total_courses: number;
        total_articles: number;
        total_webinars: number;
        total_bootcamps: number;
    };
    earnings: {
        total_earnings: number;
        paid_commission: number;
        pending_commission: number;
    };
}

interface MentorProps {
    mentors: Mentor[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Mentors({ mentors, statistics, flash }: MentorProps) {
    const [open, setOpen] = useState(false);
    const [showMoreStats, setShowMoreStats] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Mentor" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Mentor</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan daftar semua mentor.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer">
                                Tambah Mentor
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateMentor setOpen={setOpen} />
                    </Dialog>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Mentor</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_mentors}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {statistics.overview.active_mentors} aktif</p>
                                </div>
                                <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Komisi</p>
                                    <h3 className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.earnings.total_earnings)}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                                        {statistics.content.total_courses +
                                            statistics.content.total_articles +
                                            statistics.content.total_webinars +
                                            statistics.content.total_bootcamps}{' '}
                                        konten
                                    </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* ✅ MOBILE: Expandable Details */}
                    <div className="md:hidden">
                        <Button variant="outline" className="w-full" onClick={() => setShowMoreStats(!showMoreStats)}>
                            {showMoreStats ? (
                                <>
                                    <ChevronUp className="mr-2 h-4 w-4" />
                                    Sembunyikan Detail
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="mr-2 h-4 w-4" />
                                    Lihat Detail Statistik
                                </>
                            )}
                        </Button>

                        {showMoreStats && (
                            <div className="mt-4 space-y-3">
                                {/* Status */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Status Mentor</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Tidak Aktif</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.inactive_mentors}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content & Commission */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 text-xs font-semibold">Konten</h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Kelas</span>
                                                <span className="font-medium">{statistics.content.total_courses}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Bootcamp</span>
                                                <span className="font-medium">{statistics.content.total_bootcamps}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Webinar</span>
                                                <span className="font-medium">{statistics.content.total_webinars}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Artikel</span>
                                                <span className="font-medium">{statistics.content.total_articles}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 text-xs font-semibold">Komisi</h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Dibayar</span>
                                                <span className="font-medium text-green-600">
                                                    {rupiahFormatter.format(statistics.earnings.paid_commission)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Pending</span>
                                                <span className="font-medium text-yellow-600">
                                                    {rupiahFormatter.format(statistics.earnings.pending_commission)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Mentor</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_mentors}</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Mentor Aktif</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.active_mentors}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        {statistics.overview.inactive_mentors} tidak aktif
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Komisi</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.earnings.total_earnings)}
                                    </h3>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.earnings.paid_commission)} dibayar
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Konten</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {statistics.content.total_courses +
                                            statistics.content.total_articles +
                                            statistics.content.total_webinars +
                                            statistics.content.total_bootcamps}
                                    </h3>
                                    <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                        {statistics.content.total_courses} kelas, {statistics.content.total_bootcamps} bootcamp
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <BookOpen className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Content Breakdown (1 card) */}
                    <div className="hidden md:block">
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <BookOpen className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Breakdown Konten</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                        <BookText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Kelas Online</p>
                                        <p className="text-lg font-bold text-blue-600">{statistics.content.total_courses}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                        <Presentation className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Bootcamp</p>
                                        <p className="text-lg font-bold text-green-600">{statistics.content.total_bootcamps}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                        <MonitorPlay className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Webinar</p>
                                        <p className="text-lg font-bold text-purple-600">{statistics.content.total_webinars}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                        <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Artikel</p>
                                        <p className="text-lg font-bold text-orange-600">{statistics.content.total_articles}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={mentors} />
            </div>
        </AdminLayout>
    );
}
