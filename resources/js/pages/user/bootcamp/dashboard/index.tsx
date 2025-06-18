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
    price: number;
    start_date: string;
    end_date: string;
    category: Category;
}

interface BootcampProps {
    categories: Category[];
    bootcamps: Bootcamp[];
}

export default function Bootcamp({ categories, bootcamps }: BootcampProps) {
    return (
        <UserLayout>
            <Head title="Bootcamp" />

            <HeroSection />
            <FeatureSection />
            <BootcampSection categories={categories} bootcamps={bootcamps} />
        </UserLayout>
    );
}
