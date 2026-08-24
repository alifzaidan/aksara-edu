import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle2, Edit, KeyRound, Trash, XCircle } from 'lucide-react';
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { PermissionGroup } from './permission-selector';

interface StaffDetailProps {
    staff: {
        id: string;
        name: string;
        email: string;
        phone_number: string;
        instance?: string;
        city?: string;
        avatar?: string;
        email_verified_at?: string;
        created_at: string;
        permissions: string[];
    };
    permission_modules: PermissionGroup[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowStaff({ staff, permission_modules, flash }: StaffDetailProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Staff',
            href: route('staff.index'),
        },
        {
            title: staff.name,
            href: route('staff.show', staff.id),
        },
    ];

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDelete = () => {
        router.delete(route('staff.destroy', staff.id));
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    };

    const hasPermission = (perm: string) => staff.permissions.includes(perm);

    const avatarSrc = staff.avatar
        ? staff.avatar.startsWith('http') || staff.avatar.startsWith('/')
            ? staff.avatar
            : `/storage/${staff.avatar}`
        : null;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Staff - ${staff.name}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${staff.name}`}</h1>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    {/* Tabs Content */}
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="detail">Detail Staff</TabsTrigger>
                            <TabsTrigger value="permissions">
                                Hak Akses
                                <span className="bg-primary/10 ml-1.5 rounded-full px-2 py-0.5 text-xs">
                                    {staff.permissions.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab 1: Detail Info */}
                        <TabsContent value="detail">
                            <div className="space-y-6 rounded-lg border p-4">
                                <h2 className="text-lg font-medium">Data Staff</h2>

                                <div className="flex items-center gap-4 border-b pb-4">
                                    {avatarSrc ? (
                                        <img
                                            src={avatarSrc}
                                            alt={staff.name}
                                            className="h-24 w-24 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-300 text-2xl font-bold text-gray-700">
                                            {getInitials(staff.name)}
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-semibold">{staff.name}</h3>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="secondary">Staff</Badge>
                                            {staff.email_verified_at ? (
                                                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                                    ✓ Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                    Belum Verifikasi
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="w-1/3 font-medium text-muted-foreground">Nama Staff</TableCell>
                                            <TableCell className="font-semibold">{staff.name}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium text-muted-foreground">Email</TableCell>
                                            <TableCell>{staff.email}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="font-medium text-muted-foreground">Nomor Telepon</TableCell>
                                            <TableCell>{staff.phone_number}</TableCell>
                                        </TableRow>
                                        {staff.instance && (
                                            <TableRow>
                                                <TableCell className="font-medium text-muted-foreground">Instansi / Asal</TableCell>
                                                <TableCell>{staff.instance}</TableCell>
                                            </TableRow>
                                        )}
                                        {staff.city && (
                                            <TableRow>
                                                <TableCell className="font-medium text-muted-foreground">Kota Domisili</TableCell>
                                                <TableCell>{staff.city}</TableCell>
                                            </TableRow>
                                        )}
                                        <TableRow>
                                            <TableCell className="font-medium text-muted-foreground">Total Hak Akses</TableCell>
                                            <TableCell>
                                                <div className="inline-flex items-center gap-1.5 rounded bg-gray-200 px-2 py-1 font-semibold text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                                                    <KeyRound className="h-3 w-3 text-primary" />
                                                    <span>{staff.permissions.length} Akses Diberikan</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* Tab 2: Permissions Matrix */}
                        <TabsContent value="permissions">
                            <div className="space-y-4 rounded-lg border p-4">
                                <div className="flex items-center justify-between border-b pb-3">
                                    <div>
                                        <h2 className="text-lg font-medium">Hak Akses Menu</h2>
                                        <p className="text-muted-foreground text-xs">
                                            Daftar menu dan tingkat akses yang diizinkan untuk staff ini.
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                        {staff.permissions.length} Akses Aktif
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    {permission_modules.map((group) => {
                                        const groupModuleKeys = group.modules.flatMap((m) => [`${m.key}.view`, `${m.key}.manage`]);
                                        const groupActiveCount = groupModuleKeys.filter((p) => hasPermission(p)).length;

                                        return (
                                            <div key={group.group} className="rounded-lg border overflow-hidden">
                                                <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5 border-b">
                                                    <h3 className="text-sm font-semibold">{group.group}</h3>
                                                    <span className="text-xs text-muted-foreground">
                                                        {groupActiveCount} dari {groupModuleKeys.length} akses aktif
                                                    </span>
                                                </div>
                                                <div className="divide-y">
                                                    {group.modules.map((module) => {
                                                        const canView = hasPermission(`${module.key}.view`);
                                                        const canManage = hasPermission(`${module.key}.manage`);

                                                        return (
                                                            <div
                                                                key={module.key}
                                                                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/10 transition-colors"
                                                            >
                                                                <span className="font-medium">{module.label}</span>
                                                                <div className="flex items-center gap-2">
                                                                    {canView ? (
                                                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                            Lihat
                                                                        </span>
                                                                    ) : null}

                                                                    {canManage ? (
                                                                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-300">
                                                                            <CheckCircle2 className="mr-1 h-3 w-3" />
                                                                            Kelola
                                                                        </span>
                                                                    ) : null}

                                                                    {!canView && !canManage && (
                                                                        <span className="inline-flex items-center text-xs text-muted-foreground/60">
                                                                            <XCircle className="mr-1 h-3 w-3" />
                                                                            Tidak Ada Akses
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Right Column: Actions */}
                    <div>
                        <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="space-y-2">
                                <Button className="w-full hover:cursor-pointer" variant="secondary" asChild>
                                    <Link href={route('staff.edit', staff.id)}>
                                        <Edit />
                                        Edit Staff & Hak Akses
                                    </Link>
                                </Button>
                                <DeleteConfirmDialog
                                    trigger={
                                        <Button variant="destructive" className="w-full hover:cursor-pointer">
                                            <Trash /> Hapus Staff
                                        </Button>
                                    }
                                    title="Apakah Anda yakin ingin menghapus staff ini?"
                                    itemName={staff.name}
                                    onConfirm={handleDelete}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer timestamp */}
                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(staff.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
