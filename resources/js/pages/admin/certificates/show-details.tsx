import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Certificate {
    id: string;
    certificate_number: string;
    title: string;
    description?: string | null;
    header_top?: string | null;
    header_bottom?: string | null;
    issued_date?: string | null;
    period?: string | null;
    design?: { id: string; name: string; image_1: string };
    sign?: { id: string; name: string; image: string };
    course?: { id: string; title: string };
    bootcamp?: { id: string; title: string };
    webinar?: { id: string; title: string };
    created_at: string;
    updated_at: string;
}

export default function CertificateDetail({ certificate }: { certificate: Certificate }) {
    const getProgramInfo = () => {
        if (certificate.course) {
            return { type: 'Kelas Online', name: certificate.course.title };
        } else if (certificate.bootcamp) {
            return { type: 'Bootcamp', name: certificate.bootcamp.title };
        } else if (certificate.webinar) {
            return { type: 'Webinar', name: certificate.webinar.title };
        }
        return { type: '-', name: '-' };
    };

    const programInfo = getProgramInfo();

    return (
        <div className="space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Detail Sertifikat</h2>

            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">Nomor Sertifikat</TableCell>
                        <TableCell>
                            <code className="rounded bg-gray-100 px-2 py-1 text-sm">{certificate.certificate_number}</code>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Judul Sertifikat</TableCell>
                        <TableCell className="font-semibold">{certificate.title}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Deskripsi</TableCell>
                        <TableCell>
                            {certificate.description ? (
                                <div className="prose prose-sm max-w-none">{certificate.description}</div>
                            ) : (
                                <span className="text-muted-foreground">-</span>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Header Atas</TableCell>
                        <TableCell>{certificate.header_top || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Header Bawah</TableCell>
                        <TableCell>{certificate.header_bottom || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Tanggal Terbit</TableCell>
                        <TableCell>
                            {certificate.issued_date ? (
                                format(new Date(certificate.issued_date), 'dd MMMM yyyy', { locale: id })
                            ) : (
                                <span className="text-muted-foreground">Belum ditentukan</span>
                            )}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Periode</TableCell>
                        <TableCell>{certificate.period || '-'}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Jenis Program</TableCell>
                        <TableCell>
                            <Badge variant="secondary">{programInfo.type}</Badge>
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Program Terkait</TableCell>
                        <TableCell className="font-medium">{programInfo.name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Desain Sertifikat</TableCell>
                        <TableCell>
                            <Badge variant="outline">{certificate.design?.name || '-'}</Badge>
                            <img
                                src={certificate.design?.image_1 ? `/storage/${certificate.design?.image_1}` : '/assets/images/placeholder.png'}
                                alt={certificate.design?.name}
                                className="mt-2 h-24 rounded-md object-cover"
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Tanda Tangan</TableCell>
                        <TableCell>
                            <Badge variant="outline">{certificate.sign?.name || '-'}</Badge>
                            <img
                                src={certificate.sign?.image ? `/storage/${certificate.sign?.image}` : '/assets/images/placeholder.png'}
                                alt={certificate.sign?.name}
                                className="mt-2 h-24 rounded-md object-cover"
                            />
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Dibuat</TableCell>
                        <TableCell>{format(new Date(certificate.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Terakhir Diubah</TableCell>
                        <TableCell>{format(new Date(certificate.updated_at), 'dd MMMM yyyy HH:mm', { locale: id })}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>

            <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-700">
                    Sertifikat ini akan diberikan kepada peserta yang telah menyelesaikan program <strong>{programInfo.name}</strong> dengan kategori{' '}
                    <strong>{programInfo.type}</strong>.
                </p>
            </div>
        </div>
    );
}
