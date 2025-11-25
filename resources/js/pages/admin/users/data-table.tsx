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
import { BookText, MonitorPlay, Presentation, ShoppingBag, X } from 'lucide-react';
import React from 'react';

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
                    placeholder="Cari nama pengguna..."
                    value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
                    className="lg:max-w-sm"
                />
                <div className="flex flex-col items-center gap-2 lg:flex-row">
                    {table.getColumn('total_enrollments') && (
                        <DataTableFacetedFilter column={table.getColumn('total_enrollments')} title="Tipe Program" options={programTypes} />
                    )}
                    {table.getColumn('last_purchase_date') && (
                        <DataTableFacetedFilter column={table.getColumn('last_purchase_date')} title="Riwayat Pembelian" options={purchaseStatus} />
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
