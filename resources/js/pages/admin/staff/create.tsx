import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';
import React, { FormEventHandler, useRef } from 'react';
import PermissionSelector, { PermissionGroup } from './permission-selector';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Staff',
        href: route('staff.index'),
    },
    {
        title: 'Tambah Staff Baru',
        href: route('staff.create'),
    },
];

interface CreateStaffProps {
    permission_modules: PermissionGroup[];
}

export default function CreateStaff({ permission_modules }: CreateStaffProps) {
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        email: string;
        phone_number: string;
        password: string;
        instance: string;
        city: string;
        permissions: string[];
        avatar: File | null;
    }>({
        name: '',
        email: '',
        phone_number: '',
        password: '',
        instance: '',
        city: '',
        permissions: [],
        avatar: null,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('staff.store'), {
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Staff Baru" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Tambah Staff Baru</h1>
                        <p className="text-muted-foreground text-sm">
                            Silakan masukkan data akun staff baru dan tentukan hak akses menu yang diberikan.
                        </p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* User Information Box */}
                    <div className="space-y-6 rounded-lg border p-6 bg-card shadow-sm">
                        <div className="flex items-center gap-2 border-b pb-3">
                            <UserPlus className="h-5 w-5 text-primary" />
                            <div>
                                <h2 className="text-lg font-semibold">Informasi Akun Staff</h2>
                                <p className="text-muted-foreground text-xs">Informasi dasar untuk login dan identitas staff.</p>
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
                                    Password <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    autoComplete="new-password"
                                    required
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
                            {data.avatar && (
                                <div className="mt-2 flex items-center gap-3">
                                    <img
                                        src={URL.createObjectURL(data.avatar)}
                                        alt="Preview Avatar"
                                        className="h-16 w-16 rounded-full object-cover border"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setData('avatar', null);
                                            if (avatarInputRef.current) avatarInputRef.current.value = '';
                                        }}
                                    >
                                        Hapus Foto
                                    </Button>
                                </div>
                            )}
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
                            {processing ? 'Menyimpan...' : 'Tambah Staff'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
