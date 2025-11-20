import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';

interface Webinar {
    user?: {
        id: string;
        name: string;
        bio?: string;
        avatar?: string;
    };
}

export default function MentorSection({ webinar }: { webinar: Webinar }) {
    const getInitials = useInitials();

    if (!webinar.user) {
        return null;
    }

    const mentor = webinar.user;

    return (
        <section className="mx-auto mt-8 w-full max-w-5xl px-4">
            <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                Pemateri Webinar
            </p>
            <Link
                href={`/mentor/${mentor.id}`}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md transition-shadow duration-200 hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
            >
                <div className="flex w-full items-center gap-4">
                    <Avatar className="ring-primary/20 h-12 w-12 ring-4 md:h-16 md:w-16">
                        <AvatarImage src={mentor.avatar} alt={mentor.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold md:text-3xl">
                            {getInitials(mentor.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="w-full">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{webinar.user.name}</h3>
                        </div>
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{webinar.user.bio}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </section>
    );
}
