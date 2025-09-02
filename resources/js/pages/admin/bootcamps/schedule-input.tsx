'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormLabel } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Plus, X } from 'lucide-react';
import { useState } from 'react';

export type BootcampSchedule = {
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
};

interface BootcampScheduleInputProps {
    value: BootcampSchedule[];
    onChange: (value: BootcampSchedule[]) => void;
    startDate?: string;
    endDate?: string;
}

export default function BootcampScheduleInput({ value, onChange, startDate, endDate }: BootcampScheduleInputProps) {
    const [schedules, setSchedules] = useState<BootcampSchedule[]>(value);
    const [openCalendars, setOpenCalendars] = useState<{ [key: number]: boolean }>({});

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
                schedule_date: '',
                day: '',
                start_time: '07:00',
                end_time: '10:00',
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

    const startDateObj = startDate ? ymdToDate(startDate) : undefined;
    const endDateObj = endDate ? ymdToDate(endDate) : undefined;

    return (
        <div className="space-y-2">
            <FormLabel>Jadwal Bootcamp</FormLabel>
            <div className="text-muted-foreground mb-2 text-sm">
                {startDateObj && endDateObj ? (
                    <>
                        Pilih tanggal dalam rentang:{' '}
                        <span className="font-medium">
                            {startDateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>{' '}
                        -{' '}
                        <span className="font-medium">
                            {endDateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                    </>
                ) : (
                    'Tentukan tanggal mulai dan selesai bootcamp terlebih dahulu'
                )}
            </div>
            {schedules.map((schedule, idx) => {
                const dayObj = schedule.schedule_date ? getDayFromDate(schedule.schedule_date) : null;
                const selectedDate = ymdToDate(schedule.schedule_date);
                const isOpen = openCalendars[idx] || false;

                return (
                    <div key={idx} className="mt-1 flex flex-wrap items-center gap-2">
                        <Popover open={isOpen} onOpenChange={(open) => setOpenCalendar(idx, open)}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    type="button"
                                    disabled={!startDateObj || !endDateObj}
                                    className={cn(
                                        'w-36 justify-between',
                                        !selectedDate && 'text-muted-foreground',
                                        (!startDateObj || !endDateObj) && 'cursor-not-allowed opacity-50',
                                    )}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarIcon size={16} />
                                        {selectedDate
                                            ? selectedDate.toLocaleDateString('id-ID', {
                                                  day: '2-digit',
                                                  month: 'short',
                                                  year: 'numeric',
                                              })
                                            : !startDateObj || !endDateObj
                                              ? 'Set tanggal bootcamp'
                                              : 'Pilih tanggal'}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    defaultMonth={selectedDate || startDateObj}
                                    captionLayout="dropdown"
                                    disabled={(date) => {
                                        if (!startDateObj || !endDateObj) return true;

                                        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                        const startOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
                                        const endOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());

                                        return dateOnly < startOnly || dateOnly > endOnly;
                                    }}
                                    onSelect={(date) => {
                                        if (!date || !startDateObj || !endDateObj) return;

                                        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                        const startOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
                                        const endOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());

                                        if (dateOnly >= startOnly && dateOnly <= endOnly) {
                                            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
                                                date.getDate(),
                                            ).padStart(2, '0')}`;
                                            handleChange(idx, 'schedule_date', dateStr);
                                        }

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
