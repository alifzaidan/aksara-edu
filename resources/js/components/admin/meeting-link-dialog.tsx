import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { ExternalLink, Trash2, Video } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MeetingLinkProps {
    /** URL POST simpan, mis. route('bootcamps.meeting-link', [bootcampId, scheduleId]) */
    action: string;
    /** URL DELETE hapus */
    removeAction: string;
    meetingUrl?: string | null;
    zoomMeetingId?: string | null;
    label: string;
    readOnly?: boolean;
}

/** Baris link Zoom per sesi: tampilkan link + tombol tambah/edit/hapus. */
export default function MeetingLink({ action, removeAction, meetingUrl, zoomMeetingId, label, readOnly }: MeetingLinkProps) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState(meetingUrl ?? '');
    const [zoomId, setZoomId] = useState(zoomMeetingId ?? '');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);

    useEffect(() => {
        if (open) {
            setUrl(meetingUrl ?? '');
            setZoomId(zoomMeetingId ?? '');
            setErrors({});
        }
    }, [open, meetingUrl, zoomMeetingId]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        router.post(
            action,
            { meeting_url: url.trim(), zoom_meeting_id: zoomId.trim() || null },
            {
                preserveScroll: true,
                onSuccess: () => setOpen(false),
                onError: (errs) => setErrors(errs),
                onFinish: () => setSaving(false),
            },
        );
    };

    const remove = () => {
        setRemoving(true);
        router.delete(removeAction, { preserveScroll: true, onFinish: () => setRemoving(false) });
    };

    return (
        <div className="space-y-2">
            {meetingUrl ? (
                <a
                    href={meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm break-all text-blue-600 hover:underline"
                >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    Link Zoom{zoomMeetingId ? ` · ID ${zoomMeetingId}` : ''}
                </a>
            ) : (
                <p className="text-muted-foreground text-xs">Link Zoom belum ada.</p>
            )}

            {!readOnly && (
                <div className="flex gap-2">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant={meetingUrl ? 'outline' : 'secondary'} className="flex-1">
                                <Video className="h-4 w-4" />
                                {meetingUrl ? 'Edit Link Zoom' : 'Tambah Link Zoom'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[560px]">
                            <DialogHeader>
                                <DialogTitle>Link Zoom · {label}</DialogTitle>
                                <DialogDescription>
                                    Link masuk Zoom untuk peserta. Ini berbeda dari link halaman program/LMS. Hanya peserta terdaftar dengan akses
                                    aktif yang melihatnya.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={submit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="meeting_url">Link Zoom</Label>
                                    <Input
                                        id="meeting_url"
                                        placeholder="https://us06web.zoom.us/j/81234567890?pwd=..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        disabled={saving}
                                    />
                                    {errors.meeting_url && <p className="text-xs text-red-600">{errors.meeting_url}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zoom_meeting_id">ID Meeting (opsional)</Label>
                                    <Input
                                        id="zoom_meeting_id"
                                        placeholder="Diambil otomatis dari link bila kosong"
                                        value={zoomId}
                                        onChange={(e) => setZoomId(e.target.value.replace(/\s/g, ''))}
                                        disabled={saving}
                                    />
                                    {errors.zoom_meeting_id && <p className="text-xs text-red-600">{errors.zoom_meeting_id}</p>}
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={saving || !url.trim()}>
                                        {saving ? 'Menyimpan...' : 'Simpan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {meetingUrl && (
                        <DeleteConfirmDialog
                            trigger={
                                <Button size="sm" variant="destructive" disabled={removing}>
                                    <Trash2 className="h-3 w-3" />
                                    {removing ? 'Menghapus...' : 'Hapus'}
                                </Button>
                            }
                            title="Hapus link Zoom ini?"
                            itemName={`Link Zoom ${label}`}
                            onConfirm={remove}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
