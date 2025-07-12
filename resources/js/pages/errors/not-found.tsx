import { Button } from '@/components/ui/button';
import { Head, Link } from '@inertiajs/react';
import { Home } from 'lucide-react';

export default function PageNotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
            <Head title="Page Not Found" />
            <div className="container flex flex-col items-center justify-center py-12 text-center">
                <img src="/assets/images/404-light.webp" alt="Page not found" className="mb-8 block max-w-[300px] dark:hidden" />
                <img src="/assets/images/404-dark.webp" alt="Page not found" className="mb-8 hidden max-w-[300px] dark:block" />

                <p className="mb-8 max-w-md text-base text-gray-600 dark:text-gray-400">Maaf, halaman yang Anda cari tidak ditemukan.</p>

                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                    <Button asChild size="lg">
                        <Link href="/">
                            <Home className="mr-2 h-5 w-5" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
