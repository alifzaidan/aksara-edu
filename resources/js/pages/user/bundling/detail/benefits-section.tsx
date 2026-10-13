import { useTranslation } from 'react-i18next';

interface Bundle {
    description?: string | null;
    benefits?: string | null;
}

interface BenefitsSectionProps {
    bundle: Bundle;
}

export default function BenefitsSection({ bundle }: BenefitsSectionProps) {
    const { t } = useTranslation('user');

    if (!bundle.description && !bundle.benefits) {
        return null;
    }

    return (
        <section className="mx-auto w-full max-w-5xl px-4">
            {bundle.description && (
                <div className="mb-8">
                    <p className="text-primary border-primary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        {t('bundling.detail.about.aboutTitle')}
                    </p>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{bundle.description}</p>
                    </div>
                </div>
            )}

            {bundle.benefits && (
                <div className="mt-8">
                    <p className="text-primary border-primary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        {t('bundling.detail.about.benefitsTitle')}
                    </p>
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: bundle.benefits }} />
                </div>
            )}
        </section>
    );
}
