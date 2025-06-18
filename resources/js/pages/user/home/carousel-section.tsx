import { Carousel, CarouselContent, CarouselIndicator, CarouselItem } from '@/components/ui/carousel';
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
        <section className="to-background from-tertiary relative w-full bg-gradient-to-b pt-4">
            <Carousel index={index} onIndexChange={setIndex} disableDrag>
                <CarouselContent>
                    <CarouselItem className="px-4">
                        <a href="#program-kami">
                            <img
                                src="/assets/images/carousel-1.png"
                                alt="Slide 1"
                                className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                            />
                        </a>
                    </CarouselItem>
                    <CarouselItem className="px-4">
                        <img
                            src="/assets/images/carousel-1.png"
                            alt="Slide 1"
                            className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                        />
                    </CarouselItem>
                    <CarouselItem className="px-4">
                        <img
                            src="/assets/images/carousel-1.png"
                            alt="Slide 1"
                            className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                        />
                    </CarouselItem>
                    <CarouselItem className="px-4">
                        <img
                            src="/assets/images/carousel-1.png"
                            alt="Slide 1"
                            className="mx-auto w-full max-w-7xl rounded-xl object-cover shadow-lg"
                        />
                    </CarouselItem>
                </CarouselContent>
                <div className="mx-auto max-w-7xl px-4">
                    <CarouselIndicator />
                </div>
            </Carousel>
        </section>
    );
}
