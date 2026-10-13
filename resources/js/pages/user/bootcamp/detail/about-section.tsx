import { useTranslation } from 'react-i18next';

export default function AboutSection() {
    const { t } = useTranslation('user');

    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-8 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">{t('bootcamp.detail.curriculumModern')}</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        {t('bootcamp.detail.curriculumModernDesc')}
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">{t('bootcamp.detail.careerReady')}</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        {t('bootcamp.detail.careerReadyDesc')}
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">{t('bootcamp.detail.fullSupport')}</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        {t('bootcamp.detail.fullSupportDesc')}
                    </p>
                </div>
            </div>
        </section>
    );
}
