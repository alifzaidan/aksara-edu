import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import SettingsLayout from '@/layouts/settings/layout';
import UserLayout from '@/layouts/user-layout';

type ProfileForm = {
    name: string;
    email: string;
    phone_number: string | null;
    instance: string | null;
    city: string | null;
    redirect?: string;
};

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { t } = useTranslation('settings');
    const { auth } = usePage<SharedData>().props;
    const redirectUrl = new URLSearchParams(window.location.search).get('redirect');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('profile.title'),
            href: '/settings/profile',
        },
    ];

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm<Required<ProfileForm>>({
        name: auth.user.name,
        email: auth.user.email,
        phone_number: (auth.user.phone_number ?? '') as string,
        instance: (auth.user.instance ?? '') as string,
        city: (auth.user.city ?? '') as string,
        redirect: redirectUrl || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            preserveScroll: true,
        });
    };

    const isUser = auth.role.includes('user');
    const Layout = isUser ? UserLayout : AdminLayout;

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <Head title={t('profile.title')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('profile.title')} description={t('profile.description')} />

                    <form onSubmit={submit} className="space-y-6">
                        <input type="hidden" name="redirect" value={data.redirect} />
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t('profile.name')}</Label>

                            <Input
                                id="name"
                                className="mt-1 block w-full"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder={t('profile.namePlaceholder')}
                            />

                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('profile.email')}</Label>

                            <Input
                                id="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder={t('profile.emailPlaceholder')}
                            />

                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="text-muted-foreground -mt-4 text-sm">
                                    {t('profile.unverified')}{' '}
                                    <Link
                                        href={route('verification.send')}
                                        method="post"
                                        as="button"
                                        className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                    >
                                        {t('profile.resendVerification')}
                                    </Link>
                                </p>

                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        {t('profile.verificationSent')}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="phone_number">{t('profile.phone')}</Label>

                            <Input
                                id="phone_number"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.phone_number ?? ''}
                                onChange={(e) => setData('phone_number', e.target.value)}
                                required
                                autoComplete="phone_number"
                                placeholder={t('profile.phonePlaceholder')}
                            />

                            <InputError className="mt-2" message={errors.phone_number} />
                        </div>

                        {!auth.user.phone_number && (
                            <div>
                                <p className="text-muted-foreground -mt-4 text-sm">{t('profile.incompletePhone')}</p>
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="instance">{t('profile.instance')}</Label>
                            <Input
                                id="instance"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.instance ?? ''}
                                onChange={(e) => setData('instance', e.target.value)}
                                required
                                autoComplete="organization"
                                placeholder={t('profile.instancePlaceholder')}
                            />

                            <InputError className="mt-2" message={errors.instance} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="city">{t('profile.city')}</Label>
                            <Input
                                id="city"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.city ?? ''}
                                onChange={(e) => setData('city', e.target.value)}
                                required
                                autoComplete="address-level2"
                                placeholder={t('profile.cityPlaceholder')}
                            />

                            <InputError className="mt-2" message={errors.city} />
                        </div>
                        <div className="flex items-center gap-4">
                            <Button disabled={processing}>{t('profile.save')}</Button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">{t('saved')}</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </Layout>
    );
}
