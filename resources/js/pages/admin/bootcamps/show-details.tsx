import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LinkIcon } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';

interface Bootcamp {
    id: string;
    title: string;
    category?: { name: string };
    schedules?: { schedule_date: string; day: string; start_time: string; end_time: string }[];
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_date: string | Date;
    end_date: string | Date;
    registration_deadline: string | Date;
    status: string;
    bootcamp_url: string;
    registration_url: string;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    group_url?: string | null;
    requirements?: string | null;
    curriculum?: string | null;
    host_name?: string | null;
    host_description?: string | null;
    created_at: string | Date;
}

export default function BootcampDetail({ bootcamp }: { bootcamp: Bootcamp }) {
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
                registrationUrl: appendAffiliateCode(bootcamp.registration_url, affiliateCode),
                bootcampUrl: appendAffiliateCode(bootcamp.bootcamp_url, affiliateCode),
            };
        }

        return {
            registrationUrl: bootcamp.registration_url,
            bootcampUrl: bootcamp.bootcamp_url,
        };
    }, [bootcamp.registration_url, bootcamp.bootcamp_url, auth.user.affiliate_code, isAffiliate]);

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

    const handleCopyBootcampLink = async () => {
        try {
            await navigator.clipboard.writeText(affiliateUrls.bootcampUrl);
            if (isAffiliate) {
                toast.success('Link bootcamp dengan kode afiliasi berhasil disalin!');
            } else {
                toast.success('Link bootcamp berhasil disalin!');
            }
        } catch {
            toast.error('Gagal menyalin link bootcamp');
        }
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
                        disabled={bootcamp.status === 'draft' || bootcamp.status === 'archived'}
                    >
                        {isAffiliate ? 'Salin Link Afiliasi Pendaftaran' : 'Salin Link Pendaftaran'} <LinkIcon />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700">Link Bootcamp {isAffiliate && '(dengan kode afiliasi)'}</label>
                    <Input
                        type="text"
                        value={affiliateUrls.bootcampUrl}
                        readOnly
                        className="rounded border p-2 text-sm"
                        placeholder="Link Bootcamp"
                    />
                    <Button
                        type="button"
                        onClick={handleCopyBootcampLink}
                        className="w-full hover:cursor-pointer"
                        disabled={bootcamp.status === 'draft' || bootcamp.status === 'archived'}
                    >
                        {isAffiliate ? 'Salin Link Afiliasi Bootcamp' : 'Salin Link Bootcamp'} <LinkIcon />
                    </Button>
                </div>
            </div>

            {bootcamp.status === 'published' ? (
                <p className="text-muted-foreground text-center text-sm">
                    {isAffiliate
                        ? 'Share link afiliasi diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya untuk mendapatkan komisi dari setiap pendaftaran'
                        : 'Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya untuk menerima order dan pembayaran'}
                </p>
            ) : (
                <p className="text-center text-sm text-red-500">
                    Bootcamp ini belum diterbitkan. Silakan terbitkan bootcamp terlebih dahulu untuk membagikan link akses bootcamp.
                </p>
            )}

            {/* Detail komisi untuk affiliate */}
            {isAffiliate && bootcamp.status === 'published' && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-2 text-sm font-medium">Detail Komisi:</h4>
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                        <div>
                            <span className="font-medium">Harga Bootcamp:</span> {rupiahFormatter.format(bootcamp.price)}
                        </div>
                        <div>
                            <span className="font-medium">Rate Komisi:</span> {auth.user.commission}%
                        </div>
                        <div>
                            <span className="font-medium">Komisi per Penjualan:</span>{' '}
                            {rupiahFormatter.format(bootcamp.price * (auth.user.commission / 100))}
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
                        <TableCell>Status</TableCell>
                        <TableCell>
                            {(() => {
                                const status = bootcamp.status;
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
                        <TableCell>{bootcamp.category?.name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Nama Bootcamp</TableCell>
                        <TableCell>{bootcamp.title}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Harga</TableCell>
                        <TableCell>
                            {bootcamp.price === 0 ? (
                                <span>Gratis</span>
                            ) : (
                                <span>
                                    {bootcamp.strikethrough_price > 0 && (
                                        <span className="text-xs text-gray-500 line-through">
                                            {rupiahFormatter.format(bootcamp.strikethrough_price)}{' '}
                                        </span>
                                    )}
                                    <span className="text-base font-semibold">{rupiahFormatter.format(bootcamp.price)}</span>
                                </span>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Deskripsi</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: bootcamp.description ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Persyaratan</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: bootcamp.requirements ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Benefit</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: bootcamp.benefits ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Kurikulum</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: bootcamp.curriculum ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Batch</TableCell>
                        <TableCell>{bootcamp.batch ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Kuota</TableCell>
                        <TableCell>{bootcamp.quota === 0 ? 'Tak terbatas' : `${bootcamp.quota} orang`}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Waktu Pelaksanaan</TableCell>
                        <TableCell>
                            {format(new Date(bootcamp.start_date), 'dd MMMM yyyy', { locale: id })}
                            {' - '}
                            {format(new Date(bootcamp.end_date), 'dd MMMM yyyy', { locale: id })}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Jadwal</TableCell>
                        <TableCell>
                            {bootcamp.schedules && bootcamp.schedules.length > 0 ? (
                                <ul className="space-y-1">
                                    {bootcamp.schedules.map(
                                        (sch: { schedule_date: string; day: string; start_time: string; end_time: string }, idx: number) => (
                                            <li key={idx}>
                                                <span className="inline-block w-30">
                                                    {format(new Date(sch.schedule_date), 'dd MMM yyyy', { locale: id })}
                                                </span>
                                                <span className="inline-block w-20 capitalize">{sch.day}</span>
                                                <span>
                                                    {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            ) : (
                                <span className="text-muted-foreground text-sm">Belum ada jadwal.</span>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Deadline Pendaftaran</TableCell>
                        <TableCell>{format(new Date(bootcamp.registration_deadline), 'dd MMMM yyyy HH:mm', { locale: id })}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Link Group Peserta</TableCell>
                        <TableCell>{bootcamp.group_url ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Pemateri</TableCell>
                        <TableCell>
                            <div>{bootcamp.host_name ?? '-'}</div>
                            <div className="text-muted-foreground text-xs">{bootcamp.host_description ?? ''}</div>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <div className="mb-4">
                <h3 className="font-semibold">Tools yang Digunakan:</h3>
                {bootcamp.tools && bootcamp.tools.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
                        {bootcamp.tools.map((tool: { name: string; description?: string | null; icon: string | null }) => (
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
                    src={bootcamp.thumbnail ? `/storage/${bootcamp.thumbnail}` : '/assets/images/placeholder.png'}
                    alt={bootcamp.title}
                    className="my-1 mt-2 h-40 w-64 rounded border object-cover"
                />
                {bootcamp.thumbnail ? null : <span className="text-muted-foreground text-sm">Thumbnail belum diunggah.</span>}
            </div>
        </div>
    );
}
