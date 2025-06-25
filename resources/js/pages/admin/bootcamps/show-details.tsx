import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Bootcamp {
    id: string;
    title: string;
    category?: { name: string };
    schedules?: { day: string; start_time: string; end_time: string }[];
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
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
    return (
        <div className="space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Share Link untuk Menerima Pendaftaran</h2>
            <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1 space-y-2">
                    <Input type="text" value={bootcamp.registration_url} readOnly className="rounded border p-2" placeholder="Link Pendaftaran" />
                    <Button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(bootcamp.registration_url);
                            toast.success('Link pendaftaran berhasil disalin!');
                        }}
                        className="w-full hover:cursor-pointer"
                    >
                        Salin Link Pendaftaran <LinkIcon />
                    </Button>
                </div>
                <div className="flex-1 space-y-2">
                    <Input type="text" value={bootcamp.bootcamp_url} readOnly className="rounded border p-2" placeholder="Link Bootcamp" />
                    <Button
                        type="button"
                        onClick={() => {
                            navigator.clipboard.writeText(bootcamp.bootcamp_url);
                            toast.success('Link bootcamp berhasil disalin!');
                        }}
                        className="w-full hover:cursor-pointer"
                    >
                        Salin Link Bootcamp <LinkIcon />
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
                        <TableCell>{bootcamp.price === 0 ? 'Gratis' : `Rp ${bootcamp.price.toLocaleString('id-ID')}`}</TableCell>
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
                                    {bootcamp.schedules.map((sch: { day: string; start_time: string; end_time: string }, idx: number) => (
                                        <li key={idx}>
                                            <span className="inline-block w-20 capitalize">{sch.day}</span>
                                            <span>
                                                {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}
                                            </span>
                                        </li>
                                    ))}
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
                        <TableCell>Linkk Group Peserta</TableCell>
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
