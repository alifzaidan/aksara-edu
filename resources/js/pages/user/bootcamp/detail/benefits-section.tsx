import { Button } from '@/components/ui/button';
import { File } from 'lucide-react';

export default function BenefitsSection() {
    return (
        <section className="to-primary mt-8 w-full bg-gradient-to-tl from-black px-4">
            <div className="mx-auto my-8 w-full max-w-7xl px-4">
                <h2 className="mx-auto mb-8 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                    Kenapa Harus Belajar Frontend di Aksademy?
                </h2>
                <div className="grid grid-cols-1 gap-x-20 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col">
                        <Button variant="secondary" className="mb-2 w-fit">
                            <File />
                        </Button>
                        <h3 className="text-primary-foreground text-xl font-medium">Kurikulum Kebutuhan Industri</h3>
                        <p className="text-sm text-gray-400">Materi dirancang agar siswa dapat berkompetensi di industri terkini.</p>
                    </div>
                    <div className="flex flex-col">
                        <Button variant="secondary" className="mb-2 w-fit">
                            <File />
                        </Button>
                        <h3 className="text-primary-foreground text-xl font-medium">Kurikulum Kebutuhan Industri</h3>
                        <p className="text-sm text-gray-400">Materi dirancang agar siswa dapat berkompetensi di industri terkini.</p>
                    </div>
                    <div className="flex flex-col">
                        <Button variant="secondary" className="mb-2 w-fit">
                            <File />
                        </Button>
                        <h3 className="text-primary-foreground text-xl font-medium">Kurikulum Kebutuhan Industri</h3>
                        <p className="text-sm text-gray-400">Materi dirancang agar siswa dapat berkompetensi di industri terkini.</p>
                    </div>
                    <div className="flex flex-col">
                        <Button variant="secondary" className="mb-2 w-fit">
                            <File />
                        </Button>
                        <h3 className="text-primary-foreground text-xl font-medium">Kurikulum Kebutuhan Industri</h3>
                        <p className="text-sm text-gray-400">Materi dirancang agar siswa dapat berkompetensi di industri terkini.</p>
                    </div>
                    <div className="flex flex-col">
                        <Button variant="secondary" className="mb-2 w-fit">
                            <File />
                        </Button>
                        <h3 className="text-primary-foreground text-xl font-medium">Kurikulum Kebutuhan Industri</h3>
                        <p className="text-sm text-gray-400">Materi dirancang agar siswa dapat berkompetensi di industri terkini.</p>
                    </div>
                    <div className="flex flex-col">
                        <Button variant="secondary" className="mb-2 w-fit">
                            <File />
                        </Button>
                        <h3 className="text-primary-foreground text-xl font-medium">Kurikulum Kebutuhan Industri</h3>
                        <p className="text-sm text-gray-400">Materi dirancang agar siswa dapat berkompetensi di industri terkini.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
