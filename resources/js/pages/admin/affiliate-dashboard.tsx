import { SharedData } from '@/types';
import { Copy, DollarSign, MousePointerClick, TrendingUp, Users } from 'lucide-react';

interface AffiliateStatsProps {
    user: SharedData['auth']['user'];
    stats: {
        total_commission: number;
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
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
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

export default function AffiliateDashboard({ user, stats }: AffiliateStatsProps) {
    const affiliateStatsCards = [
        { title: 'Total Komisi', value: formatCurrency(stats.total_commission), icon: <DollarSign className="text-muted-foreground size-5" /> },
        {
            title: 'Total Pendaftaran',
            value: stats.total_referrals.toLocaleString('id-ID'),
            icon: <Users className="text-muted-foreground size-5" />,
        },
        {
            title: 'Total Klik Link',
            value: stats.total_clicks.toLocaleString('id-ID'),
            icon: <MousePointerClick className="text-muted-foreground size-5" />,
        },
        { title: 'Tingkat Konversi', value: `${stats.conversion_rate}%`, icon: <TrendingUp className="text-muted-foreground size-5" /> },
    ];

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
                                <img src="/assets/images/not-found.svg" alt="Referral Tidak Tersedia" className="w-48" />
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
        </>
    );
}
