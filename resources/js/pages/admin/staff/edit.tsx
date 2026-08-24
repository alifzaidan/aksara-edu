import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, UserCheck } from 'lucide-react';
import React, { FormEventHandler, useRef } from 'react';
import PermissionSelector, { PermissionGroup } from './permission-selector';

interface StaffData {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    instance?: string;
    city?: string;
    avatar?: string;
    permissions: string[];
}

interface EditStaffProps {
    staff: StaffData;
    permission_modules: PermissionGroup[];
}

export default function EditStaff({ staff, permission_modules }: EditStaffProps) {
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Staff',
            href: route('staff.index'),
        },
        {
            title: staff.name,
            href: route('staff.show', staff.id),
        },
        {
            title: 'Edit',
            href: '#',
        },
    ];

    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        name: string;
        email: string;
        phone_number: string;
        password: string;
        instance: string;
        city: string;
        permissions: string[];
        avatar: File | null;
    }>({
        _method: 'PUT',
        name: staff.name || '',
        email: staff.email || '',
        phone_number: staff.phone_number || '',
        password: '',
        instance: staff.instance || '',
        city: staff.city || '',
        permissions: staff.permissions || [],
        avatar: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('staff.update', staff.id), {
            preserveScroll: true,
        });
    };

    const existingAvatarSrc = staff.avatar
        ? staff.avatar.startsWith('http') || staff.avatar.startsWith('/')
            ? staff.avatar
            : `/storage/${staff.avatar}`
        : null;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Staff - ${staff.name}`} />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Edit Staff</h1>
                        <p className="text-muted-foreground text-sm">
                            Perbarui data profil staff dan sesuaikan hak akses menu.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* User Information Box */}
                    <div className="space-y-6 rounded-lg border p-6 bg-card shadow-sm">
                        <div className="flex items-center gap-2 border-b pb-3">
                            <UserCheck className="h-5 w-5 text-primary" />
                            <div>
                                <h2 className="text-lg font-semibold">Informasi Profil Staff</h2>
                                <p className="text-muted-foreground text-xs">Perbarui informasi akun {staff.name}.</p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Nama Lengkap <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Nama Lengkap Staff"
                                    autoComplete="off"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    Email <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="staff@aksademy.com"
                                    autoComplete="off"
                                    required
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone_number">
                                    Nomor Telepon / WhatsApp <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="phone_number"
                                    type="text"
                                    value={data.phone_number}
                                    onChange={(e) => setData('phone_number', e.target.value)}
                                    placeholder="081234567890"
                                    autoComplete="off"
                                    required
                                />
                                <InputError message={errors.phone_number} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password Baru (Kosongkan jika tidak ingin mengubah)
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    autoComplete="new-password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instance">Instansi / Asal (Opsional)</Label>
                                <Input
                                    id="instance"
                                    type="text"
                                    value={data.instance}
                                    onChange={(e) => setData('instance', e.target.value)}
                                    placeholder="Contoh: Aksademy, Universitas Brawijaya"
                                    autoComplete="off"
                                />
                                <InputError message={errors.instance} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">Kota Domisili (Opsional)</Label>
                                <Input
                                    id="city"
                                    type="text"
                                    value={data.city}
                                    onChange={(e) => setData('city', e.target.value)}
                                    placeholder="Contoh: Malang"
                                    autoComplete="off"
                                />
                                <InputError message={errors.city} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="avatar">Foto Avatar (Opsional)</Label>
                            <Input
                                id="avatar"
                                type="file"
                                ref={avatarInputRef}
                                accept="image/*"
                                onChange={(e) =>
                                    setData('avatar', e.target.files && e.target.files[0] ? e.target.files[0] : null)
                                }
                            />
                            <InputError message={errors.avatar} />
                            <div className="mt-2 flex items-center gap-3">
                                {data.avatar ? (
                                    <img
                                        src={URL.createObjectURL(data.avatar)}
                                        alt="Preview Avatar Baru"
                                        className="h-16 w-16 rounded-full object-cover border"
                                    />
                                ) : existingAvatarSrc ? (
                                    <img
                                        src={existingAvatarSrc}
                                        alt={staff.name}
                                        className="h-16 w-16 rounded-full object-cover border"
                                    />
                                ) : null}
                                {data.avatar && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setData('avatar', null);
                                            if (avatarInputRef.current) avatarInputRef.current.value = '';
                                        }}
                                    >
                                        Batalkan Foto Baru
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Permission Selector Component */}
                    <PermissionSelector
                        permissionModules={permission_modules}
                        selectedPermissions={data.permissions}
                        onChange={(perms) => setData('permissions', perms)}
                        error={errors.permissions}
                    />

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button variant="secondary" asChild className="hover:cursor-pointer">
                            <Link href={route('staff.index')}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={processing} className="hover:cursor-pointer">
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Menyimpan Perubahan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
