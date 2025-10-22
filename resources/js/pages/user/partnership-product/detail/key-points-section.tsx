interface PartnershipProduct {
    description?: string | null;
    key_points?: string | null;
}

export default function KeyPointsSection({ partnershipProduct }: { partnershipProduct: PartnershipProduct }) {
    return (
        <section className="mx-auto w-full max-w-5xl px-4 py-8">
            {partnershipProduct.description && (
                <div className="mb-8">
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Tentang Program
                    </p>
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{partnershipProduct.description}</p>
                    </div>
                </div>
            )}

            {partnershipProduct.key_points && (
                <div className="mt-8">
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Yang Akan Anda Dapatkan
                    </p>
                    <div
                        className="prose prose-lg dark:prose-invert max-w-none [&_ul]:space-y-3 [&_ul>li]:flex [&_ul>li]:items-start [&_ul>li]:gap-3 [&_ul>li]:before:mt-1.5 [&_ul>li]:before:flex-shrink-0 [&_ul>li]:before:content-[''] [&_ul>li::marker]:content-none"
                        dangerouslySetInnerHTML={{
                            __html: partnershipProduct.key_points.replace(
                                /<li>/g,
                                '<li><svg class="w-6 h-6 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
                            ),
                        }}
                    />
                </div>
            )}
        </section>
    );
}
