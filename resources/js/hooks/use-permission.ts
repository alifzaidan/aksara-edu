import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function usePermission() {
    const { auth } = usePage<SharedData>().props;
    const roles = auth?.role || [];
    const permissions = auth?.permissions || [];
    const isAdmin = roles.includes('admin');

    /**
     * Check if user has a specific permission or is admin.
     * Example: can('bootcamps.manage')
     */
    const can = (permission: string): boolean => {
        if (isAdmin) return true;
        return permissions.includes(permission);
    };

    /**
     * Check if user has ANY of the given permissions or is admin.
     * Example: canAny(['bootcamps.manage', 'courses.manage'])
     */
    const canAny = (permissionList: string[]): boolean => {
        if (isAdmin) return true;
        return permissionList.some((p) => permissions.includes(p));
    };

    /**
     * Check if user has ALL of the given permissions or is admin.
     */
    const canAll = (permissionList: string[]): boolean => {
        if (isAdmin) return true;
        return permissionList.every((p) => permissions.includes(p));
    };

    /**
     * Check if user can manage a module (has {module}.manage permission or is admin).
     * Example: canManage('bootcamps')
     */
    const canManage = (module: string): boolean => {
        if (isAdmin) return true;
        return permissions.includes(`${module}.manage`);
    };

    /**
     * Check if user can view a module (has {module}.view or {module}.manage or is admin).
     * Example: canView('bootcamps')
     */
    const canView = (module: string): boolean => {
        if (isAdmin) return true;
        return permissions.includes(`${module}.view`) || permissions.includes(`${module}.manage`);
    };

    return {
        can,
        canAny,
        canAll,
        canManage,
        canView,
        isAdmin,
        permissions,
        roles,
    };
}
