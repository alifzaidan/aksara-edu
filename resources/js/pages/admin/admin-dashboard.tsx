import { BookOpen, DollarSign, Laptop, Mic, Network, UserCheck, UserPlus, Users } from 'lucide-react';

interface InvoiceItem {
    course_items?: { course: { title: string } }[];
    bootcamp_items?: { bootcamp: { title: string } }[];
    webinar_items?: { webinar: { title: string } }[];
}

interface RecentSale {
    id: number | string;
    user: {
        name: string;
    };
    amount: number;
    course_items?: { course: { title: string } }[];
    bootcamp_items?: { bootcamp: { title: string } }[];
    webinar_items?: { webinar: { title: string } }[];
}

interface PopularCourse {
    course_id: number | string;
    course: {
        title: string;
    };
    enrollment_count: number;
}

interface StatsProps {
    stats: {
        total_revenue: number;
        total_participants: number;
        new_users_last_week: number;
        total_mentors: number;
        total_affiliates: number;
        total_courses: number;
        total_bootcamps: number;
        total_webinars: number;
        recent_sales: RecentSale[];
        popular_courses: PopularCourse[];
    };
}

const formatCurrency = (amount: number | string) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(numericAmount);
};

const getInvoiceItemName = (invoice: InvoiceItem): string => {
    if (invoice.course_items?.length && invoice.course_items.length > 0) return `Kelas: ${invoice.course_items[0].course.title}`;
    if (invoice.bootcamp_items?.length && invoice.bootcamp_items.length > 0) return `Bootcamp: ${invoice.bootcamp_items[0].bootcamp.title}`;
    if (invoice.webinar_items?.length && invoice.webinar_items.length > 0) return `Webinar: ${invoice.webinar_items[0].webinar.title}`;
    return 'Produk tidak diketahui';
};

export default function AdminDashboard({ stats }: StatsProps) {
    const statsCards = [
        { title: 'Total Pendapatan', value: formatCurrency(stats.total_revenue), icon: <DollarSign className="text-muted-foreground size-5" /> },
        {
            title: 'Total Pendaftar Program',
            value: stats.total_participants.toLocaleString('id-ID'),
            icon: <Users className="text-muted-foreground size-5" />,
        },
        {
            title: 'Pengguna Baru (7d)',
            value: `+${stats.new_users_last_week.toLocaleString('id-ID')}`,
            icon: <UserPlus className="text-muted-foreground size-5" />,
        },
        { title: 'Total Mentor', value: stats.total_mentors.toLocaleString('id-ID'), icon: <UserCheck className="text-muted-foreground size-5" /> },
        {
            title: 'Total Afiliasi',
            value: stats.total_affiliates.toLocaleString('id-ID'),
            icon: <Network className="text-muted-foreground size-5" />,
        },
        {
            title: 'Total Kelas Online',
            value: stats.total_courses.toLocaleString('id-ID'),
            icon: <BookOpen className="text-muted-foreground size-5" />,
        },
        { title: 'Total Bootcamp', value: stats.total_bootcamps.toLocaleString('id-ID'), icon: <Laptop className="text-muted-foreground size-5" /> },
        { title: 'Total Webinar', value: stats.total_webinars.toLocaleString('id-ID'), icon: <Mic className="text-muted-foreground size-5" /> },
    ];

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((card, index) => (
                    <div key={index} className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="text-sm font-medium tracking-tight">{card.title}</h3>
                            {card.icon}
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold">Penjualan Terbaru</h3>
                    <div className="mt-4 space-y-6">
                        {stats.recent_sales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-4 py-12">
                                <img src="/assets/images/not-found.svg" alt="Penjualan Tidak Tersedia" className="w-48" />
                                <div className="text-center text-gray-500">Belum ada penjualan terbaru saat ini.</div>
                            </div>
                        ) : (
                            stats.recent_sales.map((sale) => (
                                <div key={sale.id} className="flex items-center">
                                    <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                                        <span className="font-medium">{sale.user.name.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="ml-4 flex-1 space-y-1">
                                        <p className="text-sm leading-none font-medium">{sale.user.name}</p>
                                        <p className="text-muted-foreground text-sm">{getInvoiceItemName(sale)}</p>
                                    </div>
                                    <div className="font-medium">{formatCurrency(sale.amount)}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Kelas Terpopuler</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Kelas dengan pendaftar terbanyak.</p>
                    <ul className="space-y-4">
                        {stats.popular_courses.map((course) => (
                            <li key={course.course_id} className="flex items-center justify-between">
                                <span className="text-sm font-medium">{course.course.title}</span>
                                <span className="text-sm font-semibold">{course.enrollment_count.toLocaleString('id-ID')}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
}
