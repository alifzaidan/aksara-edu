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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import React from 'react';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data?: TData[] | PaginatedData<TData>;
    pagination?: PaginatedData<TData>;
    filters?: {
        search?: string;
        per_page?: number;
    };
}

export function DataTable<TData, TValue>({ columns, data, pagination }: DataTableProps<TData, TValue>) {
    const paginationObj = pagination || (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data ? (data as unknown as PaginatedData<TData>) : undefined);
    const tableData = paginationObj ? (paginationObj.data || []) : (Array.isArray(data) ? data : []);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

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

    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div>
            <div className="flex flex-col items-stretch gap-2 py-4 lg:flex-row lg:items-center">
                <Input
                    placeholder="Cari kode diskon..."
                    value={(table.getColumn('code')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('code')?.setFilterValue(event.target.value)}
                    className="lg:max-w-sm"
                />
                <div className="flex flex-col items-center gap-2 lg:flex-row">
                    <Select
                        value={(table.getColumn('type')?.getFilterValue() as string) ?? 'all'}
                        onValueChange={(value) => table.getColumn('type')?.setFilterValue(value === 'all' ? '' : value)}
                    >
                        <SelectTrigger className="w-full lg:w-[180px]">
                            <SelectValue placeholder="Tipe Diskon" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tipe</SelectItem>
                            <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                            <SelectItem value="percentage">Persentase (%)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={(table.getColumn('is_active')?.getFilterValue() as string) ?? 'all'}
                        onValueChange={(value) => table.getColumn('is_active')?.setFilterValue(value === 'all' ? '' : value === 'true')}
                    >
                        <SelectTrigger className="w-full lg:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Status</SelectItem>
                            <SelectItem value="true">Aktif</SelectItem>
                            <SelectItem value="false">Nonaktif</SelectItem>
                        </SelectContent>
                    </Select>
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
                                    Tidak ada kode diskon ditemukan.
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
