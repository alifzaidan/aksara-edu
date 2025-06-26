import { BookOpen, DollarSign, Laptop, Mic, Network, UserCheck, UserPlus, Users } from 'lucide-react';

const statsCards = [
    {
        title: 'Total Pendapatan',
        value: 'Rp 78.450.000',
        change: '+20.1% dari bulan lalu',
        icon: <DollarSign className="text-muted-foreground size-5" />,
    },
    {
        title: 'Total Peserta',
        value: '1,230',
        change: '+18.1% dari bulan lalu',
        icon: <Users className="text-muted-foreground size-5" />,
    },
    {
        title: 'Pendaftar Baru',
        value: '+573',
        change: '+201 sejak minggu lalu',
        icon: <UserPlus className="text-muted-foreground size-5" />,
    },
    {
        title: 'Total Mentor',
        value: '25',
        change: '+3 bulan ini',
        icon: <UserCheck className="text-muted-foreground size-5" />,
    },
    {
        title: 'Total Afiliasi',
        value: '150',
        change: '+15 bulan ini',
        icon: <Network className="text-muted-foreground size-5" />,
    },
    {
        title: 'Total Kelas Online',
        value: '89',
        change: '+2 kelas baru',
        icon: <BookOpen className="text-muted-foreground size-5" />,
    },
    {
        title: 'Total Bootcamp',
        value: '12',
        change: '+1 bootcamp baru',
        icon: <Laptop className="text-muted-foreground size-5" />,
    },
    {
        title: 'Total Webinar',
        value: '35',
        change: '+4 webinar bulan ini',
        icon: <Mic className="text-muted-foreground size-5" />,
    },
];

// Data statis untuk penjualan terbaru
const recentSales = [
    {
        name: 'Olivia Martin',
        item: 'Bootcamp: Full-Stack Web Developer',
        amount: '+Rp 1.999.000',
        avatar: 'OM',
    },
    {
        name: 'Jackson Lee',
        item: 'Kelas Online: UI/UX Design Mastery',
        amount: '+Rp 390.000',
        avatar: 'JL',
    },
    {
        name: 'Isabella Nguyen',
        item: 'Webinar: Intro to Digital Marketing',
        amount: '+Rp 299.000',
        avatar: 'IN',
    },
    {
        name: 'William Kim',
        item: 'Kelas Online: Data Science with Python',
        amount: '+Rp 990.000',
        avatar: 'WK',
    },
    {
        name: 'Sofia Davis',
        item: 'Kelas Online: Android Development Kotlin',
        amount: '+Rp 390.000',
        avatar: 'SD',
    },
];

export default function AdminDashboard() {
    return (
        <>
            {/* Kartu Statistik */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((card, index) => (
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

            {/* Konten Utama */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Penjualan Terbaru */}
                <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold">Penjualan Terbaru</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Anda mendapatkan 265 penjualan bulan ini.</p>
                    <div className="space-y-6">
                        {recentSales.map((sale, index) => (
                            <div key={index} className="flex items-center">
                                <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                                    <span className="font-medium">{sale.avatar}</span>
                                </div>
                                <div className="ml-4 flex-1 space-y-1">
                                    <p className="text-sm leading-none font-medium">{sale.name}</p>
                                    <p className="text-muted-foreground text-sm">{sale.item}</p>
                                </div>
                                <div className="font-medium">{sale.amount}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kelas Terpopuler */}
                <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Kelas Terpopuler</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Kelas dengan pendaftar terbanyak bulan ini.</p>
                    <ul className="space-y-4">
                        <li className="flex items-center justify-between">
                            <span className="text-sm font-medium">Full-Stack Web Developer</span>
                            <span className="text-sm font-semibold">1.2k</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="text-sm font-medium">UI/UX Design Mastery</span>
                            <span className="text-sm font-semibold">980</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="text-sm font-medium">Digital Marketing A-Z</span>
                            <span className="text-sm font-semibold">850</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="text-sm font-medium">Data Science with Python</span>
                            <span className="text-sm font-semibold">720</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span className="text-sm font-medium">Android Development Kotlin</span>
                            <span className="text-sm font-semibold">610</span>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
}
