import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { LinkIcon, Star } from 'lucide-react';
import { useMemo } from 'react';
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
    strikethrough_price: number;
    price: number;
    thumbnail?: string | null;
    course_url: string;
    registration_url: string;
    status: string;
    level: string;
    created_at: string | Date;
}

export default function CourseDetail({ course, averageRating }: { course: Course; averageRating?: number }) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const affiliateUrls = useMemo(() => {
        const affiliateCode = auth.user.affiliate_code;

        const appendAffiliateCode = (url: string, code: string) => {
            try {
                const urlObj = new URL(url);
                urlObj.searchParams.set('ref', code);
                return urlObj.toString();
            } catch {
                const separator = url.includes('?') ? '&' : '?';
                return `${url}${separator}ref=${code}`;
            }
        };

        if (isAffiliate && affiliateCode) {
            return {
                registrationUrl: appendAffiliateCode(course.registration_url, affiliateCode),
                courseUrl: appendAffiliateCode(course.course_url, affiliateCode),
            };
        }

        return {
            registrationUrl: course.registration_url,
            courseUrl: course.course_url,
        };
    }, [course.registration_url, course.course_url, auth.user.affiliate_code, isAffiliate]);

    const handleCopyRegistrationLink = async () => {
        try {
            await navigator.clipboard.writeText(affiliateUrls.registrationUrl);
            if (isAffiliate) {
                toast.success('Link pembelian dengan kode afiliasi berhasil disalin!');
            } else {
                toast.success('Link pembelian berhasil disalin!');
            }
        } catch {
            toast.error('Gagal menyalin link pembelian');
        }
    };

    const handleCopyCourseLink = async () => {
        try {
            await navigator.clipboard.writeText(affiliateUrls.courseUrl);
            if (isAffiliate) {
                toast.success('Link kelas dengan kode afiliasi berhasil disalin!');
            } else {
                toast.success('Link kelas berhasil disalin!');
            }
        } catch {
            toast.error('Gagal menyalin link kelas');
        }
    };

    return (
        <div className="space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Share Link untuk Mengakses Kelas</h2>
                {isAffiliate && <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">Mode Afiliasi</div>}
            </div>

            {/* Info banner untuk affiliate */}
            {isAffiliate && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200">Link Afiliasi Otomatis</h4>
                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Link di bawah sudah menyertakan kode afiliasi Anda ({auth.user.affiliate_code}). Setiap pembelian melalui link ini
                                akan memberikan komisi untuk Anda.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Link Pembelian {isAffiliate && '(dengan kode afiliasi)'}</label>
                    <Input
                        type="text"
                        value={affiliateUrls.registrationUrl}
                        readOnly
                        className="rounded border p-2 text-sm"
                        placeholder="Link Pembelian"
                    />
                    <Button
                        type="button"
                        onClick={handleCopyRegistrationLink}
                        className="w-full hover:cursor-pointer"
                        disabled={course.status === 'draft' || course.status === 'archived'}
                    >
                        {isAffiliate ? 'Salin Link Afiliasi Pembelian' : 'Salin Link Pembelian'} <LinkIcon />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Link Kelas {isAffiliate && '(dengan kode afiliasi)'}</label>
                    <Input type="text" value={affiliateUrls.courseUrl} readOnly className="rounded border p-2 text-sm" placeholder="Link Kelas" />
                    <Button
                        type="button"
                        onClick={handleCopyCourseLink}
                        className="w-full hover:cursor-pointer"
                        disabled={course.status === 'draft' || course.status === 'archived'}
                    >
                        {isAffiliate ? 'Salin Link Afiliasi Kelas' : 'Salin Link Kelas'} <LinkIcon />
                    </Button>
                </div>
            </div>

            {course.status === 'published' ? (
                <p className="text-muted-foreground text-center text-sm">
                    {isAffiliate
                        ? 'Share link afiliasi diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya untuk mendapatkan komisi dari setiap pembelian'
                        : 'Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya agar peserta dapat mengakses kelas online ini.'}
                </p>
            ) : (
                <p className="text-center text-sm text-red-500">
                    Kelas ini belum diterbitkan. Silakan terbitkan kelas terlebih dahulu untuk membagikan link akses kelas.
                </p>
            )}

            {/* Detail komisi untuk affiliate */}
            {isAffiliate && course.status === 'published' && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-2 text-sm font-medium">Detail Komisi:</h4>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>
                            <span className="font-medium">Harga Kelas:</span> {rupiahFormatter.format(course.price)}
                        </div>
                        <div>
                            <span className="font-medium">Rate Komisi:</span> {auth.user.commission}%
                        </div>
                        <div>
                            <span className="font-medium">Komisi per Penjualan:</span>{' '}
                            {rupiahFormatter.format(course.price * (auth.user.commission / 100))}
                        </div>
                        <div>
                            <span className="font-medium">Kode Afiliasi:</span> {auth.user.affiliate_code}
                        </div>
                    </div>
                </div>
            )}

            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Rating</TableCell>
                        <TableCell>
                            {averageRating ? (
                                <div className="flex gap-4">
                                    <span className="text-lg font-semibold">{averageRating.toFixed(1)}</span>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                size={16}
                                                className={`${star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <span className="text-gray-500">Belum ada rating</span>
                            )}
                        </TableCell>
                    </TableRow>
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
                        <TableCell>
                            {course.price === 0 ? (
                                <span>Gratis</span>
                            ) : (
                                <span>
                                    {course.strikethrough_price > 0 && (
                                        <span className="text-xs text-gray-500 line-through">
                                            {rupiahFormatter.format(course.strikethrough_price)}{' '}
                                        </span>
                                    )}
                                    <span className="text-base font-semibold">{rupiahFormatter.format(course.price)}</span>
                                </span>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Deskripsi Singkat</TableCell>
                        <TableCell>
                            <div
                                className="prose prose-sm max-w-md text-wrap"
                                dangerouslySetInnerHTML={{ __html: course.short_description ?? '-' }}
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Deskripsi Lengkap</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-md text-wrap" dangerouslySetInnerHTML={{ __html: course.description ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Poin Utama</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-md text-wrap" dangerouslySetInnerHTML={{ __html: course.key_points ?? '-' }} />
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
