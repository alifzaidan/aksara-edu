import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    FileText,
    MonitorPlay,
    PlayCircle,
    Plus,
    TrendingUp,
    Users,
    Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { columns, Webinar } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Webinar',
        href: 'admin/webinars',
    },
];

interface Statistics {
    overview: {
        total_webinars: number;
        published_webinars: number;
        draft_webinars: number;
        archived_webinars: number;
    };
    pricing: {
        free_webinars: number;
        paid_webinars: number;
    };
    completion: {
        completed: number;
        ongoing: number;
        upcoming: number;
    };
    recording: {
        with_recording: number;
        without_recording: number;
    };
    performance: {
        total_participants: number;
        total_revenue: number;
    };
}

interface WebinarProps {
    webinars: Webinar[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Webinars({ webinars, statistics, flash }: WebinarProps) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');
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
            <Head title="Webinar" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Webinar</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan daftar semua webinar.</p>
                    </div>
                    {!isAffiliate && (
                        <Button asChild className="hover:cursor-pointer">
                            <Link href={route('webinars.create')}>
                                Tambah Webinar
                                <Plus />
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview (2 cards only) */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Webinar</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_webinars}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {statistics.completion.completed} selesai</p>
                                </div>
                                <MonitorPlay className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Pendapatan</p>
                                    <h3 className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.performance.total_revenue)}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                                        {statistics.performance.total_participants} peserta
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
                                {/* Status Breakdown */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Status Webinar</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Published</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.overview.published_webinars}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Draft</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.draft_webinars}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Archived</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.archived_webinars}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Completion Status */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Status Pelaksanaan</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Akan Datang</span>
                                            <span className="text-xs font-medium text-orange-600">{statistics.completion.upcoming}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Berlangsung</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.completion.ongoing}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing & Recording */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 text-xs font-semibold">Harga</h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Berbayar</span>
                                                <span className="font-medium text-green-600">{statistics.pricing.paid_webinars}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Gratis</span>
                                                <span className="font-medium text-blue-600">{statistics.pricing.free_webinars}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 text-xs font-semibold">Rekaman</h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Ada</span>
                                                <span className="font-medium text-green-600">{statistics.recording.with_recording}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Belum</span>
                                                <span className="font-medium text-gray-600">{statistics.recording.without_recording}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Overview Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Webinar</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_webinars}</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <MonitorPlay className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Published</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.published_webinars}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{statistics.overview.draft_webinars} draft</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Peserta</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.performance.total_participants}
                                    </h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {rupiahFormatter.format(statistics.performance.total_revenue)}
                                    </h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats (3 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-3">
                        {/* Completion Status */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Calendar className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Status Pelaksanaan</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-orange-600" />
                                        <span className="text-muted-foreground">Akan Datang</span>
                                    </div>
                                    <span className="font-medium text-orange-600">{statistics.completion.upcoming}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <PlayCircle className="h-4 w-4 text-blue-600" />
                                        <span className="text-muted-foreground">Sedang Berlangsung</span>
                                    </div>
                                    <span className="font-medium text-blue-600">{statistics.completion.ongoing}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <span className="text-muted-foreground">Sudah Terlaksana</span>
                                    </div>
                                    <span className="font-medium text-green-600">{statistics.completion.completed}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <DollarSign className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Tipe Harga</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Berbayar</span>
                                    <span className="font-medium text-green-600">{statistics.pricing.paid_webinars}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Gratis</span>
                                    <span className="font-medium text-blue-600">{statistics.pricing.free_webinars}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Video className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Status Rekaman</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Dengan Rekaman</span>
                                    <span className="font-medium text-green-600">{statistics.recording.with_recording}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Belum Ada Rekaman</span>
                                    <span className="font-medium text-gray-600">{statistics.recording.without_recording}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DataTable columns={columns} data={webinars} />
            </div>
        </AdminLayout>
    );
}
