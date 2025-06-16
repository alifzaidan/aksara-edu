import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BorderTrail } from '@/components/ui/border-trail';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselIndicator, CarouselItem } from '@/components/ui/carousel';
import { Magnetic } from '@/components/ui/magnetic';
import { Spotlight } from '@/components/ui/spotlight';
import { Tilt } from '@/components/ui/tilt';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, ChevronUp, GalleryVerticalEnd, Instagram, Linkedin, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Welcome() {
    const [expanded, setExpanded] = useState<React.Key | null>('getting-started');
    const [index, setIndex] = useState(0);
    const TOTAL_ITEMS = 4;

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % TOTAL_ITEMS);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <UserLayout>
            <Head title="Dashboard" />
            <section className="relative mt-2 w-full">
                <Carousel index={index} onIndexChange={setIndex} disableDrag>
                    <CarouselContent>
                        <CarouselItem className="p-4">
                            <a href="#program-kami">
                                <img src="/assets/images/carousel-1.png" alt="Slide 1" className="w-full rounded-xl object-cover" />
                            </a>
                        </CarouselItem>
                        <CarouselItem className="p-4">
                            <img src="/assets/images/carousel-1.png" alt="Slide 1" className="w-full rounded-xl object-cover" />
                        </CarouselItem>
                        <CarouselItem className="p-4">
                            <img src="/assets/images/carousel-1.png" alt="Slide 1" className="w-full rounded-xl object-cover" />
                        </CarouselItem>
                        <CarouselItem className="p-4">
                            <img src="/assets/images/carousel-1.png" alt="Slide 1" className="w-full rounded-xl object-cover" />
                        </CarouselItem>
                    </CarouselContent>
                    <CarouselIndicator />
                </Carousel>
            </section>

            <section className="w-full px-4 py-12">
                <div className="mx-auto text-center">
                    <p className="mx-auto mb-2 text-gray-600">Kenapa Aksarise</p>
                    <h2 className="mx-auto mb-10 max-w-2xl text-3xl font-bold text-gray-900 sm:text-4xl">
                        Solusi dirancang dengan cermat untuk produktivitas yang mudah
                    </h2>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-8">
                        <Tilt rotationFactor={10} isRevese>
                            <div className="bg-sidebar relative flex h-[200px] w-full flex-col items-center justify-center rounded-md dark:bg-zinc-800">
                                <BorderTrail
                                    style={{
                                        boxShadow:
                                            '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                                    }}
                                    size={100}
                                />
                                <div className="p-4">
                                    <img src="/assets/images/icon-web-dev.png" alt="Web Development" className="mx-auto mb-4 h-16" />
                                    <h2 className="mb-1 text-lg font-semibold text-gray-900">Web Development</h2>
                                    <p className="text-sm text-gray-600">Membangun aplikasi web yang responsif dan efisien</p>
                                </div>
                            </div>
                        </Tilt>
                        <Tilt rotationFactor={10} isRevese>
                            <div className="bg-sidebar relative flex h-[200px] w-full flex-col items-center justify-center rounded-md dark:bg-zinc-800">
                                <BorderTrail
                                    style={{
                                        boxShadow:
                                            '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                                    }}
                                    size={100}
                                />
                                <div className="p-4">
                                    <img src="/assets/images/icon-data-science.png" alt="Data Science" className="mx-auto mb-4 h-16" />
                                    <h2 className="mb-1 text-lg font-semibold text-gray-900">Data Science</h2>
                                    <p className="text-sm text-gray-600">Menganalisis data untuk mendapatkan wawasan yang berharga</p>
                                </div>
                            </div>
                        </Tilt>
                        <Tilt rotationFactor={10} isRevese>
                            <div className="bg-sidebar relative flex h-[200px] w-full flex-col items-center justify-center rounded-md dark:bg-zinc-800">
                                <BorderTrail
                                    style={{
                                        boxShadow:
                                            '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                                    }}
                                    size={100}
                                />
                                <div className="p-4">
                                    <img src="/assets/images/icon-graphic-design.png" alt="Graphic Design" className="mx-auto mb-4 h-16" />
                                    <h2 className="mb-1 text-lg font-semibold text-gray-900">Graphic Design</h2>
                                    <p className="text-sm text-gray-600">Mendesain antarmuka yang menarik dan fungsional</p>
                                </div>
                            </div>
                        </Tilt>
                        <Tilt rotationFactor={10} isRevese>
                            <div className="bg-sidebar relative flex h-[200px] w-full flex-col items-center justify-center rounded-md dark:bg-zinc-800">
                                <BorderTrail
                                    style={{
                                        boxShadow:
                                            '0px 0px 60px 30px rgb(255 255 255 / 50%), 0 0 100px 60px rgb(0 0 0 / 50%), 0 0 140px 90px rgb(0 0 0 / 50%)',
                                    }}
                                    size={100}
                                />
                                <div className="p-4">
                                    <img src="/assets/images/icon-accountant.png" alt="Accounting" className="mx-auto mb-4 h-16" />
                                    <h2 className="mb-1 text-lg font-semibold text-gray-900">Accounting</h2>
                                    <p className="text-sm text-gray-600">Membantu mengelola keuangan dan laporan keuangan</p>
                                </div>
                            </div>
                        </Tilt>
                    </div>
                </div>
            </section>

            <section className="w-full px-4 py-12" id="program-kami">
                <div className="mx-auto">
                    <p className="mx-auto text-center text-2xl font-medium text-blue-600">Program Kami</p>
                    <div className="md:spce-y-0 space-y-8">
                        <div className="flex w-full flex-col items-center justify-center md:flex-row">
                            <img src="/assets/images/illustration-kelas-online.svg" alt="Kelas Online" className="md:w-1/4" />
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Kelas Online</h2>
                                <p className="font-medium">Pelajari berbagai skill sekali bayar, praktik, dan bersertifikat.</p>
                                <ul>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Belajar fleksibel via Video Materi, Project dan Studi Kasus</p>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Praktikal & Actionable. Bertahap dari level Dasar hingga Lanjut</p>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Grup Komunitas Diskusi Lifetime. Kelas Gratis Tiap Bulannya</p>
                                    </li>
                                </ul>
                                <Button>Pelajari Sekarang</Button>
                            </div>
                        </div>
                        <div className="flex w-full flex-col-reverse items-center justify-center md:flex-row">
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Bootcamp</h2>
                                <p className="font-medium">Intensive Live Class bersama Experts. Praktikal & Mendalam.</p>
                                <ul>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Kombinasi Case Study, Praktik di Tiap Sesi. Basic to Advanced</p>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Group Mentoring Semi-Privat untuk Bangun Portfolio</p>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Tutor Terkurasi. Memiliki Lebih dari 30.000 Alumni</p>
                                    </li>
                                </ul>
                                <Button>Pelajari Sekarang</Button>
                            </div>
                            <img src="/assets/images/illustration-bootcamp.svg" alt="Bootcamp" className="md:w-1/4" />
                        </div>
                        <div className="flex w-full flex-col items-center justify-center md:flex-row">
                            <img src="/assets/images/illustration-webinar.svg" alt="Webinar" className="md:w-1/4" />
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Webinar</h2>
                                <p className="font-medium">Pelajari berbagai topik terkini dari para ahli di bidangnya.</p>
                                <ul>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Belajar insightfull dengan pembicara yang expert dibidangnya</p>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Praktikal & Actionable. Bertahap dari level Dasar hingga Lanjut</p>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="18" className="text-green-600" />
                                        <p>Grup Komunitas Diskusi Lifetime. Kelas Gratis Tiap Bulannya</p>
                                    </li>
                                </ul>
                                <Button>Pelajari Sekarang</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="w-full px-4 py-12">
                <div className="mx-auto text-center">
                    <p className="mx-auto mb-2 text-gray-600">Paling Banyak Diminati</p>
                    <h2 className="mx-auto mb-8 max-w-2xl text-3xl font-bold text-gray-900 sm:text-4xl">
                        Kelas yang paling banyak diminati oleh para peserta
                    </h2>
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                        <Link href="/" className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30">
                            <Spotlight className="bg-blue-500 blur-2xl" size={284} />
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
                            <Spotlight className="bg-blue-500 blur-2xl" size={284} />
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
                            <Spotlight className="bg-blue-500 blur-2xl" size={284} />
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
                        <Button type="button" className="mt-8 hover:cursor-pointer">
                            Lihat Semua Kelas <GalleryVerticalEnd />
                        </Button>
                    </Magnetic>
                </div>
            </section>

            <section className="w-full px-4 py-12">
                <div className="mx-auto text-center">
                    <p className="mx-auto mb-2 text-gray-600">Pertanyaan yang sering diajukan</p>
                    <h2 className="mx-auto mb-8 max-w-2xl text-3xl font-bold text-gray-900 sm:text-4xl">FAQ</h2>
                </div>
                <Accordion
                    className="flex w-full flex-col divide-y divide-zinc-200 dark:divide-zinc-700"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    expandedValue={expanded}
                    onValueChange={setExpanded}
                >
                    <AccordionItem value="getting-started" className="py-2">
                        <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                            <div className="flex items-center justify-between">
                                <div>Apa itu Aksademi?</div>
                                <ChevronUp className="h-4 w-4 text-zinc-950 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Aksademy adalah platform belajar online yang memiliki berbagai learning path, mulai dari level Beginner, Intermediate,
                                hingga Expert. belajar dengan mentor yang ahli dan berpengalaman dibidangnya membantu proses belajar lebih berkualitas
                            </p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="animation-properties" className="py-2">
                        <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                            <div className="flex items-center justify-between">
                                <div>Apa saja fitur yang tersedia di Aksademi?</div>
                                <ChevronUp className="h-4 w-4 text-zinc-950 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Explore the comprehensive range of animation properties available in Motion-Primitives. Understand how to manipulate
                                timing, easing, and delays to create smooth, dynamic animations. This segment also covers the customization of
                                animations to fit the flow and style of your web applications.
                            </p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="advanced-usage" className="py-2">
                        <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                            <div className="flex items-center justify-between">
                                <div>Bagaimana alur belajar di Aksademy?</div>
                                <ChevronUp className="h-4 w-4 text-zinc-950 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Dive deeper into advanced techniques and features of Motion-Primitives. Learn about chaining animations, creating
                                complex sequences, and utilizing motion sensors for interactive animations. Gain insights on how to leverage these
                                advanced features to enhance user experience and engagement.
                            </p>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="community-and-support" className="py-2">
                        <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                            <div className="flex items-center justify-between">
                                <div>Kemana saya bisa mendapatkan informasi lebih lanjut tentang Aksademi?</div>
                                <ChevronUp className="h-4 w-4 text-zinc-950 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <p className="text-zinc-500 dark:text-zinc-400">
                                Engage with the Motion-Primitives community to gain additional support and insight. Find out how to participate in
                                discussions, contribute to the project, and access a wealth of shared knowledge and resources. Learn about upcoming
                                features, best practices, and how to get help with your specific use cases.
                            </p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </section>

            <section className="w-full rounded-xl bg-blue-900 px-4 py-12">
                <div className="mx-auto text-center">
                    <h2 className="mx-auto mb-8 max-w-2xl text-3xl font-bold text-gray-200 sm:text-4xl">Daftar Kelas Sekarang</h2>
                    <p className="mx-auto mb-4 max-w-2xl text-gray-300">
                        Bergabunglah dengan ribuan peserta lainnya yang telah merasakan manfaat dari kelas-kelas kami. Dapatkan akses ke materi
                        berkualitas, mentor berpengalaman, dan komunitas yang mendukung.
                    </p>
                    <Button asChild variant="outline" className="text-blue-900">
                        <Link href="/register">Daftar Sekarang</Link>
                    </Button>
                </div>
            </section>

            <footer className="bg-blue-900 px-6 py-16 text-indigo-100">
                <div className="mx-auto grid max-w-6xl gap-12 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <h4 className="mb-2 text-2xl font-bold text-white">Aksademy</h4>
                        <p className="mb-4">Keep Rising and Inspiring Everyone.</p>
                        <h5 className="font-semibold text-white">CV. Aksara Teknologi Mandiri</h5>
                        <p className="text-gray-300">
                            Perumahan Permata Permadani, Blok B1. Kel. Pendem Kec. Junrejo Kota Batu Prov. Jawa Timur, 65324 <br /> +6285142505797
                        </p>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold text-white">Produk</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="hover:underline">
                                    Kelas Online
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:underline">
                                    Bootcamp
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:underline">
                                    Webinar
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold text-white">Layanan</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="hover:underline">
                                    Software House
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:underline">
                                    Pusat Bantuan
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold text-white">Sosial Media</h4>
                        <div className="flex items-center gap-4">
                            <a href="https://www.instagram.com/aksarateknologi/" target="_blank">
                                <Instagram />
                            </a>
                            <a href="https://www.linkedin.com/company/aksarateknologi" target="_blank">
                                <Linkedin />
                            </a>
                        </div>
                        <p className="mt-4">
                            Ikuti kami di media sosial untuk mendapatkan informasi terbaru, tips, dan konten menarik seputar teknologi.
                        </p>
                    </div>
                </div>
                <div className="mt-12 text-center text-xs text-indigo-400">&copy; 2025 CV. Aksara Teknologi Mandiri. All rights reserved.</div>
            </footer>
        </UserLayout>
    );
}
