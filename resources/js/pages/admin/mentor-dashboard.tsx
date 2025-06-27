import { BookOpen, DollarSign, Star, Users } from 'lucide-react';

interface Enrollment {
    id: number | string;
    user: {
        name: string;
    };
    course: {
        title: string;
    };
}

interface MentorStatsProps {
    stats: {
        revenue_this_month: number;
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
    const mentorStatsCards = [
        {
            title: 'Pendapatan Bulan Ini',
            value: formatCurrency(stats.revenue_this_month),
            icon: <DollarSign className="text-muted-foreground size-5" />,
        },
        { title: 'Total Siswa Anda', value: stats.total_students.toLocaleString('id-ID'), icon: <Users className="text-muted-foreground size-5" /> },
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

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                    {stats.recent_enrollments.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                            <img src="/assets/images/not-found.svg" alt="Pendaftar Tidak Tersedia" className="w-48" />
                            <div className="text-center text-gray-500">Belum ada pendaftar baru saat ini.</div>
                        </div>
                    ) : (
                        stats.recent_enrollments.map((enrollment) => (
                            <div key={enrollment.id} className="flex items-center">
                                <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                                    <span className="font-medium">{enrollment.user.name.substring(0, 2).toUpperCase()}</span>
                                </div>
                                <div className="ml-4 flex-1 space-y-1">
                                    <p className="text-sm leading-none font-medium">{enrollment.user.name}</p>
                                    <p className="text-muted-foreground text-sm">Mendaftar di kelas "{enrollment.course.title}"</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
