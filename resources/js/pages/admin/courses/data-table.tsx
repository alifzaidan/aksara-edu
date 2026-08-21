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
import { Archive, BarChart, Eye, FileEdit, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export const courseStatuses = [
    { value: 'draft', label: 'Draft', icon: FileEdit },
    { value: 'published', label: 'Published', icon: Eye },
    { value: 'archived', label: 'Archived', icon: Archive },
];

export const courseLevels = [
    { value: 'beginner', label: 'Beginner', icon: BarChart },
    { value: 'intermediate', label: 'Intermediate', icon: BarChart },
    { value: 'advanced', label: 'Advanced', icon: BarChart },
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data?: TData[] | PaginatedData<TData>;
    pagination?: PaginatedData<TData>;
    filters?: {
        search?: string;
        status?: string;
        level?: string;
        per_page?: number;
    };
}

export function DataTable<TData, TValue>({ columns, data, pagination, filters }: DataTableProps<TData, TValue>) {
    const paginationObj = pagination || (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data ? (data as unknown as PaginatedData<TData>) : undefined);
    const tableData = paginationObj ? (paginationObj.data || []) : (Array.isArray(data) ? data : []);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
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

    const selectedStatuses = React.useMemo(() => {
        return filters?.status ? filters.status.split(',') : [];
    }, [filters?.status]);

    const selectedLevels = React.useMemo(() => {
        return filters?.level ? filters.level.split(',') : [];
    }, [filters?.level]);

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

    const isFiltered = searchValue.length > 0 || selectedStatuses.length > 0 || selectedLevels.length > 0 || table.getState().columnFilters.length > 0;

    const handleReset = () => {
        setSearchValue('');
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        table.resetColumnFilters();
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.delete('search');
        searchParams.delete('status');
        searchParams.delete('level');
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
                    placeholder="Cari kelas..."
                    value={searchValue}
                    onChange={(event) => handleSearch(event.target.value)}
                    className="lg:max-w-sm"
                />
                <div className="flex flex-col items-center gap-2 lg:flex-row">
                    {table.getColumn('status') && (
                        <DataTableFacetedFilter
                            column={table.getColumn('status')}
                            title="Status"
                            options={courseStatuses}
                            selectedValues={selectedStatuses}
                            onFilterChange={(values) => updateFilter('status', values)}
                        />
                    )}
                    {table.getColumn('level') && (
                        <DataTableFacetedFilter
                            column={table.getColumn('level')}
                            title="Level"
                            options={courseLevels}
                            selectedValues={selectedLevels}
                            onFilterChange={(values) => updateFilter('level', values)}
                        />
                    )}
                    {isFiltered && (
                        <Button variant="ghost" onClick={handleReset} className="h-8 px-2 lg:px-3">
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
