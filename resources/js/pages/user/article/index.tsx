import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserLayout from '@/layouts/user-layout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Clock, Eye, TrendingUp } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: string;
    name: string;
    articles_count: number;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    thumbnail?: string;
    category: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        name: string;
    };
    read_time: number;
    views: number;
    published_at: string;
}

interface PopularArticle {
    id: string;
    title: string;
    slug: string;
    views: number;
    thumbnail?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ArticleIndexProps {
    articles: {
        data: Article[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
    };
    categories: Category[];
    popularArticles: PopularArticle[];
    filters: {
        category?: string;
        sort?: string;
    };
}

export default function ArticleIndex({ articles, categories, popularArticles, filters }: ArticleIndexProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>(filters.category || '');
    const [sortBy, setSortBy] = useState<string>(filters.sort || 'latest');

    const handleFilter = (category: string) => {
        setSelectedCategory(category);
        router.get(
            '/article',
            { category: category || undefined, sort: sortBy },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleSort = (sort: string) => {
        setSortBy(sort);
        router.get(
            '/article',
            { category: selectedCategory || undefined, sort },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    return (
        <UserLayout>
            <Head title="Artikel" />

            <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 md:px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text mb-2 text-3xl font-bold italic md:text-4xl">Artikel & Blog</h1>
                    <p className="text-muted-foreground">Baca artikel dan tips seputar pembelajaran dan teknologi</p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    {/* Sidebar Filters */}
                    <div className="space-y-6 lg:col-span-1">
                        {/* Sort Dropdown (Mobile) */}
                        <div className="lg:hidden">
                            <Select value={sortBy} onValueChange={handleSort}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Urutkan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="latest">Terbaru</SelectItem>
                                    <SelectItem value="popular">Paling Populer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Categories Filter */}
                        <div className="rounded-lg border bg-white p-4">
                            <h3 className="mb-4 font-semibold">Kategori</h3>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="all" checked={!selectedCategory} onCheckedChange={() => handleFilter('')} />
                                    <label htmlFor="all" className="flex-1 cursor-pointer text-sm font-medium">
                                        Semua Kategori
                                    </label>
                                    <span className="text-muted-foreground text-xs">
                                        {categories.reduce((sum, cat) => sum + cat.articles_count, 0)}
                                    </span>
                                </div>
                                {categories.map((category) => (
                                    <div key={category.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={category.id}
                                            checked={selectedCategory === category.id}
                                            onCheckedChange={() => handleFilter(category.id)}
                                        />
                                        <label htmlFor={category.id} className="flex-1 cursor-pointer text-sm font-medium">
                                            {category.name}
                                        </label>
                                        <span className="text-muted-foreground text-xs">{category.articles_count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Popular Articles */}
                        <div className="rounded-lg border bg-white p-4">
                            <div className="mb-4 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <h3 className="font-semibold">Paling Banyak Dibaca</h3>
                            </div>
                            <div className="space-y-3">
                                {popularArticles.map((article, index) => (
                                    <Link
                                        key={article.id}
                                        href={`/article/${article.slug}`}
                                        className="group hover:bg-muted flex gap-3 rounded-lg border p-2 transition-colors"
                                    >
                                        <div className="flex-shrink-0">
                                            <div className="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded text-xs font-bold">
                                                {index + 1}
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="group-hover:text-primary line-clamp-2 text-sm font-medium">{article.title}</p>
                                            <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                                                <Eye className="h-3 w-3" />
                                                {article.views.toLocaleString()} views
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Articles Grid */}
                    <div className="lg:col-span-3">
                        {/* Sort Options (Desktop) */}
                        <div className="mb-6 hidden items-center justify-between lg:flex">
                            <p className="text-muted-foreground text-sm">
                                Menampilkan {articles.data.length} dari {articles.data.length} artikel
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Urutkan:</span>
                                <Button variant={sortBy === 'latest' ? 'default' : 'outline'} size="sm" onClick={() => handleSort('latest')}>
                                    Terbaru
                                </Button>
                                <Button variant={sortBy === 'popular' ? 'default' : 'outline'} size="sm" onClick={() => handleSort('popular')}>
                                    Populer
                                </Button>
                            </div>
                        </div>

                        {articles.data.length > 0 ? (
                            <>
                                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {articles.data.map((article) => (
                                        <Link key={article.id} href={`/article/${article.slug}`} className="group">
                                            <div className="h-full overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md">
                                                <div className="aspect-video overflow-hidden">
                                                    <img
                                                        src={article.thumbnail ? `/storage/${article.thumbnail}` : '/assets/images/placeholder.png'}
                                                        alt={article.title}
                                                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                                    />
                                                </div>
                                                <CardContent className="p-4">
                                                    <Badge variant="secondary" className="mb-2 text-xs">
                                                        {article.category.name}
                                                    </Badge>
                                                    <h3 className="group-hover:text-primary mb-2 line-clamp-2 font-semibold">{article.title}</h3>
                                                    {article.excerpt && (
                                                        <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{article.excerpt}</p>
                                                    )}
                                                    <div className="text-muted-foreground flex items-center justify-between text-xs">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {article.read_time} min
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                {article.views}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(article.published_at), 'dd MMM yyyy', { locale: id })}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {articles.last_page > 1 && (
                                    <div className="mt-8 flex justify-center gap-2">
                                        {articles.links.map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.visit(link.url)}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed">
                                <p className="text-muted-foreground mb-2 text-lg font-medium">Artikel tidak ditemukan</p>
                                <p className="text-muted-foreground text-sm">Coba ubah filter atau kategori</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
