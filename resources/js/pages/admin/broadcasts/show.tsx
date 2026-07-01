import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle, ArrowLeft, BookText, Calendar as CalendarIcon, ExternalLink,
    Filter, Loader2, MonitorPlay, Presentation, Send, Tags, Users, Award,
    Edit,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Broadcast {
    id: string;
    title: string;
    message: string;
    total_sent: number;
    last_sent_at: string | null;
}

interface Category { id: string; name: string; }

interface FilteredUser {
    no: number; id: string; name: string;
    phone_number: string; formatted_phone: string; wa_link: string | null;
}

interface Program { id: string; title: string; }

interface Props {
    broadcast: Broadcast;
    categories: Category[];
    courses: Program[];
    bootcamps: Program[];
    webinars: Program[];
    certifications: Program[];
    flash?: { success?: string; error?: string };
}

const programOpts = [
    { value: 'course', label: 'Kelas Online', icon: BookText, color: 'text-blue-600' },
    { value: 'bootcamp', label: 'Bootcamp', icon: Presentation, color: 'text-green-600' },
    { value: 'webinar', label: 'Webinar', icon: MonitorPlay, color: 'text-purple-600' },
    { value: 'certification', label: 'Sertifikasi', icon: Award, color: 'text-amber-600' },
];

const htmlToWhatsapp = (html: string): string => {
    if (!html) return '';

    if (typeof document === 'undefined') {
        let text = html;
        text = text.replace(/<(strong|b)>(.*?)<\/\1>/gi, '*$2*');
        text = text.replace(/<(em|i)>(.*?)<\/\1>/gi, '_$2_');
        text = text.replace(/<(s|strike|del)>(.*?)<\/\1>/gi, '~$2~');
        text = text.replace(/<br\s*\/?>/gi, '\n');
        text = text.replace(/<\/p>|<\/div>|<\/li>/gi, '\n');
        text = text.replace(/<[^>]+>/g, '');
        text = text.replace(/&nbsp;/gi, ' ');
        text = text.replace(/\u00a0/g, ' ');
        return text.trim();
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const parseNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();

            let childrenText = '';
            for (let i = 0; i < el.childNodes.length; i++) {
                childrenText += parseNode(el.childNodes[i]);
            }

            switch (tagName) {
                case 'p':
                case 'div':
                    return childrenText ? childrenText.trim() + '\n' : '\n';
                case 'br':
                    return '\n';
                case 'strong':
                case 'b':
                    const boldVal = childrenText.trim();
                    return boldVal ? `*${boldVal}*` : childrenText;
                case 'em':
                case 'i':
                    const italicVal = childrenText.trim();
                    return italicVal ? `_${italicVal}_` : childrenText;
                case 's':
                case 'strike':
                case 'del':
                    const strikeVal = childrenText.trim();
                    return strikeVal ? `~${strikeVal}~` : childrenText;
                case 'li':
                    const trimmedChild = childrenText.trim();
                    const startsWithListIndicator = /^[0-9]+[\.\)]|^[•\-\*\d]|^\u00a0|^\s/.test(trimmedChild);
                    if (startsWithListIndicator || trimmedChild.startsWith('•')) {
                        return childrenText ? trimmedChild + '\n' : '\n';
                    }
                    return childrenText ? `• ${trimmedChild}\n` : '\n';
                case 'ul':
                case 'ol':
                    return childrenText ? childrenText.trim() + '\n' : '';
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    return childrenText.trim() ? `*${childrenText.trim()}*\n` : '\n';
                default:
                    return childrenText;
            }
        }
        return '';
    };

    let text = parseNode(tempDiv);
    
    text = text.replace(/\u00a0/g, ' ');
    
    text = text.replace(/&nbsp;/gi, ' ');
    
    text = text.replace(/ {2,}/g, ' ');
    
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
};

export default function ShowBroadcast({ broadcast, categories, courses, bootcamps, webinars, certifications, flash }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Pengguna', href: '/admin/users' },
        { title: 'Broadcast', href: '/admin/broadcasts' },
        { title: broadcast.title, href: `/admin/broadcasts/${broadcast.id}` },
    ];

    const [selPrograms, setSelPrograms] = useState<string[]>([]);
    const [selSpecificCourses, setSelSpecificCourses] = useState<string[]>([]);
    const [selSpecificBootcamps, setSelSpecificBootcamps] = useState<string[]>([]);
    const [selSpecificWebinars, setSelSpecificWebinars] = useState<string[]>([]);
    const [selSpecificCertifications, setSelSpecificCertifications] = useState<string[]>([]);
    const [selCategories, setSelCategories] = useState<string[]>([]);
    const [purchaseRange, setPurchaseRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({ from: undefined, to: undefined });
    const [joinRange, setJoinRange] = useState<{ from: Date | undefined; to?: Date | undefined }>({ from: undefined, to: undefined });
    const [fromIdx, setFromIdx] = useState(1);
    const [toIdx, setToIdx] = useState(50);
    const [users, setUsers] = useState<FilteredUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sendingSingle, setSendingSingle] = useState<string | null>(null);

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const buildFilters = useCallback(() => {
        const f: Record<string, any> = {};
        if (selPrograms.length) f.program_types = selPrograms;
        if (selSpecificCourses.length) f.specific_courses = selSpecificCourses;
        if (selSpecificBootcamps.length) f.specific_bootcamps = selSpecificBootcamps;
        if (selSpecificWebinars.length) f.specific_webinars = selSpecificWebinars;
        if (selSpecificCertifications.length) f.specific_certifications = selSpecificCertifications;
        if (selCategories.length) f.categories = selCategories;
        if (purchaseRange?.from) {
            const date = purchaseRange.from;
            f.purchase_date_from = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        if (purchaseRange?.to) {
            const date = purchaseRange.to;
            f.purchase_date_to = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        if (joinRange?.from) {
            const date = joinRange.from;
            f.joined_date_from = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        if (joinRange?.to) {
            const date = joinRange.to;
            f.joined_date_to = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        return f;
    }, [selPrograms, selSpecificCourses, selSpecificBootcamps, selSpecificWebinars, selSpecificCertifications, selCategories, purchaseRange, joinRange]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.post(route('broadcasts.filtered-users', broadcast.id), { filters: buildFilters() });
            setUsers(res.data.users);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [buildFilters, broadcast.id]);

    // Auto-load users on mount
    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetFilters = async () => {
        setSelPrograms([]);
        setSelSpecificCourses([]);
        setSelSpecificBootcamps([]);
        setSelSpecificWebinars([]);
        setSelSpecificCertifications([]);
        setSelCategories([]);
        setPurchaseRange({ from: undefined, to: undefined });
        setJoinRange({ from: undefined, to: undefined });
        // Fetch with empty filters directly (state hasn't updated yet)
        setLoading(true);
        try {
            const res = await axios.post(route('broadcasts.filtered-users', broadcast.id), { filters: {} });
            setUsers(res.data.users);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const handleSend = () => {
        setSending(true);
        const plainMsg = htmlToWhatsapp(broadcast.message);
        router.post(route('broadcasts.send', broadcast.id), {
            message: plainMsg,
            from: fromIdx, to: toIdx,
            filters: buildFilters(),
            broadcast_id: broadcast.id,
        }, {
            onFinish: () => setSending(false),
        });
    };

    const openManualWa = (user: FilteredUser) => {
        const plain = htmlToWhatsapp(broadcast.message);
        const msg = encodeURIComponent(plain.replace('{nama}', user.name));
        window.open(`https://api.whatsapp.com/send?phone=${user.formatted_phone}&text=${msg}`, '_blank');
    };

    const sendSingleWablas = (user: FilteredUser) => {
        setSendingSingle(user.id);
        const plainMsg = htmlToWhatsapp(broadcast.message);
        router.post(route('broadcasts.send-single', broadcast.id), {
            user_id: user.id,
            message: plainMsg,
        }, {
            onFinish: () => setSendingSingle(null),
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={broadcast.title} />
            <div className="px-4 py-4 md:px-6">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold">{broadcast.title}</h1>
                            <p className="text-muted-foreground text-sm">
                                Total terkirim: <span className="font-medium">{broadcast.total_sent}</span>
                            </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('broadcasts.edit', broadcast.id)}><Edit className="mr-1 h-4 w-4" /> Edit Konten</Link>
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="sticky top-20 space-y-4">
                        <div className="rounded-lg border p-4">
                            <h3 className="mb-3 text-sm font-semibold text-gray-500">PREVIEW PESAN</h3>
                            <div
                                className="prose prose-sm dark:prose-invert max-w-none rounded-lg bg-green-50 p-4 dark:bg-green-950/20"
                                dangerouslySetInnerHTML={{ __html: broadcast.message.replace('{nama}', '<strong>Ahmad Faiz</strong>') }}
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="rounded-lg border p-4 space-y-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold">
                            <Filter className="h-4 w-4" /> Filter Penerima
                        </h3>

                        {/* Program types */}
                        <div className="space-y-2">
                            <Label className="text-sm">Tipe Program yang Pernah Dibeli</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {programOpts.map((o) => (
                                    <label key={o.value} className={`flex cursor-pointer items-center gap-1.5 rounded-lg border p-2.5 text-xs transition ${selPrograms.includes(o.value) ? 'border-green-500 bg-green-50 dark:border-green-700 dark:bg-green-950/20' : 'hover:bg-muted/50'}`}>
                                        <Checkbox
                                            checked={selPrograms.includes(o.value)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelPrograms(p => [...p, o.value]);
                                                } else {
                                                    setSelPrograms(p => p.filter(v => v !== o.value));
                                                    if (o.value === 'course') setSelSpecificCourses([]);
                                                    if (o.value === 'bootcamp') setSelSpecificBootcamps([]);
                                                    if (o.value === 'webinar') setSelSpecificWebinars([]);
                                                    if (o.value === 'certification') setSelSpecificCertifications([]);
                                                }
                                            }}
                                        />
                                        <o.icon className={`h-3.5 w-3.5 ${o.color}`} /> {o.label}
                                    </label>
                                ))}
                            </div>

                            {/* Specific Programs (Dynamic based on selected program types) */}
                            {selPrograms.length > 0 && (
                                <div className="space-y-3 pt-3 border-t mt-3">
                                    {selPrograms.includes('course') && courses.length > 0 && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-xs text-muted-foreground flex items-center justify-between">
                                                <span>Pilih Kelas Spesifik (Opsional)</span>
                                                {selSpecificCourses.length > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-1.5 py-0.5 rounded">{selSpecificCourses.length} dipilih</span>}
                                            </Label>
                                            <div className="max-h-[140px] overflow-y-auto rounded-md border p-1 bg-background shadow-sm">
                                                {courses.map(c => (
                                                    <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition ${selSpecificCourses.includes(c.id) ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-muted/50'}`}>
                                                        <Checkbox checked={selSpecificCourses.includes(c.id)} onCheckedChange={(checked) => setSelSpecificCourses(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} className="h-3.5 w-3.5" />
                                                        <span className="truncate flex-1">{c.title}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selPrograms.includes('bootcamp') && bootcamps.length > 0 && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-xs text-muted-foreground flex items-center justify-between">
                                                <span>Pilih Bootcamp Spesifik (Opsional)</span>
                                                {selSpecificBootcamps.length > 0 && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">{selSpecificBootcamps.length} dipilih</span>}
                                            </Label>
                                            <div className="max-h-[140px] overflow-y-auto rounded-md border p-1 bg-background shadow-sm">
                                                {bootcamps.map(c => (
                                                    <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition ${selSpecificBootcamps.includes(c.id) ? 'bg-green-50/50 dark:bg-green-950/20' : 'hover:bg-muted/50'}`}>
                                                        <Checkbox checked={selSpecificBootcamps.includes(c.id)} onCheckedChange={(checked) => setSelSpecificBootcamps(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} className="h-3.5 w-3.5" />
                                                        <span className="truncate flex-1">{c.title}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selPrograms.includes('webinar') && webinars.length > 0 && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-xs text-muted-foreground flex items-center justify-between">
                                                <span>Pilih Webinar Spesifik (Opsional)</span>
                                                {selSpecificWebinars.length > 0 && <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-1.5 py-0.5 rounded">{selSpecificWebinars.length} dipilih</span>}
                                            </Label>
                                            <div className="max-h-[140px] overflow-y-auto rounded-md border p-1 bg-background shadow-sm">
                                                {webinars.map(c => (
                                                    <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition ${selSpecificWebinars.includes(c.id) ? 'bg-purple-50/50 dark:bg-purple-950/20' : 'hover:bg-muted/50'}`}>
                                                        <Checkbox checked={selSpecificWebinars.includes(c.id)} onCheckedChange={(checked) => setSelSpecificWebinars(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} className="h-3.5 w-3.5" />
                                                        <span className="truncate flex-1">{c.title}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {selPrograms.includes('certification') && certifications.length > 0 && (
                                        <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-xs text-muted-foreground flex items-center justify-between">
                                                <span>Pilih Sertifikasi Spesifik (Opsional)</span>
                                                {selSpecificCertifications.length > 0 && <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">{selSpecificCertifications.length} dipilih</span>}
                                            </Label>
                                            <div className="max-h-[140px] overflow-y-auto rounded-md border p-1 bg-background shadow-sm">
                                                {certifications.map(c => (
                                                    <label key={c.id} className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition ${selSpecificCertifications.includes(c.id) ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-muted/50'}`}>
                                                        <Checkbox checked={selSpecificCertifications.includes(c.id)} onCheckedChange={(checked) => setSelSpecificCertifications(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} className="h-3.5 w-3.5" />
                                                        <span className="truncate flex-1">{c.title}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Categories */}
                        {categories.length > 0 && (
                            <div className="space-y-2">
                                <Label className="flex items-center gap-1.5 text-sm"><Tags className="h-3 w-3" /> Kategori</Label>
                                <div className="flex max-h-[80px] flex-wrap gap-1 overflow-y-auto">
                                    {categories.map((c) => (
                                        <Badge key={c.id} variant={selCategories.includes(c.name) ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setSelCategories((p) => p.includes(c.name) ? p.filter((v) => v !== c.name) : [...p, c.name])}>
                                            {c.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Date filters */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="flex items-center gap-1 text-sm"><CalendarIcon className="h-2.5 w-2.5" /> Rentang Tanggal Pembelian</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-8 text-xs px-2.5",
                                                !purchaseRange.from && "text-muted-foreground"
                                            )}
                                        >
                                            {purchaseRange.from ? (
                                                purchaseRange.to ? (
                                                    <>
                                                        {format(purchaseRange.from, "dd MMM yyyy", { locale: idLocale })} -{" "}
                                                        {format(purchaseRange.to, "dd MMM yyyy", { locale: idLocale })}
                                                    </>
                                                ) : (
                                                    format(purchaseRange.from, "dd MMM yyyy", { locale: idLocale })
                                                )
                                            ) : (
                                                <span>Pilih rentang tanggal beli</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                            mode="range"
                                            captionLayout="dropdown"
                                            startMonth={new Date(2020, 0)}
                                            endMonth={new Date(new Date().getFullYear() + 5, 11)}
                                            selected={purchaseRange}
                                            onSelect={(range) => setPurchaseRange(range || { from: undefined, to: undefined })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-1">
                                <Label className="flex items-center gap-1 text-sm"><CalendarIcon className="h-2.5 w-2.5" /> Rentang Tanggal Bergabung</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal h-8 text-xs px-2.5",
                                                !joinRange.from && "text-muted-foreground"
                                            )}
                                        >
                                            {joinRange.from ? (
                                                joinRange.to ? (
                                                    <>
                                                        {format(joinRange.from, "dd MMM yyyy", { locale: idLocale })} -{" "}
                                                        {format(joinRange.to, "dd MMM yyyy", { locale: idLocale })}
                                                    </>
                                                ) : (
                                                    format(joinRange.from, "dd MMM yyyy", { locale: idLocale })
                                                )
                                            ) : (
                                                <span>Pilih rentang tanggal gabung</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                            mode="range"
                                            captionLayout="dropdown"
                                            startMonth={new Date(2020, 0)}
                                            endMonth={new Date(new Date().getFullYear() + 5, 11)}
                                            selected={joinRange}
                                            onSelect={(range) => setJoinRange(range || { from: undefined, to: undefined })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={fetchUsers} disabled={loading} className="flex-1">
                                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Memuat...</> : <><Filter className="mr-1 h-4 w-4" /> Terapkan Filter</>}
                            </Button>
                            <Button variant="outline" onClick={resetFilters} disabled={loading}>
                                Reset
                            </Button>
                        </div>
                    </div>

                    {/* Users table */}
                    {(
                        <div className="rounded-lg border p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <Users className="h-4 w-4" /> Daftar Penerima ({users.length} pengguna)
                                </h3>
                            </div>

                            {/* Batch range */}
                            <div className="flex items-end gap-3">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Kirim dari no.</Label>
                                    <Input type="number" min={1} max={users.length} value={fromIdx} onChange={(e) => setFromIdx(Math.max(1, parseInt(e.target.value) || 1))} className="h-8 text-sm" />
                                </div>
                                <span className="text-muted-foreground pb-1.5 text-sm">—</span>
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Sampai no.</Label>
                                    <Input type="number" min={fromIdx} max={users.length} value={toIdx} onChange={(e) => setToIdx(Math.max(fromIdx, parseInt(e.target.value) || fromIdx))} className="h-8 text-sm" />
                                </div>
                                <Button onClick={handleSend} disabled={sending || users.length === 0} size="sm" className="bg-green-600 border-green-600 hover:bg-green-700 hover:border-green-700">
                                    {sending ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Mengirim...</> : <><Send className="mr-1 h-3 w-3" /> Kirim via Wablas</>}
                                </Button>
                            </div>

                            <div className="flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
                                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                                <span>Kirim maks 50/batch untuk hindari blokir WA. Gunakan tombol WA per baris untuk kirim manual satu per satu.</span>
                            </div>

                            <Separator />

                            <div className="max-h-[400px] overflow-auto rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12 text-xs">No</TableHead>
                                            <TableHead className="text-xs">Nama</TableHead>
                                            <TableHead className="text-xs">No. HP</TableHead>
                                            <TableHead className="w-24 text-center text-xs">Kirim Manual</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-muted-foreground py-8 text-center text-xs">
                                                    Tidak ada pengguna yang cocok.
                                                </TableCell>
                                            </TableRow>
                                        ) : users.map((u) => (
                                            <TableRow key={u.id} className={u.no >= fromIdx && u.no <= toIdx ? 'bg-green-50/50 dark:bg-green-950/10' : ''}>
                                                <TableCell className="text-xs font-medium">{u.no}</TableCell>
                                                <TableCell className="text-xs">{u.name}</TableCell>
                                                <TableCell className="text-xs">{u.phone_number || '-'}</TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-1">
                                                        {u.wa_link && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20" onClick={() => openManualWa(u)}>
                                                                        <ExternalLink className="h-3.5 w-3.5 text-green-600" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p className="text-xs">Kirim manual via WA Web</p></TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20"
                                                                    onClick={() => sendSingleWablas(u)}
                                                                    disabled={sendingSingle !== null}
                                                                >
                                                                    {sendingSingle === u.id ? (
                                                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                                                                    ) : (
                                                                        <Send className="h-3.5 w-3.5 text-blue-600" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p className="text-xs">Kirim manual via Wablas</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
