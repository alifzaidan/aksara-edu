import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Archive, Calendar, CircleX, Clock, Copy, Eye, FileText, Send, SquarePen, Trash, User } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Category {
    id: string;
    name: string;
}

interface Author {
    id: string;
    name: string;
    bio: string;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    content?: string | null;
    thumbnail?: string | null;
    category: Category;
    user: Author;
    read_time: number;
    views: number;
    status: 'draft' | 'published' | 'archived';
    published_at?: string | null;
    created_at: string;
    updated_at: string;
}

interface ShowProps {
    article: Article;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowArticle({ article, flash }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');
    const isAdmin = auth.role.includes('admin');
    const isMentor = auth.role.includes('mentor');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Artikel',
            href: route('articles.index'),
        },
        {
            title: article.title,
            href: route('articles.show', article.id),
        },
    ];

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDelete = () => {
        router.delete(route('articles.destroy', article.id));
    };

    const statusMap = {
        draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
        published: { label: 'Published', color: 'bg-green-100 text-green-700', icon: Send },
        archived: { label: 'Archived', color: 'bg-red-100 text-red-700', icon: Archive },
    };

    const currentStatus = statusMap[article.status];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${article.title}`} />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{article.title}</h1>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge className={currentStatus.color}>
                                <currentStatus.icon className="mr-1 h-3 w-3" />
                                {currentStatus.label}
                            </Badge>
                            <Badge variant="outline">{article.category.name}</Badge>
                        </div>
                    </div>
                </div>

                <div className={`${!isAffiliate ? 'lg:grid-cols-3' : ''} grid grid-cols-1 gap-4 lg:gap-6`}>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Artikel</CardTitle>
                                <CardDescription>Informasi lengkap artikel</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Thumbnail */}
                                <div>
                                    <h3 className="mb-2 text-sm font-medium">Thumbnail</h3>
                                    <img
                                        src={article.thumbnail ? `/storage/${article.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={article.title}
                                        className="w-full rounded-lg border object-cover"
                                    />
                                </div>

                                {/* Meta Info */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="rounded-lg border p-4">
                                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                                            <Eye className="h-4 w-4" />
                                            Total Views
                                        </div>
                                        <p className="text-2xl font-bold">{article.views.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            Waktu Baca
                                        </div>
                                        <p className="text-2xl font-bold">{article.read_time} menit</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-600">
                                            <User className="h-4 w-4" />
                                            Penulis
                                        </div>
                                        <p className="truncate text-sm font-medium">{article.user.name}</p>
                                        <p className="text-muted-foreground truncate text-xs">{article.user.bio}</p>
                                    </div>
                                </div>

                                {/* Excerpt */}
                                {article.excerpt && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-medium">Ringkasan Singkat</h3>
                                        <p className="text-muted-foreground text-sm">{article.excerpt}</p>
                                    </div>
                                )}

                                {/* Content */}
                                {article.content && (
                                    <div>
                                        <h3 className="mb-3 text-sm font-medium">Konten Artikel</h3>
                                        <div className="prose prose-sm max-w-none rounded-lg border bg-gray-50 p-6">
                                            <div dangerouslySetInnerHTML={{ __html: article.content }} />
                                        </div>
                                    </div>
                                )}

                                {/* Published Date */}
                                {article.published_at && (
                                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-blue-700">
                                            <Calendar className="h-4 w-4" />
                                            Tanggal Publikasi
                                        </div>
                                        <p className="text-base font-medium text-blue-900">
                                            {format(new Date(article.published_at), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Actions */}
                    {!isAffiliate && (
                        <div>
                            <h2 className="my-2 text-lg font-medium">Aksi & Pengaturan</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {isAdmin && (article.status === 'draft' || article.status === 'archived') && (
                                    <>
                                        {!article.thumbnail && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Thumbnail belum diupload. Silakan upload thumbnail sebelum menerbitkan.
                                            </div>
                                        )}
                                        {!article.content && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Konten artikel masih kosong. Silakan tambahkan konten sebelum menerbitkan.
                                            </div>
                                        )}
                                        <Button asChild className="w-full" disabled={!article.thumbnail || !article.content}>
                                            <Link method="post" href={route('articles.publish', article.id)}>
                                                <Send />
                                                Terbitkan
                                            </Link>
                                        </Button>
                                    </>
                                )}

                                {isAdmin && article.status === 'published' && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('articles.archive', article.id)}>
                                            <CircleX />
                                            Arsipkan
                                        </Link>
                                    </Button>
                                )}

                                {isMentor && (article.status === 'draft' || article.status === 'archived') && (
                                    <div className="rounded-lg bg-blue-50 p-3 text-center text-sm text-blue-700">
                                        Artikel dalam status <strong>{currentStatus.label}</strong>. Hubungi admin untuk menerbitkan artikel ini.
                                    </div>
                                )}

                                <Separator />

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href={route('articles.edit', article.id)}>
                                            <SquarePen /> Edit
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link method="post" href={route('articles.duplicate', article.id)}>
                                            <Copy /> Duplicate
                                        </Link>
                                    </Button>
                                    <DeleteConfirmDialog
                                        trigger={
                                            <Button variant="destructive" className="w-full">
                                                <Trash /> Hapus
                                            </Button>
                                        }
                                        title="Apakah Anda yakin ingin menghapus artikel ini?"
                                        itemName={article.title}
                                        onConfirm={handleDelete}
                                    />
                                </div>
                            </div>

                            {/* Article Info */}
                            <div className="mt-4 space-y-4 rounded-lg border p-4">
                                <h3 className="text-sm font-medium">Informasi Artikel</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Slug:</span>
                                        <code className="text-primary rounded bg-gray-100 px-1.5 py-0.5 text-xs">{article.slug}</code>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Kategori:</span>
                                        <Badge variant="outline" className="text-xs">
                                            {article.category.name}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Penulis:</span>
                                        <span className="text-xs">{article.user.name}</span>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Dibuat:</span>
                                        <span className="text-xs">{format(new Date(article.created_at), 'dd MMM yyyy', { locale: id })}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Diperbarui:</span>
                                        <span className="text-xs">{format(new Date(article.updated_at), 'dd MMM yyyy', { locale: id })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
