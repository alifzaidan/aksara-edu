interface Bundle {
    description?: string | null;
    benefits?: string | null;
}

interface BenefitsSectionProps {
    bundle: Bundle;
}

export default function BenefitsSection({ bundle }: BenefitsSectionProps) {
    if (!bundle.description && !bundle.benefits) {
        return null;
    }

    return (
        <section className="mx-auto w-full max-w-5xl px-4">
            {bundle.description && (
                <div className="mb-8">
                    <p className="text-primary border-primary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Tentang Paket Bundling
                    </p>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{bundle.description}</p>
                    </div>
                </div>
            )}

            {bundle.benefits && (
                <div className="mt-8">
                    <p className="text-primary border-primary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Keuntungan yang Anda Dapatkan
                    </p>
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: bundle.benefits }} />
                </div>
            )}
        </section>
    );
}
