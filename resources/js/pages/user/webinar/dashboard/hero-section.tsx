import { Button } from '@/components/ui/button';

export default function HeroSection() {
    return (
        <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-20 text-gray-900 dark:text-white">
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
            </div>
            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-3">
                <div className="col-span-1 hidden lg:block">
                    <img src="assets/images/webinar.gif" alt="Animasi Course" width={360} />
                </div>
                <div className="col-span-2">
                    <span className="text-secondary border-secondary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs hover:text-[#FF925B]">
                        ✨ Dibimbing para Expert!
                    </span>

                    <h1 className="mb-6 text-4xl leading-tight font-bold italic sm:text-5xl">
                        Belajar Langsung dari Praktisi. Terjangkau & Relevan dengan Industri.
                    </h1>

                    <p className="mb-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
                        Dirancang untuk membantumu memahami tren terbaru, tools, dan strategi praktis yang dibutuhkan di dunia kerja dan industri
                        digital.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <a href="#webinar">
                            <Button>Lihat Webinar</Button>
                        </a>
                        <a href="https://wa.me/+6285142505797" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">Konsultasi Gratis</Button>
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
