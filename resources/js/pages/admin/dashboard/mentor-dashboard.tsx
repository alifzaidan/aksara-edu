import { BookOpen, DollarSign, Star, TrendingUp, Users } from 'lucide-react';

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
        total_students: number;
        active_courses: number;
        average_rating: number | string | null;
        recent_enrollments: Enrollment[];
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function MentorDashboard({ stats }: MentorStatsProps) {
    const topStatsCards = [
        {
            title: 'Total Pendapatan',
            value: formatCurrency(stats.total_revenue),
            icon: <DollarSign className="text-muted-foreground size-5" />,
        },
        {
            title: 'Pendapatan Bulan Ini',
            value: formatCurrency(stats.revenue_this_month),
            icon: <DollarSign className="text-muted-foreground size-5" />,
        },
        {
            title: 'Pendapatan Hari Ini',
            value: formatCurrency(stats.revenue_today),
            icon: <TrendingUp className="text-muted-foreground size-5" />,
        },
    ];

    const mentorStatsCards = [
        {
            title: 'Total Siswa Anda',
            value: stats.total_students.toLocaleString('id-ID'),
            icon: <Users className="text-muted-foreground size-5" />,
        },
        {
            title: 'Jumlah Kelas Aktif',
            value: stats.active_courses.toLocaleString('id-ID'),
            icon: <BookOpen className="text-muted-foreground size-5" />,
        },
        {
            title: 'Rating Rata-rata',
            value: stats.average_rating ? Number(stats.average_rating).toFixed(1) : 'N/A',
            icon: <Star className="text-muted-foreground size-5" />,
        },
    ];

    const validEnrollments = stats.recent_enrollments?.filter((enrollment) => enrollment?.user?.name && enrollment?.course?.title) || [];

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {topStatsCards.map((card, index) => (
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
                {mentorStatsCards.map((card, index) => (
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
        </>
    );
}
