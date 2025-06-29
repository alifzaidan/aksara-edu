import { BadgeCheck } from 'lucide-react';

interface Webinar {
    benefits?: string | null;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function BenefitsSection({ webinar }: { webinar: Webinar }) {
    const benefitList = parseList(webinar.benefits);

    return (
        <section className="mx-auto w-full max-w-5xl px-4">
            <div className="mt-6 grid w-full grid-cols-1 items-center justify-end gap-6 md:grid-cols-2">
                <div>
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Manfaat yang Didapatkan
                    </p>
                    <ul className="space-y-2">
                        {benefitList.map((benefit, idx) => (
                            <li key={idx} className="flex gap-2">
                                <BadgeCheck className="mt-1 w-12 text-green-600" />
                                <div>
                                    <h4 className="text-lg font-semibold">{benefit}</h4>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
