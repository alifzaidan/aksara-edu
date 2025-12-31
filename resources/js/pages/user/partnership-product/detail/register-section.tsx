import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BadgeCheck, Calendar, CalendarDays, Clock } from 'lucide-react';

interface PartnershipProduct {
    id: string;
    title: string;
    strikethrough_price: number;
    price: number;
    registration_deadline: string;
    registration_url: string;
    thumbnail?: string | null;
    schedule_days: string[];
    duration_days: number;
}

export default function RegisterSection({ partnershipProduct }: { partnershipProduct: PartnershipProduct }) {
    const deadline = new Date(partnershipProduct.registration_deadline);
    const isRegistrationOpen = new Date() < deadline;
    const canRegister = isRegistrationOpen;

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleRegister = () => {
        window.open(route('partnership-products.track-click', partnershipProduct.id), '_blank');
    };

    return (
        <section className="mx-auto my-8 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Informasi Pendaftaran
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">
                Daftar sekarang dan tingkatkan kompetensi profesional Anda melalui program sertifikasi bersama partner terpercaya.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Left Column - Image & Benefits */}
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                        src={partnershipProduct.thumbnail ? `/storage/${partnershipProduct.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={partnershipProduct.title}
                        className="rounded-lg border border-gray-200 shadow-md"
                    />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Sertifikat Resmi dari Partner Industri</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Materi Relevan dengan Kebutuhan Industri</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Meningkatkan Kredibilitas Profesional</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>Kesempatan Networking dengan Profesional</p>
                        </li>
                    </ul>
                </div>

                {/* Right Column - Registration Info */}
                <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <h5 className="mb-4 text-sm">Daftar sekarang dan dapatkan sertifikat profesional yang diakui industri</h5>

                    {/* Price */}
                    {partnershipProduct.strikethrough_price > 0 && (
                        <span className="text-right text-sm text-red-500 line-through">{formatRupiah(partnershipProduct.strikethrough_price)}</span>
                    )}
                    {partnershipProduct.price > 0 ? (
                        <span className="text-right text-3xl font-bold text-gray-900 italic dark:text-gray-100">
                            {formatRupiah(partnershipProduct.price)}
                        </span>
                    ) : (
                        <span className="text-left text-3xl font-bold text-gray-900 italic dark:text-gray-100">GRATIS</span>
                    )}

                    <Separator className="my-4" />

                    {/* Program Info */}
                    <ul className="mb-4 space-y-3">
                        {partnershipProduct.schedule_days && partnershipProduct.schedule_days.length > 0 && (
                            <li className="flex items-start gap-2 text-sm">
                                <CalendarDays size="16" className="text-primary dark:text-secondary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="mb-1 font-medium">Hari Pelaksanaan:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {partnershipProduct.schedule_days.map((day: string) => (
                                            <span key={day} className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                                {day}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </li>
                        )}

                        {partnershipProduct.duration_days > 0 && (
                            <li className="flex items-center gap-2 text-sm">
                                <Clock size="16" className="text-primary dark:text-secondary" />
                                <p>
                                    Durasi: <span className="font-medium">{partnershipProduct.duration_days} hari</span>
                                </p>
                            </li>
                        )}

                        <li className="flex items-start gap-2 text-sm">
                            <Calendar size="16" className="text-primary dark:text-secondary mt-0.5" />
                            <div>
                                <p className="font-medium">Batas Pendaftaran:</p>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {format(deadline, "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: id })} WIB
                                </p>
                            </div>
                        </li>
                    </ul>

                    {/* Registration Button */}
                    <div className="mt-auto space-y-2">
                        {/* Warning Messages */}
                        {!isRegistrationOpen && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-800 dark:bg-red-900/20">
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">⚠️ Pendaftaran sudah ditutup</p>
                            </div>
                        )}

                        {/* Registration Button */}
                        <Button className="w-full" onClick={handleRegister} disabled={!canRegister}>
                            {canRegister ? 'Daftar Sekarang' : 'Pendaftaran Ditutup'}
                        </Button>

                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">Anda akan diarahkan ke halaman pendaftaran partner</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
