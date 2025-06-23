import Heading from '@/components/heading';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';

export default function MyWebinars() {
    return (
        <UserLayout>
            <Head title="Webinar Saya" />
            <ProfileLayout>
                <Heading title="Webinar Saya" description="Jalin relasi dan tingkatkan pengetahuan Anda dengan webinar kami" />
            </ProfileLayout>
        </UserLayout>
    );
}
