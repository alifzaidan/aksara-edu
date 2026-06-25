import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UserLayout from '@/layouts/user-layout';
import { type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertCircle, Award, Calendar, Download, ExternalLink, Mail, Phone, Search } from 'lucide-react';
import { useState } from 'react';

interface CertificateParticipant {
    id: string;
    certificate_code: string;
    certificate_number: number;
    created_at: string;
    user?: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
    } | null;
    certificate: {
        id: string;
        title: string;
        issued_date: string;
        course?: { title: string } | null;
        bootcamp?: { title: string } | null;
        webinar?: { title: string } | null;
        design?: {
            id: string;
            name: string;
            image_1: string | null;
            image_2: string | null;
        } | null;
    };
}

interface CheckCertificateProps {
    participants: CertificateParticipant[];
    searched: boolean;
    error: string | null;
    filters: {
        email: string | null;
        phone_number: string | null;
    };
}

export default function CheckCertificate({ participants, searched, error, filters }: CheckCertificateProps) {
    const { auth } = usePage<SharedData>().props;

    const [email, setEmail] = useState(filters.email || (auth.user?.email as string) || '');
    const [phone, setPhone] = useState(filters.phone_number || (auth.user?.phone_number as string) || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !phone.trim()) return;

        setLoading(true);
        router.get(
            route('certificates.check'),
            { email, phone_number: phone },
            {
                preserveState: true,
                onFinish: () => setLoading(false),
            }
        );
    };

    const getProgramDetails = (participant: CertificateParticipant) => {
        const cert = participant.certificate;
        if (cert.course) {
            return { title: cert.course.title, type: 'Kelas Online', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
        }
        if (cert.bootcamp) {
            return { title: cert.bootcamp.title, type: 'Bootcamp', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
        }
        if (cert.webinar) {
            return { title: cert.webinar.title, type: 'Webinar', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
        }
        return { title: cert.title, type: 'Sertifikat', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
    };

    const renderCertificatePreview = (participant: CertificateParticipant) => {
        return (
            <div className="relative aspect-[1.414/1] w-full overflow-hidden bg-muted border-b">
                <iframe
                    src={`/certificate/${participant.certificate_code}/pdf#toolbar=0`}
                    className="h-full w-full border-0 select-none pointer-events-none"
                    title={`Sertifikat ${participant.certificate_code}`}
                    loading="lazy"
                />
            </div>
        );
    };

    return (
        <UserLayout>
            <Head title="Cek Sertifikat" />

            {/* Hero Section */}
            <section className="w-full to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto max-w-3xl text-center mt-16 mb-8">
                    <h1 className="mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Cek Sertifikat Anda
                    </h1>
                    <p className="text-white text-sm sm:text-base">
                        Masukkan email dan nomor WhatsApp Anda yang terdaftar untuk mencari dan melihat sertifikat kelulusan program.
                    </p>
                </div>
            </section>

            {/* Main Form Section */}
            <section className="mx-auto -mt-8 max-w-7xl px-4 pb-20 space-y-8">
                {/* Centered Form */}
                <div className="mx-auto max-w-2xl">
                    <Card className="shadow-lg backdrop-blur-md">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg text-center">Form Pencarian</CardTitle>
                            <CardDescription className="text-center">Masukkan data Anda untuk melihat sertifikat kelulusan.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="flex items-center gap-1.5">
                                            <Mail className="h-4 w-4 text-muted-foreground" /> Email Terdaftar
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="contoh@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="flex items-center gap-1.5">
                                            <Phone className="h-4 w-4 text-muted-foreground" /> Nomor WhatsApp
                                        </Label>
                                        <Input
                                            id="phone"
                                            type="text"
                                            placeholder="0812xxxxxxxx"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full gap-2 h-10 mt-2">
                                    <Search className="h-4 w-4" />
                                    {loading ? 'Mencari...' : 'Cari Sertifikat'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section Below Form */}
                <div className="w-full">
                    {searched ? (
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                Hasil Pencarian
                                <Badge variant="secondary" className="font-normal text-xs">
                                    {participants.length} Sertifikat ditemukan
                                </Badge>
                            </h3>

                            {error && (
                                <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive max-w-2xl mx-auto">
                                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">Pencarian Gagal</p>
                                        <p className="text-muted-foreground mt-0.5">{error}</p>
                                    </div>
                                </div>
                            )}

                            {!error && participants.length === 0 && (
                                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center bg-muted/5 max-w-2xl mx-auto">
                                    <Award className="mb-3 h-12 w-12 text-muted-foreground opacity-50" />
                                    <p className="font-medium text-foreground">Sertifikat Belum Tersedia</p>
                                    <p className="text-muted-foreground mt-1 text-sm max-w-sm">
                                        Email dan nomor WhatsApp terdaftar, tetapi tidak ada sertifikat yang terbit atas akun tersebut saat ini.
                                    </p>
                                </div>
                            )}

                            {!error && participants.length > 0 && (
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                    {participants.map((p) => {
                                        const details = getProgramDetails(p);
                                        return (
                                            <Card key={p.id} className="group flex flex-col justify-between overflow-hidden border transition-all duration-200 hover:shadow-md hover:border-primary/30">
                                                {renderCertificatePreview(p)}
                                                <CardHeader className="p-4 pb-2">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${details.color}`}>
                                                            {details.type}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            {p.certificate_code}
                                                        </span>
                                                    </div>
                                                    <CardTitle className="text-base line-clamp-2 leading-snug">
                                                        {details.title}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0 text-xs text-muted-foreground space-y-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        <span>Diterbitkan: </span>
                                                        <span className="font-medium text-foreground">
                                                            {p.certificate.issued_date 
                                                                ? format(new Date(p.certificate.issued_date), 'dd MMMM yyyy', { locale: id }) 
                                                                : '-'}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                                <div className="border-t bg-muted/20 px-4 py-3 flex items-center justify-between gap-2">
                                                    <span className="text-[10px] text-muted-foreground">
                                                        No: {p.certificate_number}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Button asChild size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/5 px-2">
                                                            <a href={route('certificate.participant.detail', p.certificate_code)} target="_blank" rel="noopener noreferrer">
                                                                Lihat
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        </Button>
                                                        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs px-2 border-primary/20 text-primary hover:bg-primary/5">
                                                            <a href={route('certificate.participant.download.public', p.certificate_code)}>
                                                                Unduh
                                                                <Download className="h-3 w-3" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center bg-card/50 min-h-[300px] max-w-2xl mx-auto">
                            <Award className="mb-4 h-16 w-16 text-primary/30 animate-pulse" />
                            <h3 className="text-lg font-semibold text-foreground">Temukan Sertifikat Anda</h3>
                            <p className="text-muted-foreground mt-2 text-sm max-w-sm">
                                Silakan masukkan email dan nomor WhatsApp terdaftar Anda di form pencarian di atas untuk menampilkan semua sertifikat Anda.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </UserLayout>
    );
}
