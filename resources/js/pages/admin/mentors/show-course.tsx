import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { rupiahFormatter } from '@/lib/utils';

import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookOpen } from 'lucide-react';

interface Course {
    id: number;
    title: string;
    description: string;
    price: number;
    status: string;
    level: string;
    category: {
        name: string;
    };
    duration: number;
    students_count: number;
    created_at: string;
}

interface ShowCourseProps {
    courses: Course[];
}

export default function ShowCourse({ courses }: ShowCourseProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge variant="default">Published</Badge>;
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'archived':
                return <Badge variant="destructive">Archived</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (courses.length === 0) {
        return (
            <div className="space-y-6 rounded-lg border p-4">
                <h2 className="text-lg font-medium">Kelas yang Dibuat</h2>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BookOpen className="mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Belum ada kelas</h3>
                    <p className="text-gray-500">Mentor ini belum membuat kelas apapun.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Kelas yang Dibuat</h2>
                <Badge variant="outline">{courses.length} Kelas</Badge>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Judul Kelas</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Siswa</TableHead>
                        <TableHead>Dibuat</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {courses.map((course) => (
                        <TableRow key={course.id}>
                            <TableCell className="font-medium">
                                <div>
                                    <div className="line-clamp-1">{course.title}</div>
                                    <div className="line-clamp-1 text-xs text-gray-500">{course.description}</div>
                                </div>
                            </TableCell>
                            <TableCell>{course.category.name}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                    {course.level}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-green-600">{rupiahFormatter.format(course.price)}</TableCell>
                            <TableCell>{getStatusBadge(course.status)}</TableCell>
                            <TableCell>{course.students_count || 0}</TableCell>
                            <TableCell className="text-xs text-gray-500">
                                {format(new Date(course.created_at), 'dd MMM yyyy', { locale: id })}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
