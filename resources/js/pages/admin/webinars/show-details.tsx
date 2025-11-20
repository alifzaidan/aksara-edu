import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useInitials } from '@/hooks/use-initials';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LinkIcon, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import AddRecordingDialog from './create-recording-url';

interface Webinar {
    id: string;
    title: string;
    category?: { name: string };
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_time: string | Date;
    end_time: string | Date;
    registration_deadline: string | Date;
    status: string;
    webinar_url: string;
    registration_url: string;
    recording_url?: string | null;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    group_url?: string | null;
    created_at: string | Date;
    user?: {
        id: string;
        name: string;
        bio?: string;
        avatar?: string;
    };
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

export default function WebinarDetail({ webinar }: { webinar: Webinar }) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');
    const [isDeleting, setIsDeleting] = useState(false);

    const getInitials = useInitials();

    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (webinar.recording_url) {
            const videoId = getYoutubeId(webinar.recording_url);
            setPreviewUrl(videoId ? `https://www.youtube.com/embed/${videoId}` : '');
        } else {
            setPreviewUrl('');
        }
    }, [webinar.recording_url]);

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
                registrationUrl: appendAffiliateCode(webinar.registration_url, affiliateCode),
                webinarUrl: appendAffiliateCode(webinar.webinar_url, affiliateCode),
            };
        }

        return {
            registrationUrl: webinar.registration_url,
            webinarUrl: webinar.webinar_url,
        };
    }, [webinar.registration_url, webinar.webinar_url, auth.user.affiliate_code, isAffiliate]);

    const handleCopyRegistrationLink = async () => {
        try {
            await navigator.clipboard.writeText(affiliateUrls.registrationUrl);
            if (isAffiliate) {
                toast.success('Link pendaftaran dengan kode afiliasi berhasil disalin!');
            } else {
                toast.success('Link pendaftaran berhasil disalin!');
            }
        } catch {
            toast.error('Gagal menyalin link pendaftaran');
        }
    };

    const handleCopyWebinarLink = async () => {
        try {
            await navigator.clipboard.writeText(affiliateUrls.webinarUrl);
            if (isAffiliate) {
                toast.success('Link webinar dengan kode afiliasi berhasil disalin!');
            } else {
                toast.success('Link webinar berhasil disalin!');
            }
        } catch {
            toast.error('Gagal menyalin link webinar');
        }
    };

    const handleDeleteRecording = () => {
        setIsDeleting(true);

        router.delete(route('webinars.recording.remove', webinar.id), {
            onSuccess: () => {
                toast.success('Link rekaman berhasil dihapus!');
                setIsDeleting(false);
            },
            onError: (errors) => {
                console.error('Error deleting recording:', errors);
                toast.error('Gagal menghapus link rekaman');
                setIsDeleting(false);
            },
        });
    };

    return (
        <div className="space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Share Link untuk Menerima Pendaftaran</h2>
                {isAffiliate && <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">Mode Afiliasi</div>}
            </div>

            {/* Info banner untuk affiliate */}
            {isAffiliate && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h4 className="font-medium text-blue-800 dark:text-blue-200">Link Afiliasi Otomatis</h4>
                            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                                Link di bawah sudah menyertakan kode afiliasi Anda ({auth.user.affiliate_code}). Setiap pendaftaran melalui link ini
                                akan memberikan komisi untuk Anda.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Link Pendaftaran {isAffiliate && '(dengan kode afiliasi)'}</label>
                    <Input
                        type="text"
                        value={affiliateUrls.registrationUrl}
                        readOnly
                        className="rounded border p-2 text-sm"
                        placeholder="Link Pendaftaran"
                    />
                    <Button
                        type="button"
                        onClick={handleCopyRegistrationLink}
                        className="w-full hover:cursor-pointer"
                        disabled={webinar.status === 'draft' || webinar.status === 'archived'}
                    >
                        {isAffiliate ? 'Salin Link Afiliasi Pendaftaran' : 'Salin Link Pendaftaran'} <LinkIcon />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Link Webinar {isAffiliate && '(dengan kode afiliasi)'}</label>
                    <Input type="text" value={affiliateUrls.webinarUrl} readOnly className="rounded border p-2 text-sm" placeholder="Link Webinar" />
                    <Button
                        type="button"
                        onClick={handleCopyWebinarLink}
                        className="w-full hover:cursor-pointer"
                        disabled={webinar.status === 'draft' || webinar.status === 'archived'}
                    >
                        {isAffiliate ? 'Salin Link Afiliasi Webinar' : 'Salin Link Webinar'} <LinkIcon />
                    </Button>
                </div>
            </div>

            {webinar.status === 'published' ? (
                <p className="text-muted-foreground text-center text-sm">
                    {isAffiliate
                        ? 'Share link afiliasi diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya untuk mendapatkan komisi dari setiap pendaftaran'
                        : 'Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya untuk menerima order dan pembayaran'}
                </p>
            ) : (
                <p className="text-center text-sm text-red-500">
                    Webinar ini belum diterbitkan. Silakan terbitkan webinar terlebih dahulu untuk membagikan link akses webinar.
                </p>
            )}

            {/* Tampilkan URL breakdown untuk affiliate */}
            {isAffiliate && webinar.status === 'published' && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-2 text-sm font-medium">Detail Link Afiliasi:</h4>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>
                            <span className="font-medium">Link Asli:</span> {webinar.registration_url}
                        </div>
                        <div>
                            <span className="font-medium">Kode Afiliasi:</span> {auth.user.affiliate_code}
                        </div>
                        <div>
                            <span className="font-medium">Rate Komisi:</span> {auth.user.commission}%
                        </div>
                    </div>
                </div>
            )}

            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>
                            {(() => {
                                const status = webinar.status;
                                let color = 'bg-gray-200 text-gray-800';
                                if (status === 'draft') color = 'bg-gray-200 text-gray-800';
                                if (status === 'published') color = 'bg-blue-100 text-blue-800';
                                if (status === 'archived') color = 'bg-zinc-300 text-zinc-700';
                                return <Badge className={`capitalize ${color} border-0`}>{status}</Badge>;
                            })()}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Kategori</TableCell>
                        <TableCell>{webinar.category?.name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Nama Webinar</TableCell>
                        <TableCell>{webinar.title}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Harga</TableCell>
                        <TableCell>
                            {webinar.price === 0 ? (
                                <span>Gratis</span>
                            ) : (
                                <span>
                                    {webinar.strikethrough_price > 0 && (
                                        <span className="text-xs text-gray-500 line-through">
                                            {rupiahFormatter.format(webinar.strikethrough_price)}{' '}
                                        </span>
                                    )}
                                    <span className="text-base font-semibold">{rupiahFormatter.format(webinar.price)}</span>
                                </span>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Deskripsi</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-md text-wrap" dangerouslySetInnerHTML={{ __html: webinar.description ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Benefit</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-md text-wrap" dangerouslySetInnerHTML={{ __html: webinar.benefits ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Batch</TableCell>
                        <TableCell>{webinar.batch ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Kuota</TableCell>
                        <TableCell>{webinar.quota === 0 ? 'Tak terbatas' : webinar.quota}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Waktu Pelaksanaan</TableCell>
                        <TableCell>
                            {format(new Date(webinar.start_time), 'dd MMMM yyyy', { locale: id })}{' '}
                            {format(new Date(webinar.start_time), 'HH:mm', { locale: id })} -{' '}
                            {format(new Date(webinar.end_time), 'dd MMMM yyyy', { locale: id })}{' '}
                            {format(new Date(webinar.end_time), 'HH:mm', { locale: id })}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Deadline Pendaftaran</TableCell>
                        <TableCell>{format(new Date(webinar.registration_deadline), 'dd MMMM yyyy HH:mm', { locale: id })}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Link Group Peserta</TableCell>
                        <TableCell>{webinar.group_url ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Pemateri</TableCell>
                        <TableCell>
                            {webinar.user ? (
                                <div className="flex items-center gap-3">
                                    {webinar.user.avatar ? (
                                        <img
                                            src={`/storage/${webinar.user.avatar}`}
                                            alt={webinar.user.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                                            {getInitials(webinar.user.name)}
                                        </div>
                                    )}
                                    <div>
                                        <div className="font-medium">{webinar.user.name}</div>
                                        <div className="text-sm text-gray-500">{webinar.user.bio ?? 'Tidak ada bio'}</div>
                                    </div>
                                </div>
                            ) : (
                                '-'
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Link Rekaman</TableCell>
                        <TableCell>
                            <div className="space-y-3">
                                {webinar.recording_url ? (
                                    <div className="space-y-2">
                                        {previewUrl && (
                                            <div>
                                                <div className="mt-2 w-full">
                                                    <iframe
                                                        className="aspect-video w-2/3 rounded-lg border"
                                                        src={previewUrl}
                                                        title="YouTube Preview"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={webinar.recording_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 text-sm break-all text-blue-600 hover:underline"
                                            >
                                                {webinar.recording_url}
                                            </a>
                                        </div>
                                        <div className="flex gap-2">
                                            <AddRecordingDialog webinarId={webinar.id} currentRecordingUrl={webinar.recording_url} />
                                            <DeleteConfirmDialog
                                                trigger={
                                                    <Button size="sm" variant="destructive" disabled={isDeleting} className="flex items-center gap-1">
                                                        <Trash2 className="h-3 w-3" />
                                                        {isDeleting ? 'Menghapus...' : 'Hapus'}
                                                    </Button>
                                                }
                                                title="Apakah Anda yakin ingin menghapus link rekaman ini?"
                                                itemName="Link rekaman webinar"
                                                onConfirm={handleDeleteRecording}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">Belum ada link rekaman</span>
                                    </div>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <div className="mb-4">
                <h3 className="font-semibold">Tools yang Digunakan:</h3>
                {webinar.tools && webinar.tools.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
                        {webinar.tools.map((tool: { name: string; description?: string | null; icon: string | null }) => (
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
                    src={webinar.thumbnail ? `/storage/${webinar.thumbnail}` : '/assets/images/placeholder.png'}
                    alt={webinar.title}
                    className="my-1 mt-2 h-40 w-64 rounded border object-cover"
                />
                {webinar.thumbnail ? null : <span className="text-muted-foreground text-sm">Thumbnail belum diunggah.</span>}
            </div>
        </div>
    );
}
