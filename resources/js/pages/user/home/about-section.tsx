import { Cursor } from '@/components/ui/cursor';
import { Tilt } from '@/components/ui/tilt';
import { Link } from '@inertiajs/react';
import { SVGProps } from 'react';

const MouseIcon = (props: SVGProps<SVGSVGElement>) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={26} height={31} fill="none" {...props}>
            <g clipPath="url(#a)">
                <path
                    fill={'#FF7F3E'} // Ubah warna di sini
                    fillRule="evenodd"
                    stroke={'#fff'}
                    strokeLinecap="square"
                    strokeWidth={2}
                    d="M21.993 14.425 2.549 2.935l4.444 23.108 4.653-10.002z"
                    clipRule="evenodd"
                />
            </g>
            <defs>
                <clipPath id="a">
                    <path fill={'#FF7F3E'} d="M0 0h26v31H0z" />
                </clipPath>
            </defs>
        </svg>
    );
};

export default function AboutSection() {
    return (
        <section className="relative mx-auto w-full max-w-7xl px-4 py-8">
            <div className="bg-primary absolute bottom-50 -left-25 h-[200px] w-[100px] rounded-full blur-3xl xl:bottom-20 xl:-left-42"></div>
            <div className="bg-secondary absolute top-25 -right-25 h-[200px] w-[100px] blur-3xl xl:top-0 xl:-right-42"></div>
            <div className="mx-auto text-center">
                <p className="text-primary mx-auto mb-6 font-medium md:text-xl">Kenapa Harus Belajar di Aksademy?</p>
                <h2 className="mx-auto mb-8 max-w-xl text-3xl leading-snug font-bold text-gray-900 italic md:text-4xl">
                    Solusi{' '}
                    <span className="bg-secondary text-background relative inline-flex items-center gap-2 rounded-full px-8 sm:px-10">
                        <img
                            src="/assets/images/icon-pen.svg"
                            alt="Icon Pensil"
                            className="absolute -top-3 left-3/5 h-12 w-12 -translate-x-1/2 sm:h-14 sm:w-14"
                            style={{ zIndex: 1 }}
                        />
                        <span className="invisible">_</span>
                    </span>{' '}
                    dirancang dengan cermat untuk <span className="bg-primary text-background rounded-full px-2">produktivitas</span> yang mudah
                </h2>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div>
                        <Cursor
                            attachToParent
                            variants={{
                                initial: { scale: 0.3, opacity: 0 },
                                animate: { scale: 1, opacity: 1 },
                                exit: { scale: 0.3, opacity: 0 },
                            }}
                            transition={{
                                ease: 'easeInOut',
                                duration: 0.15,
                            }}
                            className="top-4 left-12"
                        >
                            <div>
                                <MouseIcon className="h-6 w-6" />
                                <div className="bg-secondary mt-1 ml-4 rounded-[4px] px-2 py-0.5 text-neutral-50">Web Development</div>
                            </div>
                        </Cursor>
                        <Tilt rotationFactor={10} isRevese>
                            <Link
                                href="/"
                                className="hover:border-secondary relative flex h-[200px] w-full cursor-none flex-col items-center justify-center rounded-xl border-2 border-gray-300 p-4 shadow-lg backdrop-blur-md transition duration-200 ease-in dark:border-zinc-100/20 dark:bg-zinc-800/30"
                            >
                                <img src="/assets/images/icon-web-dev.png" alt="Web Development" className="mx-auto mb-4 h-12 sm:h-16" />
                                <h2 className="mb-1 text-lg font-semibold">Web Development</h2>
                                <p className="text-sm text-gray-600">Membangun aplikasi web yang responsif dan efisien</p>
                            </Link>
                        </Tilt>
                    </div>
                    <div>
                        <Cursor
                            attachToParent
                            variants={{
                                initial: { scale: 0.3, opacity: 0 },
                                animate: { scale: 1, opacity: 1 },
                                exit: { scale: 0.3, opacity: 0 },
                            }}
                            transition={{
                                ease: 'easeInOut',
                                duration: 0.15,
                            }}
                            className="top-4 left-12"
                        >
                            <div>
                                <MouseIcon className="h-6 w-6" />
                                <div className="bg-secondary mt-1 ml-4 rounded-[4px] px-2 py-0.5 text-neutral-50">Data Science</div>
                            </div>
                        </Cursor>
                        <Tilt rotationFactor={10} isRevese>
                            <Link
                                href="/"
                                className="hover:border-secondary relative flex h-[200px] w-full cursor-none flex-col items-center justify-center rounded-xl border-2 border-gray-300 p-4 shadow-lg backdrop-blur-md transition duration-200 ease-in dark:border-zinc-100/20 dark:bg-zinc-800/30"
                            >
                                <img src="/assets/images/icon-data-science.png" alt="Data Science" className="mx-auto mb-4 h-12 sm:h-16" />
                                <h2 className="mb-1 text-lg font-semibold">Data Science</h2>
                                <p className="text-sm text-gray-600">Menganalisis data untuk mendapatkan wawasan yang berharga</p>
                            </Link>
                        </Tilt>
                    </div>
                    <div>
                        <Cursor
                            attachToParent
                            variants={{
                                initial: { scale: 0.3, opacity: 0 },
                                animate: { scale: 1, opacity: 1 },
                                exit: { scale: 0.3, opacity: 0 },
                            }}
                            transition={{
                                ease: 'easeInOut',
                                duration: 0.15,
                            }}
                            className="top-4 left-12"
                        >
                            <div>
                                <MouseIcon className="h-6 w-6" />
                                <div className="bg-secondary mt-1 ml-4 rounded-[4px] px-2 py-0.5 text-neutral-50">Graphic Design</div>
                            </div>
                        </Cursor>

                        <Tilt rotationFactor={10} isRevese>
                            <Link
                                href="/"
                                className="hover:border-secondary relative flex h-[200px] w-full cursor-none flex-col items-center justify-center rounded-xl border-2 border-gray-300 p-4 shadow-lg backdrop-blur-md transition duration-200 ease-in dark:border-zinc-100/20 dark:bg-zinc-800/30"
                            >
                                <img src="/assets/images/icon-graphic-design.png" alt="Graphic Design" className="mx-auto mb-4 h-12 sm:h-16" />
                                <h2 className="mb-1 text-lg font-semibold text-gray-900">Graphic Design</h2>
                                <p className="text-sm text-gray-600">Mendesain antarmuka yang menarik dan fungsional</p>
                            </Link>
                        </Tilt>
                    </div>
                    <div>
                        <Cursor
                            attachToParent
                            variants={{
                                initial: { scale: 0.3, opacity: 0 },
                                animate: { scale: 1, opacity: 1 },
                                exit: { scale: 0.3, opacity: 0 },
                            }}
                            transition={{
                                ease: 'easeInOut',
                                duration: 0.15,
                            }}
                            className="top-4 left-12"
                        >
                            <div>
                                <MouseIcon className="h-6 w-6" />
                                <div className="bg-secondary mt-1 ml-4 rounded-[4px] px-2 py-0.5 text-neutral-50">Accounting</div>
                            </div>
                        </Cursor>
                        <Tilt rotationFactor={10} isRevese>
                            <Link
                                href="/"
                                className="hover:border-secondary relative flex h-[200px] w-full cursor-none flex-col items-center justify-center rounded-xl border-2 border-gray-300 p-4 shadow-lg backdrop-blur-md transition duration-200 ease-in dark:border-zinc-100/20 dark:bg-zinc-800/30"
                            >
                                <img src="/assets/images/icon-accountant.png" alt="Accounting" className="mx-auto mb-4 h-12 sm:h-16" />
                                <h2 className="mb-1 text-lg font-semibold text-gray-900">Accounting</h2>
                                <p className="text-sm text-gray-600">Membantu mengelola keuangan dan laporan keuangan</p>
                            </Link>
                        </Tilt>
                    </div>
                </div>
            </div>
        </section>
    );
}
