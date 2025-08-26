import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SharedData } from '@/types';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    CalendarIcon,
    ChartNoAxesGantt,
    ChevronDownIcon,
    Copy,
    DollarSign,
    Euro,
    Filter,
    MousePointerClick,
    TrendingDown,
    TrendingUp,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AffiliateStatsProps {
    user: SharedData['auth']['user'];
    stats: {
        total_commission: number;
        commission_this_month: number;
        commission_today: number;
        commission_yesterday: number;
        commission_last_month: number;
        daily_commission_change: number;
        monthly_commission_change: number;
        total_referrals: number;
        total_clicks: number;
        conversion_rate: number;
        recent_referrals: {
            id: number | string;
            amount: number;
            invoice: {
                user: {
                    name: string;
                };
                course_items?: { course: { title: string } }[];
                bootcamp_items?: { bootcamp: { title: string } }[];
                webinar_items?: { webinar: { title: string } }[];
            };
        }[];
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

type InvoiceItem = {
    course_items?: { course: { title: string } }[];
    bootcamp_items?: { bootcamp: { title: string } }[];
    webinar_items?: { webinar: { title: string } }[];
    user: { name: string };
};

const getInvoiceItemName = (invoice: InvoiceItem): string => {
    if (invoice.course_items?.length && invoice.course_items.length > 0) return `Kelas: ${invoice.course_items[0].course.title}`;
    if (invoice.bootcamp_items?.length && invoice.bootcamp_items.length > 0) return `Bootcamp: ${invoice.bootcamp_items[0].bootcamp.title}`;
    if (invoice.webinar_items?.length && invoice.webinar_items.length > 0) return `Webinar: ${invoice.webinar_items[0].webinar.title}`;
    return 'Produk tidak diketahui';
};

export default function AffiliateDashboard({ user, stats, filters }: AffiliateStatsProps) {
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
            title: 'Total Komisi',
            value: formatCurrency(stats.total_commission),
            icon: <DollarSign className="text-muted-foreground size-5" />,
            color: 'bg-green-100',
            subtitle:
                hasActiveFilter && stats.filtered_date_range
                    ? `${stats.filtered_date_range.start} - ${stats.filtered_date_range.end}`
                    : 'Semua periode',
        },
        {
            title: 'Komisi Bulan Ini',
            value: formatCurrency(stats.commission_this_month),
            icon: <Euro className="text-muted-foreground size-5" />,
            color: 'bg-blue-100',
            percentage: stats.monthly_commission_change,
            comparison: ` bulan lalu (${formatCurrency(stats.commission_last_month)})`,
        },
        {
            title: 'Komisi Hari Ini',
            value: formatCurrency(stats.commission_today),
            icon: <TrendingUp className="text-muted-foreground size-5" />,
            color: 'bg-yellow-100',
            percentage: stats.daily_commission_change,
            comparison: ` kemarin (${formatCurrency(stats.commission_yesterday)})`,
        },
    ];

    const affiliateStatsCards = [
        {
            title: 'Total Pendaftaran',
            value: stats.total_referrals.toLocaleString('id-ID'),
            icon: <Users className="text-muted-foreground size-5" />,
            color: 'bg-purple-100',
        },
        {
            title: 'Total Klik Link',
            value: stats.total_clicks.toLocaleString('id-ID'),
            icon: <MousePointerClick className="text-muted-foreground size-5" />,
            color: 'bg-orange-100',
        },
        {
            title: 'Tingkat Konversi',
            value: `${stats.conversion_rate}%`,
            icon: <TrendingUp className="text-muted-foreground size-5" />,
            color: 'bg-green-100',
        },
    ];

    return (
        <>
            <div className="space-y-6">
                <div className="bg-card mb-6 rounded-lg border p-4">
                    <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Filter Total Komisi</label>
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
                    {affiliateStatsCards.map((card, index) => (
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

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm lg:col-span-2">
                        <h3 className="text-lg font-semibold">Referral Terbaru</h3>
                        <p className="text-muted-foreground mb-4 text-sm">Pendaftaran baru melalui link afiliasi Anda.</p>
                        <div className="space-y-6">
                            {stats.recent_referrals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-4 py-12">
                                    <img src="/assets/images/not-found.webp" alt="Referral Tidak Tersedia" className="w-48" />
                                    <div className="text-center text-gray-500">Belum ada referral baru saat ini.</div>
                                </div>
                            ) : (
                                stats.recent_referrals.map((ref) => (
                                    <div key={ref.id} className="flex items-center">
                                        <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                                            <span className="font-medium">{ref.invoice.user.name.substring(0, 2).toUpperCase()}</span>
                                        </div>
                                        <div className="ml-4 flex-1 space-y-1">
                                            <p className="text-sm leading-none font-medium">{ref.invoice.user.name}</p>
                                            <p className="text-muted-foreground text-sm">{getInvoiceItemName(ref.invoice)}</p>
                                        </div>
                                        <div className="font-medium">{formatCurrency(ref.amount)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                        <h3 className="text-lg font-semibold">Link Afiliasi Anda</h3>
                        <p className="text-muted-foreground mb-4 text-sm">Gunakan link ini untuk promosi.</p>
                        <div className="bg-muted flex items-center space-x-2 rounded-lg border p-3">
                            <p className="text-muted-foreground flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                                {`https://aksademy.com/register?ref=${user.affiliate_code}`}
                            </p>
                            <button
                                onClick={() => navigator.clipboard.writeText(`https://aksademy.com/register?ref=${user.affiliate_code}`)}
                                className="hover:bg-background shrink-0 rounded p-2"
                            >
                                <Copy className="size-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
