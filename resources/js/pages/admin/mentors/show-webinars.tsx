import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { rupiahFormatter } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Clock, Tag, Users, Video } from 'lucide-react';

interface Webinar {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    category: {
        name: string;
    };
    price: number;
    discount_price: number | null;
    quota: number;
    status: string;
    start_time: string;
    batch: string;
}

interface ShowWebinarsProps {
    webinars: Webinar[];
}

export default function ShowWebinars({ webinars }: ShowWebinarsProps) {
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

    const getWebinarStatus = (startTime: string) => {
        const now = new Date();
        const start = new Date(startTime);
        const diff = start.getTime() - now.getTime();
        const daysDiff = Math.ceil(diff / (1000 * 60 * 60 * 24));

        if (daysDiff > 7) {
            return { color: 'text-blue-600', label: 'Akan Datang', icon: Calendar };
        } else if (daysDiff > 0) {
            return { color: 'text-orange-600', label: `${daysDiff} Hari Lagi`, icon: Clock };
        } else if (daysDiff === 0) {
            return { color: 'text-green-600', label: 'Hari Ini', icon: Video };
        } else {
            return { color: 'text-gray-600', label: 'Selesai', icon: Calendar };
        }
    };

    if (!webinars || webinars.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Video className="text-muted-foreground mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-lg font-semibold">Belum Ada Webinar</h3>
                    <p className="text-muted-foreground text-center text-sm">Mentor ini belum membuat webinar apapun.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Webinar yang Dibuat</h2>
                <Badge variant="outline" className="text-sm">
                    {webinars.length} Webinar
                </Badge>
            </div>

            {webinars.map((webinar) => {
                const statusInfo = getWebinarStatus(webinar.start_time);
                const hasDiscount = webinar.discount_price && webinar.discount_price < webinar.price;
                const StatusIcon = statusInfo.icon;
                const thumbnailUrl = webinar.thumbnail ? `/storage/${webinar.thumbnail}` : '/assets/images/placeholder.png';

                return (
                    <Card key={webinar.id} className="overflow-hidden transition-shadow hover:shadow-md">
                        <CardContent className="p-0">
                            <Link
                                href={route('webinars.show', webinar.id)}
                                className="hover:bg-accent flex flex-col gap-4 p-4 transition-colors md:flex-row"
                            >
                                {/* Thumbnail */}
                                <div className="relative h-48 w-full flex-shrink-0 overflow-hidden rounded-lg md:h-32 md:w-48">
                                    <img src={thumbnailUrl} alt={webinar.title} className="h-full w-full object-cover" />
                                    <div className="absolute top-2 left-2">
                                        <Badge variant="secondary" className="text-primary bg-white/90 backdrop-blur-sm">
                                            #{webinar.batch}
                                        </Badge>
                                    </div>
                                    {/* Live Indicator for Today's Webinar */}
                                    {statusInfo.label === 'Hari Ini' && (
                                        <div className="absolute top-2 right-2">
                                            <Badge variant="destructive" className="animate-pulse">
                                                <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-white" />
                                                LIVE
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col justify-between space-y-3">
                                    {/* Header */}
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="hover:text-primary line-clamp-2 text-lg font-semibold">{webinar.title}</h3>
                                            {getStatusBadge(webinar.status)}
                                        </div>

                                        {/* Category */}
                                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span>{webinar.category.name}</span>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid gap-3 text-sm md:grid-cols-2">
                                        {/* Schedule */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="text-muted-foreground h-4 w-4" />
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">Jadwal</span>
                                                    <span className="font-medium">
                                                        {format(new Date(webinar.start_time), 'dd MMMM yyyy', { locale: id })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Clock className="text-muted-foreground h-4 w-4" />
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">Waktu</span>
                                                    <span className="font-medium">
                                                        {format(new Date(webinar.start_time), 'HH:mm', { locale: id })} WIB
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Details */}
                                        <div className="space-y-2">
                                            {/* Status */}
                                            <div className="flex items-center gap-2">
                                                <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                                                <span className={`text-xs font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                                            </div>

                                            {/* Quota */}
                                            <div className="flex items-center gap-2">
                                                <Users className="text-muted-foreground h-4 w-4" />
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground text-xs">Kuota</span>
                                                    <span className="font-medium">{webinar.quota} Peserta</span>
                                                </div>
                                            </div>

                                            {/* Price */}
                                            <div className="flex flex-col">
                                                {hasDiscount ? (
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-base font-bold text-green-600">
                                                            {rupiahFormatter.format(webinar.discount_price!)}
                                                        </span>
                                                        <span className="text-muted-foreground text-xs line-through">
                                                            {rupiahFormatter.format(webinar.price)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-base font-bold text-green-600">
                                                        {rupiahFormatter.format(webinar.price)}
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
