import { usePage } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function useHasAnyPermission(permissions: string[]): boolean {
    const { auth } = usePage().props;
    const allPermissions = (auth as { permissions: Record<string, boolean> }).permissions;

    let hasPermission = false;

    permissions.forEach(function (item) {
        if (allPermissions[item]) hasPermission = true;
    });

    return hasPermission;
}

export const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

export const parseRupiah = (value: string) => {
    return Number(value.replace(/[^0-9,-]+/g, '').replace(',', '.'));
};

export function formatExternalUrl(url?: string | null): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function parseHtmlList(items?: string | null): string[] {
    if (!items) return [];

    const raw = String(items).trim();
    if (!raw) return [];

    const liMatches = raw.match(/<li[^>]*>[\s\S]*?<\/li>/gi);

    if (liMatches?.length) {
        return liMatches
            .map((li) =>
                li
                    .replace(/<li[^>]*>/gi, '')
                    .replace(/<\/li>/gi, '')
                    .replace(/<br\s*\/?\s*>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&nbsp;/gi, ' ')
                    .replace(/&amp;/gi, '&')
                    .replace(/&lt;/gi, '<')
                    .replace(/&gt;/gi, '>')
                    .replace(/&quot;/gi, '"')
                    .replace(/&#39;/gi, "'")
                    .trim(),
            )
            .filter(Boolean);
    }

    const normalized = raw
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\r\n?/g, '\n');

    return normalized
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/^[-*•–—\u2022]+\s+/, '').trim())
        .filter(Boolean);
}

export function decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ');
}

export function parseList(items?: string | null): string[] {
    if (!items) return [];

    const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    const list: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = liRegex.exec(items)) !== null) {
        let text = match[1]
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\u00A0/g, ' ');
        text = decodeHtmlEntities(text).trim();
        text = text.replace(/^[-*•–—\u2022]+\s+/, '').trim();
        if (text) {
            list.push(text);
        }
    }

    if (list.length > 0) {
        return list;
    }

    const cleanText = items
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?(p|div|tr|h[1-6])\b[^>]*>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ');

    const decoded = decodeHtmlEntities(cleanText);

    return decoded
        .split(/\r?\n/)
        .map((s) => s.replace(/^[-*•–—\u2022]+\s+/, '').trim())
        .filter((s) => s.length > 0);
}
