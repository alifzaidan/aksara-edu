import { Button } from '@/components/ui/button';
import { Check, Package, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Trans, useTranslation } from 'react-i18next';

export default function HeroSection() {
    const { t } = useTranslation('user');

    const benefits = [
        t('bundling.dashboard.hero.benefit1'),
        t('bundling.dashboard.hero.benefit2'),
        t('bundling.dashboard.hero.benefit3'),
        t('bundling.dashboard.hero.benefit4'),
    ];

    return (
        <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-20 text-gray-900 dark:text-white">
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
            </div>

            <div className="relative mx-auto max-w-7xl px-4">
                <div className="mx-auto max-w-4xl text-center">
                    <span className="text-secondary border-secondary bg-background mb-4 inline-flex items-center gap-2 rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs hover:text-[#FF925B]">
                        <Sparkles size={16} />
                        {t('bundling.dashboard.hero.badge')}
                    </span>

                    <h1 className="mb-6 text-4xl leading-tight font-bold italic sm:text-5xl">
                        <Trans i18nKey="bundling.dashboard.hero.title" ns="user" components={{ br: <br /> }} />
                    </h1>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mx-auto mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-400"
                    >
                        {t('bundling.dashboard.hero.desc')}
                    </motion.p>

                    {/* Benefits Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                    >
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                                className="bg-background/50 dark:bg-background/30 flex items-start gap-3 rounded-lg border border-gray-200 p-4 backdrop-blur-sm dark:border-gray-800"
                            >
                                <div className="bg-primary/10 text-primary mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
                                    <Check size={14} />
                                </div>
                                <p className="text-left text-sm font-medium text-gray-700 dark:text-gray-300">{benefit}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        className="flex flex-wrap justify-center gap-4"
                    >
                        <a href="#bundles">
                            <Button size="lg" className="gap-2">
                                <Package size={18} />
                                {t('bundling.dashboard.hero.btnViewBundles')}
                            </Button>
                        </a>
                        <a href="https://wa.me/+6285142505794" target="_blank" rel="noopener noreferrer">
                            <Button size="lg" variant="outline" className="gap-2">
                                {t('bundling.dashboard.hero.btnFreeConsultation')}
                            </Button>
                        </a>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="mt-12 flex flex-wrap justify-center gap-8 text-center"
                    >
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">70%</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('bundling.dashboard.hero.statSave')}</p>
                        </div>
                        <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">2+</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('bundling.dashboard.hero.statPrograms')}</p>
                        </div>
                        <div className="h-12 w-px bg-gray-300 dark:bg-gray-700" />
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">100%</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('bundling.dashboard.hero.statLifetime')}</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
