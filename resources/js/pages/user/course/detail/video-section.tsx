import { Button } from '@/components/ui/button';
import { TransitionPanel } from '@/components/ui/transition-panel';
import { PlayCircle } from 'lucide-react';
import { useState } from 'react';

interface Course {
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            video_url?: string | null;
        }[];
    }[];
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

export default function VideoSection({ course }: { course: Course }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const items =
        course.modules
            ?.flatMap((module) =>
                (module.lessons?.filter((lesson) => lesson.type === 'video') || []).map((lesson) => ({
                    title: lesson.title,
                    videoUrl: lesson.video_url,
                })),
            )
            .slice(0, 2) || [];

    const totalLessons = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;

    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <TransitionPanel
                    activeIndex={activeIndex}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    variants={{
                        enter: { opacity: 0, y: -50, filter: 'blur(4px)' },
                        center: { opacity: 1, y: 0, filter: 'blur(0px)' },
                        exit: { opacity: 0, y: 50, filter: 'blur(4px)' },
                    }}
                    className="col-span-2 aspect-video h-full w-full overflow-hidden rounded-xl bg-white shadow"
                >
                    {items.map((item, index) => (
                        <div key={index} className="aspect-video w-full">
                            <iframe
                                width="100%"
                                height="100%"
                                src={
                                    item?.videoUrl?.includes('youtube.com') || item?.videoUrl?.includes('youtu.be')
                                        ? `https://www.youtube.com/embed/${getYoutubeId(item.videoUrl)}`
                                        : ''
                                }
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="h-full w-full rounded-xl"
                            ></iframe>
                        </div>
                    ))}
                </TransitionPanel>
                <div className="col-span-1 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                    <h2 className="mb-4 font-semibold">{totalLessons} Materi</h2>
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`hover:bg-primary/10 mb-2 flex justify-between rounded-lg border bg-gray-100 p-4 text-gray-800 transition hover:cursor-pointer ${
                                activeIndex === index ? 'border-primary' : ''
                            } `}
                        >
                            <h5 className="flex items-center gap-2 text-sm font-medium">
                                <PlayCircle size="18" /> {item?.title ?? ''}
                            </h5>
                        </button>
                    ))}
                    <a
                        href="#modules"
                        className="hover:bg-primary/10 mb-2 flex justify-between rounded-lg border bg-gray-100 p-4 text-gray-800 transition hover:cursor-pointer"
                    >
                        <h5 className="flex items-center gap-2 text-sm font-medium">
                            <PlayCircle size="18" /> {totalLessons - items.length} Materi Lainnya
                        </h5>
                    </a>
                    <a href="#register" className="mt-auto w-full">
                        <Button className="w-full">Gabung Sekarang</Button>
                    </a>
                </div>
            </div>
        </section>
    );
}
