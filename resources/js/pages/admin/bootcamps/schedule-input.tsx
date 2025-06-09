'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CheckIcon, ChevronsUpDownIcon, Plus, X } from 'lucide-react';
import { useState } from 'react';

const days = [
    { value: 'senin', label: 'Senin' },
    { value: 'selasa', label: 'Selasa' },
    { value: 'rabu', label: 'Rabu' },
    { value: 'kamis', label: 'Kamis' },
    { value: 'jumat', label: 'Jumat' },
    { value: 'sabtu', label: 'Sabtu' },
    { value: 'minggu', label: 'Minggu' },
];

export type BootcampSchedule = {
    day: string;
    start_time: string;
    end_time: string;
};

interface BootcampScheduleInputProps {
    value: BootcampSchedule[];
    onChange: (value: BootcampSchedule[]) => void;
}

export default function BootcampScheduleInput({ value, onChange }: BootcampScheduleInputProps) {
    const [schedules, setSchedules] = useState<BootcampSchedule[]>(value);

    function handleChange(idx: number, key: keyof BootcampSchedule, val: string) {
        const updated = schedules.map((item, i) => (i === idx ? { ...item, [key]: val } : item));
        setSchedules(updated);
        onChange(updated);
    }

    function addSchedule() {
        const updated = [...schedules, { day: '', start_time: '07:00', end_time: '10:00' }];
        setSchedules(updated);
        onChange(updated);
    }

    function removeSchedule(idx: number) {
        const updated = schedules.filter((_, i) => i !== idx);
        setSchedules(updated);
        onChange(updated);
    }

    return (
        <div className="space-y-2">
            <FormLabel>Jadwal Bootcamp</FormLabel>
            {schedules.map((schedule, idx) => (
                <div key={idx} className="mt-1 flex items-center gap-2">
                    {/* Combobox Hari */}
                    <DayCombobox value={schedule.day} onChange={(val) => handleChange(idx, 'day', val)} />
                    <Input
                        type="time"
                        value={schedule.start_time}
                        onChange={(e) => handleChange(idx, 'start_time', e.target.value)}
                        className="w-28"
                    />
                    <span>-</span>
                    <Input type="time" value={schedule.end_time} onChange={(e) => handleChange(idx, 'end_time', e.target.value)} className="w-28" />
                    <Button type="button" variant="destructive" size="icon" onClick={() => removeSchedule(idx)}>
                        <X />
                    </Button>
                </div>
            ))}
            <Button type="button" onClick={addSchedule} className="mt-1 block">
                <div className="flex items-center gap-2">
                    <Plus /> Tambah Jadwal
                </div>
            </Button>
        </div>
    );
}

// Komponen Combobox Hari
function DayCombobox({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-[120px] justify-between">
                    {value ? days.find((day) => day.value === value)?.label : 'Pilih hari'}
                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[120px] p-0">
                <Command>
                    <CommandInput placeholder="Cari hari..." />
                    <CommandList>
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                            {days.map((day) => (
                                <CommandItem
                                    key={day.value}
                                    value={day.value}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue);
                                        setOpen(false);
                                    }}
                                >
                                    <CheckIcon className={cn('mr-2 h-4 w-4', value === day.value ? 'opacity-100' : 'opacity-0')} />
                                    {day.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
