import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInitials } from '@/hooks/use-initials';
import UserLayout from '@/layouts/user-layout';
import { rupiahFormatter } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    BookOpen,
    BookText,
    Calendar,
    CalendarDays,
    Clock,
    Eye,
    FileText,
    Mail,
    MonitorPlay,
    Phone,
    Presentation,
    Star,
    Users,
    Video,
} from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface Course {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    category: Category;
    price: number;
    discount_price?: number;
    level: string;
    students_count: number;
    rating: number;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    thumbnail?: string;
    category: Category;
    read_time: number;
    views: number;
    published_at: string;
}

interface Webinar {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    category: Category;
    price: number;
    strikethrough_price: number;
    start_time: string;
    end_time: string;
    batch?: number;
    registration_deadline: string;
    is_registration_closed: boolean;
}

interface Bootcamp {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    category: Category;
    price: number;
    strikethrough_price: number;
    start_date: string;
    end_date: string;
    batch?: number;
    registration_deadline: string;
    is_registration_closed: boolean;
    duration_weeks: number;
}

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
    email: string;
    phone_number?: string;
}

interface Stats {
    total_courses: number;
    total_articles: number;
    total_webinars: number;
    total_bootcamps: number;
}

interface MentorShowProps {
    mentor: Mentor;
    courses: Course[];
    articles: Article[];
    webinars: Webinar[];
    bootcamps: Bootcamp[];
    stats: Stats;
}

export default function MentorShow({ mentor, courses, articles, webinars, bootcamps, stats }: MentorShowProps) {
    const getInitials = useInitials();

    const levelColors: Record<string, string> = {
        beginner: 'bg-green-100 text-green-700',
        intermediate: 'bg-yellow-100 text-yellow-700',
        advanced: 'bg-red-100 text-red-700',
    };

    const levelLabels: Record<string, string> = {
        beginner: 'Pemula',
        intermediate: 'Menengah',
        advanced: 'Lanjutan',
    };

    return (
        <UserLayout>
            <Head title={`Mentor - ${mentor.name}`} />

            <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
                {/* Header Section */}
                <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="p-6 md:p-8">
                        <div className="flex flex-col gap-6 md:flex-row md:items-start">
                            {/* Avatar */}
                            <Avatar className="ring-primary/20 h-16 w-16 ring-4 md:h-24 md:w-24">
                                <AvatarImage src={mentor.avatar} alt={mentor.name} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold md:text-4xl">
                                    {getInitials(mentor.name)}
                                </AvatarFallback>
                            </Avatar>

                            {/* Info */}
                            <div className="flex-1">
                                <h1 className="mb-2 text-2xl font-bold italic md:text-3xl">{mentor.name}</h1>

                                <p className="text-muted-foreground mb-4 text-sm md:text-base">{mentor.bio || 'Mentor profesional di Aksademy'}</p>

                                {/* Contact Info */}
                                <div className="mb-4 flex flex-wrap gap-4 text-sm">
                                    {mentor.email && (
                                        <div className="flex items-center gap-2">
                                            <Mail className="text-muted-foreground h-4 w-4" />
                                            <span className="text-muted-foreground">{mentor.email}</span>
                                        </div>
                                    )}
                                    {mentor.phone_number && (
                                        <div className="flex items-center gap-2">
                                            <Phone className="text-muted-foreground h-4 w-4" />
                                            <span className="text-muted-foreground">{mentor.phone_number}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                                    <div className="flex items-center gap-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                                            <BookText className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-blue-700">{stats.total_courses}</p>
                                            <p className="text-sm text-blue-600">Kelas Online</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                            <Presentation className="h-6 w-6 text-green-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-green-700">{stats.total_bootcamps}</p>
                                            <p className="text-sm text-green-600">Bootcamp</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                                            <MonitorPlay className="h-6 w-6 text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-orange-700">{stats.total_webinars}</p>
                                            <p className="text-sm text-orange-600">Webinar</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-4 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                                            <FileText className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-2xl font-bold text-purple-700">{stats.total_articles}</p>
                                            <p className="text-sm text-purple-600">Artikel</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <Tabs defaultValue="courses" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="courses">
                            <BookText className="mr-2 h-4 w-4" />
                            Kelas ({courses.length})
                        </TabsTrigger>
                        <TabsTrigger value="bootcamps">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Bootcamp ({bootcamps.length})
                        </TabsTrigger>
                        <TabsTrigger value="webinars">
                            <Video className="mr-2 h-4 w-4" />
                            Webinar ({webinars.length})
                        </TabsTrigger>
                        <TabsTrigger value="articles">
                            <FileText className="mr-2 h-4 w-4" />
                            Artikel ({articles.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Courses Tab */}
                    <TabsContent value="courses" className="mt-6">
                        {courses.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {courses.map((course) => (
                                    <Link key={course.id} href={`/course/${course.slug}`} className="group">
                                        <div className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg">
                                            <div className="aspect-video overflow-hidden">
                                                <img
                                                    src={course.thumbnail ? `/storage/${course.thumbnail}` : '/assets/images/placeholder.png'}
                                                    alt={course.title}
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {course.category.name}
                                                    </Badge>
                                                    <Badge className={`text-xs ${levelColors[course.level] || 'bg-gray-100 text-gray-700'}`}>
                                                        {levelLabels[course.level] || course.level}
                                                    </Badge>
                                                </div>

                                                <h3 className="group-hover:text-primary mb-2 line-clamp-2 font-semibold transition-colors">
                                                    {course.title}
                                                </h3>

                                                <div className="text-muted-foreground mb-3 flex items-center gap-3 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {course.students_count} siswa
                                                    </div>
                                                    {course.rating > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                            {course.rating}
                                                        </div>
                                                    )}
                                                </div>

                                                <Separator className="mb-3" />

                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        {course.discount_price ? (
                                                            <>
                                                                <p className="text-muted-foreground text-xs line-through">
                                                                    {rupiahFormatter.format(course.price)}
                                                                </p>
                                                                <p className="text-primary text-lg font-bold">
                                                                    {rupiahFormatter.format(course.discount_price)}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-primary text-lg font-bold">
                                                                {course.price === 0 ? 'Gratis' : rupiahFormatter.format(course.price)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                                <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-8">
                                    <img src="/assets/images/not-found.webp" alt="Kelas Belum Tersedia" className="w-36" />
                                    <div className="text-center text-gray-500">Belum ada kelas yang pernah dibuat.</div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="bootcamps" className="mt-6">
                        {bootcamps.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {bootcamps.map((bootcamp) => {
                                    const isDisabled = bootcamp.is_registration_closed;
                                    const LinkOrDiv = isDisabled ? 'div' : Link;
                                    const linkProps = isDisabled ? {} : { href: `/bootcamp/${bootcamp.slug}` };

                                    return (
                                        <LinkOrDiv key={bootcamp.id} {...linkProps} className={`group ${isDisabled ? 'cursor-not-allowed' : ''}`}>
                                            <div
                                                className={`h-full overflow-hidden rounded-lg border border-gray-200 bg-white transition-all ${
                                                    isDisabled ? 'opacity-60' : 'hover:shadow-lg'
                                                }`}
                                            >
                                                <div className="relative aspect-video overflow-hidden">
                                                    <img
                                                        src={bootcamp.thumbnail ? `/storage/${bootcamp.thumbnail}` : '/assets/images/placeholder.png'}
                                                        alt={bootcamp.title}
                                                        className={`h-full w-full object-cover ${!isDisabled && 'transition-transform group-hover:scale-105'}`}
                                                    />
                                                    {isDisabled && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                            <Badge variant="destructive" className="px-4 py-2 text-sm font-semibold">
                                                                Pendaftaran Ditutup
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {bootcamp.category.name}
                                                        </Badge>
                                                        {bootcamp.batch && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Batch {bootcamp.batch}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <h3
                                                        className={`mb-2 line-clamp-2 font-semibold transition-colors ${
                                                            !isDisabled && 'group-hover:text-primary'
                                                        }`}
                                                    >
                                                        {bootcamp.title}
                                                    </h3>

                                                    <div className="text-muted-foreground mb-3 space-y-1 text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <CalendarDays className="h-3 w-3" />
                                                            {format(new Date(bootcamp.start_date), 'dd MMM', { locale: id })} -{' '}
                                                            {format(new Date(bootcamp.end_date), 'dd MMM yyyy', { locale: id })}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Durasi: {bootcamp.duration_weeks} minggu
                                                        </div>
                                                        {isDisabled && (
                                                            <div className="flex items-center gap-1 font-medium text-red-600">
                                                                <Calendar className="h-3 w-3" />
                                                                Ditutup:{' '}
                                                                {format(new Date(bootcamp.registration_deadline), 'dd MMM yyyy', { locale: id })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Separator className="mb-3" />

                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            {bootcamp.strikethrough_price > 0 && (
                                                                <p className="text-muted-foreground text-xs line-through">
                                                                    {rupiahFormatter.format(bootcamp.strikethrough_price)}
                                                                </p>
                                                            )}
                                                            <p className={`text-lg font-bold ${isDisabled ? 'text-gray-500' : 'text-primary'}`}>
                                                                {bootcamp.price === 0 ? 'Gratis' : rupiahFormatter.format(bootcamp.price)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </LinkOrDiv>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                                <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-8">
                                    <img src="/assets/images/not-found.webp" alt="Bootcamp Belum Tersedia" className="w-36" />
                                    <div className="text-center text-gray-500">Belum ada bootcamp yang pernah diajar.</div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="webinars" className="mt-6">
                        {webinars.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {webinars.map((webinar) => {
                                    const isDisabled = webinar.is_registration_closed;
                                    const LinkOrDiv = isDisabled ? 'div' : Link;
                                    const linkProps = isDisabled ? {} : { href: `/webinar/${webinar.slug}` };

                                    return (
                                        <LinkOrDiv key={webinar.id} {...linkProps} className={`group ${isDisabled ? 'cursor-not-allowed' : ''}`}>
                                            <div
                                                className={`h-full overflow-hidden rounded-lg border border-gray-200 bg-white transition-all ${
                                                    isDisabled ? 'opacity-60' : 'hover:shadow-lg'
                                                }`}
                                            >
                                                <div className="relative aspect-video overflow-hidden">
                                                    <img
                                                        src={webinar.thumbnail ? `/storage/${webinar.thumbnail}` : '/assets/images/placeholder.png'}
                                                        alt={webinar.title}
                                                        className={`h-full w-full object-cover ${!isDisabled && 'transition-transform group-hover:scale-105'}`}
                                                    />
                                                    {isDisabled && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                            <Badge variant="destructive" className="px-4 py-2 text-sm font-semibold">
                                                                Pendaftaran Ditutup
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {webinar.category.name}
                                                        </Badge>
                                                        {webinar.batch && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Batch {webinar.batch}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <h3
                                                        className={`mb-2 line-clamp-2 font-semibold transition-colors ${
                                                            !isDisabled && 'group-hover:text-primary'
                                                        }`}
                                                    >
                                                        {webinar.title}
                                                    </h3>

                                                    <div className="text-muted-foreground mb-3 space-y-1 text-xs">
                                                        <div className="flex items-center gap-1">
                                                            <CalendarDays className="h-3 w-3" />
                                                            {format(new Date(webinar.start_time), 'dd MMM yyyy', { locale: id })}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(webinar.start_time), 'HH:mm', { locale: id })} -{' '}
                                                            {format(new Date(webinar.end_time), 'HH:mm', { locale: id })} WIB
                                                        </div>
                                                        {isDisabled && (
                                                            <div className="flex items-center gap-1 font-medium text-red-600">
                                                                <Calendar className="h-3 w-3" />
                                                                Ditutup:{' '}
                                                                {format(new Date(webinar.registration_deadline), 'dd MMM yyyy', { locale: id })}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Separator className="mb-3" />

                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            {webinar.strikethrough_price > 0 && (
                                                                <p className="text-muted-foreground text-xs line-through">
                                                                    {rupiahFormatter.format(webinar.strikethrough_price)}
                                                                </p>
                                                            )}
                                                            <p className={`text-lg font-bold ${isDisabled ? 'text-gray-500' : 'text-primary'}`}>
                                                                {webinar.price === 0 ? 'Gratis' : rupiahFormatter.format(webinar.price)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </LinkOrDiv>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                                <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-8">
                                    <img src="/assets/images/not-found.webp" alt="Webinar Belum Tersedia" className="w-36" />
                                    <div className="text-center text-gray-500">Belum ada webinar yang pernah diajar.</div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="articles" className="mt-6">
                        {articles.length > 0 ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {articles.map((article) => (
                                    <Link key={article.id} href={`/article/${article.slug}`} className="group">
                                        <div className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg">
                                            <div className="aspect-video overflow-hidden">
                                                <img
                                                    src={article.thumbnail ? `/storage/${article.thumbnail}` : '/assets/images/placeholder.png'}
                                                    alt={article.title}
                                                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <Badge variant="secondary" className="mb-2 text-xs">
                                                    {article.category.name}
                                                </Badge>

                                                <h3 className="group-hover:text-primary mb-2 line-clamp-2 font-semibold transition-colors">
                                                    {article.title}
                                                </h3>

                                                {article.excerpt && (
                                                    <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{article.excerpt}</p>
                                                )}

                                                <div className="text-muted-foreground flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {article.read_time} min
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            {article.views}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(article.published_at), 'dd MMM', { locale: id })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-8 rounded-lg border border-gray-200 bg-white shadow-sm">
                                <div className="flex min-h-[300px] flex-col items-center justify-center gap-2 p-8">
                                    <img src="/assets/images/not-found.webp" alt="Artikel Belum Tersedia" className="w-36" />
                                    <div className="text-center text-gray-500">Belum ada artikel yang pernah dibuat.</div>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </UserLayout>
    );
}
