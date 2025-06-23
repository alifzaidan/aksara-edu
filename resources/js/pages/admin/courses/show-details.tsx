import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Course {
    id: string;
    title: string;
    category?: { name: string };
    tools?: { name: string; description?: string | null; icon: string | null }[];
    images?: { image_url: string }[];
    short_description?: string | null;
    description?: string | null;
    key_points?: string | null;
    price: number;
    thumbnail?: string | null;
    course_url: string;
    registration_url: string;
    status: string;
    level: string;
    created_at: string | Date;
}

export default function CourseDetail({ course }: { course: Course }) {
    return (
        <div className="space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Share Link untuk Mengakses Kelas</h2>
            <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1 space-y-2">
                    <Input type="text" value={course.registration_url} readOnly className="rounded border p-2" placeholder="Link Pembelian" />
                    <Button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(course.registration_url);
                            toast.success('Link pembelian berhasil disalin!');
                        }}
                        className="w-full hover:cursor-pointer"
                    >
                        Salin Link Pembelian <LinkIcon />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    <Input type="text" value={course.course_url} readOnly className="rounded border p-2" placeholder="Link Kelas" />
                    <Button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(course.course_url);
                            toast.success('Link kelas berhasil disalin!');
                        }}
                        className="w-full hover:cursor-pointer"
                    >
                        Salin Link Kelas <LinkIcon />
                    </Button>
                </div>
            </div>
            <p className="text-muted-foreground text-center text-sm">
                Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya agar peserta dapat
                mengakses kelas online ini.
            </p>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>
                            {(() => {
                                const status = course.status;
                                let color = 'bg-gray-200 text-gray-800';
                                if (status === 'draft') color = 'bg-gray-200 text-gray-800';
                                if (status === 'published') color = 'bg-blue-100 text-blue-800';
                                if (status === 'archived') color = 'bg-zinc-300 text-zinc-700';
                                return <Badge className={`capitalize ${color} border-0`}>{status}</Badge>;
                            })()}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Tingkat Kesulitan</TableCell>
                        <TableCell>
                            {(() => {
                                const level = course.level;
                                let color = 'bg-gray-200 text-gray-800';
                                if (level === 'beginner') color = 'bg-green-100 text-green-800';
                                if (level === 'intermediate') color = 'bg-yellow-100 text-yellow-800';
                                if (level === 'advanced') color = 'bg-red-100 text-red-800';
                                return <Badge className={`capitalize ${color} border-0`}>{level}</Badge>;
                            })()}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Kategori</TableCell>
                        <TableCell>{course.category?.name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Nama Kelas</TableCell>
                        <TableCell>{course.title}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Harga</TableCell>
                        <TableCell>{course.price === 0 ? 'Gratis' : `Rp ${course.price.toLocaleString('id-ID')}`}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Deskripsi Singkat</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: course.short_description ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Deskripsi Lengkap</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: course.description ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Poin Utama</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: course.key_points ?? '-' }} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <div className="mb-4">
                <h3 className="font-semibold">Tools yang Digunakan:</h3>
                {course.tools && course.tools.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
                        {course.tools.map((tool: { name: string; description?: string | null; icon: string | null }) => (
                            <div key={tool.name}>
                                <img
                                    src={tool.icon ? `/storage/${tool.icon}` : '/assets/images/placeholder.png'}
                                    alt="Tool Icon"
                                    className="mx-auto my-1 mt-2 h-24 rounded border object-cover"
                                />
                                <h4 className="text-center text-sm font-medium">{tool.name}</h4>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">Belum ada tools yang ditentukan.</span>
                )}
            </div>
            <div>
                <span className="font-semibold">Thumbnail:</span>
                <img
                    src={course.thumbnail ? `/storage/${course.thumbnail}` : '/assets/images/placeholder.png'}
                    alt={course.title}
                    className="my-1 mt-2 aspect-video h-40 rounded border object-cover"
                />
                {course.thumbnail ? null : <span className="text-muted-foreground text-sm">Thumbnail belum diunggah.</span>}
            </div>
            <div>
                <h3 className="mb-2 font-semibold">Sneak Peek Kelas:</h3>
                {course.images && course.images.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {course.images.map((img: { image_url: string }, idx: number) => (
                            <img
                                key={idx}
                                src={`/storage/${img.image_url}`}
                                alt={`Sneak Peek ${idx + 1}`}
                                className="aspect-video h-24 rounded border object-cover"
                            />
                        ))}
                    </div>
                ) : (
                    <span className="text-muted-foreground text-sm">Belum ada gambar sneak peek yang ditentukan.</span>
                )}
            </div>
        </div>
    );
}
