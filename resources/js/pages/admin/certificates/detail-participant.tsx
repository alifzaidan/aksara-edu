import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/layouts/admin-layout';
import UserLayout from '@/layouts/user-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ArrowLeft, Award, Calendar, User } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface Certificate {
    id: string;
    title: string;
    certificate_number: string;
    description?: string;
    course_id?: string;
    bootcamp_id?: string;
    webinar_id?: string;
    course?: {
        id: string;
        title: string;
        slug: string;
    };
    bootcamp?: {
        id: string;
        title: string;
        slug: string;
    };
    webinar?: {
        id: string;
        title: string;
        slug: string;
    };
    created_at: string;
}

interface CertificateParticipant {
    id: string;
    certificate_id: string;
    user_id: string;
    certificate_number: number;
    certificate_code: string;
    user: User;
    certificate: Certificate;
    created_at: string;
    updated_at: string;
}

interface DetailParticipantProps {
    participant: CertificateParticipant;
}

export default function DetailParticipant({ participant }: DetailParticipantProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const isAdmin = role === 'admin' || role === 'mentor';

    const fullCertificateNumber = `${String(participant.certificate_number).padStart(4, '0')}/${participant.certificate.certificate_number}`;

    const programType = participant.certificate.course_id ? 'Course' : participant.certificate.bootcamp_id ? 'Bootcamp' : 'Webinar';

    const programData = participant.certificate.course || participant.certificate.bootcamp || participant.certificate.webinar;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sertifikat',
            href: route('certificates.index'),
        },
        {
            title: participant.certificate.title,
            href: route('certificates.show', { certificate: participant.certificate.id }),
        },
        {
            title: 'Detail Participant',
            href: route('certificate.participant.detail', { code: participant.certificate_code }),
        },
    ];

    const content = (
        <div className="px-4 py-4 md:px-6">
            <div className={`${isAdmin ? '' : 'mx-auto max-w-7xl lg:px-4'} mb-6 flex items-center justify-between`}>
                <div>
                    <h1 className="text-2xl font-semibold">Detail Sertifikat</h1>
                    <p className="text-muted-foreground">
                        {isAdmin ? `Informasi lengkap participant ${participant.certificate.title}` : `${participant.certificate.title}`}
                    </p>
                    <p className="font-mono text-sm text-blue-600 dark:text-blue-400">Kode Sertifikat: {participant.certificate_code}</p>
                </div>

                {isAdmin && (
                    <Button variant="outline" asChild>
                        <Link href={route('certificates.show', { certificate: participant.certificate.id })}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                )}
            </div>

            <div className={`${isAdmin ? '' : 'mx-auto max-w-7xl lg:px-4'} grid grid-cols-1 gap-6 lg:grid-cols-3`}>
                <div className="space-y-6 lg:col-span-2">
                    {/* Participant Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {isAdmin ? 'Informasi Participant' : 'Informasi Pemegang Sertifikat'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                {participant.user.avatar ? (
                                    <img src={participant.user.avatar} alt={participant.user.name} className="h-16 w-16 rounded-full object-cover" />
                                ) : (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                        <User className="h-8 w-8" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold">{participant.user.name}</h3>
                                    <p className="text-muted-foreground">{participant.user.email}</p>
                                </div>
                            </div>

                            {isAdmin && (
                                <>
                                    <Separator />

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">Nama Lengkap</label>
                                            <p className="text-sm font-semibold">{participant.user.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">Email</label>
                                            <p className="text-sm">{participant.user.email}</p>
                                        </div>

                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">User ID</label>
                                            <p className="font-mono text-sm">{participant.user.id}</p>
                                        </div>
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">Participant ID</label>
                                            <p className="font-mono text-sm">{participant.id}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Certificate Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Informasi Sertifikat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Nomor Sertifikat</label>
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{fullCertificateNumber}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Kode Sertifikat</label>
                                    <p className="rounded bg-gray-100 px-2 py-1 font-mono text-sm dark:bg-gray-800">{participant.certificate_code}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Judul Sertifikat</label>
                                    <p className="text-sm font-semibold">{participant.certificate.title}</p>
                                </div>
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Jenis Program</label>
                                    <div
                                        className={`w-fit items-center rounded-full px-2 py-1 text-xs font-medium ${
                                            programType === 'Course'
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                                : programType === 'Bootcamp'
                                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                                        }`}
                                    >
                                        {programType === 'Course' ? 'Kelas Online' : programType}
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-muted-foreground text-sm font-medium">Program</label>
                                    <p className="text-sm">{programData?.title}</p>
                                </div>
                                {participant.certificate.description && (
                                    <div className="md:col-span-2">
                                        <label className="text-muted-foreground text-sm font-medium">Keterangan</label>
                                        <p className="text-sm leading-relaxed">{participant.certificate.description}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Tanggal Terbit</label>
                                    <p className="flex items-center gap-1 text-sm">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(participant.created_at), 'dd MMMM yyyy', { locale: id })}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );

    if (isAdmin) {
        return (
            <AdminLayout breadcrumbs={breadcrumbs}>
                <Head title={`Detail Participant - ${participant.user.name}`} />
                {content}
            </AdminLayout>
        );
    }

    return (
        <UserLayout>
            <Head title={`Sertifikat - ${participant.certificate.title}`} />
            {content}
        </UserLayout>
    );
}
