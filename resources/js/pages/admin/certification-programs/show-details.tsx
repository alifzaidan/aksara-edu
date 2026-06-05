import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useInitials } from '@/hooks/use-initials';
import { rupiahFormatter } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Schedule {
    id: string;
    title?: string | null;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
    recording_url?: string | null;
}

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}

interface CertificationProgram {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    status: string;
    category?: { name: string };
    mentors?: Mentor[];
    schedules?: Schedule[];
    socializationSchedules?: Schedule[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    scholarship_price?: number;
    scholarship_flow?: string | null;
    registration_deadline?: string | null;
    socialization_registration_deadline?: string | null;
    short_description?: string | null;
    description?: string | null;
    benefits?: string | null;
    terms_conditions?: string | null;
    group_url?: string | null;
    thumbnail?: string | null;
    document_required?: boolean;
    document_description?: string | null;
    program_url: string;
    registration_url: string;
    socialization_group_url?: string | null;
}

export default function CertificationProgramDetail({ program }: { program: CertificationProgram }) {
    const getInitials = useInitials();
    const socializationSchedules =
        program.socializationSchedules ?? (program as CertificationProgram & { socialization_schedules?: Schedule[] }).socialization_schedules ?? [];

    const handleCopyRegistrationLink = async () => {
        try {
            await navigator.clipboard.writeText(program.registration_url);
            toast.success('Link pendaftaran berhasil disalin!');
        } catch {
            toast.error('Gagal menyalin link pendaftaran');
        }
    };

    const handleCopyProgramLink = async () => {
        try {
            await navigator.clipboard.writeText(program.program_url);
            toast.success('Link program berhasil disalin!');
        } catch {
            toast.error('Gagal menyalin link program');
        }
    };

    const renderSchedules = (schedules: Schedule[], title: string) => (
        <div className="space-y-2">
            <h4 className="text-sm font-medium">{title}</h4>
            {schedules.length > 0 ? (
                <div className="space-y-2">
                    {schedules.map((sch, idx) => {
                        const scheduleDate = new Date(sch.schedule_date);
                        const isPast = scheduleDate < new Date();
                        return (
                            <div key={idx} className="flex items-start justify-between rounded-lg border p-3">
                                <div>
                                    <div className="font-medium">{sch.title || `Pertemuan ${idx + 1}`}</div>
                                    <div className="text-sm text-gray-600">
                                        {format(scheduleDate, 'dd MMM yyyy', { locale: id })} • <span className="capitalize">{sch.day}</span> •{' '}
                                        {sch.start_time?.slice(0, 5)} – {sch.end_time?.slice(0, 5)} WIB
                                    </div>
                                </div>
                                <Badge variant={isPast ? 'secondary' : 'default'} className="text-xs">
                                    {isPast ? 'Selesai' : 'Akan Datang'}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <span className="text-muted-foreground text-sm">Belum ada jadwal.</span>
            )}
        </div>
    );

    return (
        <div className="space-y-6 rounded-lg border p-4">
            {/* Share Link Section */}
            <div>
                <h2 className="mb-4 text-lg font-medium">Share Link untuk Menerima Pendaftaran</h2>
                <div className="flex flex-col gap-4 md:flex-row">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Link Pendaftaran</label>
                        <Input
                            type="text"
                            value={program.registration_url}
                            readOnly
                            className="rounded border p-2 text-sm"
                            placeholder="Link Pendaftaran"
                        />
                        <Button
                            type="button"
                            onClick={handleCopyRegistrationLink}
                            className="w-full hover:cursor-pointer"
                            disabled={program.status === 'draft' || program.status === 'archived'}
                        >
                            Salin Link Pendaftaran <LinkIcon className="ml-1" />
                        </Button>
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Link Program</label>
                        <Input type="text" value={program.program_url} readOnly className="rounded border p-2 text-sm" placeholder="Link Program" />
                        <Button
                            type="button"
                            onClick={handleCopyProgramLink}
                            className="w-full hover:cursor-pointer"
                            disabled={program.status === 'draft' || program.status === 'archived'}
                        >
                            Salin Link Program <LinkIcon className="ml-1" />
                        </Button>
                    </div>
                </div>
                {program.status === 'published' || program.status === 'hidden' ? (
                    <p className="text-muted-foreground mt-3 text-center text-sm">
                        Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya untuk menerima
                        order dan pembayaran
                    </p>
                ) : (
                    <p className="mt-3 text-center text-sm text-red-500">
                        Program ini belum diterbitkan. Silahkan terbitkan program terlebih dahulu untuk membagikan link akses.
                    </p>
                )}
                {program.status === 'hidden' && (
                    <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                        <h4 className="font-medium text-yellow-800">Program Disembunyikan</h4>
                        <p className="mt-1 text-sm text-yellow-700">
                            Peserta hanya dapat mengakses program melalui link langsung, namun program ini tidak akan muncul di halaman publik.
                        </p>
                    </div>
                )}
            </div>
            {/* Thumbnail */}
            <div>
                <span className="font-semibold">Thumbnail:</span>
                <img
                    src={program.thumbnail ? `/storage/${program.thumbnail}` : '/assets/images/placeholder.png'}
                    alt={program.title}
                    className="my-2 h-40 w-64 rounded border object-cover"
                />
                {!program.thumbnail && <span className="text-muted-foreground text-sm">Thumbnail belum diunggah.</span>}
            </div>

            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">Kategori</TableCell>
                        <TableCell>{program.category?.name ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Tipe</TableCell>
                        <TableCell>
                            <Badge
                                className={`border-0 ${program.type === 'scholarship' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}
                            >
                                {program.type === 'scholarship' ? 'Beasiswa' : 'Reguler'}
                            </Badge>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Batch</TableCell>
                        <TableCell>{program.batch ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Harga</TableCell>
                        <TableCell>
                            {program.type === 'scholarship' ? (
                                <div className="space-y-1">
                                    {program.strikethrough_price > 0 && (
                                        <div className="text-xs text-gray-500 line-through">
                                            {rupiahFormatter.format(program.strikethrough_price)}
                                        </div>
                                    )}
                                    <div className="text-base font-semibold">
                                        {(program.scholarship_price ?? 0) === 0 ? 'Gratis' : rupiahFormatter.format(program.scholarship_price ?? 0)}
                                    </div>
                                    <div className="text-xs text-purple-600">Harga Beasiswa</div>
                                </div>
                            ) : program.price === 0 ? (
                                <span className="text-base font-semibold">Gratis</span>
                            ) : (
                                <div>
                                    {program.strikethrough_price > 0 && (
                                        <div className="text-xs text-gray-500 line-through">
                                            {rupiahFormatter.format(program.strikethrough_price)}
                                        </div>
                                    )}
                                    <div className="text-base font-semibold">{rupiahFormatter.format(program.price)}</div>
                                </div>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Deskripsi Singkat</TableCell>
                        <TableCell>{program.short_description ?? '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Deskripsi Lengkap</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-md text-wrap" dangerouslySetInnerHTML={{ __html: program.description ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Manfaat/Benefit</TableCell>
                        <TableCell>
                            <div className="prose prose-sm max-w-md text-wrap" dangerouslySetInnerHTML={{ __html: program.benefits ?? '-' }} />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Syarat & Ketentuan</TableCell>
                        <TableCell>
                            <div
                                className="prose prose-sm max-w-md text-wrap"
                                dangerouslySetInnerHTML={{ __html: program.terms_conditions ?? '-' }}
                            />
                        </TableCell>
                    </TableRow>
                    {program.type === 'scholarship' && program.scholarship_flow && (
                        <TableRow>
                            <TableCell className="font-medium">Alur Beasiswa</TableCell>
                            <TableCell>
                                <div className="prose prose-sm max-w-md text-wrap" dangerouslySetInnerHTML={{ __html: program.scholarship_flow }} />
                            </TableCell>
                        </TableRow>
                    )}
                    <TableRow>
                        <TableCell className="font-medium">Deadline Pendaftaran</TableCell>
                        <TableCell>
                            {program.registration_deadline
                                ? format(new Date(program.registration_deadline), 'dd MMMM yyyy HH:mm', { locale: id })
                                : '-'}
                        </TableCell>
                    </TableRow>
                    {program.type === 'scholarship' && (
                        <TableRow>
                            <TableCell className="font-medium">Deadline Sosialisasi</TableCell>
                            <TableCell>
                                {program.socialization_registration_deadline
                                    ? format(new Date(program.socialization_registration_deadline), 'dd MMMM yyyy HH:mm', { locale: id })
                                    : '-'}
                            </TableCell>
                        </TableRow>
                    )}
                    <TableRow>
                        <TableCell className="font-medium">Dokumen Diperlukan</TableCell>
                        <TableCell>{program.document_required ? 'Ya' : 'Tidak'}</TableCell>
                    </TableRow>
                    {program.document_required && (
                        <TableRow>
                            <TableCell className="font-medium">Deskripsi Dokumen</TableCell>
                            <TableCell>
                                <div className="text-sm whitespace-pre-line text-gray-700">{program.document_description ?? '-'}</div>
                            </TableCell>
                        </TableRow>
                    )}
                    <TableRow>
                        <TableCell className="font-medium">Link Grup</TableCell>
                        <TableCell>
                            {program.group_url ? (
                                <a href={program.group_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {program.group_url}
                                </a>
                            ) : (
                                '-'
                            )}
                        </TableCell>
                    </TableRow>
                    {program.type === 'scholarship' && (
                        <TableRow>
                            <TableCell className="font-medium">Link Grup Sosialisasi</TableCell>
                            <TableCell>
                                {program.socialization_group_url ? (
                                    <a
                                        href={program.socialization_group_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                    >
                                        {program.socialization_group_url}
                                    </a>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                        </TableRow>
                    )}
                    <TableRow>
                        <TableCell className="font-medium">Pemateri</TableCell>
                        <TableCell>
                            {program.mentors && program.mentors.length > 0 ? (
                                <div className="flex flex-col gap-3">
                                    {program.mentors.map((mentor) => (
                                        <div key={mentor.id} className="flex items-center gap-3">
                                            {mentor.avatar ? (
                                                <img
                                                    src={`/storage/${mentor.avatar}`}
                                                    alt={mentor.name}
                                                    className="h-10 w-10 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm text-gray-600">
                                                    {getInitials(mentor.name)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium">{mentor.name}</div>
                                                <div className="text-sm text-gray-500">{mentor.bio ?? 'Tidak ada bio'}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                '-'
                            )}
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            {/* Schedules */}
            <div className="space-y-4">
                {renderSchedules(program.schedules ?? [], 'Jadwal Pelaksanaan')}
                {program.type === 'scholarship' && renderSchedules(socializationSchedules, 'Jadwal Sosialisasi')}
            </div>
        </div>
    );
}
