'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type BootcampSchedule = {
    id?: string;
    title?: string;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
};

export default function CertificationProgramScheduleInput({
    value,
    onChange,
    label = 'Jadwal',
}: {
    value: BootcampSchedule[];
    onChange: (value: BootcampSchedule[]) => void;
    label?: string;
}) {
    const [schedules, setSchedules] = useState<BootcampSchedule[]>(value);
    const [openCalendars, setOpenCalendars] = useState<{ [key: number]: boolean }>({});

    useEffect(() => {
        setSchedules(value);
    }, [value]);

    function ymdToDate(ymd?: string) {
        if (!ymd) return undefined;
        const [y, m, d] = ymd.split('-').map((v) => parseInt(v, 10));
        if (!y || !m || !d) return undefined;
        return new Date(y, m - 1, d);
    }

    function getDayFromDate(dateStr: string): { value: string; label: string } | null {
        if (!dateStr) return null;
        const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
        const dt = new Date(y, (m || 1) - 1, d || 1);
        const idx = dt.getDay();
        const map: { value: string; label: string }[] = [
            { value: 'minggu', label: 'Minggu' },
            { value: 'senin', label: 'Senin' },
            { value: 'selasa', label: 'Selasa' },
            { value: 'rabu', label: 'Rabu' },
            { value: 'kamis', label: 'Kamis' },
            { value: 'jumat', label: 'Jumat' },
            { value: 'sabtu', label: 'Sabtu' },
        ];
        return map[idx] ?? null;
    }

    function handleChange(idx: number, key: keyof BootcampSchedule, val: string) {
        const updated = schedules.map((item, i) => {
            if (i !== idx) return item;
            if (key === 'schedule_date') {
                const dayObj = getDayFromDate(val);
                return { ...item, schedule_date: val, day: dayObj?.value ?? '' };
            }
            return { ...item, [key]: val };
        });
        setSchedules(updated);
        onChange(updated);
    }

    function addSchedule() {
        const updated = [
            ...schedules,
            {
                id: undefined,
                title: '',
                schedule_date: '',
                day: '',
                start_time: '15:00',
                end_time: '17:00',
            },
        ];
        setSchedules(updated);
        onChange(updated);
    }

    function removeSchedule(idx: number) {
        const updated = schedules.filter((_, i) => i !== idx);
        setSchedules(updated);
        onChange(updated);
    }

    function setOpenCalendar(idx: number, open: boolean) {
        setOpenCalendars((prev) => ({ ...prev, [idx]: open }));
    }

    return (
        <div className="space-y-2">
            <FormLabel>{label}</FormLabel>
            {schedules.map((schedule, idx) => {
                const dayObj = schedule.schedule_date ? getDayFromDate(schedule.schedule_date) : null;
                const selectedDate = ymdToDate(schedule.schedule_date);
                const isOpen = openCalendars[idx] || false;

                return (
                    <div key={idx} className="mt-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="text"
                                placeholder={`Judul sesi ${idx + 1} (opsional)`}
                                value={schedule.title || ''}
                                onChange={(e) => handleChange(idx, 'title', e.target.value)}
                                className="bg-background w-full rounded-lg border px-3 py-1.5 text-sm"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Popover open={isOpen} onOpenChange={(open) => setOpenCalendar(idx, open)}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        className={cn('w-36 justify-between', !selectedDate && 'text-muted-foreground')}
                                    >
                                        <span className="inline-flex items-center gap-2">
                                            <CalendarIcon size={16} />
                                            {selectedDate
                                                ? selectedDate.toLocaleDateString('id-ID', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : 'Pilih tanggal'}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        defaultMonth={selectedDate || new Date()}
                                        endMonth={new Date(new Date().getFullYear() + 10, 11)}
                                        captionLayout="dropdown"
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        onSelect={(date) => {
                                            if (!date) return;
                                            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                            handleChange(idx, 'schedule_date', dateStr);
                                            setOpenCalendar(idx, false);
                                        }}
                                    />
                                </PopoverContent>
                            </Popover>

                            <span
                                className={cn(
                                    'inline-flex items-center rounded-full border px-3 py-1 text-sm',
                                    dayObj ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-zinc-200 bg-zinc-50 text-zinc-600',
                                )}
                                title="Terisi otomatis dari tanggal"
                            >
                                {dayObj ? dayObj.label : 'Pilih tgl'}
                            </span>

                            <input
                                type="time"
                                value={schedule.start_time}
                                onChange={(e) => handleChange(idx, 'start_time', e.target.value)}
                                className="bg-background w-28 rounded-lg border px-3 py-1.5"
                            />
                            <span>-</span>
                            <input
                                type="time"
                                value={schedule.end_time}
                                onChange={(e) => handleChange(idx, 'end_time', e.target.value)}
                                className="bg-background w-28 rounded-lg border px-3 py-1.5"
                            />
                            <Button type="button" variant="destructive" size="icon" onClick={() => removeSchedule(idx)}>
                                <X />
                            </Button>
                        </div>
                    </div>
                );
            })}
            <Button type="button" onClick={addSchedule} className="mt-1 block hover:cursor-pointer">
                <div className="flex items-center gap-2">
                    <Plus /> Tambah Jadwal
                </div>
            </Button>
        </div>
    );
}
