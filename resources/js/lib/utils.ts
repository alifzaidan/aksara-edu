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
