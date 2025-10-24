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
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: partnershipProduct.key_points }} />
                </div>
            )}
        </section>
    );
}
