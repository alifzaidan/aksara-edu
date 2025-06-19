import { BadgeCheck } from 'lucide-react';

export default function AboutSection() {
    return (
        <>
            <section className="mx-auto w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-3 dark:border-zinc-700 dark:bg-zinc-800">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h3 className="text-3xl font-bold italic">4.90/5.00</h3>
                        <p className="text-center text-sm">Menjadi nomor #1 Coding Bootcamp di Pendem berdasarkan Penilaian Course Report</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h3 className="text-3xl font-bold italic">9 Juta Rupiah</h3>
                        <p className="text-center text-sm">Alumni Aksarise memiliki gaji rata - rata sebesar 9 juta rupiah setelah lulus kuliah</p>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                        <h3 className="text-3xl font-bold italic">1000+</h3>
                        <p className="text-center text-sm">Lowongan pekerjaan untuk profesi Front End Developer berdasarkan job portal.</p>
                    </div>
                </div>
            </section>
            <section className="mx-auto mt-8 w-full max-w-5xl px-4">
                <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-5xl">
                    Kenapa harus Belajar Frontend ?
                </h2>
                <div className="mt-6 grid w-full grid-cols-1 items-center justify-end md:grid-cols-2">
                    <img src="/assets/images/illustration-webinar.svg" alt="Webinar" className="w-[300px]" />

                    <ul className="space-y-2">
                        <li className="flex gap-2">
                            <BadgeCheck className="mt-1 w-12 text-green-600" />
                            <div>
                                <h4 className="text-lg font-semibold">Permintaan Pesat di Industri Digital</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Seiring meningkatnya kebutuhan digitalisasi bisnis di berbagai sektor, profesi Front End Developer semakin banyak
                                    dicari untuk menciptakan aplikasi web yang interaktif dan menarik.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-2">
                            <BadgeCheck className="mt-1 w-12 text-green-600" />
                            <div>
                                <h4 className="text-lg font-semibold">Permintaan Pesat di Industri Digital</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Seiring meningkatnya kebutuhan digitalisasi bisnis di berbagai sektor, profesi Front End Developer semakin banyak
                                    dicari untuk menciptakan aplikasi web yang interaktif dan menarik.
                                </p>
                            </div>
                        </li>
                        <li className="flex gap-2">
                            <BadgeCheck className="mt-1 w-12 text-green-600" />
                            <div>
                                <h4 className="text-lg font-semibold">Permintaan Pesat di Industri Digital</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Seiring meningkatnya kebutuhan digitalisasi bisnis di berbagai sektor, profesi Front End Developer semakin banyak
                                    dicari untuk menciptakan aplikasi web yang interaktif dan menarik.
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>
            </section>
        </>
    );
}
