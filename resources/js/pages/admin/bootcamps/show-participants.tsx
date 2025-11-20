import { createParticipantColumns, type Participant } from './columns-participants';
import { DataTable } from './data-table-participants';

interface BootcampParticipantProps {
    participants: Participant[];
    totalSchedules: number;
}

export default function BootcampParticipant({ participants, totalSchedules }: BootcampParticipantProps) {
    const columns = createParticipantColumns(totalSchedules);

    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Data Peserta Bootcamp</h2>
                {participants.length > 0 && (
                    <div className="text-muted-foreground text-sm">
                        Total Peserta: <span className="text-foreground font-semibold">{participants.length}</span>
                    </div>
                )}
            </div>

            {participants.length > 0 ? (
                <DataTable columns={columns} data={participants} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Peserta Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada peserta untuk bootcamp ini.</p>
                </div>
            )}
        </div>
    );
}
