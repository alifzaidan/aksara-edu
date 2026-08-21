'use client';

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';

import { DataTableFacetedFilter } from '@/components/data-table-faceted-filter';
import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableServerPagination } from '@/components/data-table-server-pagination';
import { DataTableViewOptions } from '@/components/data-table-view-option';
import { PaginatedData } from '@/types/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookText, GraduationCap, MonitorPlay, Presentation, ShoppingBag, Tags, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export const programTypes = [
    {
        value: 'course',
        label: 'Kelas Online',
        icon: BookText,
    },
    {
        value: 'bootcamp',
        label: 'Bootcamp',
        icon: Presentation,
    },
    {
        value: 'webinar',
        label: 'Webinar',
        icon: MonitorPlay,
    },
    {
        value: 'certification_program',
        label: 'Program Sertifikasi',
        icon: GraduationCap,
    },
    {
        value: 'private',
        label: 'Private Class',
        icon: Presentation,
    },
];

export const purchaseStatus = [
    {
        value: 'true',
        label: 'Pernah Beli',
        icon: ShoppingBag,
    },
    {
        value: 'false',
        label: 'Belum Pernah Beli',
        icon: X,
    },
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data?: TData[] | PaginatedData<TData>;
    pagination?: PaginatedData<TData>;
    categories?: { id: string; name: string }[];
    filters?: {
        search?: string;
        program_type?: string;
        category?: string;
        purchase_status?: string;
        per_page?: number;
    };
}

export function DataTable<TData, TValue>({ columns, data, pagination, filters, categories = [] }: DataTableProps<TData, TValue>) {
    const paginationObj = pagination || (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data ? (data as unknown as PaginatedData<TData>) : undefined);
    const tableData = paginationObj ? (paginationObj.data || []) : (Array.isArray(data) ? data : []);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({ purchased_categories: false });
    const [rowSelection, setRowSelection] = React.useState({});

    // Server-side search state
    const [searchValue, setSearchValue] = useState(filters?.search ?? '');
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((value: string) => {
        setSearchValue(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            const searchParams = new URLSearchParams(window.location.search);
            if (value) {
                searchParams.set('search', value);
            } else {
                searchParams.delete('search');
            }
            searchParams.set('page', '1');
            router.get(
                `${window.location.pathname}?${searchParams.toString()}`,
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);
    }, []);

    // Sync searchValue when filters prop changes (e.g. navigating back)
    useEffect(() => {
        setSearchValue(filters?.search ?? '');
    }, [filters?.search]);

    const selectedProgramTypes = React.useMemo(() => {
        return filters?.program_type ? filters.program_type.split(',') : [];
    }, [filters?.program_type]);

    const selectedCategories = React.useMemo(() => {
        return filters?.category ? filters.category.split(',') : [];
    }, [filters?.category]);

    const selectedPurchaseStatuses = React.useMemo(() => {
        return filters?.purchase_status ? filters.purchase_status.split(',') : [];
    }, [filters?.purchase_status]);

    const updateFilter = useCallback((key: string, values: string[]) => {
        const searchParams = new URLSearchParams(window.location.search);
        if (values.length > 0) {
            searchParams.set(key, values.join(','));
        } else {
            searchParams.delete(key);
        }
        searchParams.set('page', '1');
        router.get(
            `${window.location.pathname}?${searchParams.toString()}`,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, []);

    const table = useReactTable({
        data: tableData,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: paginationObj ? undefined : getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const isFiltered =
        searchValue.length > 0 ||
        selectedProgramTypes.length > 0 ||
        selectedCategories.length > 0 ||
        selectedPurchaseStatuses.length > 0 ||
        table.getState().columnFilters.length > 0;

    const handleReset = () => {
        setSearchValue('');
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        table.resetColumnFilters();
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.delete('search');
        searchParams.delete('program_type');
        searchParams.delete('category');
        searchParams.delete('purchase_status');
        searchParams.set('page', '1');
        router.get(
            `${window.location.pathname}?${searchParams.toString()}`,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <div>
            <div className="flex flex-col items-stretch gap-2 py-4 lg:flex-row lg:items-center">
                <Input
                    placeholder="Cari nama atau email..."
                    value={searchValue}
                    onChange={(event) => handleSearch(event.target.value)}
                    className="lg:max-w-sm"
                />
                <div className="flex flex-col items-center gap-2 lg:flex-row">
                    {table.getColumn('total_enrollments') && (
                        <DataTableFacetedFilter
                            column={table.getColumn('total_enrollments')}
                            title="Tipe Program"
                            options={programTypes}
                            selectedValues={selectedProgramTypes}
                            onFilterChange={(values) => updateFilter('program_type', values)}
                        />
                    )}
                    {table.getColumn('purchased_categories') && categories.length > 0 && (
                        <DataTableFacetedFilter
                            column={table.getColumn('purchased_categories')}
                            title="Kategori Produk"
                            options={categories.map((c) => ({ value: c.name, label: c.name, icon: Tags }))}
                            selectedValues={selectedCategories}
                            onFilterChange={(values) => updateFilter('category', values)}
                        />
                    )}
                    {table.getColumn('last_purchase_date') && (
                        <DataTableFacetedFilter
                            column={table.getColumn('last_purchase_date')}
                            title="Riwayat Pembelian"
                            options={purchaseStatus}
                            selectedValues={selectedPurchaseStatuses}
                            onFilterChange={(values) => updateFilter('purchase_status', values)}
                        />
                    )}
                    {isFiltered && (
                        <Button
                            variant="ghost"
                            onClick={handleReset}
                            className="h-8 px-2 lg:px-3"
                        >
                            Reset
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
                <DataTableViewOptions table={table} />
            </div>
            <div className="w-[1000px] max-w-full min-w-full overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="py-4">
                {paginationObj ? (
                    <DataTableServerPagination pagination={paginationObj} />
                ) : (
                    <DataTablePagination table={table} />
                )}
            </div>
        </div>
    );
}
