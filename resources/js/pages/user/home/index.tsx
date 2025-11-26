import FakeNotifications from '@/components/fake-notifications';
import PromotionPopup from '@/components/promotion-popup';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import AboutSection from './about-section';
import CarouselSection from './carousel-section';
import CtaSection from './cta-section';
import FaqSection from './faq-section';
import LatestProductsSection from './latest-products-section';
import ProgramSection from './program-section';
import TestimonySection from './testimony-section';
import ToolsSection from './tools-section';

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    title: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    level?: 'beginner' | 'intermediate' | 'advanced';
    start_date?: string;
    end_date?: string;
    start_time?: string;
    registration_deadline?: string;
    duration_days?: number;
    bundle_url?: string;
    category?: Category;
    type: 'course' | 'bootcamp' | 'webinar' | 'bundle' | 'partnership';
    created_at: string;
}

interface MyProductIds {
    courses: string[];
    bootcamps: string[];
    webinars: string[];
    bundles: string[];
    partnerships: string[];
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

interface Promotion {
    id: string;
    promotion_flyer: string;
    start_date: string;
    end_date: string;
    url_redirect?: string;
    is_active: boolean;
}

interface HomeProps {
    tools: Tool[];
    latestProducts: Product[];
    myProductIds: MyProductIds;
    allProducts: Array<{
        id: string;
        title: string;
        type: 'course' | 'bootcamp' | 'webinar';
        price: number;
    }>;
    activePromotion?: Promotion | null;
    referralInfo: ReferralInfo;
}

export default function Home({ tools, latestProducts, myProductIds, allProducts, activePromotion, referralInfo }: HomeProps) {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('referral_code', refFromUrl);
        } else if (referralInfo.code) {
            sessionStorage.setItem('referral_code', referralInfo.code);
        }
    }, [referralInfo]);

    return (
        <UserLayout>
            <Head title="Beranda" />

            {activePromotion && <PromotionPopup promotion={activePromotion} suppressDuration={3} />}

            <CarouselSection />
            <AboutSection />
            <ProgramSection />
            <ToolsSection tools={tools} />
            <LatestProductsSection latestProducts={latestProducts} myProductIds={myProductIds} />
            <TestimonySection />
            <FaqSection />
            <CtaSection />

            {typeof window !== 'undefined' && window.innerWidth >= 1024 && <FakeNotifications products={allProducts} />}

            <a
                href="https://wa.me/+6285142505794?text=Halo%20Admin%20Aksademy,%20saya%20ingin%20bertanya%20tentang%20kelas%20online."
                target="_blank"
                rel="noopener noreferrer"
                className="fixed right-4 bottom-18 z-50 flex h-12 w-12 animate-bounce items-center justify-center rounded-full bg-green-100 shadow-lg transition duration-1000 hover:bg-green-200 md:right-10 md:h-16 md:w-16 lg:bottom-6"
                aria-label="Chat WhatsApp"
            >
                <img src="/assets/images/icon-wa.svg" alt="WhatsApp" className="h-8 w-8 md:h-12 md:w-12" />
            </a>
        </UserLayout>
    );
}
