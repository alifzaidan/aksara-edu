import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Package, Sparkles } from 'lucide-react';

interface Bundle {
    title: string;
    thumbnail?: string | null;
    short_description?: string | null;
    registration_deadline?: string | null;
    bundle_items_count: number;
}

interface HeroSectionProps {
    bundle: Bundle;
    discountPercentage: number;
}

export default function HeroSection({ bundle, discountPercentage }: HeroSectionProps) {
    const deadlineDate = bundle.registration_deadline ? new Date(bundle.registration_deadline) : null;

    return (
        <section className="to-background from-background via-primary/5 dark:via-primary/10 relative bg-gradient-to-b py-20 text-gray-900 dark:text-white">
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
            </div>

            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-3">
                <div className="col-span-2">
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <span className="text-primary border-primary bg-background mb-4 inline-flex w-fit items-center gap-2 rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                            <Sparkles size={14} className="mr-1" />
                            Paket Bundling
                        </span>
                        <span className="text-secondary border-secondary bg-background mb-4 inline-flex w-fit items-center rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs hover:text-[#FF925B]">
                            {discountPercentage > 0 && `Hemat ${discountPercentage}%`}
                        </span>
                        <span className="text-primary border-primary bg-background mb-4 inline-flex w-fit items-center gap-2 rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                            <Package size={14} className="mr-1" />
                            {bundle.bundle_items_count} Program
                        </span>
                    </div>

                    <h1 className="mb-4 text-4xl leading-tight font-bold italic sm:text-5xl">{bundle.title}</h1>

                    {bundle.short_description && <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">{bundle.short_description}</p>}

                    {deadlineDate && (
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                            ⏰ Daftar sebelum: {format(deadlineDate, 'dd MMMM yyyy, HH:mm', { locale: id })} WIB
                        </div>
                    )}

                    <div className="flex flex-wrap gap-4">
                        <a href="#register">
                            <Button size="lg">
                                <Package className="mr-2 h-4 w-4" />
                                Daftar Sekarang
                            </Button>
                        </a>
                        <a href="https://wa.me/+6285142505794" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline">
                                Hubungi Kami
                            </Button>
                        </a>
                    </div>
                </div>

                <div className="col-span-1 hidden lg:block">
                    <img
                        src={bundle.thumbnail ? `/storage/${bundle.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={bundle.title}
                        className="rounded-xl shadow-lg"
                    />
                </div>
            </div>
        </section>
    );
}
