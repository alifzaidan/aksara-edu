import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { User } from 'lucide-react';

export default function CtaSection() {
    return (
        <section className="mx-auto mb-4 w-full max-w-7xl p-4 sm:mb-8">
            <div className="to-primary mx-auto rounded-xl bg-gradient-to-tl from-black px-4 py-8 text-center sm:py-16">
                <div className="mx-auto mb-4 flex w-fit items-center justify-center gap-2 rounded-full bg-gray-300/20 p-1.5">
                    <div className="to-primary relative h-10 w-20 rounded-full bg-gradient-to-tl from-black">
                        <div className="boder-gray-200 absolute top-2 left-2 z-10 rounded-full border bg-[#71D0F7] p-1.5">
                            <User className="text-primary h-3 w-3" />
                        </div>
                        <div className="boder-gray-200 absolute top-1 left-1/2 z-20 -translate-x-1/2 rounded-full border bg-[#E3F0E9] p-1.5">
                            <User className="text-primary h-4 w-4" />
                        </div>
                        <div className="boder-gray-200 absolute top-2 right-2 z-10 rounded-full border bg-[#E6834A] p-1.5">
                            <User className="text-primary h-3 w-3" />
                        </div>
                    </div>
                    <p className="mr-2 hidden text-sm text-gray-200 sm:block">Bergabung dengan 1000+ alumni</p>
                </div>
                <h2 className="mx-auto my-4 max-w-2xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-3xl font-bold text-transparent italic sm:my-6 sm:text-5xl">
                    Daftar Kelas Sekarang
                </h2>
                <p className="mx-auto mb-6 max-w-2xl text-sm text-gray-300 sm:text-base">
                    Bergabunglah dengan ribuan peserta lainnya yang telah merasakan manfaat dari kelas-kelas kami. Dapatkan akses ke materi
                    berkualitas, mentor berpengalaman, dan komunitas yang mendukung.
                </p>
                <Button asChild variant="secondary">
                    <Link href="/course">Eksplorasi Kelas</Link>
                </Button>
            </div>
        </section>
    );
}
