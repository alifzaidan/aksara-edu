import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, X } from 'lucide-react';

interface Course {
    title: string;
    short_description?: string | null;
    level: 'beginner' | 'intermediate' | 'advanced';
    created_at: string;
    updated_at: string;
}

export default function HeroSection({ course }: { course: Course }) {
    const courseCertificate = 'yes' as 'yes' | 'no';
    const courseConsultation = 'yes' as 'yes' | 'no';

    return (
        <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
            </div>
            <div className="relative mx-auto max-w-7xl px-4 text-center">
                <div className="col-span-2">
                    <div className="flex justify-center gap-4">
                        <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                            🚀 Released date{' '}
                            {new Date(course.created_at).toLocaleDateString('id-ID', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                        <span className="text-secondary border-secondary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs hover:text-[#FF925B]">
                            🕛 Last updated{' '}
                            {new Date(course.updated_at).toLocaleDateString('id-ID', {
                                month: 'long',
                                year: 'numeric',
                            })}
                        </span>
                    </div>

                    <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{course.title}</h1>

                    <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">{course.short_description}</p>

                    <div className="flex flex-wrap justify-center gap-12">
                        <div className="flex flex-col items-center space-y-2">
                            <h5>Tingkatan</h5>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={
                                            course.level === 'beginner'
                                                ? 'w-fit rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-zinc-800 dark:text-green-300'
                                                : course.level === 'intermediate'
                                                  ? 'rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-zinc-800 dark:text-yellow-300'
                                                  : 'rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-zinc-800 dark:text-red-300'
                                        }
                                    >
                                        <p>{course.level === 'beginner' ? '1' : course.level === 'intermediate' ? '2' : '3'}</p>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {course.level === 'beginner' && <p>Level Beginner</p>}
                                    {course.level === 'intermediate' && <p>Level Intermediate</p>}
                                    {course.level === 'advanced' && <p>Level Advanced</p>}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <h5>Sertifikat</h5>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={
                                            courseCertificate === 'yes'
                                                ? 'w-fit rounded-full border border-green-300 bg-green-100 p-1.5 text-sm font-medium text-green-700 dark:bg-zinc-800 dark:text-green-300'
                                                : 'rounded-full border border-red-300 bg-red-100 p-1.5 text-sm font-medium text-red-700 dark:bg-zinc-800 dark:text-red-300'
                                        }
                                    >
                                        {courseCertificate === 'yes' ? <Check size="16" /> : <X size="16" />}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {courseCertificate === 'yes' && <p>Sertifikat Tersedia</p>}
                                    {courseCertificate === 'no' && <p>Sertifikat Tidak Tersedia</p>}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="flex flex-col items-center space-y-2">
                            <h5>Konsultasi</h5>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={
                                            courseConsultation === 'yes'
                                                ? 'w-fit rounded-full border border-green-300 bg-green-100 p-1.5 text-sm font-medium text-green-700 dark:bg-zinc-800 dark:text-green-300'
                                                : 'rounded-full border border-red-300 bg-red-100 p-1.5 text-sm font-medium text-red-700 dark:bg-zinc-800 dark:text-red-300'
                                        }
                                    >
                                        {courseConsultation === 'yes' ? <Check size="16" /> : <X size="16" />}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {courseConsultation === 'yes' && <p>Konsultasi Tersedia</p>}
                                    {courseConsultation === 'no' && <p>Konsultasi Tidak Tersedia</p>}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
