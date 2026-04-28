import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from '@inertiajs/react';
import { BadgeCheck, CalendarDays, MapPin, Users } from 'lucide-react';

interface Schedule {
    id: string;
    start_time: string;
    end_time: string;
    registration_deadline?: string | null;
    max_participants?: number;
}

interface PrivateClass {
    id: string;
    title: string;
    slug: string;
    mode: 'online' | 'offline';
    location?: string | null;
    price: number;
    strikethrough_price?: number;
    thumbnail?: string | null;
    schedules?: Schedule[];
    category?: { name: string };
}

export default function RegisterSection({
    privateClass,
    myPrivateClassIds,
}: {
    privateClass: PrivateClass;
    myPrivateClassIds: string[];
}) {
    const isOwned = myPrivateClassIds.includes(privateClass.id);
    const totalSlots = privateClass.schedules?.length || 0;
    
    // Sort schedules by start_time
    const sortedSchedules = privateClass.schedules?.slice().sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) || [];

    // Check if any schedule still has open registration
    const hasOpenRegistration = privateClass.schedules?.some((s) => {
        if (!s.registration_deadline) return true;
        return new Date() < new Date(s.registration_deadline);
    });

    return (
        <section className="mx-auto my-8 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Jadwal dan Biaya Program
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">
                Daftar sekarang dan dapatkan bimbingan personal dari mentor berpengalaman.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                        src={privateClass.thumbnail ? `/storage/${privateClass.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={privateClass.title}
                        className="rounded-lg border border-gray-200 shadow-md"
                    />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Bimbingan Langsung dari Mentor</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Materi Disesuaikan Kebutuhan</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Sesi Interaktif & Tanya Jawab</p>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <h5 className="mb-4 text-sm">
                        Daftar Private Class Aksademy dan dapatkan bimbingan personal dari mentor ahli
                    </h5>

                    {(privateClass.strikethrough_price ?? 0) > 0 && (
                        <span className="text-right text-sm text-red-500 line-through">
                            Rp {(privateClass.strikethrough_price ?? 0).toLocaleString('id-ID')}
                        </span>
                    )}
                    {privateClass.price > 0 ? (
                        <span className="text-right text-3xl font-bold text-gray-900 italic dark:text-gray-100">
                            Rp {privateClass.price.toLocaleString('id-ID')}
                        </span>
                    ) : (
                        <span className="text-left text-3xl font-bold text-gray-900 italic dark:text-gray-100">GRATIS</span>
                    )}

                    <Separator className="my-4" />
                    <ul className="mb-4 space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <MapPin size="16" className="text-primary dark:text-secondary" />
                            <p>{privateClass.mode === 'offline' ? privateClass.location || 'Lokasi akan diinformasikan' : 'Online (Google Meet/Zoom)'}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Users size="16" className="text-primary dark:text-secondary" />
                            <p>{totalSlots} Slot Jadwal Tersedia</p>
                        </li>
                        {sortedSchedules.length > 0 && (
                            <li className="flex flex-col gap-2 text-sm">
                                <div className="flex items-center gap-2 font-medium">
                                    <CalendarDays size="16" className="text-primary dark:text-secondary" />
                                    <p>Pilihan Jadwal Tersedia:</p>
                                </div>
                                <ul className="ml-6 space-y-2">
                                    {sortedSchedules.map((schedule) => (
                                        <li key={schedule.id} className="list-disc text-gray-600 dark:text-gray-400">
                                            {new Date(schedule.start_time).toLocaleDateString('id-ID', {
                                                weekday: 'short',
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}{' '}
                                            ({new Date(schedule.start_time).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}{' '}
                                            -{' '}
                                            {new Date(schedule.end_time).toLocaleTimeString('id-ID', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })})
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        )}
                        {privateClass.category && (
                            <li className="flex items-center gap-2 text-sm">
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                    {privateClass.category.name}
                                </span>
                            </li>
                        )}
                    </ul>
                    <div className="mt-auto space-y-1">
                        {isOwned ? (
                            <Button className="w-full" disabled>
                                Anda Sudah Terdaftar
                            </Button>
                        ) : hasOpenRegistration ? (
                            <Button className="w-full" asChild>
                                <Link href={route('private.register', { privateClass: privateClass.slug })}>Daftar Sekarang</Link>
                            </Button>
                        ) : (
                            <Button className="w-full" disabled>
                                Pendaftaran Ditutup
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
