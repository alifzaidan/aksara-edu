'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BarChart3, Eye, TrendingUp } from 'lucide-react';

interface ClickStats {
    date: string;
    clicks: number;
}

interface RecentClick {
    id: string;
    user?: { id: string; name: string } | null;
    ip_address?: string | null;
    created_at: string;
}

export default function ShowPartnershipProductAnalytics({
    totalClicks,
    uniqueClicks,
    clickStats,
    recentClicks,
}: {
    totalClicks: number;
    uniqueClicks: number;
    clickStats: ClickStats[];
    recentClicks: RecentClick[];
}) {
    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Klik</CardTitle>
                        <Eye className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalClicks}</div>
                        <p className="text-muted-foreground text-xs">Semua waktu</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">User Unik</CardTitle>
                        <TrendingUp className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniqueClicks}</div>
                        <p className="text-muted-foreground text-xs">User yang login</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Klik (30 Hari)</CardTitle>
                        <BarChart3 className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clickStats.reduce((sum, stat) => sum + stat.clicks, 0)}</div>
                        <p className="text-muted-foreground text-xs">Bulan ini</p>
                    </CardContent>
                </Card>
            </div>

            {/* Click History */}
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Klik (30 Hari Terakhir)</CardTitle>
                    <CardDescription>Grafik klik produk dalam 30 hari terakhir</CardDescription>
                </CardHeader>
                <CardContent>
                    {clickStats.length > 0 ? (
                        <div className="space-y-2">
                            {clickStats.map((stat, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{format(new Date(stat.date), 'dd MMM yyyy', { locale: id })}</span>
                                    <span className="font-medium">{stat.clicks} klik</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center text-sm">Belum ada data klik</p>
                    )}
                </CardContent>
            </Card>

            {/* Recent Clicks */}
            <Card>
                <CardHeader>
                    <CardTitle>Klik Terbaru</CardTitle>
                    <CardDescription>10 klik terakhir ke produk ini</CardDescription>
                </CardHeader>
                <CardContent>
                    {recentClicks.length > 0 ? (
                        <div className="space-y-3">
                            {recentClicks.map((click) => (
                                <div key={click.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {click.user?.name || 'Guest'} {!click.user && `(${click.ip_address})`}
                                        </p>
                                        <p className="text-muted-foreground text-xs">
                                            {format(new Date(click.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center text-sm">Belum ada klik</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
