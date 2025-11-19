import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useInitials } from '@/hooks/use-initials';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookText, Calendar, Clock, Eye, MonitorPlay, Presentation, Share2 } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface Author {
    id: string;
    name: string;
    bio: string;
    avatar?: string;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    thumbnail?: string;
    category: Category;
    user: Author;
    read_time: number;
    views: number;
    published_at: string;
    created_at: string;
}

interface RelatedArticle {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    thumbnail?: string;
    read_time: number;
    published_at: string;
}

interface ArticleShowProps {
    article: Article;
    relatedArticles: RelatedArticle[];
}

export default function ArticleShow({ article, relatedArticles }: ArticleShowProps) {
    const getInitials = useInitials();

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.excerpt || article.title,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link berhasil disalin!');
        }
    };

    return (
        <UserLayout>
            <Head title={article.title} />

            <div className="mx-auto min-h-screen max-w-7xl px-4 py-8 md:px-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <article>
                            {/* Header */}
                            <div className="mb-6">
                                <Badge variant="secondary" className="mb-3">
                                    {article.category.name}
                                </Badge>
                                <h1 className="mb-4 text-3xl font-bold italic md:text-4xl">{article.title}</h1>

                                {/* Meta Info */}
                                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7">
                                            <AvatarImage src={article.user.avatar} alt={article.user.name} />
                                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                                {getInitials(article.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{article.user.name}</span>
                                    </div>
                                    <Separator orientation="vertical" className="h-4" />
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {format(new Date(article.published_at), 'dd MMMM yyyy', { locale: id })}
                                    </div>
                                    <Separator orientation="vertical" className="h-4" />
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {article.read_time} menit baca
                                    </div>
                                    <Separator orientation="vertical" className="h-4" />
                                    <div className="flex items-center gap-1">
                                        <Eye className="h-4 w-4" />
                                        {article.views.toLocaleString()} views
                                    </div>
                                </div>
                            </div>

                            {/* Thumbnail */}
                            {article.thumbnail && (
                                <div className="mb-8 overflow-hidden rounded-lg">
                                    <img src={`/storage/${article.thumbnail}`} alt={article.title} className="h-auto w-full object-cover" />
                                </div>
                            )}

                            {/* Excerpt */}
                            {article.excerpt && (
                                <div className="border-primary bg-primary/5 mb-6 rounded-lg border-l-4 p-4">
                                    <p className="text-muted-foreground italic">{article.excerpt}</p>
                                </div>
                            )}

                            {/* Content */}
                            <div className="prose prose-sm prose-slate dark:prose-invert md:prose-base max-w-none">
                                {article.content ? (
                                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                                ) : (
                                    <p className="text-muted-foreground">Konten artikel tidak tersedia.</p>
                                )}
                            </div>

                            {/* Share Button */}
                            <div className="mt-8 flex items-center justify-between rounded-lg border p-4">
                                <p className="font-medium">Bagikan artikel ini</p>
                                <button
                                    onClick={handleShare}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
                                >
                                    <Share2 className="h-4 w-4" />
                                    Bagikan
                                </button>
                            </div>

                            {/* Author Info */}
                            <div className="mt-8 border-t p-6">
                                <div className="flex items-start gap-4">
                                    <Avatar className="h-16 w-16">
                                        <AvatarImage src={article.user.avatar} alt={article.user.name} />
                                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                            {getInitials(article.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <h3 className="mb-1 font-semibold">Tentang Penulis</h3>
                                        <p className="text-lg font-medium">{article.user.name === 'Admin' ? 'Aksademy Team' : article.user.name}</p>
                                        <p className="text-muted-foreground text-sm">{article.user.bio}</p>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    {/* ✅ Sidebar - STICKY & NO CARD */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 space-y-6">
                            {/* Related Articles */}
                            {relatedArticles.length > 0 && (
                                <div className="rounded-lg border bg-white p-4">
                                    <h3 className="mb-4 font-semibold">Artikel Terkait</h3>
                                    <div className="space-y-4">
                                        {relatedArticles.map((related) => (
                                            <Link
                                                key={related.id}
                                                href={`/article/${related.slug}`}
                                                className="group hover:bg-muted block rounded-lg border p-3 transition-colors"
                                            >
                                                <div className="mb-2 flex gap-3">
                                                    <img
                                                        src={related.thumbnail ? `/storage/${related.thumbnail}` : '/assets/images/placeholder.png'}
                                                        alt={related.title}
                                                        className="h-16 w-20 flex-shrink-0 rounded object-cover"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="group-hover:text-primary line-clamp-2 text-sm font-medium">{related.title}</h4>
                                                    </div>
                                                </div>
                                                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {related.read_time} min
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {format(new Date(related.published_at), 'dd MMM', { locale: id })}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ✅ CTA - All Products & NO CARD */}
                            <div className="bg-primary text-primary-foreground rounded-lg p-6">
                                <h3 className="mb-2 text-lg font-semibold">Ingin Belajar Lebih Lanjut?</h3>
                                <p className="mb-4 text-sm opacity-90">Jelajahi produk edukasi kami untuk meningkatkan skill Anda</p>
                                <div className="space-y-2">
                                    <Link
                                        href="/course"
                                        className="group flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
                                    >
                                        <BookText className="h-5 w-5 transition-transform group-hover:rotate-12" />
                                        <span>Lihat Kelas Online</span>
                                    </Link>
                                    <Link
                                        href="/bootcamp"
                                        className="group flex items-center gap-3 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
                                    >
                                        <Presentation className="h-5 w-5 transition-transform group-hover:rotate-12" />
                                        <span>Lihat Bootcamp</span>
                                    </Link>
                                    <Link
                                        href="/webinar"
                                        className="group flex items-center gap-3 rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-3 text-sm font-medium text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
                                    >
                                        <MonitorPlay className="h-5 w-5 transition-transform group-hover:rotate-12" />
                                        <span>Lihat Webinar</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
