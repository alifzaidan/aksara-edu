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
import { Archive, CheckCircle2, Eye, EyeOff, FileEdit, X } from 'lucide-react';
import React from 'react';

export const webinarStatuses = [
    { value: 'draft', label: 'Draft', icon: FileEdit },
    { value: 'published', label: 'Published', icon: Eye },
    { value: 'archived', label: 'Archived', icon: Archive },
];

export const recordingStatuses = [
    { value: 'yes', label: 'Ada', icon: CheckCircle2 },
    { value: 'no', label: 'Belum Ada', icon: EyeOff },
];

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
                    placeholder="Cari webinar..."
                    value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('title')?.setFilterValue(event.target.value)}
                    className="lg:max-w-sm"
                />
                <div className="flex flex-col items-center gap-2 lg:flex-row">
                    {table.getColumn('status') && (
                        <DataTableFacetedFilter column={table.getColumn('status')} title="Status" options={webinarStatuses} />
                    )}
                    {table.getColumn('has_recording') && (
                        <DataTableFacetedFilter
                            column={table.getColumn('has_recording')}
                            title="Rekaman"
                            options={recordingStatuses}
                        />
                    )}
                    {isFiltered && (
                        <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-8 px-2 lg:px-3">
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
