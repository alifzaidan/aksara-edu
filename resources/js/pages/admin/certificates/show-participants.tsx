import { columns, type CertificateParticipant } from './columns-participants';
import { DataTable } from './data-table-participants';

export default function CertificateParticipants({ participants }: { participants: CertificateParticipant[] }) {
    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Peserta Sertifikat</h2>
            </div>

            {participants.length > 0 ? (
                <DataTable columns={columns} data={participants} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Peserta Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada peserta untuk sertifikat ini.</p>
                </div>
            )}
        </div>
    );
}
