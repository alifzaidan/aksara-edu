import Heading from '@/components/heading';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';

export default function Profile() {
    return (
        <UserLayout>
            <Head title="Profil" />
            <ProfileLayout>
                <Heading title="Dashboard" description="Pantau aktivitas dan progres Anda" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 w-full rounded-lg border px-5 py-3">
                        <h2 className="text-lg font-semibold">Resume Saya</h2>
                        <p className="text-muted-foreground text-sm">1 Bulan Terakhir</p>
                    </div>
                    <div className="h-32 w-full rounded-lg border px-5 py-3">
                        <h2 className="text-lg font-semibold">Topik Favorit</h2>
                        <p className="text-muted-foreground text-sm">1 Bulan Terakhir</p>
                    </div>
                    <div className="h-32 w-full rounded-lg border px-5 py-3">
                        <h2 className="text-lg font-semibold">Progres Saya</h2>
                        <p className="text-muted-foreground text-sm">Jumlah kelas yang diikuti: 5</p>
                    </div>
                    <div className="h-32 w-full rounded-lg border px-5 py-3">
                        <h2 className="text-lg font-semibold">Durasi Belajar</h2>
                        <p className="text-muted-foreground text-sm">1 Bulan Terakhir</p>
                    </div>
                </div>
            </ProfileLayout>
        </UserLayout>
    );
}
