import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { rupiahFormatter } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

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
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    group_url?: string | null;
    host_name?: string | null;
    host_description?: string | null;
    created_at: string | Date;
}

export default function WebinarDetail({ webinar }: { webinar: Webinar }) {
    return (
        <div className="space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Share Link untuk Menerima Pendaftaran</h2>
            <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1 space-y-2">
                    <Input type="text" value={webinar.registration_url} readOnly className="rounded border p-2" placeholder="Link Pendaftaran" />
                    <Button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(webinar.registration_url);
                            toast.success('Link pendaftaran berhasil disalin!');
                        }}
                        className="w-full hover:cursor-pointer"
                    >
                        Salin Link Pendaftaran <LinkIcon />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    <Input type="text" value={webinar.webinar_url} readOnly className="rounded border p-2" placeholder="Link Webinar" />
                    <Button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(webinar.webinar_url);
                            toast.success('Link webinar berhasil disalin!');
                        }}
                        className="w-full hover:cursor-pointer"
                    >
                        Salin Link Webinar <LinkIcon />
                    </Button>
                </div>
            </div>
            <p className="text-muted-foreground text-center text-sm">
                Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya untuk menerima order dan
                pembayaran
            </p>
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
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: webinar.description ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Benefit</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: webinar.benefits ?? '-' }} />
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
                            <div>{webinar.host_name ?? '-'}</div>
                            <div className="text-muted-foreground text-xs">{webinar.host_description ?? ''}</div>
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
