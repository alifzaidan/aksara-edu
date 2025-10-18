import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

interface AddRecordingDialogProps {
    webinarId: string;
    currentRecordingUrl?: string | null;
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

export default function AddRecordingDialog({ webinarId, currentRecordingUrl }: AddRecordingDialogProps) {
    const [open, setOpen] = useState(false);
    const { data, setData, patch, processing, errors } = useForm({
        recording_url: currentRecordingUrl || '',
    });

    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (data.recording_url) {
            const videoId = getYoutubeId(data.recording_url);
            setPreviewUrl(videoId ? `https://www.youtube.com/embed/${videoId}` : '');
        } else {
            setPreviewUrl('');
        }
    }, [data.recording_url]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('webinars.add-recording', { webinar: webinarId }), {
            onSuccess: () => {
                setOpen(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full">
                    <Plus />
                    {currentRecordingUrl ? 'Edit Link Rekaman' : 'Upload Link Rekaman'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Link Rekaman Webinar</DialogTitle>
                    <DialogDescription>Masukkan link video dari YouTube. Pastikan link valid agar peserta dapat melihat rekaman.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="recording_url">Link YouTube</Label>
                        <Input
                            id="recording_url"
                            value={data.recording_url}
                            onChange={(e) => setData('recording_url', e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=xxxxxx"
                            autoComplete="off"
                        />
                        <InputError message={errors.recording_url} />
                    </div>

                    {previewUrl && (
                        <div>
                            <Label>Pratinjau Video</Label>
                            <div className="mt-2 aspect-video w-full">
                                <iframe
                                    className="h-full w-full rounded-lg border"
                                    src={previewUrl}
                                    title="YouTube Preview"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={processing}>
                            Simpan Link
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
