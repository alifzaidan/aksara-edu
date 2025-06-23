import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="bg-muted relative hidden h-full flex-col overflow-hidden p-0 text-white lg:flex dark:border-r">
                <img src="/assets/images/login-img.png" alt="Aksademy" className="absolute inset-0 z-0 h-full w-full object-cover object-center" />
                <div className="relative z-10 flex h-full w-full flex-col p-10">
                    {quote && (
                        <div className="mt-auto">
                            <blockquote className="space-y-2">
                                <p className="text-lg">&ldquo;{quote.message}&rdquo;</p>
                                <footer className="text-sm text-neutral-300">{quote.author}</footer>
                            </blockquote>
                        </div>
                    )}
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link href={route('home')} className="relative z-20 flex items-center justify-center">
                        <img src="/assets/images/logo-primary-2.png" alt="Aksademy" className="block w-20 fill-current dark:hidden" />
                        <img src="/assets/images/logo-secondary-2.png" alt="Aksademy" className="hidden w-20 fill-current dark:block" />
                    </Link>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h1 className="text-2xl font-bold italic">{title}</h1>
                        <p className="text-muted-foreground text-sm text-balance">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
