import { BadgeCheck } from 'lucide-react';

interface Bootcamp {
    benefits?: string | null;
    requirements?: string | null;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];

    const raw = String(items).trim();
    if (!raw) return [];

    const liMatches = raw.match(/<li[^>]*>[\s\S]*?<\/li>/gi);
    const normalized = raw
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\r\n?/g, '\n');

    const lines = normalized
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/^[-*•–—\u2022]+\s+/, '').trim())
        .filter(Boolean);

    // Kalau ada <li>, pakai itu sebagai sumber list
    if (liMatches?.length) {
        return liMatches
            .map((li) =>
                li
                    .replace(/<li[^>]*>/gi, '')
                    .replace(/<\/li>/gi, '')
                    .replace(/<br\s*\/?\s*>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                    .trim(),
            )
            .filter(Boolean);
    }

    return lines;
}

export default function RequirementSection({ bootcamp }: { bootcamp: Bootcamp }) {
    const requirementList = parseList(bootcamp.requirements);
    const benefitList = parseList(bootcamp.benefits);

    return (
        <section className="mx-auto w-full max-w-5xl px-4">
            <div className="mt-6 grid w-full grid-cols-1 items-center justify-end gap-6 md:grid-cols-2">
                <div>
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Persyaratan Peserta
                    </p>
                    <ul className="space-y-2">
                        {requirementList.map((req, idx) => (
                            <li key={idx} className="flex gap-2">
                                <BadgeCheck className="mt-1 min-w-12 text-green-600" />
                                <div>
                                    <h4 className="text-lg font-semibold">{req}</h4>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Manfaat yang Didapatkan
                    </p>
                    <ul className="space-y-2">
                        {benefitList.map((benefit, idx) => (
                            <li key={idx} className="flex gap-2">
                                <BadgeCheck className="mt-1 min-w-12 text-green-600" />
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
