import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}

interface CertificationProgram {
    description?: string | null;
    benefits?: string | null;
    terms_conditions?: string | null;
    scholarship_flow?: string | null;
    type: 'regular' | 'scholarship';
    mentors: Mentor[];
}

export default function KeyPointsSection({ program }: { program: CertificationProgram }) {
    const getInitials = useInitials();

    return (
        <section className="mx-auto w-full max-w-5xl px-4 py-8">
            {program.description && (
                <div className="mb-8">
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Tentang Program
                    </p>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <div className="text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: program.description }} />
                    </div>
                </div>
            )}

            {program.benefits && (
                <div className="mb-8">
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Manfaat Program
                    </p>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: program.benefits }} />
                </div>
            )}

            {program.terms_conditions && (
                <div className="mb-8">
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Syarat & Ketentuan
                    </p>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: program.terms_conditions }} />
                </div>
            )}

            {program.type === 'scholarship' && program.scholarship_flow && (
                <div className="mb-8">
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Alur Beasiswa
                    </p>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: program.scholarship_flow }} />
                </div>
            )}

            {/* Mentors */}
            {program.mentors && program.mentors.length > 0 && (
                <div className="mt-8">
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Mentor Program
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {program.mentors.map((mentor) => (
                            <div
                                key={mentor.id}
                                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800"
                            >
                                <Avatar className="h-14 w-14">
                                    <AvatarImage src={mentor.avatar ? `/storage/${mentor.avatar}` : undefined} />
                                    <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{mentor.name}</h4>
                                    {mentor.bio && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{mentor.bio}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
