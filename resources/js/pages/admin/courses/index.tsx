import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { columns, Course } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelas Online',
        href: 'admin/courses',
    },
];

interface CourseProps {
    courses: Course[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Courses({ courses, flash }: CourseProps) {
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
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Kelas Online</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua kelas online.</p>
                    </div>
                    <Button asChild className="hover:cursor-pointer">
                        <Link href={route('courses.create')}>
                            Tambah Kelas
                            <Plus />
                        </Link>
                    </Button>
                </div>
                <DataTable columns={columns} data={courses} />
            </div>
        </AdminLayout>
    );
}
