import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, ChevronDown, ChevronUp, DollarSign, FileText, Plus, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { columns, Course } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelas Online',
        href: 'admin/courses',
    },
];

interface Statistics {
    overview: {
        total_courses: number;
        published_courses: number;
        draft_courses: number;
        archived_courses: number;
    };
    pricing: {
        free_courses: number;
        paid_courses: number;
    };
    level: {
        beginner: number;
        intermediate: number;
        advanced: number;
    };
    performance: {
        total_enrollments: number;
        total_revenue: number;
    };
}

interface CourseProps {
    courses: Course[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Courses({ courses, statistics, flash }: CourseProps) {
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
            <Head title="Kelas Online" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Kelas Online</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan daftar semua kelas online.</p>
                    </div>
                    {!isAffiliate && (
                        <Button asChild className="hover:cursor-pointer">
                            <Link href={route('courses.create')}>
                                Tambah Kelas
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
                                    <p className="text-muted-foreground text-xs font-medium">Total Kelas</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_courses}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        ✓ {statistics.overview.published_courses} published
                                    </p>
                                </div>
                                <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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
                                        {statistics.performance.total_enrollments} enrollments
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
                                    <h4 className="mb-2 font-semibold">Status Kelas</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Draft</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.draft_courses}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Archived</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.archived_courses}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Level & Pricing */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 text-xs font-semibold">Level</h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Beginner</span>
                                                <span className="font-medium text-green-600">{statistics.level.beginner}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Intermediate</span>
                                                <span className="font-medium text-yellow-600">{statistics.level.intermediate}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Advanced</span>
                                                <span className="font-medium text-red-600">{statistics.level.advanced}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 text-xs font-semibold">Harga</h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Berbayar</span>
                                                <span className="font-medium text-green-600">{statistics.pricing.paid_courses}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Gratis</span>
                                                <span className="font-medium text-blue-600">{statistics.pricing.free_courses}</span>
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
                                    <p className="text-muted-foreground text-sm font-medium">Total Kelas</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_courses}</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Published</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.published_courses}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{statistics.overview.draft_courses} draft</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Enrollments</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.performance.total_enrollments}
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
                    <div className="hidden gap-4 md:grid md:grid-cols-2">
                        {/* Level Breakdown */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <FileText className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Level Kelas</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Beginner</span>
                                    <span className="font-medium text-green-600">{statistics.level.beginner}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Intermediate</span>
                                    <span className="font-medium text-yellow-600">{statistics.level.intermediate}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Advanced</span>
                                    <span className="font-medium text-red-600">{statistics.level.advanced}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <DollarSign className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Tipe Harga</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Berbayar</span>
                                    <span className="font-medium text-green-600">{statistics.pricing.paid_courses}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Gratis</span>
                                    <span className="font-medium text-blue-600">{statistics.pricing.free_courses}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={courses} />
            </div>
        </AdminLayout>
    );
}
