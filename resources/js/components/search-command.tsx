import { Badge } from '@/components/ui/badge';
import { CommandDialog, CommandInput, CommandList } from '@/components/ui/command';
import { router } from '@inertiajs/react';
import { CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchResult {
    id: string;
    title: string;
    type: 'course' | 'bootcamp' | 'webinar';
    href: string;
    description?: string;
    price?: string;
    strikethrough_price?: string;
    instructor?: string;
    rating?: number;
    duration?: string;
    thumbnail?: string;
    level?: string;
    category?: string;
    start_date?: string;
    start_time?: string;
    quota?: number;
    has_access?: boolean;
    registration_deadline?: string;
}

interface SearchCommandProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        const timeoutId = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error('Response is not JSON');
                }

                const data = await response.json();
                setResults(Array.isArray(data) ? data : []);
            } catch {
                setError('Terjadi kesalahan saat mencari. Silakan coba lagi.');
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'course':
                return 'Kelas Online';
            case 'bootcamp':
                return 'Bootcamp';
            case 'webinar':
                return 'Webinar';
            default:
                return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'course':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'bootcamp':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'webinar':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const handleSelect = (href: string) => {
        onOpenChange(false);
        setQuery('');
        router.visit(href);
    };

    const groupedResults = results.reduce(
        (acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        },
        {} as Record<string, SearchResult[]>,
    );

    const formatDateTime = (dateString: string, isTime: boolean = false) => {
        try {
            const date = new Date(dateString);
            if (isTime) {
                return date.toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                });
            }
            return date.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateString;
        }
    };

    const hasResults = results.length > 0;
    const hasQuery = query.trim().length > 0;

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Cari kelas, bootcamp, atau webinar..." value={query} onValueChange={setQuery} />
            <CommandList className="max-h-[400px]">
                {/* Loading state */}
                {loading && <div className="text-muted-foreground py-6 text-center text-sm">Mencari...</div>}

                {/* Error state */}
                {error && !loading && <div className="py-6 text-center text-sm text-red-500">{error}</div>}

                {/* Empty state */}
                {!loading && !hasResults && hasQuery && !error && (
                    <div className="text-muted-foreground py-6 text-center text-sm">Tidak ada hasil ditemukan.</div>
                )}

                {/* No query state */}
                {!hasQuery && !loading && (
                    <div className="text-muted-foreground py-6 text-center text-sm">Ketik untuk mencari kelas, bootcamp, atau webinar...</div>
                )}

                {/* Results */}
                {hasResults &&
                    !loading &&
                    Object.entries(groupedResults).map(([type, items]) => (
                        <div key={type} className="p-1">
                            {/* Group heading */}
                            <div className="text-muted-foreground px-2 py-1.5 text-xs font-medium">{getTypeLabel(type)}</div>

                            {/* Items */}
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSelect(item.href)}
                                    className="hover:bg-accent hover:text-accent-foreground relative flex cursor-pointer items-start gap-3 rounded-sm px-2 py-2 text-sm"
                                >
                                    {/* Thumbnail */}
                                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-200">
                                        <img
                                            src={item.thumbnail ? `/storage/${item.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src = '/assets/images/placeholder.png';
                                            }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="truncate text-sm font-medium">{item.title}</span>
                                            <Badge variant="secondary" className={`px-1.5 py-0.5 text-xs ${getTypeColor(item.type)}`}>
                                                {getTypeLabel(item.type)}
                                            </Badge>
                                            {item.has_access && (
                                                <div className="flex items-center space-x-1 text-green-600">
                                                    <CheckCircle className="h-3 w-3" />
                                                    <span className="text-xs">Sudah memiliki</span>
                                                </div>
                                            )}
                                        </div>

                                        {item.description && (
                                            <p className="text-muted-foreground line-clamp-2 text-xs">
                                                {item.description.length > 60 ? item.description.substring(0, 60) + '...' : item.description}
                                            </p>
                                        )}

                                        <div className="flex items-center justify-between text-xs">
                                            <div className="text-muted-foreground flex items-center space-x-3">
                                                {item.instructor && <span>Oleh {item.instructor}</span>}
                                                {item.duration && (
                                                    <div className="flex items-center space-x-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{item.duration}</span>
                                                    </div>
                                                )}
                                                {item.level && (
                                                    <span className="capitalize">
                                                        {item.level === 'beginner' ? 'Pemula' : item.level === 'intermediate' ? 'Menengah' : 'Mahir'}
                                                    </span>
                                                )}
                                                {item.start_date && <span>Mulai: {formatDateTime(item.start_date)}</span>}
                                                {item.start_time && <span>{formatDateTime(item.start_time, true)}</span>}
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {item.has_access ? (
                                                    <span className="text-xs font-medium text-green-600">Akses Tersedia</span>
                                                ) : (
                                                    <>
                                                        {item.strikethrough_price && item.strikethrough_price !== 'Gratis' && (
                                                            <span className="text-muted-foreground text-xs line-through">
                                                                {item.strikethrough_price}
                                                            </span>
                                                        )}
                                                        {item.price && <span className="text-primary font-medium">{item.price}</span>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
            </CommandList>
        </CommandDialog>
    );
}
