import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, GraduationCap } from 'lucide-react';

interface RelatedProgram {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    price: number;
    strikethrough_price?: number;
    category?: { name: string };
    thumbnail?: string | null;
    registration_deadline?: string;
}

export default function RelatedPrograms({ relatedPrograms }: { relatedPrograms: RelatedProgram[] }) {
    if (!relatedPrograms || relatedPrograms.length === 0) return null;

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    return (
        <section className="mx-auto mt-16 w-full max-w-7xl px-4" id="related">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Program Sertifikasi Lainnya
            </h2>
            <p className="mb-8 text-center text-gray-600 dark:text-gray-400">Program sertifikasi lain yang mungkin menarik untuk Anda</p>

            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPrograms.map((program) => {
                    const deadlineDate = program.registration_deadline ? new Date(program.registration_deadline) : null;
                    return (
                        <Link
                            key={program.id}
                            href={route('certification-programs.detail', program.slug)}
                            className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                        >
                            <Spotlight className="bg-primary blur-2xl" size={284} />
                            <div className="bg-sidebar relative flex h-full w-full flex-col items-center justify-between rounded-lg transition-colors dark:bg-zinc-800">
                                <div className="w-full overflow-hidden rounded-t-lg">
                                    <img
                                        src={program.thumbnail ? `/storage/${program.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={program.title}
                                        className="h-48 w-full rounded-t-lg object-cover"
                                    />
                                    <div className="p-4">
                                        <Badge className={`mb-2 border-0 text-xs ${program.type === 'scholarship' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            <GraduationCap size={12} className="mr-1" />
                                            {program.type === 'scholarship' ? 'Beasiswa' : 'Reguler'}
                                        </Badge>
                                        <h2 className="mb-2 line-clamp-2 text-lg font-semibold">{program.title}</h2>
                                    </div>
                                </div>

                                <div className="w-full border-t p-4">
                                    {program.price === 0 ? (
                                        <p className="mb-2 text-lg font-semibold text-green-600 dark:text-green-400">Gratis</p>
                                    ) : (
                                        <div className="mb-2">
                                            {program.strikethrough_price && program.strikethrough_price > 0 && (
                                                <p className="text-sm text-red-500 line-through">{formatRupiah(program.strikethrough_price)}</p>
                                            )}
                                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{formatRupiah(program.price)}</p>
                                        </div>
                                    )}
                                    {deadlineDate && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar size="16" className="text-red-500" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Daftar sebelum: <span className="font-medium">{format(deadlineDate, 'dd MMM yyyy', { locale: id })}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
