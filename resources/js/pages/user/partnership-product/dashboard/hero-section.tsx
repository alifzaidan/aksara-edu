import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';

export default function HeroSection() {
    return (
        <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-20 text-gray-900 dark:text-white">
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
            </div>
            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-3">
                <div className="col-span-1 hidden lg:block">
                    <div className="relative flex justify-center">
                        <div className="relative h-[480px] w-[360px]">
                            <motion.img
                                src="assets/images/animated/10.webp"
                                alt="Animasi Partnership 1"
                                width={360}
                                className="absolute top-12 left-12 z-10 rotate-3 transform"
                                animate={{
                                    y: [0, -20, 0],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                }}
                            />
                            <motion.img
                                src="assets/images/animated/11.webp"
                                alt="Animasi Partnership 2"
                                width={360}
                                className="absolute top-6 left-4 z-20 scale-110 rotate-3 transform"
                                animate={{
                                    y: [0, 25, 0],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 0.5,
                                }}
                            />
                            <motion.img
                                src="assets/images/animated/12.webp"
                                alt="Animasi Partnership 3"
                                width={360}
                                className="absolute top-24 left-0 z-30 rotate-3 transform"
                                animate={{
                                    y: [0, -20, 0],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut',
                                    delay: 1,
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="col-span-2">
                    <span className="text-secondary border-secondary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs hover:text-[#FF925B]">
                        ✨ Program Sertifikasi Kerjasama!
                    </span>

                    <h1 className="mb-6 text-4xl leading-tight font-bold italic sm:text-5xl">
                        Dapatkan Sertifikasi dari Partner Terpercaya & Tingkatkan Kredibilitas Profesional
                    </h1>

                    <p className="mb-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
                        Program sertifikasi yang dirancang bersama partner industri untuk meningkatkan kompetensi dan membuka peluang karir lebih
                        luas.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <a href="#partnership-products">
                            <Button>Lihat Program Sertifikasi</Button>
                        </a>
                        <a href="https://wa.me/+6285142505794" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">Konsultasi Gratis</Button>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
