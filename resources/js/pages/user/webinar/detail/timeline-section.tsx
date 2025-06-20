import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';

interface Bootcamp {
    curriculum?: string | null;
}

function parseCurriculum(curriculum?: string | null): string[] {
    if (!curriculum) return [];
    const matches = curriculum.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function TimelineSection({ bootcamp }: { bootcamp: Bootcamp }) {
    const curriculumList = parseCurriculum(bootcamp.curriculum);

    return (
        <section className="to-primary mt-8 w-full bg-gradient-to-tl from-black px-4">
            <div className="mx-auto my-12 w-full max-w-7xl px-4">
                <h2 className="mx-auto mb-8 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                    Materi yang akan kamu pelajari
                </h2>
                <div className="grid grid-cols-1 gap-x-20 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                    {curriculumList.map((curriculum, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <Button variant="secondary" className="mb-2 w-fit">
                                <File />
                            </Button>
                            <h3 className="text-primary-foreground text-xl font-medium">{curriculum}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
