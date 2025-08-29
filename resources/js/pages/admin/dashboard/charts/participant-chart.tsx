'use client';

import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ParticipantData {
    date: string;
    count: number;
    type: 'course' | 'bootcamp' | 'webinar';
}

interface ParticipantChartProps {
    data: ParticipantData[];
}

const chartConfig = {
    course: {
        label: 'Kelas',
    },
    bootcamp: {
        label: 'Bootcamp',
    },
    webinar: {
        label: 'Webinar',
    },
} satisfies ChartConfig;

export function ParticipantChart({ data }: ParticipantChartProps) {
    const [timeRange, setTimeRange] = React.useState('30d');

    // Transform data untuk chart
    const transformedData = React.useMemo(() => {
        const dateMap = new Map();

        data.forEach((item) => {
            const date = item.date;
            if (!dateMap.has(date)) {
                dateMap.set(date, {
                    date,
                    course: 0,
                    bootcamp: 0,
                    webinar: 0,
                });
            }
            dateMap.get(date)[item.type] += item.count;
        });

        return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data]);

    const filteredData = React.useMemo(() => {
        const referenceDate = new Date();
        let daysToSubtract = 30;

        if (timeRange === '7d') {
            daysToSubtract = 7;
        } else if (timeRange === '14d') {
            daysToSubtract = 14;
        }

        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);

        return transformedData.filter((item) => {
            const itemDate = new Date(item.date);
            return itemDate >= startDate;
        });
    }, [transformedData, timeRange]);

    const totalParticipants = React.useMemo(() => {
        return filteredData.reduce((sum, item) => sum + item.course + item.bootcamp + item.webinar, 0);
    }, [filteredData]);

    return (
        <Card>
            <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
                <div className="grid flex-1 gap-1">
                    <CardTitle>Grafik Pendaftar Produk</CardTitle>
                    <CardDescription>Menampilkan data pendaftar untuk setiap jenis produk</CardDescription>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto" aria-label="Select a value">
                        <SelectValue placeholder="30 hari terakhir" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="30d" className="rounded-lg">
                            30 hari terakhir
                        </SelectItem>
                        <SelectItem value="14d" className="rounded-lg">
                            14 hari terakhir
                        </SelectItem>
                        <SelectItem value="7d" className="rounded-lg">
                            7 hari terakhir
                        </SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                <ChartContainer config={chartConfig} className="mb-6 aspect-auto h-[280px] w-full">
                    <AreaChart data={filteredData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="fillCourse" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-course)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-course)" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="fillBootcamp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-bootcamp)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-bootcamp)" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="fillWebinar" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--color-webinar)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--color-webinar)" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                });
                            }}
                        />
                        <YAxis tickLine={false} axisLine={false} tickMargin={8} tickCount={6} />
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    labelFormatter={(value) => {
                                        return new Date(value).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        });
                                    }}
                                    indicator="dot"
                                />
                            }
                        />
                        <Area dataKey="course" type="natural" fill="url(#fillCourse)" stroke="var(--color-course)" stackId="a" />
                        <Area dataKey="bootcamp" type="natural" fill="url(#fillBootcamp)" stroke="var(--color-bootcamp)" stackId="a" />
                        <Area dataKey="webinar" type="natural" fill="url(#fillWebinar)" stroke="var(--color-webinar)" stackId="a" />
                        <ChartLegend content={<ChartLegendContent />} />
                    </AreaChart>
                </ChartContainer>
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            Total {totalParticipants.toLocaleString('id-ID')} pendaftar dalam periode ini
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 leading-none">Data pendaftar berdasarkan jenis produk</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
