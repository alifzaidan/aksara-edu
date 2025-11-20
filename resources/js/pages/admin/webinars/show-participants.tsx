import { webinarParticipantColumns, type WebinarParticipant } from './columns-participants';
import { DataTable } from './data-table-participants';

interface WebinarParticipantProps {
    participants: WebinarParticipant[];
}

export default function WebinarParticipantSection({ participants }: WebinarParticipantProps) {
    const verifiedCount = participants.filter((p) => p.webinar_item.attendance_verified).length;
    const uploadedCount = participants.filter((p) => p.webinar_item.attendance_proof).length;

    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Data Peserta Webinar</h2>
                {participants.length > 0 && (
                    <div className="flex gap-4 text-sm">
                        <div className="text-muted-foreground">
                            Total Peserta: <span className="text-foreground font-semibold">{participants.length}</span>
                        </div>
                        <div className="text-muted-foreground">
                            Kehadiran Terverifikasi:{' '}
                            <span className="font-semibold text-green-600">
                                {verifiedCount}/{participants.length}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {participants.length > 0 && (uploadedCount > 0 || verifiedCount > 0) && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-900/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Bukti Kehadiran Diupload</p>
                                <p className="text-muted-foreground text-xs">Total peserta yang sudah upload</p>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                                {uploadedCount}/{participants.length}
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-900/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">Kehadiran Terverifikasi</p>
                                <p className="text-muted-foreground text-xs">Total peserta yang sudah diverifikasi</p>
                            </div>
                            <div className="text-2xl font-bold text-green-600">
                                {verifiedCount}/{participants.length}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {participants.length > 0 ? (
                <DataTable columns={webinarParticipantColumns} data={participants} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Peserta Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada peserta untuk webinar ini.</p>
                </div>
            )}
        </div>
    );
}
