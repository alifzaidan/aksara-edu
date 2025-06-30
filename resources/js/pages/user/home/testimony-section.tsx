import { Button } from '@/components/ui/button';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { Link } from '@inertiajs/react';
import { User } from 'lucide-react';

export default function TestimonySection() {
    return (
        <section className="to-primary my-8 hidden w-full bg-gradient-to-tl from-black lg:block">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-8 md:gap-12">
                <div className="mx-4">
                    <p className="text-secondary mx-auto mb-2 font-medium md:text-lg">Terpercaya lebih dari 1000+ alumni</p>
                    <h2 className="mx-auto mb-4 text-3xl font-bold text-white italic md:text-4xl">Bergabung bersama komunitas supportif kami 💪</h2>
                    <p className="mx-auto text-zinc-200">
                        Aksademy menyediakan komunitas belajar berbagai disiplin ilmu untuk pemula ke mahir. Dapatkan dukungan, berbagi pengalaman,
                        dan tumbuh bersama dalam perjalanan belajar Anda.
                    </p>
                    <Button variant="secondary" className="mt-4" asChild>
                        <Link href="/course">Gabung Sekarang</Link>
                    </Button>
                </div>
                <div className="flex h-[500px]">
                    <InfiniteSlider direction="vertical" speedOnHover={20} gap={24} className="p-4">
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-blue-100 p-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Sarah Wijaya</h3>
                                    <p className="text-xs text-gray-500">UI/UX Designer</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                "Materi bootcamp UI/UX di Aksademy sangat komprehensif. Sekarang saya sudah bekerja di startup unicorn. Terima kasih
                                Aksademy!"
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-green-100 p-2">
                                    <User className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Budi Santoso</h3>
                                    <p className="text-xs text-gray-500">Full Stack Developer</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                "Dari nol sampai bisa bikin aplikasi web kompleks. Mentor di Aksademy sangat sabar dan supportif. Worth it banget!"
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-purple-100 p-2">
                                    <User className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Rina Kartika</h3>
                                    <p className="text-xs text-gray-500">Digital Marketer</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                "Kelas digital marketing-nya game changer! Bisnis online saya sekarang omzetnya naik 300% dalam 6 bulan."
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-orange-100 p-2">
                                    <User className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Ahmad Rizky</h3>
                                    <p className="text-xs text-gray-500">Data Analyst</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                "Transisi karir dari accounting ke data analyst jadi lebih mudah berkat bootcamp di Aksademy. Materinya sangat
                                aplikatif!"
                            </p>
                        </div>
                    </InfiniteSlider>
                    <InfiniteSlider direction="vertical" speedOnHover={20} gap={24} className="p-4" reverse>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-pink-100 p-2">
                                    <User className="h-4 w-4 text-pink-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Maya Sari</h3>
                                    <p className="text-xs text-gray-500">Product Manager</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                "Webinar product management-nya eye opening banget! Sekarang saya lebih percaya diri memimpin tim produk di
                                perusahaan."
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-cyan-100 p-2">
                                    <User className="h-4 w-4 text-cyan-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Denny Pratama</h3>
                                    <p className="text-xs text-gray-500">DevOps Engineer</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                "Kelas DevOps-nya sangat detail dan praktis. Dari basic Docker sampai Kubernetes semua dijelaskan dengan baik."
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-indigo-100 p-2">
                                    <User className="h-4 w-4 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Lisa Anggraini</h3>
                                    <p className="text-xs text-gray-500">Content Creator</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                "Belajar video editing dan content strategy di Aksademy bikin channel YouTube saya tembus 100k subscriber!"
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-yellow-100 p-2">
                                    <User className="h-4 w-4 text-yellow-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Fajar Ramadhan</h3>
                                    <p className="text-xs text-gray-500">Mobile Developer</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500">
                                "Bootcamp Flutter-nya recommended banget! Sekarang saya bisa develop aplikasi mobile untuk iOS dan Android."
                            </p>
                        </div>
                    </InfiniteSlider>
                </div>
            </div>
        </section>
    );
}
