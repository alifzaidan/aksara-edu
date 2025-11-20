import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, BookText, FileText, Video } from 'lucide-react';

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
    total_courses: number;
    total_articles: number;
    total_webinars: number;
    total_bootcamps: number;
}

interface MentorIndexProps {
    mentors: Mentor[];
}

export default function MentorIndex({ mentors }: MentorIndexProps) {
    const getInitials = useInitials();

    return (
        <UserLayout>
            <Head title="Mentor Kami" />

            <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold italic md:text-4xl">Mentor Kami</h1>
                    <p className="text-muted-foreground">Belajar bersama mentor profesional dan berpengalaman</p>
                </div>

                {mentors.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {mentors.map((mentor) => (
                            <Link key={mentor.id} href={`/mentor/${mentor.id}`}>
                                <div className="group h-full overflow-hidden rounded-lg border border-gray-200 transition-all hover:shadow-lg">
                                    <div className="p-6">
                                        {/* Avatar & Name */}
                                        <div className="mb-4 flex items-start gap-4">
                                            <Avatar className="ring-primary/20 group-hover:ring-primary/50 h-16 w-16 ring-2 transition-all">
                                                <AvatarImage src={mentor.avatar} alt={mentor.name} />
                                                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                                                    {getInitials(mentor.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="group-hover:text-primary mb-1 text-lg font-semibold transition-colors">
                                                    {mentor.name}
                                                </h3>
                                                <Badge variant="secondary" className="text-xs">
                                                    {mentor.bio || 'Mentor profesional di Aksademy'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-lg bg-blue-50 p-2.5 text-center">
                                                <div className="mb-1 flex items-center justify-center gap-1 text-blue-600">
                                                    <BookText className="h-3.5 w-3.5" />
                                                </div>
                                                <p className="text-lg font-bold text-blue-700">{mentor.total_courses}</p>
                                                <p className="text-[10px] text-blue-600">Kelas</p>
                                            </div>
                                            <div className="rounded-lg bg-purple-50 p-2.5 text-center">
                                                <div className="mb-1 flex items-center justify-center gap-1 text-purple-600">
                                                    <FileText className="h-3.5 w-3.5" />
                                                </div>
                                                <p className="text-lg font-bold text-purple-700">{mentor.total_articles}</p>
                                                <p className="text-[10px] text-purple-600">Artikel</p>
                                            </div>
                                            <div className="rounded-lg bg-green-50 p-2.5 text-center">
                                                <div className="mb-1 flex items-center justify-center gap-1 text-green-600">
                                                    <Video className="h-3.5 w-3.5" />
                                                </div>
                                                <p className="text-lg font-bold text-green-700">{mentor.total_webinars}</p>
                                                <p className="text-[10px] text-green-600">Webinar</p>
                                            </div>
                                            <div className="rounded-lg bg-orange-50 p-2.5 text-center">
                                                <div className="mb-1 flex items-center justify-center gap-1 text-orange-600">
                                                    <BookOpen className="h-3.5 w-3.5" />
                                                </div>
                                                <p className="text-lg font-bold text-orange-700">{mentor.total_bootcamps}</p>
                                                <p className="text-[10px] text-orange-600">Bootcamp</p>
                                            </div>
                                        </div>

                                        <Button className="mt-4 w-full" variant="outline">
                                            Lihat Profile
                                        </Button>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                        <div className="mb-4 text-6xl">👨‍🏫</div>
                        <p className="text-muted-foreground mb-2 text-lg font-medium">Belum Ada Mentor</p>
                        <p className="text-muted-foreground text-sm">Mentor akan segera hadir untuk membantu pembelajaran Anda</p>
                    </div>
                )}
            </div>
        </UserLayout>
    );
}
