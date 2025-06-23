import Heading from '@/components/heading';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';

export default function MyBootcamps() {
    return (
        <UserLayout>
            <Head title="Bootcamp Saya" />
            <ProfileLayout>
                <Heading title="Bootcamp Saya" description="Perbanyak portofolio Anda dengan bootcamp kami" />
            </ProfileLayout>
        </UserLayout>
    );
}
