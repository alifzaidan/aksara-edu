import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface Course {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    level: string;
    category_id: string;
    category: Category;
    course_url: string;
    registration_url: string;
    key_points: string;
    description: string | null;
    short_description: string | null;
    status: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

interface EnrollmentCourseItem {
    id: string;
    invoice_id: string;
    course_id: string;
    course: Course;
    progress: number;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface CourseProps {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    status: string;
    paid_at: string | null;
    user_id: string;
    course_items: EnrollmentCourseItem[];
    created_at: string;
    updated_at: string;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function DetailMyCourse({ course }: { course: CourseProps }) {
    const courseItem = course.course_items?.[0];
    const courseData = courseItem?.course;
    const courseInvoiceStatus = course.status;
    const keyPointList = parseList(courseData.key_points);

    return (
        <UserLayout>
            <Head title={courseData.title} />
            <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                    <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                    <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 text-center">
                    <Button className="top-0 left-4 mb-4 rounded-full md:absolute md:mb-0" variant="secondary" asChild>
                        <Link href="/profile/my-courses">
                            <ArrowLeft /> Kembali Ke Kelas Saya
                        </Link>
                    </Button>
                    <div className="col-span-2">
                        <div className="flex justify-center gap-4">
                            <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                                📌 Enrollled in{' '}
                                {new Date(courseItem.created_at).toLocaleDateString('id-ID', {
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                            <span className="text-secondary border-secondary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs hover:text-[#FF925B]">
                                🎮 Level <span className="capitalize">{courseData.level}</span>
                            </span>
                        </div>

                        <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{courseData.title}</h1>

                        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">{courseData.description}</p>

                        <div className="flex items-center justify-center gap-4">
                            <span className={`font-semibold ${courseInvoiceStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                {courseInvoiceStatus !== 'paid' ? 'Selesaikan Pembayaran Untuk Mengakses Kelas!!' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mx-auto mb-12 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="col-span-2 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                        <h1 className="text-lg font-semibold">Progres Kamu</h1>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Progres:</span>
                            <span className="text-sm font-semibold">{courseItem.progress}%</span>
                        </div>
                        <div className="mt-2 mb-8 flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Selesai:</span>
                            <span className="text-sm font-semibold">{courseItem.completed_at ? 'Ya' : 'Belum'}</span>
                        </div>
                        <h1 className="text-lg font-semibold">Poin Utama</h1>
                        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {keyPointList.map((keyPoint, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{keyPoint}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-span-1 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                        <h2 className="mb-4 text-center font-semibold">{courseData.title}</h2>
                        <img
                            src={courseData.thumbnail ? `/storage/${courseData.thumbnail}` : '/assets/images/placeholder.png'}
                            alt={courseData.title}
                            className="aspect-video rounded-xl object-cover shadow-lg"
                        />
                        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{courseData.short_description}</p>

                        <Button
                            className="mt-2 w-full"
                            disabled={courseInvoiceStatus !== 'paid'}
                            onClick={() => window.open(courseData.course_url, '_blank')}
                        >
                            Lanjutkan Belajar
                        </Button>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
