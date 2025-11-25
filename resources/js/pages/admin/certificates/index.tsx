import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Award,
    BookOpen,
    Calendar,
    ChevronDown,
    ChevronUp,
    FileCheck,
    Layers,
    Palette,
    PencilLine,
    Plus,
    Presentation,
    TrendingUp,
    Users,
    Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Certificate, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sertifikat',
        href: 'admin/certificates',
    },
];

interface Statistics {
    overview: {
        total_certificates: number;
        total_participants: number;
        average_participants: number;
        recent_certificates: number;
    };
    program_type: {
        courses: number;
        bootcamps: number;
        webinars: number;
    };
    issued: {
        this_month: number;
        this_year: number;
    };
}

interface CertificateProps {
    certificates: Certificate[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Certificates({ certificates, statistics, flash }: CertificateProps) {
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
            <Head title="Sertifikat" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Sertifikat</h1>
                        <p className="text-muted-foreground text-sm">Kelola dan monitor semua sertifikat yang diterbitkan.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('certificate-designs.index')}>
                                <Palette className="h-4 w-4" />
                                Desain
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('certificate-signs.index')}>
                                <PencilLine className="h-4 w-4" />
                                Tanda Tangan
                            </Link>
                        </Button>
                        <Button size="sm" asChild>
                            <Link href={route('certificates.create')}>
                                <Plus className="h-4 w-4" />
                                Tambah Sertifikat
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview (2 cards only) */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Sertifikat</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_certificates}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        +{statistics.overview.recent_certificates} baru (30 hari)
                                    </p>
                                </div>
                                <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Peserta</p>
                                    <h3 className="mt-1 text-xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.overview.total_participants}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                                        ~{statistics.overview.average_participants} rata-rata/sertifikat
                                    </p>
                                </div>
                                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
                                {/* Program Type */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Tipe Program</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Kelas Online</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.program_type.courses}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Bootcamp</span>
                                            <span className="text-xs font-medium text-purple-600">{statistics.program_type.bootcamps}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Webinar</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.program_type.webinars}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Issued Timeline */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Penerbitan</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Bulan Ini</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.issued.this_month}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Tahun Ini</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.issued.this_year}</span>
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
                                    <p className="text-muted-foreground text-sm font-medium">Total Sertifikat</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_certificates}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">+{statistics.overview.recent_certificates} baru</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Diterbitkan Bulan Ini</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{statistics.issued.this_month}</h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{statistics.issued.this_year} tahun ini</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <FileCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Peserta</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.overview.total_participants}
                                    </h3>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                        ~{statistics.overview.average_participants} rata-rata
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Rata-rata Peserta</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {statistics.overview.average_participants}
                                    </h3>
                                    <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">per sertifikat</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats (2 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2">
                        {/* Program Type Distribution */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Layers className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Distribusi Program</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                        <span className="text-muted-foreground">Kelas Online</span>
                                    </div>
                                    <span className="font-medium text-blue-600">{statistics.program_type.courses}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Presentation className="h-4 w-4 text-purple-600" />
                                        <span className="text-muted-foreground">Bootcamp</span>
                                    </div>
                                    <span className="font-medium text-purple-600">{statistics.program_type.bootcamps}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Video className="h-4 w-4 text-green-600" />
                                        <span className="text-muted-foreground">Webinar</span>
                                    </div>
                                    <span className="font-medium text-green-600">{statistics.program_type.webinars}</span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Penerbitan */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Calendar className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Timeline Penerbitan</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Bulan Ini</span>
                                    <span className="font-medium text-blue-600">{statistics.issued.this_month}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Tahun Ini</span>
                                    <span className="font-medium text-green-600">{statistics.issued.this_year}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={certificates} />
            </div>
        </AdminLayout>
    );
}
