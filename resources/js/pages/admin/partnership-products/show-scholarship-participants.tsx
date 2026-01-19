'use client';

import { Card } from '@/components/ui/card';
import { getColumns, type ScholarshipParticipant } from './columns-scholarship-participants';
import { DataTableScholarshipParticipants } from './data-table-scholarship-participants';

export default function ShowScholarshipParticipants({
    partnershipProductId,
    participants,
}: {
    partnershipProductId: string;
    participants: ScholarshipParticipant[];
}) {
    return (
        <Card className="p-4">
            {participants.length > 0 ? (
                <DataTableScholarshipParticipants columns={getColumns(partnershipProductId)} data={participants} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Peserta Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada peserta yang mengisi formulir beasiswa.</p>
                </div>
            )}
        </Card>
    );
}
