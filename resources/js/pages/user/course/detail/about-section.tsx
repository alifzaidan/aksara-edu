import { Link } from '@inertiajs/react';
import { BadgeCheck, Mic, Star, User } from 'lucide-react';

export default function AboutSection() {
    return (
        <>
            <section className="mx-auto w-full max-w-5xl px-4" id="about">
                <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-5xl">
                    Kembangkan Skillmu
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400">
                    Laravel 12, Service Repository: Shoes Store Website Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit, vero provident
                    laborum laboriosam nam dicta aut mollitia maxime? Saepe, placeat. A eius repudiandae nulla similique molestias dolor ipsa quos
                    temporibus!
                </p>
            </section>
            <section className="mx-auto mt-4 w-full max-w-5xl px-4">
                <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Highlight Kelas
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <img src="/assets/images/image-course.png" alt="Highlight Kelas" className="rounded-lg border border-gray-200 shadow-md" />
                    <img src="/assets/images/image-course.png" alt="Highlight Kelas" className="rounded-lg border border-gray-200 shadow-md" />
                    <img src="/assets/images/image-course.png" alt="Highlight Kelas" className="rounded-lg border border-gray-200 shadow-md" />
                </div>
            </section>
            <section className="mx-auto mt-4 w-full max-w-5xl px-4">
                <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Poin Utama
                </p>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <li className="flex items-center gap-2">
                        <BadgeCheck size="18" className="text-green-600" />
                        <p>Penerapan Arsitektur Service Repository</p>
                    </li>
                    <li className="flex items-center gap-2">
                        <BadgeCheck size="18" className="text-green-600" />
                        <p>Penerapan Arsitektur Service Repository</p>
                    </li>
                    <li className="flex items-center gap-2">
                        <BadgeCheck size="18" className="text-green-600" />
                        <p>Penerapan Arsitektur Service Repository</p>
                    </li>
                    <li className="flex items-center gap-2">
                        <BadgeCheck size="18" className="text-green-600" />
                        <p>Penerapan Arsitektur Service Repository</p>
                    </li>
                </ul>
            </section>
            <section className="mx-auto mt-4 w-full max-w-5xl px-4">
                <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Cocok Untuk
                </p>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <li className="flex items-center gap-2">
                        <BadgeCheck size="18" className="text-green-600" />
                        <p>Web Developer Pemula ke Menengah</p>
                    </li>
                    <li className="flex items-center gap-2">
                        <BadgeCheck size="18" className="text-green-600" />
                        <p>Web Developer Pemula ke Menengah</p>
                    </li>
                    <li className="flex items-center gap-2">
                        <BadgeCheck size="18" className="text-green-600" />
                        <p>Web Developer Pemula ke Menengah</p>
                    </li>
                    <li className="flex items-center gap-2">
                        <BadgeCheck size="18" className="text-green-600" />
                        <p>Web Developer Pemula ke Menengah</p>
                    </li>
                </ul>
            </section>
            <section className="mx-auto mt-4 w-full max-w-5xl px-4">
                <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Belajar dengan Ahlinya
                </p>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex w-full items-center gap-4">
                        <div className="rounded-full bg-gray-200 p-2">
                            <User className="h-10 w-10 text-gray-500" />
                        </div>
                        <div className="w-full">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Hari Robiansyah, S.Kom</h3>
                                <Mic size={20} className="text-gray-500 dark:text-gray-400" />
                            </div>
                            <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Web Developer & Instructor</p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                </div>
                                <Link href="#" className="text-primary dark:text-primary text-sm font-medium hover:underline">
                                    Lihat Profil
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
