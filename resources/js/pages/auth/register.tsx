import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from 'react-i18next';

type RegisterForm = {
    name: string;
    email: string;
    phone_number: string;
    instance: string;
    city: string;
    password: string;
    password_confirmation: string;
    affiliate_code?: string;
};

export default function Register({ affiliate_code }: { affiliate_code?: string }) {
    const { t } = useTranslation('auth');
    const [showPassword, setShowPassword] = useState(false);

    const getReferralCode = (): string => {
        if (affiliate_code) {
            sessionStorage.setItem('affiliate_code', affiliate_code);
            sessionStorage.setItem('referral_code', affiliate_code);
            return affiliate_code;
        }

        const storedReferral = sessionStorage.getItem('affiliate_code') || sessionStorage.getItem('referral_code');
        if (storedReferral) {
            return storedReferral;
        }

        return 'ATM2025';
    };

    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        phone_number: '',
        instance: '',
        city: '',
        password: '',
        password_confirmation: '',
        affiliate_code: getReferralCode(),
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
            sessionStorage.setItem('referral_code', refFromUrl);
            setData('affiliate_code', refFromUrl);
        } else {
            const storedReferral = sessionStorage.getItem('affiliate_code') || sessionStorage.getItem('referral_code');
            if (storedReferral) {
                setData('affiliate_code', storedReferral);
            }
        }
    }, [setData]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
            onSuccess: () => {
                sessionStorage.removeItem('referral_code');
            },
        });
    };

    return (
        <AuthLayout title={t('register.title')} description={t('register.description')}>
            <Head title={t('register.headTitle')} />
            <form className="flex flex-col gap-6" onSubmit={submit}>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">{t('register.name')}</Label>
                        <Input
                            id="name"
                            type="text"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                            placeholder={t('register.namePlaceholder')}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">{t('register.email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            tabIndex={2}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={processing}
                            placeholder="email@example.com"
                        />
                        <InputError message={errors.email} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone_number">{t('register.phone')}</Label>
                        <Input
                            id="phone_number"
                            type="phone_number"
                            required
                            tabIndex={2}
                            autoComplete="phone_number"
                            value={data.phone_number}
                            onChange={(e) => setData('phone_number', e.target.value)}
                            disabled={processing}
                            placeholder={t('register.phonePlaceholder')}
                        />
                        <InputError message={errors.phone_number} />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="instance">{t('register.instance')}</Label>
                        <Input
                            id="instance"
                            type="text"
                            required
                            tabIndex={2}
                            autoComplete="instance"
                            value={data.instance}
                            onChange={(e) => setData('instance', e.target.value)}
                            disabled={processing}
                            placeholder={t('register.instancePlaceholder')}
                        />
                        <InputError message={errors.instance} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="city">{t('register.city')}</Label>
                        <Input
                            id="city"
                            type="text"
                            required
                            tabIndex={2}
                            autoComplete="address-level2"
                            value={data.city}
                            onChange={(e) => setData('city', e.target.value)}
                            disabled={processing}
                            placeholder={t('register.cityPlaceholder')}
                        />
                        <InputError message={errors.city} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password">{t('register.password')}</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={3}
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                disabled={processing}
                                placeholder={t('register.password')}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 h-full px-3 hover:cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <Eye className="size-4 text-gray-500" /> : <EyeOff className="size-4 text-gray-500" />}
                                <span className="sr-only">{showPassword ? t('login.hidePassword') : t('login.showPassword')}</span>
                            </button>
                        </div>
                        <InputError message={errors.password} />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="password_confirmation">{t('register.confirmPassword')}</Label>
                        <div className="relative">
                            <Input
                                id="password_confirmation"
                                type={showPassword ? 'text' : 'password'}
                                required
                                tabIndex={4}
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                disabled={processing}
                                placeholder={t('register.confirmPassword')}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 h-full px-3 hover:cursor-pointer"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <Eye className="size-4 text-gray-500" /> : <EyeOff className="size-4 text-gray-500" />}
                                <span className="sr-only">{showPassword ? t('login.hidePassword') : t('login.showPassword')}</span>
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} />
                    </div>

                    {/* Tampilkan referral code info */}
                    {data.affiliate_code && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    {t('register.referralApplied')}<span className="font-mono font-medium">{data.affiliate_code}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    <Button type="submit" className="mt-2 w-full" tabIndex={5} disabled={processing}>
                        {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {t('register.submit')}
                    </Button>
                </div>

                <div className="text-muted-foreground text-center text-sm">
                    {t('register.hasAccount')}{' '}
                    <TextLink href={route('login')} tabIndex={6}>
                        {t('register.login')}
                    </TextLink>
                </div>
            </form>
        </AuthLayout>
    );
}
