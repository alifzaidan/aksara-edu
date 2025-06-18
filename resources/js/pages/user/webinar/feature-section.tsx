import { TransitionPanel } from '@/components/ui/transition-panel';
import { useState } from 'react';

export default function FeatureSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    const items = [
        {
            title: 'Dipandu Praktisi Profesional',
            subtitle: 'Belajar langsung dari mentor berpengalaman di bidangnya. Dapatkan insight yang aplikatif dan relevan.',
            image: '/assets/images/illustration-kelas-online.svg',
        },
        {
            title: 'Topik yang Selalu Update',
            subtitle:
                'Topik disesuaikan dengan kebutuhan industri dan perkembangan teknologi terbaru. Mulai dari tools freelancer, UI/UX, web development, hingga AI.',
            image: '/assets/images/illustration-bootcamp.svg',
        },
        {
            title: 'Cocok untuk Semua Tingkatan',
            subtitle: 'Baik kamu pemula atau profesional, webinar kami didesain agar mudah dipahami dan bisa langsung dipraktikkan.',
            image: '/assets/images/illustration-webinar.svg',
        },
    ];

    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <p className="text-primary border-primary bg-background mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                Webinar Aksademy
            </p>
            <h2 className="mx-auto mb-4 max-w-2xl text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Solusi #1 Kembangkan Diri dan Koneksi
            </h2>
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`w-full rounded-xl border-2 border-gray-300 p-4 text-sm font-medium shadow transition duration-200 ease-in dark:border-zinc-100/20 dark:bg-zinc-800/30 ${
                                activeIndex === index
                                    ? 'border-primary dark:bg-zinc-800 dark:text-zinc-100'
                                    : 'border-gray-300 dark:bg-zinc-700 dark:text-zinc-400'
                            }`}
                        >
                            <h2 className="mb-1 text-lg font-semibold text-gray-900">{item.title}</h2>
                            <p className="text-sm text-gray-600">{item.subtitle}</p>
                        </button>
                    ))}
                </div>
                <div className="overflow-hidden border-t border-zinc-200 dark:border-zinc-700">
                    <TransitionPanel
                        activeIndex={activeIndex}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        variants={{
                            enter: { opacity: 0, y: -50, filter: 'blur(4px)' },
                            center: { opacity: 1, y: 0, filter: 'blur(0px)' },
                            exit: { opacity: 0, y: 50, filter: 'blur(4px)' },
                        }}
                    >
                        {items.map((item, index) => (
                            <div key={index} className="py-2">
                                <img src={item.image} alt={item.title} className="mx-auto w-3/4" />
                            </div>
                        ))}
                    </TransitionPanel>
                </div>
            </div>
        </section>
    );
}
