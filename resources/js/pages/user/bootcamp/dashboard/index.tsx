import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import BootcampSection from './bootcamp-section';
import FeatureSection from './feature-section';
import HeroSection from './hero-section';

type Category = {
    id: string;
    name: string;
};

interface Bootcamp {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    start_date: string;
    end_date: string;
    category: Category;
}

interface BootcampProps {
    categories: Category[];
    bootcamps: Bootcamp[];
    myBootcampIds: string[];
}

export default function Bootcamp({ categories, bootcamps, myBootcampIds }: BootcampProps) {
    return (
        <UserLayout>
            <Head title="Bootcamp" />

            <HeroSection />
            <FeatureSection />
            <BootcampSection categories={categories} bootcamps={bootcamps} myBootcampIds={myBootcampIds} />
        </UserLayout>
    );
}
