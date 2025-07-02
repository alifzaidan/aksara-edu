import { Button } from '@/components/ui/button';
import { Award, Download } from 'lucide-react';

interface CertificateCardProps {
    type: 'completion' | 'participation' | 'graduation';
    title: string;
    description: string;
    onDownload?: () => void;
    isAvailable?: boolean;
    className?: string;
}

const certificateConfig = {
    completion: {
        icon: Award,
        iconColor: 'text-yellow-500',
        bgGradient: 'from-yellow-500 to-orange-500',
        hoverGradient: 'hover:from-yellow-600 hover:to-orange-600',
        title: 'Sertifikat Penyelesaian',
    },
    participation: {
        icon: Award,
        iconColor: 'text-blue-500',
        bgGradient: 'from-blue-500 to-purple-500',
        hoverGradient: 'hover:from-blue-600 hover:to-purple-600',
        title: 'Sertifikat Partisipasi',
    },
    graduation: {
        icon: Award,
        iconColor: 'text-green-500',
        bgGradient: 'from-green-500 to-emerald-500',
        hoverGradient: 'hover:from-green-600 hover:to-emerald-600',
        title: 'Sertifikat Kelulusan',
    },
};

export default function CertificateCard({ type, title, description, onDownload, isAvailable = false, className = '' }: CertificateCardProps) {
    const config = certificateConfig[type];
    const IconComponent = config.icon;

    return (
        <div className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 ${className}`}>
            <div className="mb-4 flex items-center gap-2">
                <IconComponent className={config.iconColor} size={20} />
                <h3 className="font-semibold">{title || config.title}</h3>
            </div>

            <div className="group relative">
                <img
                    src="/assets/images/placeholder.png"
                    alt="Sertifikat"
                    className="aspect-video rounded-lg border object-cover shadow-lg transition-transform group-hover:scale-105 dark:border-zinc-700"
                />
                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                        <div className="text-center text-white">
                            <Award size={32} className="mx-auto mb-2 opacity-70" />
                            <p className="text-sm font-medium">Segera Tersedia</p>
                        </div>
                    </div>
                )}
            </div>

            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{description}</p>

            <Button
                className={`mt-3 w-full bg-gradient-to-r ${config.bgGradient} ${config.hoverGradient}`}
                disabled={!isAvailable}
                onClick={onDownload}
            >
                <Download size={16} className="mr-2" />
                {isAvailable ? 'Unduh Sertifikat' : 'Unduh Sertifikat (Segera)'}
            </Button>
        </div>
    );
}
