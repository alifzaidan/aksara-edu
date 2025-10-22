import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';

interface PartnershipProduct {
    schedule_days: string[];
    duration_days: number;
}

export default function ScheduleInfoSection({ partnershipProduct }: { partnershipProduct: PartnershipProduct }) {
    if (!partnershipProduct.schedule_days || partnershipProduct.schedule_days.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
            <div className="grid grid-cols-1 gap-8 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-2 dark:border-zinc-700 dark:bg-zinc-800">
                {/* Schedule Days */}
                <div className="flex flex-col items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-8 w-8 text-blue-600" />
                        <h3 className="text-2xl font-bold italic">Jadwal Pelaksanaan</h3>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {partnershipProduct.schedule_days.map((day: string) => (
                            <Badge key={day} className="bg-blue-100 px-4 py-2 text-base text-blue-700">
                                {day}
                            </Badge>
                        ))}
                    </div>
                    <p className="text-muted-foreground text-center text-sm">Program ini dilaksanakan pada hari-hari yang telah ditentukan</p>
                </div>

                {partnershipProduct.duration_days > 0 && (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-8 w-8 text-green-600" />
                            <h3 className="text-2xl font-bold italic">Durasi Program</h3>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-green-600">{partnershipProduct.duration_days}</span>
                            <span className="text-xl text-gray-600 dark:text-gray-400">hari</span>
                        </div>
                        <p className="text-muted-foreground text-center text-sm">Total durasi pembelajaran dari awal hingga akhir program</p>
                    </div>
                )}
            </div>
        </section>
    );
}
