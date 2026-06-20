import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookOpen, Building2, Eye, FileText, GraduationCap, Hash, Mail, Phone, User, X, ZoomIn } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useState } from 'react';

// ─── Regular Application ──────────────────────────────────────────────────────

interface RegularApplication {
    id: string;
    user?: { id: string; name: string; email: string; phone_number?: string };
    name?: string;
    email?: string;
    phone?: string;
    document_attachment?: string | null;
    notes?: string | null;
    status: string;
    created_at: string;
}

// ─── Scholarship Application ──────────────────────────────────────────────────

interface ScholarshipApplication {
    id: string;
    name: string;
    email: string;
    phone: string;
    university: string;
    major: string;
    semester: number | string;
    nim: string;
    ktm_photo?: string | null;
    transcript_photo?: string | null;
    instagram_follow_photo?: string | null;
    tiktok_follow_photo?: string | null;
    comment_tag_photo?: string | null;
    status: string;
    created_at: string;
}

type Application = RegularApplication | ScholarshipApplication;

interface CertificationProgramApplicationsProps {
    applications: Application[];
    programType: 'regular' | 'scholarship';
    programId: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
    approved: { label: 'Disetujui', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    paid: { label: 'Lunas', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
};

// ─── Custom Modal Portal ──────────────────────────────────────────────────────
// Sepenuhnya custom, tidak pakai Shadcn Dialog agar kita kontrol penuh

interface CustomModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
}

function CustomModal({ open, onClose, children, maxWidth = 'max-w-lg' }: CustomModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onMouseDown={(e) => {
                // Tutup modal hanya jika klik langsung di overlay (bukan anak)
                if (e.target === overlayRef.current) onClose();
            }}
        >
            <div
                className={`relative w-full ${maxWidth} rounded-xl bg-white shadow-2xl dark:bg-zinc-900`}
                onMouseDown={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body,
    );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
            onMouseDown={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            <button
                className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/25 transition-colors"
                onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
            >
                <X className="h-5 w-5" />
            </button>
            <img
                src={src}
                alt={alt}
                className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
                onMouseDown={(e) => e.stopPropagation()}
            />
        </div>,
        document.body,
    );
}

// ─── Document Card ────────────────────────────────────────────────────────────

function DocumentCard({ label, path, onZoom }: { label: string; path: string | null | undefined; onZoom: (src: string, alt: string) => void }) {
    if (!path) {
        return (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
                <FileText className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                <p className="text-center text-xs text-gray-400 dark:text-zinc-500">{label}</p>
                <span className="text-xs text-gray-300 dark:text-zinc-600">Tidak ada</span>
            </div>
        );
    }

    const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(path);
    const fullUrl = path.startsWith('http') ? path : `/storage/${path}`;

    if (isImage) {
        return (
            <div className="group relative flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                <div className="relative overflow-hidden rounded-md">
                    <img
                        src={fullUrl}
                        alt={label}
                        className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <button
                        onMouseDown={(e) => { e.stopPropagation(); onZoom(fullUrl, label); }}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100"
                    >
                        <ZoomIn className="h-6 w-6 text-white" />
                    </button>
                </div>
                <p className="text-center text-xs font-medium text-gray-600 dark:text-zinc-400">{label}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <FileText className="h-8 w-8 text-blue-500" />
            <p className="text-center text-xs font-medium text-gray-600 dark:text-zinc-400">{label}</p>
            <a
                href={fullUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
            >
                Buka Dokumen
            </a>
        </div>
    );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number | null | undefined }) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-700">
                <Icon className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 dark:text-zinc-500">{label}</p>
                <p className="truncate text-sm font-medium text-gray-800 dark:text-zinc-200">{value ?? '-'}</p>
            </div>
        </div>
    );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({
    open,
    actionType,
    appName,
    onCancel,
    onConfirm,
}: {
    open: boolean;
    actionType: 'approve' | 'reject' | null;
    appName: string;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <CustomModal open={open} onClose={onCancel} maxWidth="max-w-sm">
            <div className="p-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
                    {actionType === 'approve' ? 'Konfirmasi Terima Peserta' : 'Konfirmasi Tolak Peserta'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-zinc-400">
                    Anda yakin ingin {actionType === 'approve' ? 'menerima' : 'menolak'} <strong>{appName}</strong>?
                    {actionType === 'approve' && ' Pesan WA akan dikirim otomatis.'}
                </p>
                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={onCancel}>Batal</Button>
                    <Button
                        onClick={onConfirm}
                        className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                        variant={actionType === 'reject' ? 'destructive' : 'default'}
                    >
                        Ya, {actionType === 'approve' ? 'Terima' : 'Tolak'}
                    </Button>
                </div>
            </div>
        </CustomModal>
    );
}

// ─── Detail Modal: Regular ────────────────────────────────────────────────────

function RegularDetailModal({
    app,
    open,
    onClose,
    programId,
}: {
    app: RegularApplication | null;
    open: boolean;
    onClose: () => void;
    programId: string;
}) {
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxAlt, setLightboxAlt] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

    // Reset state saat modal ditutup
    useEffect(() => {
        if (!open) {
            setLightboxSrc(null);
            setConfirmOpen(false);
            setActionType(null);
        }
    }, [open]);

    if (!app) return null;

    const name = app.user?.name ?? app.name ?? '-';
    const email = app.user?.email ?? app.email ?? '-';
    const phone = app.user?.phone_number ?? app.phone ?? '-';
    const statusInfo = statusMap[app.status] ?? { label: app.status, color: 'bg-gray-200 text-gray-800' };

    const handleAction = (type: 'approve' | 'reject') => {
        setActionType(type);
        setConfirmOpen(true);
    };

    const submitAction = () => {
        if (!actionType) return;
        const routeName =
            actionType === 'approve'
                ? route('certification-programs.applications.approve', { program: programId, application: app.id })
                : route('certification-programs.applications.reject', { program: programId, application: app.id });

        router.post(routeName, {}, {
            preserveScroll: true,
            onSuccess: () => { setConfirmOpen(false); onClose(); },
            onError: () => { setConfirmOpen(false); },
        });
    };

    return (
        <>
            {/* Lightbox — independen dari modal utama */}
            {lightboxSrc && (
                <ImageLightbox src={lightboxSrc} alt={lightboxAlt} onClose={() => setLightboxSrc(null)} />
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                open={confirmOpen}
                actionType={actionType}
                appName={name}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={submitAction}
            />

            {/* Main Detail Modal */}
            <CustomModal open={open} onClose={onClose} maxWidth="max-w-lg">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-700">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg shadow">
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold truncate text-gray-900 dark:text-zinc-100">{name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`border-0 text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                            <span className="text-xs text-gray-400">
                                {format(new Date(app.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                            </span>
                        </div>
                    </div>
                    <button
                        className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-700"
                        onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[60vh] overflow-y-auto">
                    <div className="px-6 py-4 space-y-5">
                        {/* Personal Info */}
                        <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                                Informasi Pendaftar
                            </h4>
                            <div className="space-y-3">
                                <InfoRow icon={User} label="Nama" value={name} />
                                <InfoRow icon={Mail} label="Email" value={email} />
                                <InfoRow icon={Phone} label="No. Telepon" value={phone} />
                            </div>
                        </div>

                        <Separator />

                        {/* Document */}
                        <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                                Dokumen Pendukung
                            </h4>
                            <DocumentCard
                                label="Bukti Dokumen"
                                path={app.document_attachment}
                                onZoom={(src, alt) => { setLightboxSrc(src); setLightboxAlt(alt); }}
                            />
                        </div>

                        {app.notes && (
                            <>
                                <Separator />
                                <div>
                                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                                        Catatan
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-zinc-300 rounded-lg bg-gray-50 dark:bg-zinc-800 p-3">
                                        {app.notes}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-6 py-4 border-t border-gray-100 dark:border-zinc-700">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Tutup
                    </Button>
                    {app.status === 'pending' && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => handleAction('reject')}
                                className="flex-1"
                            >
                                Tolak
                            </Button>
                            <Button
                                onClick={() => handleAction('approve')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                Terima
                            </Button>
                        </>
                    )}
                </div>
            </CustomModal>
        </>
    );
}

// ─── Detail Modal: Scholarship ────────────────────────────────────────────────

function ScholarshipDetailModal({
    app,
    open,
    onClose,
    programId,
}: {
    app: ScholarshipApplication | null;
    open: boolean;
    onClose: () => void;
    programId: string;
}) {
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [lightboxAlt, setLightboxAlt] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

    // Reset state saat modal ditutup
    useEffect(() => {
        if (!open) {
            setLightboxSrc(null);
            setConfirmOpen(false);
            setActionType(null);
        }
    }, [open]);

    if (!app) return null;

    const statusInfo = statusMap[app.status] ?? { label: app.status, color: 'bg-gray-200 text-gray-800' };

    const handleAction = (type: 'approve' | 'reject') => {
        setActionType(type);
        setConfirmOpen(true);
    };

    const submitAction = () => {
        if (!actionType) return;
        const routeName =
            actionType === 'approve'
                ? route('certification-programs.scholarship-applications.approve', { program: programId, application: app.id })
                : route('certification-programs.scholarship-applications.reject', { program: programId, application: app.id });

        router.post(routeName, {}, {
            preserveScroll: true,
            onSuccess: () => { setConfirmOpen(false); onClose(); },
            onError: () => { setConfirmOpen(false); },
        });
    };

    const photos = [
        { label: 'Foto KTM', path: app.ktm_photo },
        { label: 'Transkrip Nilai', path: app.transcript_photo },
        { label: 'Follow Instagram', path: app.instagram_follow_photo },
        { label: 'Follow TikTok', path: app.tiktok_follow_photo },
        { label: 'Komentar & Tag', path: app.comment_tag_photo },
    ];

    return (
        <>
            {/* Lightbox — independen dari modal utama */}
            {lightboxSrc && (
                <ImageLightbox src={lightboxSrc} alt={lightboxAlt} onClose={() => setLightboxSrc(null)} />
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                open={confirmOpen}
                actionType={actionType}
                appName={app.name}
                onCancel={() => setConfirmOpen(false)}
                onConfirm={submitAction}
            />

            {/* Main Detail Modal */}
            <CustomModal open={open} onClose={onClose} maxWidth="max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-gray-100 dark:border-zinc-700">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold text-lg shadow">
                        {app.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold truncate text-gray-900 dark:text-zinc-100">{app.name}</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`border-0 text-xs ${statusInfo.color}`}>{statusInfo.label}</Badge>
                            <span className="text-xs text-gray-400">Beasiswa</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-400">
                                {format(new Date(app.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                            </span>
                        </div>
                    </div>
                    <button
                        className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-zinc-700"
                        onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="max-h-[65vh] overflow-y-auto">
                    <div className="px-6 py-4 space-y-5">
                        {/* Personal Info */}
                        <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                                Informasi Pribadi
                            </h4>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <InfoRow icon={User} label="Nama Lengkap" value={app.name} />
                                <InfoRow icon={Mail} label="Email" value={app.email} />
                                <InfoRow icon={Phone} label="No. Telepon" value={app.phone} />
                            </div>
                        </div>

                        <Separator />

                        {/* Academic Info */}
                        <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                                Informasi Akademik
                            </h4>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <InfoRow icon={Building2} label="Universitas" value={app.university} />
                                <InfoRow icon={BookOpen} label="Program Studi" value={app.major} />
                                <InfoRow icon={GraduationCap} label="Semester" value={`Semester ${app.semester}`} />
                                <InfoRow icon={Hash} label="NIM" value={app.nim} />
                            </div>
                        </div>

                        <Separator />

                        {/* Documents */}
                        <div>
                            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                                Dokumen yang Diupload
                            </h4>
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                {photos.map(({ label, path }) => (
                                    <DocumentCard
                                        key={label}
                                        label={label}
                                        path={path}
                                        onZoom={(src, alt) => { setLightboxSrc(src); setLightboxAlt(alt); }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 px-6 py-4 border-t border-gray-100 dark:border-zinc-700">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Tutup
                    </Button>
                    {app.status === 'pending' && (
                        <>
                            <Button
                                variant="destructive"
                                onClick={() => handleAction('reject')}
                                className="flex-1"
                            >
                                Tolak
                            </Button>
                            <Button
                                onClick={() => handleAction('approve')}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                Terima
                            </Button>
                        </>
                    )}
                </div>
            </CustomModal>
        </>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CertificationProgramApplications({ applications, programType, programId }: CertificationProgramApplicationsProps) {
    const label = programType === 'scholarship' ? 'Pendaftar Beasiswa' : 'Pendaftar Program';
    const approvedCount = applications.filter((a) => a.status === 'approved').length;

    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    const openDetail = (app: Application) => {
        setSelectedApp(app);
        setDetailOpen(true);
    };

    const closeDetail = () => {
        setDetailOpen(false);
        setTimeout(() => setSelectedApp(null), 300);
    };

    return (
        <div className="h-full space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">{label}</h2>
                {applications.length > 0 && (
                    <div className="text-muted-foreground text-sm">
                        Disetujui:{' '}
                        <span className="text-foreground font-semibold">
                            {approvedCount}/{applications.length}
                        </span>
                    </div>
                )}
            </div>

            {applications.length > 0 ? (
                <div className="space-y-3">
                    {applications.map((app) => {
                        const isScholarship = programType === 'scholarship';
                        const scholarshipApp = app as ScholarshipApplication;
                        const regularApp = app as RegularApplication;

                        const name = isScholarship ? scholarshipApp.name : (regularApp.user?.name ?? regularApp.name ?? '-');
                        const email = isScholarship ? scholarshipApp.email : (regularApp.user?.email ?? regularApp.email ?? '-');
                        const phone = isScholarship ? scholarshipApp.phone : (regularApp.user?.phone_number ?? regularApp.phone ?? '-');
                        const statusInfo = statusMap[app.status] ?? { label: app.status, color: 'bg-gray-200 text-gray-800' };

                        // Count uploaded docs for scholarship
                        const docCount = isScholarship
                            ? [scholarshipApp.ktm_photo, scholarshipApp.transcript_photo, scholarshipApp.instagram_follow_photo, scholarshipApp.tiktok_follow_photo, scholarshipApp.comment_tag_photo].filter(Boolean).length
                            : null;

                        return (
                            <div key={app.id} className="flex items-start justify-between rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="font-medium truncate">{name}</div>
                                    <div className="text-muted-foreground text-sm truncate">{email}</div>
                                    {phone !== '-' && <div className="text-muted-foreground text-sm">{phone}</div>}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="text-muted-foreground text-xs">
                                            Daftar: {format(new Date(app.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                        </div>
                                        {isScholarship && docCount !== null && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                <FileText className="h-3 w-3" />
                                                {docCount}/5 dokumen
                                            </span>
                                        )}
                                        {!isScholarship && regularApp.document_attachment && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                                <FileText className="h-3 w-3" />
                                                Ada dokumen
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                    <Badge className={`border-0 ${statusInfo.color}`}>{statusInfo.label}</Badge>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 gap-1.5 text-xs"
                                        onClick={() => openDetail(app)}
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        Detail
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Tidak ada pendaftar" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada pendaftar untuk program ini.</p>
                </div>
            )}

            {/* Detail Modals */}
            {programType === 'regular' ? (
                <RegularDetailModal
                    app={selectedApp as RegularApplication | null}
                    open={detailOpen}
                    onClose={closeDetail}
                    programId={programId}
                />
            ) : (
                <ScholarshipDetailModal
                    app={selectedApp as ScholarshipApplication | null}
                    open={detailOpen}
                    onClose={closeDetail}
                    programId={programId}
                />
            )}
        </div>
    );
}
