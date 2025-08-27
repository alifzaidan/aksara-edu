import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    BookText,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Clock,
    CreditCard,
    DollarSign,
    Mail,
    MonitorPlay,
    Phone,
    PlayCircle,
    Presentation,
    User,
    Users,
} from 'lucide-react';

interface UserData {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
    avatar?: string;
    created_at: string;
    roles: Array<{ name: string }>;
}

interface InvoiceItem {
    id: string;
    amount: number;
    nett_amount: number;
    status: 'pending' | 'paid' | 'failed';
    invoice_code: string;
    paid_at?: string;
    created_at: string;
    courseItems?: Array<{
        course: {
            id: string;
            title: string;
            thumbnail?: string;
            price: number;
            user: { id: string; name: string };
        };
    }>;
    bootcampItems?: Array<{
        bootcamp: {
            id: string;
            title: string;
            thumbnail?: string;
            price: number;
            user: { id: string; name: string };
        };
    }>;
    webinarItems?: Array<{
        webinar: {
            id: string;
            title: string;
            thumbnail?: string;
            price: number;
            user: { id: string; name: string };
        };
    }>;
}

interface PaginatedInvoices {
    data: InvoiceItem[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

interface EnrollmentData {
    id: string;
    progress?: number;
    completed_at?: string;
    created_at: string;
    type: 'course' | 'bootcamp' | 'webinar';
    course?: {
        id: string;
        title: string;
        thumbnail?: string;
        price: number;
        user: { id: string; name: string };
    };
    bootcamp?: {
        id: string;
        title: string;
        thumbnail?: string;
        price: number;
        user: { id: string; name: string };
    };
    webinar?: {
        id: string;
        title: string;
        thumbnail?: string;
        price: number;
        user: { id: string; name: string };
    };
    invoice: {
        id: string;
        status: string;
        paid_at?: string;
    };
}

interface PaginatedEnrollments {
    data: EnrollmentData[];
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

interface UserShowProps {
    user: UserData;
    invoices: PaginatedInvoices;
    enrollments: PaginatedEnrollments;
    stats: {
        total_spent: number;
        total_transactions: number;
        total_courses: number;
        total_bootcamps: number;
        total_webinars: number;
        completed_courses: number;
        active_courses: number;
    };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getStatusBadge = (status: string) => {
    const styles = {
        paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    const labels = {
        paid: 'Lunas',
        pending: 'Pending',
        failed: 'Gagal',
    };

    return <Badge className={styles[status as keyof typeof styles] || styles.pending}>{labels[status as keyof typeof labels] || status}</Badge>;
};

const getProgressBadge = (progress: number) => {
    if (progress === 100) {
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
    } else if (progress > 0) {
        return <Badge className="bg-blue-100 text-blue-800">Berlangsung ({progress}%)</Badge>;
    } else {
        return <Badge className="bg-gray-100 text-gray-800">Belum Dimulai</Badge>;
    }
};

const getProductTypeBadge = (type: string) => {
    const styles = {
        course: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        bootcamp: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        webinar: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    };

    const labels = {
        course: 'Kelas',
        bootcamp: 'Bootcamp',
        webinar: 'Webinar',
    };

    return <Badge className={styles[type as keyof typeof styles] || styles.course}>{labels[type as keyof typeof labels] || type}</Badge>;
};

const getInvoiceItems = (invoice: InvoiceItem) => {
    const items = [];

    if (invoice.courseItems) {
        items.push(
            ...invoice.courseItems.map((item) => ({
                type: 'course',
                title: item.course.title,
                mentor: item.course.user.name,
                thumbnail: item.course.thumbnail,
                price: item.course.price,
            })),
        );
    }

    if (invoice.bootcampItems) {
        items.push(
            ...invoice.bootcampItems.map((item) => ({
                type: 'bootcamp',
                title: item.bootcamp.title,
                mentor: item.bootcamp.user.name,
                thumbnail: item.bootcamp.thumbnail,
                price: item.bootcamp.price,
            })),
        );
    }

    if (invoice.webinarItems) {
        items.push(
            ...invoice.webinarItems.map((item) => ({
                type: 'webinar',
                title: item.webinar.title,
                mentor: item.webinar.user.name,
                thumbnail: item.webinar.thumbnail,
                price: item.webinar.price,
            })),
        );
    }

    return items;
};

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'course':
            return <BookText className="h-4 w-4" />;
        case 'bootcamp':
            return <Presentation className="h-4 w-4" />;
        case 'webinar':
            return <MonitorPlay className="h-4 w-4" />;
        default:
            return <PlayCircle className="h-4 w-4" />;
    }
};

const PaginationControls = ({
    currentPage,
    lastPage,
    total,
    from,
    to,
    onPageChange,
}: {
    currentPage: number;
    lastPage: number;
    total: number;
    from: number;
    to: number;
    onPageChange: (page: number) => void;
}) => {
    return (
        <div className="flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
                Menampilkan {from} sampai {to} dari {total} entri
            </div>
            <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                </Button>
                <span className="text-sm">
                    Halaman {currentPage} dari {lastPage}
                </span>
                <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= lastPage}>
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export default function UserShow({ user, invoices, enrollments, stats }: UserShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Kelola Peserta', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}` },
    ];

    const handleInvoicePageChange = (page: number) => {
        router.get(`/admin/users/${user.id}`, { invoices_page: page }, { preserveState: true });
    };

    const handleEnrollmentPageChange = (page: number) => {
        router.get(`/admin/users/${user.id}`, { enrollments_page: page }, { preserveState: true });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Peserta - ${user.name}`} />

            <div className="space-y-6 px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Detail Peserta</h1>
                            <p className="text-muted-foreground text-sm">Informasi lengkap dan aktivitas peserta</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* User Profile & Stats - Same as before */}
                    <div className="lg:col-span-1">
                        <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                            <div className="flex flex-col items-center text-center">
                                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="h-20 w-20 rounded-full object-cover" />
                                    ) : (
                                        <User className="h-10 w-10 text-blue-600" />
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold">{user.name}</h3>
                                <p className="text-muted-foreground mb-4 text-sm">
                                    {user.roles[0]?.name === 'user' ? 'Peserta' : user.roles[0]?.name}
                                </p>

                                <div className="w-full space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="text-muted-foreground h-4 w-4" />
                                        <span>{user.email}</span>
                                    </div>
                                    {user.phone_number && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="text-muted-foreground h-4 w-4" />
                                            <span>{user.phone_number}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="text-muted-foreground h-4 w-4" />
                                        <span>Bergabung {formatDate(user.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="border-border bg-card text-card-foreground mt-6 rounded-xl border p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">Statistik</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">Total Belanja</span>
                                    </div>
                                    <span className="font-medium">{formatCurrency(stats.total_spent)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm">Total Transaksi</span>
                                    </div>
                                    <span className="font-medium">{stats.total_transactions}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookText className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm">Kelas Diikuti</span>
                                    </div>
                                    <span className="font-medium">{stats.total_courses}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Presentation className="h-4 w-4 text-orange-600" />
                                        <span className="text-sm">Bootcamp Diikuti</span>
                                    </div>
                                    <span className="font-medium">{stats.total_bootcamps}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MonitorPlay className="h-4 w-4 text-pink-600" />
                                        <span className="text-sm">Webinar Diikuti</span>
                                    </div>
                                    <span className="font-medium">{stats.total_webinars}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">Kelas Selesai</span>
                                    </div>
                                    <span className="font-medium">{stats.completed_courses}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm">Kelas Aktif</span>
                                    </div>
                                    <span className="font-medium">{stats.active_courses}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content with Pagination */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Enrollments with Pagination */}
                        <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">Program Yang Diikuti</h3>
                            {enrollments.data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <Users className="mb-2 h-12 w-12 text-gray-400" />
                                    <p className="text-muted-foreground text-sm">Belum mengikuti program apapun</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 space-y-4">
                                        {enrollments.data.map((enrollment) => {
                                            const content = enrollment.course || enrollment.bootcamp || enrollment.webinar;
                                            return (
                                                <div key={enrollment.id} className="flex items-start gap-4 rounded-lg border p-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                                                        {getTypeIcon(enrollment.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <div className="mb-1 flex items-center gap-2">
                                                                    <h4 className="font-medium">{content?.title}</h4>
                                                                    {getProductTypeBadge(enrollment.type)}
                                                                </div>
                                                                <p className="text-muted-foreground text-sm">Mentor: {content?.user.name}</p>
                                                                <p className="text-muted-foreground text-sm">
                                                                    Bergabung: {formatDate(enrollment.created_at)}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="mb-2">{formatCurrency(content?.price || 0)}</div>
                                                                {enrollment.type === 'course' &&
                                                                    enrollment.progress !== undefined &&
                                                                    getProgressBadge(enrollment.progress)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <PaginationControls
                                        currentPage={enrollments.current_page}
                                        lastPage={enrollments.last_page}
                                        total={enrollments.total}
                                        from={enrollments.from}
                                        to={enrollments.to}
                                        onPageChange={handleEnrollmentPageChange}
                                    />
                                </>
                            )}
                        </div>

                        {/* Invoices with Pagination */}
                        <div className="border-border bg-card text-card-foreground rounded-xl border p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">Riwayat Transaksi</h3>
                            {invoices.data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8">
                                    <CreditCard className="mb-2 h-12 w-12 text-gray-400" />
                                    <p className="text-muted-foreground text-sm">Belum ada transaksi</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-4 space-y-4">
                                        {invoices.data.map((invoice) => {
                                            const items = getInvoiceItems(invoice);
                                            return (
                                                <div key={invoice.id} className="rounded-lg border p-4">
                                                    <div className="mb-3 flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-medium">#{invoice.invoice_code}</h4>
                                                            <p className="text-muted-foreground text-sm">{formatDate(invoice.created_at)}</p>
                                                            {invoice.paid_at && (
                                                                <p className="text-muted-foreground text-sm">
                                                                    Dibayar: {formatDate(invoice.paid_at)}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            {getStatusBadge(invoice.status)}
                                                            <div className="mt-1 font-medium">{formatCurrency(invoice.nett_amount)}</div>
                                                        </div>
                                                    </div>

                                                    {items.length > 0 && (
                                                        <div className="space-y-2">
                                                            <p className="text-sm font-medium">Item yang dibeli:</p>
                                                            {items.map((item, index) => (
                                                                <div key={index} className="flex items-center gap-2 text-sm">
                                                                    {getTypeIcon(item.type)}
                                                                    <span className="font-medium">{item.title}</span>
                                                                    {getProductTypeBadge(item.type)}
                                                                    <span className="text-muted-foreground">- Mentor: {item.mentor}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <PaginationControls
                                        currentPage={invoices.current_page}
                                        lastPage={invoices.last_page}
                                        total={invoices.total}
                                        from={invoices.from}
                                        to={invoices.to}
                                        onPageChange={handleInvoicePageChange}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
