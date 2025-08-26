import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    Star,
    TrendingDown,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Enrollment {
    id: number | string;
    user: {
        name: string;
    };
    course: {
        title: string;
    };
    created_at: string;
}

interface MentorStatsProps {
    stats: {
        total_revenue: number;
        revenue_this_month: number;
        revenue_today: number;
        revenue_yesterday: number;
        revenue_last_month: number;
        daily_revenue_change: number;
        monthly_revenue_change: number;
        total_students: number;
        active_courses: number;
        average_rating: number | string | null;
        recent_enrollments: Enrollment[];
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

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

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

export default function MentorDashboard({ stats, filters }: MentorStatsProps) {
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

    const mentorStatsCards = [
        {
            title: 'Total Siswa Anda',
            value: stats.total_students.toLocaleString('id-ID'),
            icon: <Users className="text-muted-foreground size-5" />,
            color: 'bg-purple-100',
        },
        {
            title: 'Jumlah Kelas Aktif',
            value: stats.active_courses.toLocaleString('id-ID'),
            icon: <BookOpen className="text-muted-foreground size-5" />,
            color: 'bg-green-100',
        },
        {
            title: 'Rating Rata-rata',
            value: stats.average_rating ? Number(stats.average_rating).toFixed(1) : 'N/A',
            icon: <Star className="text-muted-foreground size-5" />,
            color: 'bg-yellow-100',
        },
    ];

    const validEnrollments = stats.recent_enrollments?.filter((enrollment) => enrollment?.user?.name && enrollment?.course?.title) || [];

    return (
        <>
            <div className="space-y-6">
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

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mentorStatsCards.map((card, index) => (
                        <div key={index} className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="text-sm font-medium tracking-tight">{card.title}</h3>
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.color}`}>{card.icon}</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{card.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Pendaftar Terbaru di Kelas Anda</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Siswa yang baru saja mendaftar di kelas Anda.</p>
                    <div className="space-y-6">
                        {validEnrollments.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                                <img src="/assets/images/not-found.webp" alt="Pendaftar Tidak Tersedia" className="w-48" />
                                <div className="text-center text-gray-500">Belum ada pendaftar baru saat ini.</div>
                            </div>
                        ) : (
                            validEnrollments.map((enrollment) => (
                                <div key={enrollment.id} className="flex items-center">
                                    <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                                        <span className="font-medium">{enrollment.user.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="ml-4 flex-1 space-y-1">
                                        <p className="text-sm leading-none font-medium">{enrollment.user.name}</p>
                                        <p className="text-muted-foreground text-sm">Mendaftar di kelas "{enrollment.course.title}"</p>
                                    </div>
                                    <div className="text-muted-foreground text-sm">
                                        {new Date(enrollment.created_at).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
