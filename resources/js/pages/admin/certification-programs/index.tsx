'use client';

import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Award, BookOpen, GraduationCap, Plus, TrendingUp, Users } from 'lucide-react';
import { useEffect } from 'react';
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

                    {/* Desktop: Full Statistics */}
                    <div className="hidden grid-cols-6 gap-4 md:grid">
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

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm dark:from-amber-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Reguler</p>
                                    <h3 className="mt-1 text-2xl font-bold">{statistics.regular_programs}</h3>
                                </div>
                                <Users className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>

                        <div className="dark:to-background col-span-2 rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Beasiswa</p>
                                    <h3 className="mt-1 text-2xl font-bold">{statistics.scholarship_programs}</h3>
                                </div>
                                <GraduationCap className="h-10 w-10 text-purple-600 dark:text-purple-400" />
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
