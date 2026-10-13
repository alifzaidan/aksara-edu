import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { formatExternalUrl } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { BookTextIcon, BriefcaseBusiness, ExternalLink, GraduationCap, MessageCircle, MonitorPlay, Play, Presentation } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Product {
    id: string;
    title: string;
    slug: string;
    type: 'course' | 'bootcamp' | 'webinar' | 'certification-program';
    routeParam?: string;
    is_scholarship?: boolean;
    progress?: number;
    completed_at?: string;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    group_url?: string;
    enrolled_at: string;
    is_installment?: boolean;
    is_fully_paid?: boolean;
    is_suspended?: boolean;
}

interface ProfileProps {
    stats: {
        courses: number;
        bootcamps: number;
        webinars: number;
        certificationPrograms: number;
        total: number;
    };
    recentProducts: Product[];
}

export default function Profile({ stats, recentProducts }: ProfileProps) {
    const { t, i18n } = useTranslation('profile');
    const dateLocale = i18n.language === 'en' ? enUS : id;

    const getProductTypeLabel = (type: string): string => {
        switch (type) {
            case 'course':
                return t('sidebar.courses');
            case 'bootcamp':
                return t('sidebar.bootcamps');
            case 'webinar':
                return t('sidebar.webinars');
            case 'certification-program':
                return t('sidebar.certifications');
            default:
                return t('dashboard.table.product');
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
            case 'certification-program':
                return <BriefcaseBusiness className="h-4 w-4" />;
            default:
                return <GraduationCap className="h-4 w-4" />;
        }
    };

    const getProductDetailHref = (product: Product) => {
        if (product.type === 'certification-program') {
            return route('profile.certification-program.detail', { program: product.slug });
        }

        return route(`profile.${product.type}.detail`, { [product.routeParam || product.type]: product.slug });
    };

    const getProgressBadge = (progress: number) => {
        if (progress === 100) {
            return <Badge className="border-green-300 bg-green-100 text-green-700">{t('dashboard.table.statusCompleted')}</Badge>;
        } else if (progress > 0) {
            return <Badge className="border-blue-300 bg-blue-100 text-blue-700">{t('dashboard.table.statusOngoing')}</Badge>;
        } else {
            return <Badge className="border-gray-300 bg-gray-100 text-gray-700">{t('dashboard.table.statusNotStarted')}</Badge>;
        }
    };

    const formatSchedule = (product: Product): string => {
        if (product.type === 'bootcamp') {
            const startDate = format(new Date(product.start_date!), 'dd MMM yyyy', { locale: dateLocale });
            const endDate = product.end_date ? format(new Date(product.end_date), 'dd MMM yyyy', { locale: dateLocale }) : '';
            return endDate ? `${startDate} - ${endDate}` : startDate;
        }

        if (product.type === 'webinar') {
            const startTime = format(new Date(product.start_time!), 'dd MMM yyyy, HH:mm', { locale: dateLocale });
            const endTime = product.end_time ? format(new Date(product.end_time), 'HH:mm', { locale: dateLocale }) : '';
            return endTime ? `${startTime} - ${endTime}` : startTime;
        }

        return '-';
    };

    return (
        <UserLayout>
            <Head title={t('sidebar.title')} />
            <ProfileLayout>
                <Heading title={t('dashboard.title')} description={t('dashboard.description')} />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.stats.total')}</CardTitle>
                            <GraduationCap className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-muted-foreground text-xs">{t('dashboard.stats.totalDesc')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.stats.courses')}</CardTitle>
                            <BookTextIcon className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.courses}</div>
                            <p className="text-muted-foreground text-xs">{t('dashboard.stats.coursesDesc')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.stats.bootcamps')}</CardTitle>
                            <Presentation className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.bootcamps}</div>
                            <p className="text-muted-foreground text-xs">{t('dashboard.stats.bootcampsDesc')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.stats.webinars')}</CardTitle>
                            <MonitorPlay className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.webinars}</div>
                            <p className="text-muted-foreground text-xs">{t('dashboard.stats.webinarsDesc')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('dashboard.stats.certifications')}</CardTitle>
                            <BriefcaseBusiness className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.certificationPrograms}</div>
                            <p className="text-muted-foreground text-xs">{t('dashboard.stats.certificationsDesc')}</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8">
                    <Heading title={t('dashboard.myProducts')} description={t('dashboard.myProductsDesc')} />
                    <Card className="p-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('dashboard.table.product')}</TableHead>
                                    <TableHead>{t('dashboard.table.type')}</TableHead>
                                    <TableHead>{t('dashboard.table.schedule')}</TableHead>
                                    <TableHead>{t('dashboard.table.statusProgress')}</TableHead>
                                    <TableHead>{t('dashboard.table.action')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentProducts.length > 0 ? (
                                    recentProducts.map((product) => (
                                        <TableRow key={`${product.type}-${product.id}`}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {getProductTypeIcon(product.type)}
                                                    <Link href={getProductDetailHref(product)} className="hover:text-primary">
                                                        {product.title}
                                                    </Link>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getProductTypeLabel(product.type)}</TableCell>
                                            <TableCell>
                                                {product.type === 'course' ? (
                                                    <span className="text-gray-500">{t('dashboard.table.selfPaced')}</span>
                                                ) : product.type === 'certification-program' ? (
                                                    <span className="text-gray-500">{t('dashboard.table.certRegistration')}</span>
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
                                                        {product.is_installment && (
                                                            <div>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        product.is_fully_paid
                                                                            ? 'border-green-300 bg-green-50 text-green-700'
                                                                            : product.is_suspended
                                                                              ? 'border-red-300 bg-red-50 text-red-700'
                                                                              : 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                                                    }
                                                                >
                                                                    {product.is_fully_paid
                                                                        ? t('dashboard.table.installmentPaid')
                                                                        : product.is_suspended
                                                                          ? t('dashboard.table.installmentSuspended')
                                                                          : t('dashboard.table.installmentActive')}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : product.type === 'certification-program' ? (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                                            {product.is_scholarship ? t('dashboard.table.scholarship') : t('dashboard.table.regular')}
                                                        </Badge>
                                                        {product.is_installment && (
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    product.is_fully_paid
                                                                        ? 'border-green-300 bg-green-50 text-green-700'
                                                                        : product.is_suspended
                                                                          ? 'border-red-300 bg-red-50 text-red-700'
                                                                          : 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                                                }
                                                             >
                                                                {product.is_fully_paid
                                                                    ? t('dashboard.table.installmentPaid')
                                                                    : product.is_suspended
                                                                      ? t('dashboard.table.installmentSuspended')
                                                                      : t('dashboard.table.installmentActive')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-start gap-1">
                                                        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                                                            {t('dashboard.table.statusRegistered')}
                                                        </Badge>
                                                        {product.is_installment && (
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    product.is_fully_paid
                                                                        ? 'border-green-300 bg-green-50 text-green-700'
                                                                        : product.is_suspended
                                                                          ? 'border-red-300 bg-red-50 text-red-700'
                                                                          : 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                                                }
                                                            >
                                                                {product.is_fully_paid
                                                                    ? t('dashboard.table.installmentPaid')
                                                                    : product.is_suspended
                                                                      ? t('dashboard.table.installmentSuspended')
                                                                      : t('dashboard.table.installmentActive')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {product.is_installment && !product.is_fully_paid && (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                                                        >
                                                            <Link href={route('profile.installments')}>
                                                                {t('dashboard.table.btnInstallment')}
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    {product.type === 'course' ? (
                                                        <Button asChild size="sm" variant="outline">
                                                            <Link href={route('profile.course.detail', { course: product.slug })}>
                                                                <Play className="mr-1 h-4 w-4" />
                                                                {t('dashboard.table.btnLearn')}
                                                            </Link>
                                                        </Button>
                                                    ) : product.type === 'certification-program' ? (
                                                        <>
                                                            <Button asChild size="sm" variant="outline">
                                                                <Link href={getProductDetailHref(product)}>
                                                                    <ExternalLink className="mr-1 h-4 w-4" />
                                                                    {t('dashboard.table.btnDetail')}
                                                                </Link>
                                                            </Button>
                                                            {product.group_url && (
                                                                <Button asChild size="sm" variant="default">
                                                                    <a href={formatExternalUrl(product.group_url)} target="_blank" rel="noopener noreferrer">
                                                                        <MessageCircle className="mr-1 h-4 w-4" />
                                                                        {t('dashboard.table.btnGroup')}
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button asChild size="sm" variant="outline">
                                                                <Link href={getProductDetailHref(product)}>
                                                                    <ExternalLink className="mr-1 h-4 w-4" />
                                                                    {t('dashboard.table.btnDetail')}
                                                                </Link>
                                                            </Button>
                                                            {product.group_url && (
                                                                <Button asChild size="sm" variant="default">
                                                                    <a href={formatExternalUrl(product.group_url)} target="_blank" rel="noopener noreferrer">
                                                                        <MessageCircle className="mr-1 h-4 w-4" />
                                                                        {t('dashboard.table.btnGroup')}
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
                                                <p>{t('dashboard.table.empty')}</p>
                                                <Button asChild className="mt-4" variant="outline">
                                                    <Link href={route('course.index')}>{t('dashboard.table.browseCourses')}</Link>
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
