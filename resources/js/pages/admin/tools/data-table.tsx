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

import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableServerPagination } from '@/components/data-table-server-pagination';
import { DataTableViewOptions } from '@/components/data-table-view-option';
import { PaginatedData } from '@/types/pagination';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { router } from '@inertiajs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data?: TData[] | PaginatedData<TData>;
    pagination?: PaginatedData<TData>;
    filters?: {
        search?: string;
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

    return (
        <div>
            <div className="flex flex-col items-stretch gap-2 py-4 lg:flex-row lg:items-center">
                <Input
                    placeholder="Cari nama tools..."
                    value={searchValue}
                    onChange={(event) => handleSearch(event.target.value)}
                    className="lg:max-w-sm"
                />
                <DataTableViewOptions table={table} />
            </div>
            <div className="rounded-md border">
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
