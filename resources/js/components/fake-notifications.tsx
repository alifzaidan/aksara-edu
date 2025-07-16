import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Product {
    id: string;
    title: string;
    type: 'course' | 'bootcamp' | 'webinar';
    price: number;
}

interface FakeNotificationsProps {
    products: Product[];
}

const FAKE_NAMES = [
    'Ahmad Rizki',
    'Siti Nurhaliza',
    'Budi Santoso',
    'Maya Sari',
    'Andi Pratama',
    'Dewi Lestari',
    'Reza Fauzi',
    'Indira Putri',
    'Fajar Nugroho',
    'Rina Maharani',
    'Dimas Aditya',
    'Lina Kartika',
    'Arief Rahman',
    'Tia Permata',
    'Yoga Saputra',
    'Nita Sari',
    'Bayu Wijaya',
    'Safira Anggraini',
    'Hendra Gunawan',
    'Mira Oktavia',
    'Alif Firmansyah',
    'Putri Wulandari',
    'Irfan Hakim',
    'Sari Melati',
    'Doni Setiawan',
];

export default function FakeNotifications({ products }: FakeNotificationsProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!products || products.length === 0) return;

        const showFakeNotification = () => {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            const randomName = FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
            const productType = randomProduct.type === 'course' ? 'Kelas Online' : randomProduct.type === 'bootcamp' ? 'Bootcamp' : 'Webinar';

            toast.success(
                <div className="flex w-full min-w-0 items-start space-x-3">
                    <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="mb-1 text-sm font-medium text-gray-900">
                            <span className="font-semibold">{randomName}</span>
                        </p>
                        <span className="text-xs leading-relaxed break-words text-gray-500">Baru saja membeli {productType}: </span>
                        <span className="text-xs leading-relaxed font-medium break-words text-gray-700">{randomProduct.title}</span>
                    </div>
                </div>,
                {
                    duration: 5000,
                    position: 'bottom-left',
                    style: {
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        maxWidth: '350px',
                        width: '350px',
                        padding: '12px',
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word',
                    },
                },
            );
        };

        const initialTimeout = setTimeout(showFakeNotification, 10000);

        const interval = setInterval(
            () => {
                if (isVisible) {
                    showFakeNotification();
                }
            },
            Math.random() * 30000 + 30000,
        );

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [products, isVisible]);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            if (scrollPosition >= documentHeight * 0.8) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
        };

        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        window.addEventListener('scroll', handleScroll);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return null;
}
