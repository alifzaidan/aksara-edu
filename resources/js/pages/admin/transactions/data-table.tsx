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
import { DataTableViewOptions } from '@/components/data-table-view-option';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookText, CheckCircle, Clock, DollarSign, Gift, MonitorPlay, Presentation, X, XCircle } from 'lucide-react';
import React from 'react';

export const status = [
    {
        value: 'pending',
        label: 'Pending',
        icon: Clock,
    },
    {
        value: 'paid',
        label: 'Paid',
        icon: CheckCircle,
    },
    {
        value: 'failed',
        label: 'Failed',
        icon: XCircle,
    },
];

export const paymentTypes = [
    {
        value: 'paid',
        label: 'Berbayar',
        icon: DollarSign,
    },
    {
        value: 'free',
        label: 'Gratis',
        icon: Gift,
    },
];

export const productTypes = [
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
        value: 'bundle',
        label: 'Bundle',
        icon: Gift,
    },
];

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
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
                    placeholder="Cari nama pembeli..."
                    value={(table.getColumn('user_name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('user_name')?.setFilterValue(event.target.value)}
                    className="lg:max-w-sm"
                />
                <div className="flex flex-col items-center gap-2 lg:flex-row">
                    {table.getColumn('status') && <DataTableFacetedFilter column={table.getColumn('status')} title="Status" options={status} />}
                    {table.getColumn('payment_type') && (
                        <DataTableFacetedFilter column={table.getColumn('payment_type')} title="Jenis Bayar" options={paymentTypes} />
                    )}
                    {table.getColumn('product_type') && (
                        <DataTableFacetedFilter column={table.getColumn('product_type')} title="Jenis Produk" options={productTypes} />
                    )}
                    {isFiltered && (
                        <Button
                            onClick={() => {
                                table.resetColumnFilters();
                            }}
                            className="h-8 px-2 lg:px-3"
                        >
                            Reset
                            <X />
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
                <DataTablePagination table={table} />
            </div>
        </div>
    );
}
