'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';

interface MonthlyRevenueData {
    month: string;
    year: number;
    month_year: string;
    total_amount: number;
    transaction_count: number;
}

interface RevenueChartProps {
    data: MonthlyRevenueData[];
}

const chartConfig = {
    total_amount: {
        label: 'Pendapatan',
        color: 'hsl(var(--primary))',
    },
} satisfies ChartConfig;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000000) {
        return `Rp ${(amount / 1000000000).toFixed(1)}M`;
    }
    if (amount >= 1000000) {
        return `Rp ${(amount / 1000000).toFixed(1)}Jt`;
    }
    if (amount >= 1000) {
        return `Rp ${(amount / 1000).toFixed(0)}K`;
    }
    return `Rp ${amount.toLocaleString('id-ID')}`;
};

export function RevenueChart({ data }: RevenueChartProps) {
    const currentMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];

    let growthPercentage = 0;
    let isPositiveGrowth = true;

    if (currentMonth && previousMonth && previousMonth.total_amount > 0) {
        growthPercentage = ((currentMonth.total_amount - previousMonth.total_amount) / previousMonth.total_amount) * 100;
        isPositiveGrowth = growthPercentage >= 0;
    }

    const totalRevenue = data.reduce((sum, item) => sum + item.total_amount, 0);
    const totalTransactions = data.reduce((sum, item) => sum + item.transaction_count, 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Laporan Pendapatan dan Transaksi</CardTitle>
                <CardDescription>Data pendapatan dan transaksi 12 bulan terakhir</CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart
                            accessibilityLayer
                            data={data}
                            margin={{
                                bottom: 20,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="month_year"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                angle={-45}
                                textAnchor="end"
                                height={30}
                                interval={0}
                                fontSize={11}
                            />
                            <YAxis tickFormatter={formatCompactCurrency} axisLine={false} tickLine={false} fontSize={11} width={60} />
                            <ChartTooltip
                                cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-background border-border rounded-lg border p-3 shadow-lg">
                                                <p className="text-sm font-medium">{label}</p>
                                                <p className="text-primary text-sm">
                                                    Pendapatan: <span className="font-semibold">{formatCurrency(data.total_amount)}</span>
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    Transaksi: <span className="font-medium">{data.transaction_count}</span>
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="total_amount" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    {data.length > 1 && (
                        <>
                            {isPositiveGrowth ? (
                                <>
                                    Naik {Math.abs(growthPercentage).toFixed(1)}% dari bulan lalu
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                </>
                            ) : (
                                <>
                                    Turun {Math.abs(growthPercentage).toFixed(1)}% dari bulan lalu
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                </>
                            )}
                        </>
                    )}
                </div>
                <div className="text-muted-foreground leading-none">
                    Total: {formatCurrency(totalRevenue)} dari {totalTransactions} transaksi
                </div>
            </CardFooter>
        </Card>
    );
}
