import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { BadgeCheck } from 'lucide-react';

export default function ProgramSection() {
    return (
        <section className="w-full px-4 py-8" id="program-kami">
            <div className="mx-auto max-w-5xl">
                <p className="text-primary border-primary bg-background mx-auto mb-8 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Program Kami
                </p>
                <div className="space-y-8 md:space-y-4">
                    <div className="flex w-full flex-col items-center justify-end md:flex-row md:gap-14">
                        <img src="/assets/images/illustration-course.webp" alt="Kelas Online" className="w-[250px]" />
                        <div className="space-y-2">
                            <h2 className="dark:text-primary-foreground text-center text-2xl font-bold italic sm:text-left sm:text-3xl">
                                Kelas Online
                            </h2>
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
                            <Button className="mt-2 w-full sm:w-auto" asChild>
                                <Link href="/course">Pelajari Sekarang</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="flex w-full flex-col-reverse items-center justify-start md:flex-row md:gap-14">
                        <div className="space-y-2">
                            <h2 className="dark:text-primary-foreground text-center text-2xl font-bold italic sm:text-left sm:text-3xl">Bootcamp</h2>
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
                            <Button className="mt-2 w-full sm:w-auto" asChild>
                                <Link href="/bootcamp">Pelajari Sekarang</Link>
                            </Button>
                        </div>
                        <img src="/assets/images/illustration-bootcamp.webp" alt="Bootcamp" className="w-[250px]" />
                    </div>
                    <div className="flex w-full flex-col items-center justify-end md:flex-row md:gap-14">
                        <img src="/assets/images/illustration-webinar.webp" alt="Webinar" className="w-[250px]" />
                        <div className="space-y-2">
                            <h2 className="dark:text-primary-foreground text-center text-2xl font-bold italic sm:text-left sm:text-3xl">Webinar</h2>
                            <p className="font-medium">Pelajari berbagai topik terkini dari para ahli di bidangnya.</p>
                            <ul className="">
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
                            <Button className="mt-2 w-full sm:w-auto" asChild>
                                <Link href="/webinar">Pelajari Sekarang</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
