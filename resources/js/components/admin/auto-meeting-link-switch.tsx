import { Switch } from '@/components/ui/switch';
import { router } from '@inertiajs/react';
import { useState } from 'react';

interface AutoMeetingLinkSwitchProps {
    /** URL POST sakelar, mis. route('bootcamps.auto-meeting-link', id) */
    action: string;
    enabled: boolean;
    disabled?: boolean;
}

/**
 * Sakelar "Link Zoom otomatis" per produk. Nyala = agent Aska membuat meeting
 * di akun Zoom perusahaan untuk setiap sesi yang belum punya link. Matikan
 * untuk kelas yang memakai akun Zoom pinjaman (link diisi manual).
 */
export default function AutoMeetingLinkSwitch({ action, enabled, disabled }: AutoMeetingLinkSwitchProps) {
    const [saving, setSaving] = useState(false);

    const toggle = (value: boolean) => {
        setSaving(true);
        router.post(action, { enabled: value }, { preserveScroll: true, onFinish: () => setSaving(false) });
    };

    return (
        <div className="flex items-start gap-3">
            <Switch id="auto-meeting-link" checked={enabled} onCheckedChange={toggle} disabled={disabled || saving} />
            <div className="space-y-0.5">
                <label htmlFor="auto-meeting-link" className="text-sm font-medium">
                    {enabled ? 'Aktif' : 'Tidak aktif'}
                </label>
                <p className="text-muted-foreground text-xs text-wrap">
                    Link Zoom dibuat otomatis pukul 16:30 untuk sesi 7 hari ke depan yang belum punya link.
                </p>
            </div>
        </div>
    );
}
