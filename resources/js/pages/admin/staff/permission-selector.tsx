import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, KeyRound, ShieldCheck, X } from 'lucide-react';
import React from 'react';

export interface PermissionModuleItem {
    key: string;
    label: string;
}

export interface PermissionGroup {
    group: string;
    modules: PermissionModuleItem[];
}

interface PermissionSelectorProps {
    permissionModules: PermissionGroup[];
    selectedPermissions: string[];
    onChange: (permissions: string[]) => void;
    error?: string;
}

export default function PermissionSelector({
    permissionModules,
    selectedPermissions,
    onChange,
    error,
}: PermissionSelectorProps) {
    const isChecked = (perm: string) => selectedPermissions.includes(perm);

    const togglePermission = (perm: string) => {
        if (isChecked(perm)) {
            // If unchecking view, also uncheck manage for this module
            if (perm.endsWith('.view')) {
                const moduleKey = perm.replace('.view', '');
                onChange(selectedPermissions.filter((p) => p !== perm && p !== `${moduleKey}.manage`));
            } else {
                onChange(selectedPermissions.filter((p) => p !== perm));
            }
        } else {
            // If checking manage, also ensure view is checked
            if (perm.endsWith('.manage')) {
                const moduleKey = perm.replace('.manage', '');
                const updated = new Set([...selectedPermissions, perm, `${moduleKey}.view`]);
                onChange(Array.from(updated));
            } else {
                onChange([...selectedPermissions, perm]);
            }
        }
    };

    const selectAll = () => {
        const all: string[] = [];
        permissionModules.forEach((group) => {
            group.modules.forEach((mod) => {
                all.push(`${mod.key}.view`);
                all.push(`${mod.key}.manage`);
            });
        });
        onChange(all);
    };

    const selectAllViewOnly = () => {
        const all: string[] = [];
        permissionModules.forEach((group) => {
            group.modules.forEach((mod) => {
                all.push(`${mod.key}.view`);
            });
        });
        onChange(all);
    };

    const resetAll = () => {
        onChange([]);
    };

    const selectGroup = (group: PermissionGroup, type: 'all' | 'view' | 'none') => {
        const groupPerms: string[] = [];
        group.modules.forEach((mod) => {
            if (type === 'all') {
                groupPerms.push(`${mod.key}.view`);
                groupPerms.push(`${mod.key}.manage`);
            } else if (type === 'view') {
                groupPerms.push(`${mod.key}.view`);
            }
        });

        const allGroupKeys = group.modules.flatMap((m) => [`${m.key}.view`, `${m.key}.manage`]);
        const withoutGroup = selectedPermissions.filter((p) => !allGroupKeys.includes(p));

        onChange([...withoutGroup, ...groupPerms]);
    };

    const totalPermissions = permissionModules.reduce((acc, g) => acc + g.modules.length * 2, 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        <h3 className="text-base font-semibold">Pengaturan Hak Akses Menu Staff</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Pilih menu yang dapat diakses oleh staff ini, beserta tingkat aksesnya (Hanya Lihat atau Kelola Penuh).
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs font-normal">
                        {selectedPermissions.length} dari {totalPermissions} akses dipilih
                    </Badge>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllViewOnly}
                        className="h-8 text-xs hover:cursor-pointer"
                    >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Semua Lihat
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        className="h-8 text-xs hover:cursor-pointer"
                    >
                        <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                        Akses Penuh
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={resetAll}
                        className="h-8 text-xs text-destructive hover:cursor-pointer"
                    >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Reset
                    </Button>
                </div>
            </div>

            {error && <p className="text-sm font-medium text-destructive">{error}</p>}

            <div className="grid gap-4 md:grid-cols-2">
                {permissionModules.map((group) => {
                    const groupModuleKeys = group.modules.flatMap((m) => [`${m.key}.view`, `${m.key}.manage`]);
                    const groupSelectedCount = groupModuleKeys.filter((p) => isChecked(p)).length;

                    return (
                        <div key={group.group} className="rounded-lg border shadow-sm overflow-hidden bg-card">
                            <div className="border-b bg-muted/40 px-4 py-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold">{group.group}</h4>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                            {groupSelectedCount}/{groupModuleKeys.length}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[11px] text-muted-foreground hover:cursor-pointer"
                                            onClick={() => selectGroup(group, 'view')}
                                        >
                                            Lihat
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-[11px] text-primary hover:cursor-pointer"
                                            onClick={() => selectGroup(group, 'all')}
                                        >
                                            Semua
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-1.5 text-[11px] text-destructive hover:cursor-pointer"
                                            onClick={() => selectGroup(group, 'none')}
                                        >
                                            Hapus
                                        </Button>
                                    </div>
                                </div>
                            </div>
                            <div className="divide-y">
                                {group.modules.map((module) => {
                                    const viewKey = `${module.key}.view`;
                                    const manageKey = `${module.key}.manage`;
                                    const isViewChecked = isChecked(viewKey);
                                    const isManageChecked = isChecked(manageKey);

                                    return (
                                        <div
                                            key={module.key}
                                            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/10 transition-colors"
                                        >
                                            <div className="font-medium text-sm text-foreground">
                                                {module.label}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                                                    <Checkbox
                                                        checked={isViewChecked}
                                                        onCheckedChange={() => togglePermission(viewKey)}
                                                    />
                                                    <span className={isViewChecked ? 'text-primary font-medium' : 'text-muted-foreground'}>
                                                        Lihat
                                                    </span>
                                                </label>

                                                <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                                                    <Checkbox
                                                        checked={isManageChecked}
                                                        onCheckedChange={() => togglePermission(manageKey)}
                                                    />
                                                    <span className={isManageChecked ? 'text-green-600 dark:text-green-400 font-medium' : 'text-muted-foreground'}>
                                                        Kelola
                                                    </span>
                                                </label>
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
    );
}
