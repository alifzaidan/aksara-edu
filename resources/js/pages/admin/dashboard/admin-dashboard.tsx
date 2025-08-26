import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    BookOpen,
    CalendarIcon,
    ChartNoAxesGantt,
    ChevronDownIcon,
    DollarSign,
    Euro,
    Filter,
    Laptop,
    Mic,
    Network,
    TrendingDown,
    TrendingUp,
    UserCheck,
    UserPlus,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ParticipantChart } from './charts/participant-chart';
import { RevenueChart } from './charts/revenue-chart';

interface RecentSale {
    id: number | string;
    user: {
        name: string;
    };
    nett_amount: number;
    course_items?: { course: { title: string } }[];
    bootcamp_items?: { bootcamp: { title: string } }[];
    webinar_items?: { webinar: { title: string } }[];
}

interface PopularProduct {
    id: number | string;
    title: string;
    type: 'course' | 'bootcamp' | 'webinar';
    enrollment_count: number;
    thumbnail?: string;
    price: number;
}

interface MonthlyRevenueData {
    month: string;
    year: number;
    month_year: string;
    total_amount: number;
    transaction_count: number;
}

interface ParticipantData {
    date: string;
    count: number;
    type: 'course' | 'bootcamp' | 'webinar';
}

interface StatsProps {
    stats: {
        total_revenue: number;
        revenue_this_month: number;
        revenue_today: number;
        revenue_yesterday: number;
        revenue_last_month: number;
        daily_revenue_change: number;
        monthly_revenue_change: number;
        total_participants: number;
        participants_this_month: number;
        total_users: number;
        new_users_last_week: number;
        total_mentors: number;
        new_mentors_last_week: number;
        total_affiliates: number;
        new_affiliates_last_week: number;
        total_courses: number;
        total_bootcamps: number;
        total_webinars: number;
        recent_sales: RecentSale[];
        monthly_revenue_data: MonthlyRevenueData[];
        participant_data: ParticipantData[];
        popular_products: PopularProduct[];
        filtered_date_range?: {
            start: string;
            end: string;
        } | null;
    };
    filters?: {
        start_date?: string;
        end_date?: string;
    };
}

const formatPercentage = (percentage: number): string => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`;
};

const getPercentageColor = (percentage: number): string => {
    if (percentage > 0) return 'text-green-600';
    if (percentage < 0) return 'text-red-600';
    return 'text-gray-600';
};

const getPercentageIcon = (percentage: number) => {
    if (percentage > 0) return <TrendingUp className="h-3 w-3" />;
    if (percentage < 0) return <TrendingDown className="h-3 w-3" />;
    return <ChartNoAxesGantt className="h-3 w-3" />;
};

const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(numericAmount);
};

const getInvoiceItemName = (invoice: RecentSale): string => {
    if (invoice.course_items?.length && invoice.course_items.length > 0) return `Kelas: ${invoice.course_items[0].course.title}`;
    if (invoice.bootcamp_items?.length && invoice.bootcamp_items.length > 0) return `Bootcamp: ${invoice.bootcamp_items[0].bootcamp.title}`;
    if (invoice.webinar_items?.length && invoice.webinar_items.length > 0) return `Webinar: ${invoice.webinar_items[0].webinar.title}`;
    return 'Produk tidak diketahui';
};

const getProductTypeBadge = (type: string) => {
    const styles = {
        course: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        bootcamp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        webinar: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };

    const labels = {
        course: 'Kelas',
        bootcamp: 'Bootcamp',
        webinar: 'Webinar',
    };

    return (
        <Badge variant="secondary" className={styles[type as keyof typeof styles]}>
            {labels[type as keyof typeof labels]}
        </Badge>
    );
};

export default function AdminDashboard({ stats, filters }: StatsProps) {
    const [startDate, setStartDate] = useState<Date | undefined>(() => {
        if (filters?.start_date) {
            const date = new Date(filters.start_date + 'T00:00:00');
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    });

    const [endDate, setEndDate] = useState<Date | undefined>(() => {
        if (filters?.end_date) {
            const date = new Date(filters.end_date + 'T00:00:00');
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    });

    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);

    const handleApplyFilter = () => {
        const params: Record<string, string> = {};

        if (startDate) {
            params.start_date = format(startDate, 'yyyy-MM-dd');
        }
        if (endDate) {
            params.end_date = format(endDate, 'yyyy-MM-dd');
        }

        router.get(route('dashboard'), params, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    const handleClearFilter = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        router.get(
            route('dashboard'),
            {},
            {
                preserveState: false,
                preserveScroll: true,
            },
        );
    };

    const hasActiveFilter = startDate && endDate;

    useEffect(() => {
        if (filters?.start_date) {
            const date = new Date(filters.start_date + 'T00:00:00');
            if (!isNaN(date.getTime())) {
                setStartDate(date);
            }
        } else {
            setStartDate(undefined);
        }

        if (filters?.end_date) {
            const date = new Date(filters.end_date + 'T00:00:00');
            if (!isNaN(date.getTime())) {
                setEndDate(date);
            }
        } else {
            setEndDate(undefined);
        }
    }, [filters?.start_date, filters?.end_date]);

    const topStatsCards = [
        {
            title: 'Total Pendapatan',
            value: formatCurrency(stats.total_revenue),
            icon: <DollarSign className="text-muted-foreground size-5" />,
            color: 'bg-green-100',
            subtitle:
                hasActiveFilter && stats.filtered_date_range
                    ? `${stats.filtered_date_range.start} - ${stats.filtered_date_range.end}`
                    : 'Semua periode',
        },
        {
            title: 'Pendapatan Bulan Ini',
            value: formatCurrency(stats.revenue_this_month),
            icon: <Euro className="text-muted-foreground size-5" />,
            color: 'bg-blue-100',
            percentage: stats.monthly_revenue_change,
            comparison: ` bulan lalu (${formatCurrency(stats.revenue_last_month)})`,
        },
        {
            title: 'Pendapatan Hari Ini',
            value: formatCurrency(stats.revenue_today),
            icon: <TrendingUp className="text-muted-foreground size-5" />,
            color: 'bg-yellow-100',
            percentage: stats.daily_revenue_change,
            comparison: ` kemarin (${formatCurrency(stats.revenue_yesterday)})`,
        },
    ];

    const bottomStatsCards = [
        {
            title: 'Total Pengguna',
            value: stats.total_users.toLocaleString('id-ID'),
            icon: <UserPlus className="text-muted-foreground size-5" />,
            subValue: `+${stats.new_users_last_week.toLocaleString('id-ID')} dalam 7 hari`,
            color: 'bg-purple-100',
        },
        {
            title: 'Total Mentor',
            value: stats.total_mentors.toLocaleString('id-ID'),
            icon: <UserCheck className="text-muted-foreground size-5" />,
            subValue: `+${stats.new_mentors_last_week.toLocaleString('id-ID')} dalam 7 hari`,
            color: 'bg-green-100',
        },
        {
            title: 'Total Afiliasi',
            value: stats.total_affiliates.toLocaleString('id-ID'),
            icon: <Network className="text-muted-foreground size-5" />,
            subValue: `+${stats.new_affiliates_last_week.toLocaleString('id-ID')} dalam 7 hari`,
            color: 'bg-blue-100',
        },
        {
            title: 'Total Kelas Online',
            value: stats.total_courses.toLocaleString('id-ID'),
            icon: <BookOpen className="text-muted-foreground size-5" />,
            color: 'bg-yellow-100',
        },
        {
            title: 'Total Bootcamp',
            value: stats.total_bootcamps.toLocaleString('id-ID'),
            icon: <Laptop className="text-muted-foreground size-5" />,
            color: 'bg-red-100',
        },
        {
            title: 'Total Webinar',
            value: stats.total_webinars.toLocaleString('id-ID'),
            icon: <Mic className="text-muted-foreground size-5" />,
            color: 'bg-purple-200',
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <div className="bg-card mb-6 rounded-lg border p-4">
                        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Filter Total Pendapatan</label>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-between text-left font-normal sm:w-[200px]',
                                                    !startDate && 'text-muted-foreground',
                                                )}
                                            >
                                                <div className="flex items-center">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {startDate ? format(startDate, 'dd MMM yyyy', { locale: id }) : 'Tanggal mulai'}
                                                </div>
                                                <ChevronDownIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={startDate}
                                                captionLayout="dropdown"
                                                onSelect={(date) => {
                                                    setStartDate(date);
                                                    setIsStartDateOpen(false);
                                                }}
                                                disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>

                                    <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-between text-left font-normal sm:w-[200px]',
                                                    !endDate && 'text-muted-foreground',
                                                )}
                                            >
                                                <div className="flex items-center">
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {endDate ? format(endDate, 'dd MMM yyyy', { locale: id }) : 'Tanggal selesai'}
                                                </div>
                                                <ChevronDownIcon className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={endDate}
                                                captionLayout="dropdown"
                                                onSelect={(date) => {
                                                    setEndDate(date);
                                                    setIsEndDateOpen(false);
                                                }}
                                                disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleApplyFilter} disabled={!startDate || !endDate} className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Terapkan Filter
                                </Button>

                                {hasActiveFilter && (
                                    <Button variant="outline" onClick={handleClearFilter} className="flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        Hapus Filter
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {topStatsCards.map((card, index) => (
                            <div key={index} className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="text-sm font-medium tracking-tight">{card.title}</h3>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.color}`}>{card.icon}</div>
                                </div>
                                <div>
                                    <div className="mb-2 text-2xl font-bold">{card.value}</div>
                                    {card.subtitle && <p className="text-muted-foreground mb-2 text-xs">{card.subtitle}</p>}
                                    {card.percentage !== undefined && (
                                        <div className="flex items-center space-x-1">
                                            <span className={`flex items-center text-xs font-medium ${getPercentageColor(card.percentage)}`}>
                                                {getPercentageIcon(card.percentage)}
                                                <span className="ml-1">{formatPercentage(card.percentage)}</span>
                                            </span>
                                            <span className="text-muted-foreground text-xs">{card.comparison}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <RevenueChart data={stats.monthly_revenue_data} />
                    <ParticipantChart data={stats.participant_data} />

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {bottomStatsCards.map((card, index) => (
                            <div key={index} className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="text-sm font-medium tracking-tight">{card.title}</h3>
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.color}`}>{card.icon}</div>
                                </div>
                                <div>
                                    <div className="mb-1 text-2xl font-bold">{card.value}</div>
                                    {card.subValue && <p className="text-muted-foreground text-xs">{card.subValue}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                        <h3 className="text-lg font-semibold">Total Pendaftar Produk</h3>
                        <div className="mb-2 text-2xl font-bold text-green-500">{stats.total_participants.toLocaleString('id-ID')}</div>
                        <div className="text-muted-foreground mb-4 flex items-center gap-2">
                            <p className="text-sm">{stats.participants_this_month.toLocaleString('id-ID')} Pendaftar Bulan ini</p>
                            <TrendingUp size="20" />
                        </div>
                        <Separator className="mb-4" />
                        <h3 className="text-lg font-semibold">Pendaftar Produk Terbaru</h3>
                        <div className="mt-4 space-y-6">
                            {stats.recent_sales.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-4 py-12">
                                    <img src="/assets/images/not-found.webp" alt="Penjualan Tidak Tersedia" className="w-48" />
                                    <div className="text-center text-gray-500">Belum ada penjualan terbaru saat ini.</div>
                                </div>
                            ) : (
                                stats.recent_sales.map((sale) => (
                                    <div key={sale.id} className="flex items-center">
                                        <div className="flex-1 space-y-1">
                                            <p className="text-sm leading-none font-medium">{sale.user.name}</p>
                                            <p className="text-muted-foreground text-sm">{getInvoiceItemName(sale)}</p>
                                        </div>
                                        <div className="font-medium">{formatCurrency(sale.nett_amount)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                        <h3 className="text-lg font-semibold">Produk Terpopuler</h3>
                        <p className="text-muted-foreground mb-4 text-sm">Produk dengan pendaftar terbanyak.</p>
                        <div className="space-y-4">
                            {stats.popular_products.length === 0 ? (
                                <div className="py-8 text-center text-gray-500">Belum ada data produk populer.</div>
                            ) : (
                                stats.popular_products.slice(0, 8).map((product) => (
                                    <div key={product.id} className="flex items-center justify-between">
                                        <div className="flex min-w-0 flex-1 items-center space-x-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{product.title}</p>
                                                <div className="mt-1 flex items-center space-x-2">
                                                    {getProductTypeBadge(product.type)}
                                                    <span className="text-muted-foreground text-xs">{formatCurrency(product.price)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-right">
                                            <span className="text-sm font-semibold">{product.enrollment_count}</span>
                                            <p className="text-muted-foreground text-xs">pendaftar</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
