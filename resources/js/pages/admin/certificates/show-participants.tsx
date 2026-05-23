import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { Download, FileSpreadsheet, UploadCloud } from 'lucide-react';
import { useRef } from 'react';
import { getColumns, type CertificateParticipant } from './columns-participants';
import { DataTable } from './data-table-participants';

interface Certificate {
    id: string;
    title: string;
    bootcamp_id?: string | null;
    course_id?: string | null;
    webinar_id?: string | null;
    program_type?: string;
    page_count?: number | string | null;
    second_page_grade?: boolean;
    second_page_material?: boolean;
    assessment_subjects?: string[] | null;
}

interface CertificateParticipantsProps {
    certificate: Certificate;
    participants: CertificateParticipant[];
    issuedDate?: string | null;
}

export default function CertificateParticipants({ certificate, participants, issuedDate }: CertificateParticipantsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        router.post(route('certificates.import-grades', certificate.id), formData, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const isGradePage = (certificate.program_type === 'bootcamp' || !!certificate.bootcamp_id) && 
                        String(certificate.page_count) === '2' && 
                        certificate.second_page_grade === true;

    return (
        <div className="h-full space-y-6 rounded-lg border p-4 bg-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Peserta Sertifikat</h2>
                    <p className="text-xs text-muted-foreground">Kelola data dan nilai transkrip untuk para peserta.</p>
                </div>
            </div>

            {isGradePage && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                            </span>
                            <h4 className="font-semibold text-sm text-gray-900">Pengisian Nilai Transkrip (Halaman Kedua)</h4>
                        </div>
                        <p className="text-xs text-muted-foreground max-w-2xl">
                            Sertifikat ini memiliki halaman kedua berupa transkrip nilai. Unduh template Excel di bawah untuk mengisi nilai per kolom aspek penilaian, lalu unggah kembali untuk memperbarui data peserta.
                        </p>
                    </div>

                    <div className="flex flex-col items-center sm:ml-auto gap-2.5">
                        <Button asChild variant="outline" className="w-full h-9 gap-1.5 bg-white shadow-sm border-gray-200">
                            <a href={route('certificates.download-grades-template', certificate.id)}>
                                <Download className="h-4 w-4 text-muted-foreground" />
                                Unduh Template
                            </a>
                        </Button>

                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".xlsx,.xls,.csv" 
                            className="hidden" 
                        />
                        
                        <Button onClick={handleImportClick} className="w-full h-9 gap-1.5 shadow-sm">
                            <UploadCloud className="h-4 w-4" /> 
                            Import Nilai Excel
                        </Button>
                    </div>
                </div>
            )}

            {participants.length > 0 ? (
                <DataTable columns={getColumns(issuedDate)} data={participants} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Peserta Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada peserta untuk sertifikat ini.</p>
                </div>
            )}
        </div>
    );
}
