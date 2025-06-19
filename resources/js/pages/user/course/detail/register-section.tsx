import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BadgeCheck, Clock, Presentation, TvMinimalPlay } from 'lucide-react';

export default function RegisterSection() {
    return (
        <section className="mx-auto mt-8 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Daftar & Dapatkan Promo Diskon Special Launching!
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">Jangan sampai kelewatan ya!</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <img src="/assets/images/image-course.png" alt="Highlight Kelas" className="rounded-lg border border-gray-200 shadow-md" />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Web Developer Pemula ke Menengah</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Materi Update</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Waktu Belajar Fleksibel</p>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <h5 className="mb-4 text-sm">Miliki kelas Premium secara permanen dan bangun sebuah projek nyata</h5>

                    <span className="text-right text-sm text-red-600 line-through dark:text-gray-400">Rp 299.000</span>
                    <span className="text-right text-3xl font-bold text-gray-900 italic dark:text-gray-100">Rp 199.000</span>
                    <Separator className="my-4" />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <TvMinimalPlay size="16" className="text-primary" />
                            <p>22 Video</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Clock size="16" className="text-primary" />
                            <p>4 Jam 30 Menit</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Presentation size="16" className="text-primary" />
                            <p>Free Konsultasi</p>
                        </li>
                    </ul>
                    <Button className="mt-auto w-full">Gabung Sekarang</Button>
                </div>
            </div>
        </section>
    );
}
