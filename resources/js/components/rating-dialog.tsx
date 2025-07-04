import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { useState } from 'react';

interface Course {
    id: string;
    title: string;
    thumbnail: string;
    description: string;
}

interface RatingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    course: Course;
}

export default function RatingDialog({ isOpen, onClose, course }: RatingDialogProps) {
    const [hoveredStar, setHoveredStar] = useState<number>(0);
    const { data, setData, post, processing, errors, reset } = useForm({
        rating: 0,
        review: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('course.rating.store', course.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const handleStarClick = (rating: number) => {
        setData('rating', rating);
    };

    const handleStarHover = (rating: number) => {
        setHoveredStar(rating);
    };

    const handleStarLeave = () => {
        setHoveredStar(0);
    };

    const getStarColor = (starNumber: number) => {
        const activeRating = hoveredStar || data.rating;
        return starNumber <= activeRating ? 'text-yellow-400' : 'text-gray-300';
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Berikan Rating & Review</DialogTitle>
                    <DialogDescription>Bagikan pengalaman Anda mengikuti kelas ini</DialogDescription>
                </DialogHeader>

                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <img
                            src={course.thumbnail ? `/storage/${course.thumbnail}` : '/assets/images/placeholder.png'}
                            alt={course.title}
                            className="h-16 w-16 rounded-lg object-cover"
                        />
                        <div>
                            <h3 className="font-semibold">{course.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{course.description}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Rating <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => handleStarClick(star)}
                                    onMouseEnter={() => handleStarHover(star)}
                                    onMouseLeave={handleStarLeave}
                                    className="transition-colors duration-150"
                                >
                                    <Star className={`h-8 w-8 ${getStarColor(star)} ${star <= (hoveredStar || data.rating) ? 'fill-current' : ''}`} />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                {data.rating > 0 && (
                                    <>
                                        {data.rating}/5 -{' '}
                                        {data.rating === 1
                                            ? 'Sangat Buruk'
                                            : data.rating === 2
                                              ? 'Buruk'
                                              : data.rating === 3
                                                ? 'Cukup'
                                                : data.rating === 4
                                                  ? 'Baik'
                                                  : 'Sangat Baik'}
                                    </>
                                )}
                            </span>
                        </div>
                        {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Review <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            value={data.review}
                            onChange={(e) => setData('review', e.target.value)}
                            placeholder="Ceritakan pengalaman Anda mengikuti kelas ini. Apa yang Anda sukai? Apa yang bisa diperbaiki?"
                            rows={4}
                            className="resize-none"
                        />
                        <div className="mt-1 flex justify-between text-sm text-gray-500">
                            <span>{errors.review && <span className="text-red-600">{errors.review}</span>}</span>
                            <span>{data.review.length}/1000</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                        <p className="text-sm text-green-800 dark:text-green-200">
                            <strong>Catatan:</strong> Setelah Anda mengirim rating dan review, sertifikat kelulusan akan langsung tersedia untuk
                            diunduh.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" className="flex-1" onClick={handleClose} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" className="flex-1" disabled={processing || data.rating === 0 || data.review.length < 1}>
                            {processing ? 'Mengirim...' : 'Kirim Rating'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
