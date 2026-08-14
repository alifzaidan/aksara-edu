import { Carousel, CarouselContent, CarouselIndicator, CarouselItem, CarouselNavigation } from '@/components/ui/carousel';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface CarouselItemData {
    id: string;
    title: string | null;
    image_path: string;
    target_url: string | null;
}

interface CarouselSectionProps {
    carousels?: CarouselItemData[];
}

const defaultSlides = [
    {
        id: 'default-1',
        title: 'Slide 1',
        image_path: '/assets/images/carousel-1.webp',
        target_url: '#latest-products',
    },
    {
        id: 'default-2',
        title: 'Slide 2',
        image_path: '/assets/images/carousel-2.webp',
        target_url: route('certification-programs.index'),
    },
    {
        id: 'default-3',
        title: 'Slide 3',
        image_path: '/assets/images/carousel-3.webp',
        target_url: route('bootcamp.index'),
    },
    {
        id: 'default-4',
        title: 'Slide 4',
        image_path: '/assets/images/carousel-2.webp',
        target_url: route('course.index'),
    },
];

export default function CarouselSection({ carousels }: CarouselSectionProps) {
    const slides = carousels && carousels.length > 0 ? carousels : defaultSlides;
    const [index, setIndex] = useState(0);
    const TOTAL_ITEMS = slides.length;

    useEffect(() => {
        if (TOTAL_ITEMS === 0) return;
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % TOTAL_ITEMS);
        }, 5000);
        return () => clearInterval(interval);
    }, [TOTAL_ITEMS]);

    return (
        <section className="relative w-full pt-4">
            <Carousel index={index} onIndexChange={setIndex} disableDrag>
                <CarouselContent>
                        {slides.map((slide, i) => {
                        const content = (
                            <img
                                src={slide.image_path}
                                alt={slide.title || `Slide ${i + 1}`}
                                loading="lazy"
                                className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                            />
                            );

                        return (
                            <CarouselItem key={slide.id || i} className="px-4">
                                {slide.target_url ? (
                                    slide.target_url.startsWith('http://') ||
                                    slide.target_url.startsWith('https://') ||
                                    slide.target_url.startsWith('#') ? (
                                        <a href={slide.target_url}>{content}</a>
                                    ) : (
                                        <Link href={slide.target_url}>{content}</Link>
                                    )
                                ) : (
                                    content
                                )}
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                <CarouselNavigation />
                <div className="mx-auto max-w-7xl px-4">
                    <CarouselIndicator />
                </div>
            </Carousel>
        </section>
    );
}
