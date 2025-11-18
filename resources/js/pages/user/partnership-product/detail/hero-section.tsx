import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PartnershipProduct {
    title: string;
    category?: { name: string };
    thumbnail?: string | null;
    short_description?: string | null;
    description?: string | null;
    registration_deadline: string;
}

export default function HeroSection({ partnershipProduct }: { partnershipProduct: PartnershipProduct }) {
    const deadlineDate = new Date(partnershipProduct.registration_deadline);

    return (
        <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-20 text-gray-900 dark:text-white">
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
            </div>
            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-3">
                <div className="col-span-2">
                    {partnershipProduct.category && (
                        <span className="text-secondary border-secondary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs hover:text-[#FF925B]">
                            {' '}
                            {partnershipProduct.category.name}
                        </span>
                    )}

                    <h1 className="mb-4 text-4xl leading-tight font-bold italic sm:text-5xl">{partnershipProduct.title}</h1>

                    {partnershipProduct.short_description && (
                        <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">{partnershipProduct.short_description}</p>
                    )}

                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                        ⏰ Daftar sebelum: {format(deadlineDate, 'dd MMMM yyyy, HH:mm', { locale: id })} WIB
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <a href="#register">
                            <Button>Daftar Sekarang</Button>
                        </a>
                        <a href="https://wa.me/+6285142505794" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">Hubungi Kami</Button>
                        </a>
                        <a href="https://ppppmi.id" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">Terafiliasi dengan P4MI</Button>
                        </a>
                    </div>
                </div>
                <div className="col-span-1 hidden lg:block">
                    <img
                        src={partnershipProduct.thumbnail ? `/storage/${partnershipProduct.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={partnershipProduct.title}
                        className="rounded-xl shadow-lg"
                    />
                </div>
            </div>
        </section>
    );
}
