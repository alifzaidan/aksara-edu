import { Link } from '@inertiajs/react';
import { Instagram, Linkedin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function AppFooter() {
    const { t } = useTranslation('common');

    const productItems = [
        {
            title: t('footer.links.course'),
            href: '/course',
        },
        {
            title: t('footer.links.bootcamp'),
            href: '/bootcamp',
        },
        {
            title: t('footer.links.webinar'),
            href: '/webinar',
        },
        {
            title: t('footer.links.private'),
            href: '/private',
        },
        {
            title: t('footer.links.bundle'),
            href: '/bundle',
        },
        {
            title: t('footer.links.certification'),
            href: '/certification-programs',
        },
    ];

    const serviceItems = [
        {
            title: t('footer.links.softwareHouse'),
            href: 'https://aksarateknologi.co.id/',
        },
        {
            title: t('footer.links.helpCenter'),
            href: 'https://wa.me/+6285142505794',
        },
    ];

    const otherItems = [
        {
            title: t('footer.links.article'),
            href: '/article',
        },
        {
            title: t('footer.links.terms'),
            href: '/terms-and-conditions',
        },
        {
            title: t('footer.links.privacy'),
            href: '/privacy-policy',
        },
    ];

    return (
        <footer className="from-primary/80 to-background bg-gradient-to-t py-8 sm:py-16">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 text-sm sm:grid-cols-2 sm:gap-12 lg:grid-cols-3">
                <div>
                    {/* Logo untuk light mode */}
                    <img src="/assets/images/logo-primary-2.png" alt="Logo Aksara" className="block w-24 fill-current dark:hidden" />
                    {/* Logo untuk dark mode */}
                    <img src="/assets/images/logo-secondary-2.png" alt="Logo Aksara" className="hidden w-24 fill-current dark:block" />
                    <p className="my-4">{t('footer.tagline')}</p>
                    <h5 className="font-semibold">{t('footer.company')}</h5>
                    <p className="text-gray-800 dark:text-gray-400">
                        {t('footer.address')} <br /> +6285142505794
                    </p>
                </div>
                <div className="flex gap-8 sm:gap-12">
                    <div>
                        <h4 className="mb-4 font-semibold">{t('footer.products')}</h4>
                        <ul className="space-y-2">
                            {productItems.map((item) => (
                                <li key={item.title}>
                                    <Link href={item.href} className="hover:underline">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold">{t('footer.services')}</h4>
                        <ul className="space-y-2">
                            {serviceItems.map((item) => (
                                <li key={item.title}>
                                    <a href={item.href} className="hover:underline" target="_blank" rel="noopener noreferrer">
                                        {item.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="mb-4 font-semibold">{t('footer.others')}</h4>
                        <ul className="space-y-2">
                            {otherItems.map((item) => (
                                <li key={item.title}>
                                    <Link href={item.href} className="hover:underline">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="sm:text-right">
                    <h4 className="mb-4 font-semibold">{t('footer.social')}</h4>
                    <div className="flex items-center gap-4 sm:justify-end">
                        <a href="https://www.instagram.com/aksademy/" target="_blank">
                            <Instagram />
                        </a>
                        <a href="https://www.linkedin.com/company/aksarateknologi" target="_blank">
                            <Linkedin />
                        </a>
                    </div>
                    <p className="mt-4">
                        {t('footer.socialDesc')}
                    </p>
                </div>
            </div>
            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row">
                <div>{t('footer.copyright')}</div>
                <LanguageSwitcher variant="dropdown" />
            </div>
        </footer>
    );
}
