import { Link } from '@inertiajs/react';
import { Mic, Star, User } from 'lucide-react';

export default function MentorSection() {
    return (
        <section className="mx-auto mt-4 w-full max-w-5xl px-4">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Belajar Bersama Mentor Expert
            </h2>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
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
                            <Link href="#" className="text-primary dark:text-primary-foreground text-sm font-medium hover:underline">
                                Lihat Profil
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
