import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useState } from 'react';

interface Application {
    id: string;
    user?: { id: string; name: string; email: string; phone_number?: string };
    name?: string;
    email?: string;
    phone?: string;
    status: string;
    created_at: string;
}

interface CertificationProgramApplicationsProps {
    applications: Application[];
    programType: 'regular' | 'scholarship';
    programId: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800' },
    paid: { label: 'Lunas', color: 'bg-blue-100 text-blue-800' },
};

export default function CertificationProgramApplications({ applications, programType, programId }: CertificationProgramApplicationsProps) {
    const label = programType === 'scholarship' ? 'Pendaftar Beasiswa' : 'Pendaftar Program';
    const approvedCount = applications.filter((a) => a.status === 'approved').length;

    return (
        <div className="h-full space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{label}</h2>
                {applications.length > 0 && (
                    <div className="text-muted-foreground text-sm">
                        Disetujui:{' '}
                        <span className="text-foreground font-semibold">
                            {approvedCount}/{applications.length}
                        </span>
                    </div>
                )}
            </div>

            {applications.length > 0 ? (
                <div className="space-y-3">
                    {applications.map((app) => {
                        const name = app.user?.name ?? app.name ?? '-';
                        const email = app.user?.email ?? app.email ?? '-';
                        const phone = app.user?.phone_number ?? app.phone ?? '-';
                        const statusInfo = statusMap[app.status] ?? { label: app.status, color: 'bg-gray-200 text-gray-800' };

                        return (
                            <div key={app.id} className="flex items-start justify-between rounded-lg border p-3">
                                <div className="space-y-1">
                                    <div className="font-medium">{name}</div>
                                    <div className="text-muted-foreground text-sm">{email}</div>
                                    {phone !== '-' && <div className="text-muted-foreground text-sm">{phone}</div>}
                                    <div className="text-muted-foreground text-xs">
                                        Daftar: {format(new Date(app.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Badge className={`border-0 ${statusInfo.color}`}>{statusInfo.label}</Badge>

                                    {/* Actions: only show when pending */}
                                    {app.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <ApproveRejectButtons
                                                programType={programType}
                                                programId={programId}
                                                applicationId={app.id}
                                                participantPhone={phone}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Tidak ada pendaftar" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada pendaftar untuk program ini.</p>
                </div>
            )}
        </div>
    );
}

function ApproveRejectButtons({
    programType,
    programId,
    applicationId,
}: {
    programType: 'regular' | 'scholarship';
    programId: string;
    applicationId: string;
    participantPhone: string;
}) {
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

    const handleAction = (type: 'approve' | 'reject') => {
        setActionType(type);
        setConfirmOpen(true);
    };

    const submitAction = () => {
        if (!actionType) return;

        const routeName =
            actionType === 'approve'
                ? programType === 'scholarship'
                    ? route('certification-programs.scholarship-applications.approve', { program: programId, application: applicationId })
                    : route('certification-programs.applications.approve', { program: programId, application: applicationId })
                : // reject
                  programType === 'scholarship'
                  ? route('certification-programs.scholarship-applications.reject', { program: programId, application: applicationId })
                  : route('certification-programs.applications.reject', { program: programId, application: applicationId });

        // Use Inertia post to call controller
        router.post(
            routeName,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setConfirmOpen(false);
                },
                onError: () => {
                    setConfirmOpen(false);
                },
            },
        );

        // WA sending is handled server-side (Wablas). No client-side WA open needed.
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 px-2 bg-green-100 text-green-600" onClick={() => handleAction('approve')}>
                    Terima
                </Button>
                <Button variant="destructive" size="sm" className="h-8 px-2" onClick={() => handleAction('reject')}>
                    Tolak
                </Button>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{actionType === 'approve' ? 'Konfirmasi Terima Peserta' : 'Konfirmasi Tolak Peserta'}</DialogTitle>
                    </DialogHeader>
                    <p className="mt-2 text-sm">
                        Anda yakin ingin {actionType === 'approve' ? 'menerima' : 'menolak'} peserta ini? Pesan WA akan dikirim jika memilih terima.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={submitAction} className="ml-2">
                            Ya, {actionType === 'approve' ? 'Terima' : 'Tolak'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
