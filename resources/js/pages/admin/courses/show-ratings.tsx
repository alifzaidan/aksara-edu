import { Star } from 'lucide-react';
import { columns, type CourseRating } from './columns-ratings';
import { DataTable } from './data-table-ratings';

interface CourseRatingComponentProps {
    ratings: CourseRating[];
    averageRating?: number;
}

export default function CourseRatingComponent({ ratings, averageRating = 0 }: CourseRatingComponentProps) {
    const approvedRatings = ratings.filter((r) => r.status === 'approved');

    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Rating dan Ulasan</h2>
                <div className="text-sm text-gray-500">Total: {ratings.length} rating</div>
            </div>

            {ratings.length > 0 ? (
                <div className="space-y-4">
                    <div className="rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 p-6 dark:from-yellow-900/20 dark:to-orange-900/20">
                        <div className="text-center">
                            <div className="mb-2 flex items-center justify-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={24}
                                            className={`${star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{averageRating.toFixed(1)}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Berdasarkan {approvedRatings.length} ulasan yang disetujui</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Menunggu</div>
                            <div className="text-lg font-semibold text-yellow-600">{ratings.filter((r) => r.status === 'pending').length}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Disetujui</div>
                            <div className="text-lg font-semibold text-green-600">{ratings.filter((r) => r.status === 'approved').length}</div>
                        </div>
                        <div className="text-center">
                            <div className="text-sm text-gray-500">Ditolak</div>
                            <div className="text-lg font-semibold text-red-600">{ratings.filter((r) => r.status === 'rejected').length}</div>
                        </div>
                    </div>

                    <DataTable columns={columns} data={ratings} />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Rating dan Ulasan Tidak Tersedia" className="w-48" />
                    <div className="text-center">
                        <p className="text-muted-foreground text-sm">Belum ada rating dan ulasan untuk kelas ini.</p>
                        <p className="mt-1 text-xs text-gray-400">Rating akan muncul setelah peserta menyelesaikan kelas dan memberikan penilaian.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
