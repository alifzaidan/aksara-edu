import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/magnetic';
import { Link } from '@inertiajs/react';
import { GalleryVerticalEnd, Star, User } from 'lucide-react';
import { useState } from 'react';

const ratings = [
    {
        id: 1,
        name: 'Ramadhani Pasuleri',
        rating: 5,
        comment:
            'Aksademy tempat belajarnya nyaman, materi yang disampaikan cukup jelas, mudah dipahami, banyak case² latihan untuk kita lebih cepat paham.',
    },
    {
        id: 2,
        name: 'Budi Santoso',
        rating: 4,
        comment: 'Materi bagus, tapi ada beberapa bagian yang kurang detail.',
    },
    {
        id: 3,
        name: 'Siti Aminah',
        rating: 5,
        comment: 'Sangat membantu untuk pemula!',
    },
    {
        id: 4,
        name: 'Andi Wijaya',
        rating: 3,
        comment: 'Cukup baik, tapi bisa lebih interaktif.',
    },
    {
        id: 5,
        name: 'Andi Wijaya',
        rating: 3,
        comment: 'Cukup baik, tapi bisa lebih interaktif.',
    },
    {
        id: 6,
        name: 'Andi Wijaya',
        rating: 3,
        comment: 'Cukup baik, tapi bisa lebih interaktif.',
    },
    {
        id: 7,
        name: 'Andi Wijaya',
        rating: 3,
        comment: 'Cukup baik, tapi bisa lebih interaktif.',
    },
];

export default function RatingSection() {
    const [selectedRating, setSelectedRating] = useState<number | null>(null);

    const filteredRatings = selectedRating ? ratings.filter((r) => r.rating === selectedRating) : ratings;
    return (
        <section className="mx-auto mt-8 w-full max-w-7xl px-4" id="reviews">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Terima Kasih Para Peserta
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">
                Review setelah bergabung di kelas Laravel 11, Service Repository, Filament: Web Event and Workshop Ticket
            </p>
            <div className="mt-4 flex w-max flex-nowrap gap-2">
                <button
                    type="button"
                    onClick={() => setSelectedRating(null)}
                    className={`rounded-xl border px-4 py-2 text-sm transition hover:cursor-pointer ${
                        selectedRating === null
                            ? 'to-primary text-primary-foreground border-primary bg-gradient-to-br from-black'
                            : 'hover:bg-accent dark:hover:bg-primary/10 bg-background border-gray-300 text-gray-800 dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100'
                    } `}
                >
                    Semua Rating
                </button>
                {[5, 4, 3, 2, 1].map((rate) => (
                    <button
                        key={rate}
                        type="button"
                        onClick={() => setSelectedRating(rate)}
                        className={`rounded-xl border px-4 py-2 text-sm transition hover:cursor-pointer ${
                            selectedRating === rate
                                ? 'to-primary text-primary-foreground border-primary bg-gradient-to-br from-black'
                                : 'hover:bg-accent dark:hover:bg-primary/10 bg-background border-gray-300 text-gray-800 dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100'
                        } `}
                    >
                        {rate} <Star size={14} className="inline text-yellow-500" fill="currentColor" />
                    </button>
                ))}
            </div>
            <div className="mt-6 flex flex-col items-center justify-center gap-2">
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {filteredRatings.map((item) => (
                        <div key={item.id} className="max-w-sm space-y-2 rounded-lg bg-white p-4 shadow-md">
                            <div className="flex items-center gap-2">
                                <div className="rounded-full bg-gray-200 p-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                </div>
                                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        className={i < item.rating ? 'text-yellow-500' : 'text-gray-300'}
                                        fill={i < item.rating ? 'currentColor' : 'none'}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-gray-500">{item.comment}</p>
                        </div>
                    ))}
                </div>
                <Magnetic>
                    <Button type="button" className="mt-8" asChild>
                        <Link href="/course">
                            Lihat Semua Rating <GalleryVerticalEnd />
                        </Link>
                    </Button>
                </Magnetic>
            </div>
        </section>
    );
}
