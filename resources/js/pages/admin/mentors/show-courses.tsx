import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { rupiahFormatter } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookOpen, Clock, GraduationCap, Tag, Users } from 'lucide-react';

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string | null;
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

    const getLevelBadge = (level: string) => {
        const variants = {
            beginner: { variant: 'default' as const, color: 'bg-green-100 text-green-700 border-green-200' },
            intermediate: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
            advanced: { variant: 'destructive' as const, color: 'bg-red-100 text-red-700 border-red-200' },
        };

        const config = variants[level as keyof typeof variants] || variants.beginner;

        return (
            <Badge variant="outline" className={config.color}>
                {level}
            </Badge>
        );
    };

    if (!courses || courses.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <BookOpen className="text-muted-foreground mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-lg font-semibold">Belum Ada Kelas</h3>
                    <p className="text-muted-foreground text-center text-sm">Mentor ini belum membuat kelas apapun.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Kelas yang Dibuat</h2>
                <Badge variant="outline" className="text-sm">
                    {courses.length} Kelas
                </Badge>
            </div>

            {courses.map((course) => {
                const thumbnailUrl = course.thumbnail ? `/storage/${course.thumbnail}` : '/assets/images/placeholder.png';

                return (
                    <Card key={course.id} className="overflow-hidden transition-shadow hover:shadow-md">
                        <CardContent className="p-0">
                            <Link
                                href={route('courses.show', course.id)}
                                className="hover:bg-accent flex flex-col gap-4 p-4 transition-colors md:flex-row"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-lg md:h-32 md:w-48">
                                    <img src={thumbnailUrl} alt={course.title} className="h-full w-full object-cover" />
                                    <div className="absolute top-2 left-2">{getLevelBadge(course.level)}</div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col justify-between space-y-3">
                                    {/* Header */}
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="hover:text-primary line-clamp-2 text-lg font-semibold">{course.title}</h3>
                                            {getStatusBadge(course.status)}
                                        </div>

                                        {/* Description */}
                                        <p className="text-muted-foreground line-clamp-2 text-sm">{course.description}</p>

                                        {/* Category */}
                                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span>{course.category.name}</span>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid gap-3 text-sm md:grid-cols-2">
                                        {/* Left Column */}
                                        <div className="space-y-2">
                                            {/* Duration */}
                                            <div className="flex items-center gap-2">
                                                <Clock className="text-muted-foreground h-4 w-4" />
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">Durasi</span>
                                                    <span className="font-medium">{course.duration} Jam</span>
                                                </div>
                                            </div>

                                            {/* Students */}
                                            <div className="flex items-center gap-2">
                                                <Users className="text-muted-foreground h-4 w-4" />
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">Siswa</span>
                                                    <span className="font-medium">{course.students_count || 0} Terdaftar</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-2">
                                            {/* Price */}
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="text-muted-foreground h-4 w-4" />
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">Harga</span>
                                                    <span className="text-base font-bold text-green-600">
                                                        {course.price === 0 ? 'Gratis' : rupiahFormatter.format(course.price)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Created Date */}
                                            <div className="text-muted-foreground text-xs">
                                                Dibuat: {format(new Date(course.created_at), 'dd MMM yyyy', { locale: id })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
