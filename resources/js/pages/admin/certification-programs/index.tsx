'use client';

import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Award, BookOpen, ChevronDown, ChevronUp, GraduationCap, Plus, TrendingUp, Users, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CertificationProgram, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Program Sertifikasi',
        href: route('certification-programs.index'),
    },
];

interface Statistics {
    total_programs: number;
    published_programs: number;
    draft_programs: number;
    archived_programs: number;
    regular_programs: number;
    scholarship_programs: number;
    recording: {
        with_recording: number;
        partially_recorded: number;
        without_recording: number;
    };
}

interface CertificationProgramsProps {
    programs: CertificationProgram[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CertificationPrograms({ programs, statistics, flash }: CertificationProgramsProps) {
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
            <Head title="Program Sertifikasi" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Program Sertifikasi</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan daftar semua program sertifikasi.</p>
                    </div>
                    {!isAffiliate && (
                        <div className="flex gap-2">
                            <Button asChild variant="outline">
                                <Link href={route('certification-programs.create', { type: 'scholarship' })}>
                                    <Plus />
                                    Beasiswa
                                </Link>
                            </Button>
                            <Button asChild className="hover:cursor-pointer">
                                <Link href={route('certification-programs.create', { type: 'regular' })}>
                                    <Plus />
                                    Reguler
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* Mobile: Compact Overview */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm dark:from-teal-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Program</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.total_programs}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {statistics.published_programs} terbit</p>
                                </div>
                                <Award className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm dark:from-amber-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Beasiswa vs Reguler</p>
                                    <h3 className="mt-1 text-xl font-bold">
                                        {statistics.scholarship_programs} / {statistics.regular_programs}
                                    </h3>
                                </div>
                                <GraduationCap className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </div>

                    {/* MOBILE: Expandable Details */}
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
                                    <h4 className="mb-2 font-semibold">Status Program</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Published</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.published_programs}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Draft</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.draft_programs}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Archived</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.archived_programs}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Recording Status */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 text-xs font-semibold">Rekaman</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Lengkap</span>
                                            <span className="font-medium text-green-600">{statistics.recording.with_recording}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Sebagian</span>
                                            <span className="font-medium text-amber-600">{statistics.recording.partially_recorded}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Belum Ada</span>
                                            <span className="font-medium text-gray-600">{statistics.recording.without_recording}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop: Overview Stats (4 cards) */}
                    <div className="hidden grid-cols-4 gap-4 md:grid">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm dark:from-teal-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Program</p>
                                    <h3 className="mt-1 text-2xl font-bold">{statistics.total_programs}</h3>
                                </div>
                                <Award className="h-10 w-10 text-teal-600 dark:text-teal-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Dipublikasi</p>
                                    <h3 className="mt-1 text-2xl font-bold">{statistics.published_programs}</h3>
                                </div>
                                <BookOpen className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Draft</p>
                                    <h3 className="mt-1 text-2xl font-bold">{statistics.draft_programs}</h3>
                                </div>
                                <TrendingUp className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-zinc-50 to-white p-4 shadow-sm dark:from-zinc-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Archived</p>
                                    <h3 className="mt-1 text-2xl font-bold">{statistics.archived_programs}</h3>
                                </div>
                                <TrendingUp className="h-10 w-10 text-zinc-600 dark:text-zinc-400" />
                            </div>
                        </div>
                    </div>

                    {/* Desktop: Additional Stats */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2">
                        {/* Program Types */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Users className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Tipe Program</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Reguler</span>
                                    <span className="font-medium text-amber-600">{statistics.regular_programs}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Beasiswa</span>
                                    <span className="font-medium text-purple-600">{statistics.scholarship_programs}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Rekaman */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Video className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Status Rekaman</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Semua Terisi (Lengkap)</span>
                                    <span className="font-medium text-green-600">{statistics.recording.with_recording}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Terisi Sebagian</span>
                                    <span className="font-medium text-amber-600">{statistics.recording.partially_recorded}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Belum Ada Rekaman</span>
                                    <span className="font-medium text-gray-600">{statistics.recording.without_recording}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Programs Table */}
                <div className="bg-card rounded-lg border p-4">
                    <DataTable columns={columns} data={programs} />
                </div>
            </div>
        </AdminLayout>
    );
}
