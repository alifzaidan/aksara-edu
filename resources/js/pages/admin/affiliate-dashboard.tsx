import { SharedData } from '@/types';
import { Copy, DollarSign, MousePointerClick, TrendingUp, Users } from 'lucide-react';

const affiliateStatsCards = [
    { title: 'Total Komisi', value: 'Rp 5.250.000', change: 'Komisi bulan ini', icon: <DollarSign className="text-muted-foreground size-5" /> },
    { title: 'Total Pendaftaran', value: '150', change: '+25 referral bulan ini', icon: <Users className="text-muted-foreground size-5" /> },
    {
        title: 'Total Klik Link',
        value: '2,340',
        change: 'Jumlah klik pada link Anda',
        icon: <MousePointerClick className="text-muted-foreground size-5" />,
    },
    {
        title: 'Tingkat Konversi',
        value: '6.4%',
        change: 'Dari klik menjadi pendaftaran',
        icon: <TrendingUp className="text-muted-foreground size-5" />,
    },
];
const affiliateRecentReferrals = [
    { name: 'Dewi Anggraini', item: 'Kelas: UI/UX Design Mastery', commission: '+Rp 39.000', avatar: 'DA' },
    { name: 'Eko Prasetyo', item: 'Bootcamp: Full-Stack Web', commission: '+Rp 199.000', avatar: 'EP' },
    { name: 'Fitriani', item: 'Kelas: Digital Marketing', commission: '+Rp 45.000', avatar: 'F' },
];

export default function AffiliateDashboard({ user }: { user: SharedData['auth']['user'] }) {
    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {affiliateStatsCards.map((card, index) => (
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-semibold">Referral Terbaru</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Pendaftaran baru melalui link afiliasi Anda.</p>
                    <div className="space-y-6">
                        {affiliateRecentReferrals.map((ref, index) => (
                            <div key={index} className="flex items-center">
                                <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                                    <span className="font-medium">{ref.avatar}</span>
                                </div>
                                <div className="ml-4 flex-1 space-y-1">
                                    <p className="text-sm leading-none font-medium">{ref.name}</p>
                                    <p className="text-muted-foreground text-sm">{ref.item}</p>
                                </div>
                                <div className="font-medium">{ref.commission}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold">Link Afiliasi Anda</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Gunakan link ini untuk promosi.</p>
                    <div className="bg-muted flex items-center space-x-2 rounded-lg border p-3">
                        <p className="text-muted-foreground flex-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap">
                            https://aksademy.com/ref/{user.name.toLowerCase()}
                        </p>
                        <button
                            onClick={() => navigator.clipboard.writeText(`https://aksademy.com/ref/${user.name.toLowerCase()}`)}
                            className="hover:bg-background shrink-0 rounded p-2"
                        >
                            <Copy className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
