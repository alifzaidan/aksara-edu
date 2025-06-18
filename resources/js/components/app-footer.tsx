import { ProductItem, ServiceItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Instagram, Linkedin } from 'lucide-react';

const productItems: ProductItem[] = [
    {
        title: 'Kelas Online',
        href: '/course',
    },
    {
        title: 'Bootcamp',
        href: '/bootcamp',
    },
    {
        title: 'Webinar',
        href: '/webinar',
    },
];

const serviceItems: ServiceItem[] = [
    {
        title: 'Software House',
        href: 'https://aksarateknologi.co.id/',
    },
    {
        title: 'Pusat Bantuan',
        href: 'https://wa.me/+6285142505797',
    },
];

export default function AppFooter() {
    return (
        <footer className="from-primary/80 to-background bg-gradient-to-t py-8 sm:py-16">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 text-sm sm:grid-cols-2 sm:gap-12 lg:grid-cols-4">
                <div>
                    {/* Logo untuk light mode */}
                    <img src="/assets/images/logo-primary-2.png" alt="Logo Aksara" className="block w-24 fill-current dark:hidden" />
                    {/* Logo untuk dark mode */}
                    <img src="/assets/images/logo-secondary-2.png" alt="Logo Aksara" className="hidden w-24 fill-current dark:block" />
                    <p className="my-4">Keep Rising and Inspiring Everyone.</p>
                    <h5 className="font-semibold">CV. Aksara Teknologi Mandiri</h5>
                    <p className="text-gray-800">
                        Perumahan Permata Permadani, Blok B1. Kel. Pendem Kec. Junrejo Kota Batu Prov. Jawa Timur, 65324 <br /> +6285142505797
                    </p>
                </div>
                <div className="sm:text-right">
                    <h4 className="mb-4 font-semibold">Produk</h4>
                    <ul className="space-y-2">
                        {productItems.map((item) => (
                            <li key={item.title}>
                                <Link href={item.href} className="hover:underline">
                                    {item.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 className="mb-4 font-semibold">Layanan</h4>
                    <ul className="space-y-2">
                        {serviceItems.map((item) => (
                            <li key={item.title}>
                                <a href={item.href} className="hover:underline" target="_blank" rel="noopener noreferrer">
                                    {item.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="sm:text-right">
                    <h4 className="mb-4 font-semibold">Media Sosial</h4>
                    <div className="flex items-center gap-4 sm:justify-end">
                        <a href="https://www.instagram.com/aksarateknologi/" target="_blank">
                            <Instagram />
                        </a>
                        <a href="https://www.linkedin.com/company/aksarateknologi" target="_blank">
                            <Linkedin />
                        </a>
                    </div>
                    <p className="mt-4">
                        Ikuti kami di media sosial untuk mendapatkan informasi terbaru, tips, dan konten menarik seputar teknologi.
                    </p>
                </div>
            </div>
            <div className="mt-12 text-center text-xs text-blue-200">&copy; 2025 CV. Aksara Teknologi Mandiri. All rights reserved.</div>
        </footer>
    );
}
