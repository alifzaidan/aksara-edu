import { useTranslation } from 'react-i18next';

export default function AboutSection() {
    const { t } = useTranslation('user');

    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-8 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">{t('webinar.detail.expertSpeaker')}</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        {t('webinar.detail.expertSpeakerDesc')}
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">{t('webinar.detail.interactiveSession')}</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        {t('webinar.detail.interactiveSessionDesc')}
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">{t('webinar.detail.latestInsights')}</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        {t('webinar.detail.latestInsightsDesc')}
                    </p>
                </div>
            </div>
        </section>
    );
}
