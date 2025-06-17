import { Button } from '@/components/ui/button';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { Star, User } from 'lucide-react';

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
                    <Button variant="secondary" className="mt-4">
                        Gabung Sekarang
                    </Button>
                </div>
                <div className="flex h-[500px]">
                    <InfiniteSlider direction="vertical" speedOnHover={20} gap={24} className="p-4">
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold">Ramadhani Pasuleri</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk
                                kita lebih cepat paham.
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold">Ramadhani Pasuleri</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk
                                kita lebih cepat paham.
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold">Ramadhani Pasuleri</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk
                                kita lebih cepat paham.
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold">Ramadhani Pasuleri</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk
                                kita lebih cepat paham.
                            </p>
                        </div>
                    </InfiniteSlider>
                    <InfiniteSlider direction="vertical" speedOnHover={20} gap={24} className="p-4" reverse>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold">Ramadhani Pasuleri</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk
                                kita lebih cepat paham.
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold">Ramadhani Pasuleri</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk
                                kita lebih cepat paham.
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold">Ramadhani Pasuleri</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk
                                kita lebih cepat paham.
                            </p>
                        </div>
                        <div className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold">Ramadhani Pasuleri</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                                <Star size={16} className="text-yellow-500" fill="currentColor" />
                            </div>
                            <p className="text-sm text-gray-500">
                                Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk
                                kita lebih cepat paham.
                            </p>
                        </div>
                    </InfiniteSlider>
                </div>
            </div>
        </section>
    );
}
