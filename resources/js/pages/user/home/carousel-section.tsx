import { Carousel, CarouselContent, CarouselIndicator, CarouselItem, CarouselNavigation } from '@/components/ui/carousel';
import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function CarouselSection() {
    const [index, setIndex] = useState(0);
    const TOTAL_ITEMS = 4;

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % TOTAL_ITEMS);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="relative w-full pt-4">
            <Carousel index={index} onIndexChange={setIndex} disableDrag>
                <CarouselContent>
                    <CarouselItem className="px-4">
                        <a href="#program-kami">
                            <img
                                src="/assets/images/carousel-1-1.png"
                                alt="Slide 1"
                                className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                            />
                        </a>
                    </CarouselItem>
                    <CarouselItem className="px-4">
                        <Link href={route('course.index')}>
                            <img
                                src="/assets/images/carousel-2.png"
                                alt="Slide 2"
                                className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                            />
                        </Link>
                    </CarouselItem>
                    <CarouselItem className="px-4">
                        <Link href={route('bootcamp.index')}>
                            <img
                                src="/assets/images/carousel-3.png"
                                alt="Slide 3"
                                className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                            />
                        </Link>
                    </CarouselItem>
                    <CarouselItem className="px-4">
                        <Link href={route('webinar.index')}>
                            <img
                                src="/assets/images/carousel-4.png"
                                alt="Slide 4"
                                className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                            />
                        </Link>
                    </CarouselItem>
                </CarouselContent>
                <CarouselNavigation />
                <div className="mx-auto max-w-7xl px-4">
                    <CarouselIndicator />
                </div>
            </Carousel>
        </section>
    );
}
