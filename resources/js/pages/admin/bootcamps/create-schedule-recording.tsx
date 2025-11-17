import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { router } from '@inertiajs/react';
import { LinkIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface AddScheduleRecordingDialogProps {
    bootcampId: string;
    scheduleId: string;
    currentRecordingUrl?: string | null;
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

export default function AddScheduleRecordingDialog({ bootcampId, scheduleId, currentRecordingUrl }: AddScheduleRecordingDialogProps) {
    const [open, setOpen] = useState(false);
    const [recordingUrl, setRecordingUrl] = useState(currentRecordingUrl || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        setRecordingUrl(currentRecordingUrl || '');
        if (currentRecordingUrl) {
            const videoId = getYoutubeId(currentRecordingUrl);
            setPreviewUrl(videoId ? `https://www.youtube.com/embed/${videoId}` : '');
        } else {
            setPreviewUrl('');
        }
    }, [currentRecordingUrl, open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setRecordingUrl(url);

        if (url) {
            const videoId = getYoutubeId(url);
            setPreviewUrl(videoId ? `https://www.youtube.com/embed/${videoId}` : '');
        } else {
            setPreviewUrl('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!recordingUrl.trim()) {
            toast.error('Link rekaman tidak boleh kosong');
            return;
        }

        setIsSubmitting(true);

        router.post(
            route('bootcamps.add-recording', { bootcamp: bootcampId, schedule: scheduleId }),
            { recording_url: recordingUrl },
            {
                onSuccess: () => {
                    setOpen(false);
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={currentRecordingUrl ? 'outline' : 'default'} size="sm" className="w-full">
                    <LinkIcon className="h-4 w-4" />
                    {currentRecordingUrl ? 'Edit Link Rekaman' : 'Tambah Link Rekaman'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{currentRecordingUrl ? 'Edit Link Rekaman' : 'Tambah Link Rekaman'}</DialogTitle>
                    <DialogDescription>
                        Masukkan link YouTube untuk rekaman sesi bootcamp ini. Link akan otomatis ditampilkan untuk peserta yang terdaftar.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="recording_url">Link YouTube Rekaman</Label>
                            <Input
                                id="recording_url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={recordingUrl}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-gray-500">
                                Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ atau https://youtu.be/dQw4w9WgXcQ
                            </p>
                        </div>

                        {previewUrl && (
                            <div className="space-y-2">
                                <Label>Preview Video</Label>
                                <div className="w-full">
                                    <iframe
                                        className="aspect-video w-full rounded-lg border"
                                        src={previewUrl}
                                        title="YouTube Preview"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
