import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BadgeCheck, CalendarDays, ChartArea, Clock, Hourglass, MapPin, Users } from 'lucide-react';

interface Bootcamp {
    title: string;
    batch?: string | null;
    price: number;
    quota: number;
    start_date: string;
    end_date: string;
    schedules?: { day: string; start_time: string; end_time: string }[];
    registration_deadline: string;
    registration_url: string;
    thumbnail?: string | null;
}

export default function RegisterSection({ bootcamp }: { bootcamp: Bootcamp }) {
    const start = new Date(bootcamp.start_date);
    const end = new Date(bootcamp.end_date);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    const totalWeeks = Math.ceil(diffDays / 7);

    const page = usePage<SharedData>();
    const { auth } = page.props;
    const user = auth.user;

    return (
        <section className="mx-auto my-8 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Lokasi, Jadwal, dan Biaya Program
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">
                Daftar sekarang dan dapatkan bimbingan dari mentor ahli dan akses materi pembelajaran yang lengkap.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                        src={bootcamp.thumbnail ? `/storage/${bootcamp.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={bootcamp.title}
                        className="rounded-lg border border-gray-200 shadow-md"
                    />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Dibimbing mentor expert</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Materi Praktis</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Tersedia Modul Pembelajaran</p>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <h5 className="mb-4 text-sm">Daftar Bootcamp Aksademy dan mulai bangun projek real</h5>

                    <span className="text-right text-sm text-red-600 line-through dark:text-gray-400">Rp 999.000</span>
                    <span className="text-right text-3xl font-bold text-gray-900 italic dark:text-gray-100">
                        Rp {bootcamp.price.toLocaleString('id-ID')}
                    </span>
                    <Separator className="my-4" />
                    <ul className="mb-4 space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <MapPin size="16" className="text-primary dark:text-secondary" />
                            <p>Online</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Hourglass size="16" className="text-primary dark:text-secondary" />
                            <p>Batch {bootcamp.batch}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Users size="16" className="text-primary dark:text-secondary" />
                            <p>Kuota {bootcamp.quota ? `${bootcamp.quota} Peserta` : 'Tidak Terbatas'} </p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <ChartArea size="16" className="text-primary dark:text-secondary" />
                            <p>{diffDays < 7 ? `${diffDays} Hari` : `${totalWeeks} Minggu`}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <CalendarDays size="16" className="text-primary dark:text-secondary" />
                            <p>
                                {new Date(bootcamp.start_date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}{' '}
                                -{' '}
                                {new Date(bootcamp.end_date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </li>
                        {bootcamp.schedules && bootcamp.schedules.length > 0 ? (
                            bootcamp.schedules.map((schedule, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-sm">
                                    <Clock size="16" className="text-primary dark:text-secondary" />
                                    <p className="capitalize">
                                        {schedule.day} | {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB
                                    </p>
                                </li>
                            ))
                        ) : (
                            <li className="flex items-center gap-2 text-sm">
                                <Clock size="16" className="text-primary dark:text-secondary" />
                                <p>Jadwal belum tersedia</p>
                            </li>
                        )}
                    </ul>
                    <div className="mt-auto space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                            Terakhir pendaftaran:{' '}
                            {new Date(bootcamp.registration_deadline).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                        <Button className="mt-auto w-full" asChild>
                            <Link href={user ? bootcamp.registration_url : `/login?redirect=${encodeURIComponent(bootcamp.registration_url)}`}>
                                Daftar Sekarang
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
