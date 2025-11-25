import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { rupiahFormatter } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, CalendarDays, Rocket, Tag } from 'lucide-react';

interface Bootcamp {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    category: {
        name: string;
    };
    price: number;
    discount_price: number | null;
    batch: string;
    status: string;
    start_date: string;
    end_date: string;
}

interface ShowBootcampsProps {
    bootcamps: Bootcamp[];
}

export default function ShowBootcamps({ bootcamps }: ShowBootcampsProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge variant="default">Published</Badge>;
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'archived':
                return <Badge variant="destructive">Archived</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getStatusColor = (startDate: string, endDate: string) => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (now < start) {
            return { color: 'text-blue-600', label: 'Akan Datang' };
        } else if (now >= start && now <= end) {
            return { color: 'text-green-600', label: 'Sedang Berlangsung' };
        } else {
            return { color: 'text-gray-600', label: 'Selesai' };
        }
    };

    if (!bootcamps || bootcamps.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Rocket className="text-muted-foreground mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-lg font-semibold">Belum Ada Bootcamp</h3>
                    <p className="text-muted-foreground text-center text-sm">Mentor ini belum membuat bootcamp apapun.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Bootcamp yang Dibuat</h2>
                <Badge variant="outline" className="text-sm">
                    {bootcamps.length} Bootcamp
                </Badge>
            </div>

            {bootcamps.map((bootcamp) => {
                const statusInfo = getStatusColor(bootcamp.start_date, bootcamp.end_date);
                const hasDiscount = bootcamp.discount_price && bootcamp.discount_price < bootcamp.price;
                const thumbnailUrl = bootcamp.thumbnail ? `/storage/${bootcamp.thumbnail}` : '/assets/images/placeholder.png';

                return (
                    <Card key={bootcamp.id} className="overflow-hidden transition-shadow hover:shadow-md">
                        <CardContent className="p-0">
                            <Link
                                href={route('bootcamps.show', bootcamp.id)}
                                className="hover:bg-accent flex flex-col gap-4 p-4 transition-colors md:flex-row"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-lg md:h-32 md:w-48">
                                    <img src={thumbnailUrl} alt={bootcamp.title} className="h-full w-full object-cover" />
                                    <div className="absolute top-2 left-2">
                                        <Badge variant="secondary" className="text-primary bg-white/90 backdrop-blur-sm">
                                            #{bootcamp.batch}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col justify-between space-y-3">
                                    {/* Header */}
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="hover:text-primary line-clamp-2 text-lg font-semibold">{bootcamp.title}</h3>
                                            {getStatusBadge(bootcamp.status)}
                                        </div>

                                        {/* Category */}
                                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span>{bootcamp.category.name}</span>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid gap-2 text-sm md:grid-cols-2">
                                        {/* Date Range */}
                                        <div className="flex items-start gap-2">
                                            <CalendarDays className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="text-muted-foreground text-xs">Periode</span>
                                                <div className="flex flex-col gap-0.5 text-xs font-medium">
                                                    <span>{format(new Date(bootcamp.start_date), 'dd MMM yyyy', { locale: id })}</span>
                                                    <span className="text-muted-foreground">s/d</span>
                                                    <span>{format(new Date(bootcamp.end_date), 'dd MMM yyyy', { locale: id })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Price */}
                                        <div className="flex flex-col gap-2">
                                            {/* Status Timeline */}
                                            <div className="flex items-center gap-2">
                                                <Calendar className="text-muted-foreground h-4 w-4" />
                                                <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                                            </div>

                                            {/* Price */}
                                            <div className="flex flex-col">
                                                {hasDiscount ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-base font-bold text-green-600">
                                                            {rupiahFormatter.format(bootcamp.discount_price!)}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs line-through">
                                                            {rupiahFormatter.format(bootcamp.price)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-base font-bold text-green-600">
                                                        {rupiahFormatter.format(bootcamp.price)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
