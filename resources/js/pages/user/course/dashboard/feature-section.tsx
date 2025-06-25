import { TransitionPanel } from '@/components/ui/transition-panel';
import { useEffect, useState } from 'react';

const items = [
    {
        title: 'Belajar Fleksibel & Bersertifikat.',
        subtitle:
            'Disusun bertahap dari level dasar hingga lanjutan oleh praktisi industri dari berbagai company. Dapatkan e-certificate di tiap materi.',
        image: '/assets/images/feature-course-1.svg',
    },
    {
        title: 'Kombinasi Strategi Praktek & Portofolio.',
        subtitle: 'Belajar sambil praktek dengan ragam case study, worksheet, dan framework. Didasarkan pada kebutuhan industri dan profesi.',
        image: '/assets/images/feature-course-2.svg',
    },
    {
        title: 'Gabung Komunitas Secara Lifetime.',
        subtitle: 'Bangun network profesional , saling sharing ilmu dalam praktik, sambil berbagai info loker maupun freelance.',
        image: '/assets/images/feature-course-3.svg',
    },
];

export default function FeatureSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => (prevIndex + 1) % items.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [activeIndex]);

    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <p className="text-primary border-primary bg-background mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                Kelas Online Aksademy
            </p>
            <h2 className="dark:text-primary-foreground mx-auto mb-4 max-w-2xl text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Solusi #1 Upgrade Skill Profesional
            </h2>
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                <div className="my-12 space-y-2">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`w-full rounded-xl border-2 border-gray-300 p-4 text-sm font-medium shadow transition duration-200 ease-in hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800/30 ${
                                activeIndex === index
                                    ? 'border-primary dark:border-primary dark:to-primary text-primary-foreground dark:bg-zinc-800 dark:bg-gradient-to-br dark:from-black dark:text-zinc-100'
                                    : 'border-gray-300 dark:bg-zinc-700 dark:text-zinc-400'
                            }`}
                        >
                            <h2 className="dark:text-primary-foreground mb-1 text-lg font-semibold text-gray-900">{item.title}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.subtitle}</p>
                        </button>
                    ))}
                </div>
                <div className="overflow-hidden">
                    <TransitionPanel
                        activeIndex={activeIndex}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        variants={{
                            enter: { opacity: 0, y: -50, filter: 'blur(4px)' },
                            center: { opacity: 1, y: 0, filter: 'blur(0px)' },
                            exit: { opacity: 0, y: 50, filter: 'blur(4px)' },
                        }}
                    >
                        {items.map((item, index) => (
                            <div key={index} className="py-2">
                                <img src={item.image} alt={item.title} loading="lazy" className="mx-auto w-3/4" />
                            </div>
                        ))}
                    </TransitionPanel>
                </div>
            </div>
        </section>
    );
}
