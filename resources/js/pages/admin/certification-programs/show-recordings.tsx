import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ExternalLink, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AddScheduleRecordingDialog from './create-schedule-recording';

interface Schedule {
    id: string;
    title?: string | null;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
    recording_url?: string | null;
}

interface CertificationProgramRecordingsProps {
    programId: string;
    programType: 'regular' | 'scholarship';
    schedules: Schedule[];
    socializationSchedules: Schedule[];
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

export default function CertificationProgramRecordings({ programId, programType, schedules, socializationSchedules }: CertificationProgramRecordingsProps) {
    const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);

    const handleDeleteRecording = (scheduleId: string, type: 'schedule' | 'socialization') => {
        setDeletingScheduleId(scheduleId);

        const routeName = type === 'socialization'
            ? 'certification-programs.remove-socialization-recording'
            : 'certification-programs.remove-recording';

        router.delete(route(routeName, { program: programId, schedule: scheduleId }), {
            onSuccess: () => {
                setDeletingScheduleId(null);
            },
            onError: () => {
                setDeletingScheduleId(null);
            },
        });
    };

    const renderScheduleRecordings = (scheduleList: Schedule[], title: string, type: 'schedule' | 'socialization') => (
        <div className="space-y-4">
            <h3 className="text-base font-semibold">{title}</h3>
            {scheduleList.length > 0 ? (
                <div className="space-y-4">
                    {scheduleList.map((sch, idx) => {
                        const scheduleDate = new Date(sch.schedule_date);
                        const isPastSchedule = scheduleDate < new Date();
                        const videoId = sch.recording_url ? getYoutubeId(sch.recording_url) : '';
                        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';

                        return (
                            <div key={sch.id} className="space-y-3 rounded-lg border p-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-medium">{sch.title || `Pertemuan ${idx + 1}`}</div>
                                        <div className="text-sm text-gray-600">
                                            <span className="inline-block">
                                                {format(scheduleDate, 'dd MMM yyyy', { locale: id })}
                                            </span>
                                            {' • '}
                                            <span className="inline-block capitalize">{sch.day}</span>
                                            {' • '}
                                            <span>
                                                {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)} WIB
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {isPastSchedule ? (
                                            <Badge variant="secondary" className="text-xs">
                                                Selesai
                                            </Badge>
                                        ) : (
                                            <Badge className="text-xs">Akan Datang</Badge>
                                        )}
                                    </div>
                                </div>

                                {/* Recording Section */}
                                <div className="space-y-2">
                                    {sch.recording_url ? (
                                        <>
                                            {embedUrl && (
                                                <div className="w-full">
                                                    <iframe
                                                        className="aspect-video w-full rounded-lg border"
                                                        src={embedUrl}
                                                        title={`Recording ${sch.title || `Pertemuan ${idx + 1}`}`}
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                        allowFullScreen
                                                    />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={sch.recording_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex flex-1 items-center gap-1 text-sm text-blue-600 hover:underline"
                                                >
                                                    <ExternalLink className="h-3 w-3" />
                                                    Lihat di YouTube
                                                </a>
                                            </div>
                                            <div className="flex gap-2">
                                                <AddScheduleRecordingDialog
                                                    programId={programId}
                                                    scheduleId={sch.id}
                                                    currentRecordingUrl={sch.recording_url}
                                                    type={type}
                                                />
                                                <DeleteConfirmDialog
                                                    trigger={
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            disabled={deletingScheduleId === sch.id}
                                                            className="flex items-center gap-1"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                            {deletingScheduleId === sch.id ? 'Menghapus...' : 'Hapus'}
                                                        </Button>
                                                    }
                                                    title="Apakah Anda yakin ingin menghapus link rekaman ini?"
                                                    itemName={`Rekaman ${sch.title || `Pertemuan ${idx + 1}`}`}
                                                    onConfirm={() => handleDeleteRecording(sch.id, type)}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {isPastSchedule && (
                                                <div className="rounded-lg bg-amber-50 p-2 text-xs text-amber-700">
                                                    Sesi sudah selesai - Link rekaman belum diupload
                                                </div>
                                            )}
                                            <AddScheduleRecordingDialog
                                                programId={programId}
                                                scheduleId={sch.id}
                                                currentRecordingUrl={null}
                                                type={type}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed bg-gray-50 py-8 text-center dark:bg-zinc-900/50">
                    <p className="text-gray-500">Belum ada jadwal.</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 rounded-lg border p-4">
            {renderScheduleRecordings(schedules, 'Jadwal Kelas', 'schedule')}
            {programType === 'scholarship' && renderScheduleRecordings(socializationSchedules, 'Jadwal Sosialisasi', 'socialization')}
        </div>
    );
}
