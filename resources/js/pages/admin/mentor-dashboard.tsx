import { BookOpen, DollarSign, Star, Users } from 'lucide-react';

const mentorStatsCards = [
    {
        title: 'Pendapatan Bulan Ini',
        value: 'Rp 12.500.000',
        change: '+15% dari bulan lalu',
        icon: <DollarSign className="text-muted-foreground size-5" />,
    },
    { title: 'Total Siswa Anda', value: '450', change: '+50 siswa baru', icon: <Users className="text-muted-foreground size-5" /> },
    { title: 'Jumlah Kelas Aktif', value: '5', change: 'Anda mengajar 5 kelas', icon: <BookOpen className="text-muted-foreground size-5" /> },
    { title: 'Rating Rata-rata', value: '4.8', change: 'Dari semua kelas Anda', icon: <Star className="text-muted-foreground size-5" /> },
];
const mentorRecentActivity = [
    { name: 'Ahmad Subarjo', activity: 'menyelesaikan kuis di kelas "UI/UX Design"', avatar: 'AS' },
    { name: 'Citra Lestari', activity: 'mengajukan pertanyaan di kelas "Full-Stack"', avatar: 'CL' },
    { name: 'Budi Santoso', activity: 'memberikan rating 5 bintang untuk kelas "UI/UX"', avatar: 'BS' },
];

export default function MentorDashboard() {
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
                            <p className="text-muted-foreground text-xs">{card.change}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                <h3 className="text-lg font-semibold">Aktivitas Siswa Terbaru</h3>
                <p className="text-muted-foreground mb-4 text-sm">Interaksi terbaru dari siswa di kelas Anda.</p>
                <div className="space-y-6">
                    {mentorRecentActivity.map((act, index) => (
                        <div key={index} className="flex items-center">
                            <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                                <span className="font-medium">{act.avatar}</span>
                            </div>
                            <div className="ml-4 flex-1 space-y-1">
                                <p className="text-sm leading-none font-medium">{act.name}</p>
                                <p className="text-muted-foreground text-sm">{act.activity}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
