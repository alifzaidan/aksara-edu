import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookOpen, Calendar, Eye, FileText } from 'lucide-react';

interface Article {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    category: {
        name: string;
    };
    excerpt: string;
    status: string;
    views: number;
    read_time: number;
    is_featured: boolean;
    published_at: string | null;
    created_at: string;
}

interface ShowArticlesProps {
    articles: Article[];
}

export default function ShowArticles({ articles }: ShowArticlesProps) {
    if (!articles || articles.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                    <h3 className="mb-2 text-lg font-semibold">Belum Ada Artikel</h3>
                    <p className="text-muted-foreground text-center text-sm">Mentor ini belum membuat artikel apapun.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Artikel yang Dibuat</h2>
                <Badge variant="outline" className="text-sm">
                    {articles.length} Artikel
                </Badge>
            </div>

            {articles.map((article) => {
                const thumbnailUrl = article.thumbnail ? `/storage/${article.thumbnail}` : '/assets/images/placeholder.png';

                return (
                    <Card key={article.id} className="overflow-hidden transition-shadow hover:shadow-md">
                        <CardContent className="p-0">
                            <Link
                                href={route('articles.show', article.id)}
                                className="hover:bg-accent flex flex-col gap-4 p-4 transition-colors md:flex-row"
                            >
                                {/* Thumbnail */}
                                <div className="h-48 w-full flex-shrink-0 overflow-hidden rounded-lg md:h-32 md:w-48">
                                    <img src={thumbnailUrl} alt={article.title} className="h-full w-full object-cover" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="hover:text-primary line-clamp-2 font-semibold">{article.title}</h3>
                                        {article.is_featured && (
                                            <Badge variant="default" className="flex-shrink-0">
                                                Featured
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground line-clamp-2 text-sm">{article.excerpt}</p>
                                    <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
                                        <div className="flex items-center gap-1">
                                            <BookOpen className="h-3 w-3" />
                                            <span>{article.category.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Eye className="h-3 w-3" />
                                            <span>{article.views} views</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            <span>{article.read_time} min read</span>
                                        </div>
                                        <Badge
                                            variant={
                                                article.status === 'published' ? 'default' : article.status === 'draft' ? 'secondary' : 'destructive'
                                            }
                                        >
                                            {article.status}
                                        </Badge>
                                    </div>
                                    {article.published_at && (
                                        <p className="text-muted-foreground text-xs">
                                            Dipublikasi: {format(new Date(article.published_at), 'dd MMM yyyy', { locale: id })}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
