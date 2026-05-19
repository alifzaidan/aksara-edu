import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Clock } from 'lucide-react';

interface Schedule {
    id: string;
    title?: string | null;
    schedule_date?: string;
    start_date?: string;
    day?: string;
    start_time?: string;
    end_time?: string;
}

interface CertificationProgram {
    schedules: Schedule[];
    socializationSchedules?: Schedule[];
    type: 'regular' | 'scholarship';
}

export default function ScheduleInfoSection({ program }: { program: CertificationProgram }) {
    const schedules = program.schedules ?? [];
    if (schedules.length === 0) return null;
    const socializationSchedules =
        program.socializationSchedules ?? (program as CertificationProgram & { socialization_schedules?: Schedule[] }).socialization_schedules ?? [];

    const getDate = (s: Schedule) => s.schedule_date || s.start_date || '';
    const getDayLabel = (s: Schedule) => {
        if (s.day?.trim()) {
            return s.day;
        }

        const dateValue = getDate(s);
        if (!dateValue) {
            return '';
        }

        return format(new Date(dateValue), 'EEEE', { locale: id });
    };

    const formatDate = (value: string) => format(new Date(value), 'dd MMMM yyyy', { locale: id });
    const formatTime = (value?: string) => (value ? value.slice(0, 5) : '');

    const totalSessions = schedules.length;
    const firstDate = getDate(schedules[0]);
    const lastDate = getDate(schedules[schedules.length - 1]);

    return (
        <section className="mx-auto w-full max-w-5xl px-4 py-8">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="to-primary bg-gradient-to-br from-black px-6 py-5 text-white md:px-8">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wider text-white/90 uppercase">
                                <Calendar className="h-4 w-4" />
                                Jadwal Pelaksanaan
                            </div>
                            <h3 className="text-2xl font-bold md:text-3xl">Rangkaian sesi program per hari</h3>
                            <p className="mt-1 max-w-2xl text-sm text-white/85">Detail jadwal sesi yang akan dilaksanakan.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm md:min-w-80">
                            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                                <div className="text-white/75">Total Sesi</div>
                                <div className="mt-1 text-2xl font-bold">{totalSessions}</div>
                            </div>
                            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
                                <div className="text-white/75">Rentang Tanggal</div>
                                <div className="mt-1 text-base leading-tight font-semibold">
                                    {firstDate && lastDate ? `${formatDate(firstDate)} - ${formatDate(lastDate)}` : 'Menunggu jadwal'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 md:p-8">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Detail Jadwal per Hari</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Urutan sesi ditampilkan dari hari pertama hingga terakhir.</p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {schedules.map((schedule, index) => {
                            const dateValue = getDate(schedule);
                            const startTime = formatTime(schedule.start_time);
                            const endTime = formatTime(schedule.end_time);

                            return (
                                <div
                                    key={schedule.id}
                                    className="group hover:border-primary rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800/80"
                                >
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="to-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-black text-white shadow-md">
                                                <span className="text-sm font-bold">{index + 1}</span>
                                            </div>

                                            <div className="space-y-2">
                                                <h5 className="text-base font-semibold text-slate-900 dark:text-white">
                                                    {schedule.title || (dateValue ? formatDate(dateValue) : `Sesi ${index + 1}`)}
                                                </h5>

                                                {schedule.title && dateValue && schedule.day && (
                                                    <p className="text-sm text-slate-500 capitalize dark:text-slate-400">
                                                        {schedule.day}, {formatDate(dateValue)}
                                                    </p>
                                                )}

                                                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                    {(startTime || endTime) && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-zinc-700">
                                                            <Clock className="h-4 w-4 text-amber-500" />
                                                            {startTime || '--:--'} {endTime ? `- ${endTime}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Socialization Schedules for Scholarship */}
            {program.type === 'scholarship' && socializationSchedules.length > 0 && (
                <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
                    <div className="mb-4 flex items-center gap-2">
                        <Calendar className="text-primary h-5 w-5" />
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Jadwal Sosialisasi Beasiswa</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tahapan awal sebelum proses seleksi utama dimulai.</p>
                        </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        {socializationSchedules.map((schedule, index) => {
                            const dateValue = getDate(schedule);
                            const startTime = formatTime(schedule.start_time);
                            const endTime = formatTime(schedule.end_time);

                            return (
                                <div
                                    key={schedule.id}
                                    className="border-primary-foreground dark:border-primary rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-zinc-950"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <Badge className="bg-primary-foreground text-primary hover:bg-primary-foreground dark:bg-primary/15 rounded-full px-3 py-1 text-xs font-semibold dark:text-purple-200">
                                            {schedule.title || `Tahap ${index + 1}`}
                                        </Badge>
                                        <span className="text-primary text-xs font-medium tracking-wide uppercase">Sosialisasi</span>
                                    </div>
                                    <div className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                                        {getDayLabel(schedule) && <span className="capitalize">{getDayLabel(schedule)}, </span>}
                                        {dateValue ? formatDate(dateValue) : 'Tanggal belum tersedia'}
                                    </div>
                                    {(startTime || endTime) && (
                                        <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                            {startTime || '--:--'} {endTime ? `- ${endTime}` : ''}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
