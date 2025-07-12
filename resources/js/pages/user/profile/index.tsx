import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookTextIcon, ExternalLink, GraduationCap, MessageCircle, MonitorPlay, Play, Presentation } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    slug: string;
    type: 'course' | 'bootcamp' | 'webinar';
    progress?: number;
    completed_at?: string;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    group_url?: string;
    enrolled_at: string;
}

interface ProfileProps {
    stats: {
        courses: number;
        bootcamps: number;
        webinars: number;
        total: number;
    };
    recentProducts: Product[];
}

export default function Profile({ stats, recentProducts }: ProfileProps) {
    const getProductTypeLabel = (type: string): string => {
        switch (type) {
            case 'course':
                return 'Kelas Online';
            case 'bootcamp':
                return 'Bootcamp';
            case 'webinar':
                return 'Webinar';
            default:
                return 'Produk';
        }
    };

    const getProductTypeIcon = (type: string) => {
        switch (type) {
            case 'course':
                return <BookTextIcon className="h-4 w-4" />;
            case 'bootcamp':
                return <Presentation className="h-4 w-4" />;
            case 'webinar':
                return <MonitorPlay className="h-4 w-4" />;
            default:
                return <GraduationCap className="h-4 w-4" />;
        }
    };

    const getProgressBadge = (progress: number) => {
        if (progress === 100) {
            return <Badge className="border-green-300 bg-green-100 text-green-700">Selesai</Badge>;
        } else if (progress > 0) {
            return <Badge className="border-blue-300 bg-blue-100 text-blue-700">Berlangsung</Badge>;
        } else {
            return <Badge className="border-gray-300 bg-gray-100 text-gray-700">Belum Dimulai</Badge>;
        }
    };

    const formatSchedule = (product: Product): string => {
        if (product.type === 'bootcamp') {
            const startDate = format(new Date(product.start_date!), 'dd MMM yyyy', { locale: id });
            const endDate = product.end_date ? format(new Date(product.end_date), 'dd MMM yyyy', { locale: id }) : '';
            return endDate ? `${startDate} - ${endDate}` : startDate;
        }

        if (product.type === 'webinar') {
            const startTime = format(new Date(product.start_time!), 'dd MMM yyyy, HH:mm', { locale: id });
            const endTime = product.end_time ? format(new Date(product.end_time), 'HH:mm', { locale: id }) : '';
            return endTime ? `${startTime} - ${endTime}` : startTime;
        }

        return '-';
    };

    return (
        <UserLayout>
            <Head title="Profil" />
            <ProfileLayout>
                <Heading title="Dashboard" description="Pantau aktivitas dan progres belajar Anda di sini." />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
                            <GraduationCap className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-muted-foreground text-xs">Total item yang Anda ikuti</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Kelas Online</CardTitle>
                            <BookTextIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.courses}</div>
                            <p className="text-muted-foreground text-xs">Kelas yang telah Anda beli</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bootcamp</CardTitle>
                            <Presentation className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.bootcamps}</div>
                            <p className="text-muted-foreground text-xs">Bootcamp yang Anda ikuti</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Webinar</CardTitle>
                            <MonitorPlay className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.webinars}</div>
                            <p className="text-muted-foreground text-xs">Webinar yang Anda ikuti</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <Heading title="Produk Saya" description="Daftar produk yang telah Anda beli dan ikuti." />
                    <Card className="p-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>Tipe</TableHead>
                                    <TableHead>Jadwal</TableHead>
                                    <TableHead>Status/Progress</TableHead>
                                    <TableHead>Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentProducts.length > 0 ? (
                                    recentProducts.map((product) => (
                                        <TableRow key={`${product.type}-${product.id}`}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {getProductTypeIcon(product.type)}
                                                    <Link
                                                        href={route(`profile.${product.type}.detail`, { [product.type]: product.slug })}
                                                        className="hover:text-primary"
                                                    >
                                                        {product.title}
                                                    </Link>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getProductTypeLabel(product.type)}</TableCell>
                                            <TableCell>
                                                {product.type === 'course' ? (
                                                    <span className="text-gray-500">Belajar Mandiri</span>
                                                ) : (
                                                    formatSchedule(product)
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {product.type === 'course' ? (
                                                    <div className="space-y-2">
                                                        {getProgressBadge(product.progress || 0)}
                                                        <div className="flex items-center gap-2">
                                                            <Progress value={product.progress || 0} className="w-20" />
                                                            <span className="text-xs text-gray-500">{product.progress || 0}%</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                        Terdaftar
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {product.type === 'course' ? (
                                                        <Button asChild size="sm" variant="outline">
                                                            <Link href={route('profile.course.detail', { course: product.slug })}>
                                                                <Play className="mr-1 h-4 w-4" />
                                                                Belajar
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button asChild size="sm" variant="outline">
                                                                <Link
                                                                    href={route(`profile.${product.type}.detail`, { [product.type]: product.slug })}
                                                                >
                                                                    <ExternalLink className="mr-1 h-4 w-4" />
                                                                    Detail
                                                                </Link>
                                                            </Button>
                                                            {product.group_url && (
                                                                <Button asChild size="sm" variant="default">
                                                                    <a href={product.group_url} target="_blank" rel="noopener noreferrer">
                                                                        <MessageCircle className="mr-1 h-4 w-4" />
                                                                        Grup WA
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-8 text-center">
                                            <div className="text-gray-500">
                                                <GraduationCap className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                                                <p>Belum ada produk yang dibeli.</p>
                                                <Button asChild className="mt-4" variant="outline">
                                                    <Link href={route('course.index')}>Jelajahi Kelas</Link>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </div>
            </ProfileLayout>
        </UserLayout>
    );
}
