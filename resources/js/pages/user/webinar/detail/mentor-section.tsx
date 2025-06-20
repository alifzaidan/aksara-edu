import { Link } from '@inertiajs/react';
import { Mic, Star, User } from 'lucide-react';

interface Webinar {
    host_name?: string | null;
    host_description?: string | null;
}

export default function MentorSection({ webinar }: { webinar: Webinar }) {
    return (
        <section className="mx-auto mt-8 w-full max-w-5xl px-4">
            <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                Pemateri Webinar
            </p>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex w-full items-center gap-4">
                    <div className="rounded-full bg-gray-200 p-2">
                        <User className="h-10 w-10 text-gray-500" />
                    </div>
                    <div className="w-full">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{webinar.host_name}</h3>
                            <Mic size={20} className="text-gray-500 dark:text-gray-400" />
                        </div>
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{webinar.host_description}</p>
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
