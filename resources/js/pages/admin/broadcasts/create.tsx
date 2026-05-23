import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Editor } from '@tinymce/tinymce-react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengguna', href: '/admin/users' },
    { title: 'Broadcast', href: '/admin/broadcasts' },
    { title: 'Buat Broadcast', href: '/admin/broadcasts/create' },
];

export default function CreateBroadcast() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.post(route('broadcasts.store'), { title, message }, { onFinish: () => setSubmitting(false) });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Broadcast" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold">Buat Broadcast Baru</h1>
                    <p className="text-muted-foreground text-sm">Tulis konten pesan broadcast menggunakan rich text editor.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="rounded-lg border p-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Judul Broadcast <span className="text-red-500">*</span></Label>
                            <Input id="title" placeholder="cth: Promo Akhir Tahun 2026" value={title} onChange={(e) => setTitle(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Konten Pesan <span className="text-red-500">*</span></Label>
                            <p className="text-muted-foreground text-xs mb-2">
                                Gunakan <code className="bg-muted rounded px-1 text-[10px]">{'{nama}'}</code> untuk menyisipkan nama penerima secara otomatis.
                            </p>
                            <Editor
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                value={message}
                                onEditorChange={(content) => setMessage(content)}
                                init={{
                                    plugins: ['autolink', 'charmap', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'wordcount'],
                                    toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                                    height: 400,
                                    menubar: false,
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={submitting || !title || message.length < 10}>
                            {submitting ? 'Menyimpan...' : 'Simpan Broadcast'}
                        </Button>
                        <Button type="button" variant="outline" asChild>
                            <Link href={route('broadcasts.index')}>Batal</Link>
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
