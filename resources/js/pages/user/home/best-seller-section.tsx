import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/magnetic';
import { Spotlight } from '@/components/ui/spotlight';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { GalleryVerticalEnd, Star } from 'lucide-react';

export default function BestSellerSection() {
    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
            <div className="mx-auto text-center">
                <p className="text-primary border-primary bg-background mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Paling Diminati
                </p>
                <h2 className="mx-auto mb-8 max-w-2xl text-3xl font-bold text-gray-900 italic md:text-4xl">
                    Kelas yang paling banyak diminati oleh para peserta
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Link href="/" className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30">
                        <Spotlight className="bg-primary blur-2xl" size={284} />
                        <div className="bg-sidebar relative flex w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                            <img src="/assets/images/image-course.png" alt="Web Development" className="h-48 w-full rounded-t-lg object-cover" />
                            <div className="p-4 text-left">
                                <h2 className="mb-1 text-lg font-semibold">Laravel 12, Service Repository Pattern: Shoes Store Website</h2>
                                <p className="text-sm text-gray-600">Rp. 120.000</p>
                                <div className="mt-4 flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" />
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-zinc-800 dark:text-green-300">
                                                <p>1</p>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Level Beginner</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </Link>
                    <Link href="/" className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30">
                        <Spotlight className="bg-primary blur-2xl" size={284} />
                        <div className="bg-sidebar relative flex w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                            <img src="/assets/images/image-course.png" alt="Web Development" className="h-48 w-full rounded-t-lg object-cover" />
                            <div className="p-4 text-left">
                                <h2 className="mb-1 text-lg font-semibold">Laravel 12, Service Repository Pattern: Shoes Store Website</h2>
                                <p className="text-sm text-gray-600">Rp. 120.000</p>
                                <div className="mt-4 flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" />
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-zinc-800 dark:text-yellow-300">
                                                <p>2</p>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Level Intermediate</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </Link>
                    <Link href="/" className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30">
                        <Spotlight className="bg-primary blur-2xl" size={284} />
                        <div className="bg-sidebar relative flex w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                            <img src="/assets/images/image-course.png" alt="Web Development" className="h-48 w-full rounded-t-lg object-cover" />
                            <div className="p-4 text-left">
                                <h2 className="mb-1 text-lg font-semibold">Laravel 12, Service Repository Pattern: Shoes Store Website</h2>
                                <p className="text-sm text-gray-600">Rp. 120.000</p>
                                <div className="mt-4 flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" />
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-zinc-800 dark:text-red-300">
                                                <p>3</p>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Level Beginner</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
                <Magnetic>
                    <Button type="button" className="mt-8" asChild>
                        <Link href="/course">
                            Lihat Semua Kelas <GalleryVerticalEnd />
                        </Link>
                    </Button>
                </Magnetic>
            </div>
        </section>
    );
}
