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
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookText, CalendarIcon, CheckCircle, ChevronDownIcon, Clock, DollarSign, Download, Filter, Gift, MonitorPlay, Presentation, X, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
    filters?: {
        start_date?: string;
        end_date?: string;
        status?: string;
        payment_type?: string;
        product_type?: string;
    };
}

export function DataTable<TData, TValue>({ columns, data, filters }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    // Date filter states
    const [startDate, setStartDate] = useState<Date | undefined>(() => {
        if (filters?.start_date) {
            const date = new Date(filters.start_date + 'T00:00:00');
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    });

    const [endDate, setEndDate] = useState<Date | undefined>(() => {
        if (filters?.end_date) {
            const date = new Date(filters.end_date + 'T00:00:00');
            return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    });

    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);

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
    const hasDateFilter = startDate && endDate;

    // Apply date filter
    const handleApplyDateFilter = () => {
        const params: Record<string, string> = {};

        if (startDate) {
            params.start_date = format(startDate, 'yyyy-MM-dd');
        }
        if (endDate) {
            params.end_date = format(endDate, 'yyyy-MM-dd');
        }

        // Tambahkan filter kolom yang sedang aktif
        const statusFilter = table.getColumn('status')?.getFilterValue();
        if (statusFilter) {
            params.status = String(statusFilter);
        }

        const paymentTypeFilter = table.getColumn('payment_type')?.getFilterValue();
        if (paymentTypeFilter) {
            params.payment_type = String(paymentTypeFilter);
        }

        const productTypeFilter = table.getColumn('product_type')?.getFilterValue();
        if (productTypeFilter) {
            params.product_type = String(productTypeFilter);
        }

        router.get(route('transactions.index'), params, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    // Clear all filters including date
    const handleClearAllFilters = () => {
        table.resetColumnFilters();
        setStartDate(undefined);
        setEndDate(undefined);
        router.get(
            route('transactions.index'),
            {},
            {
                preserveState: false,
                preserveScroll: true,
            },
        );
    };

    // Sync with URL params
    useEffect(() => {
        if (filters?.start_date) {
            const date = new Date(filters.start_date + 'T00:00:00');
            if (!isNaN(date.getTime())) {
                setStartDate(date);
            }
        } else {
            setStartDate(undefined);
        }

        if (filters?.end_date) {
            const date = new Date(filters.end_date + 'T00:00:00');
            if (!isNaN(date.getTime())) {
                setEndDate(date);
            }
        } else {
            setEndDate(undefined);
        }

        // Sync column filters from URL
        const newColumnFilters: ColumnFiltersState = [];

        if (filters?.status) {
            newColumnFilters.push({ id: 'status', value: filters.status });
        }

        if (filters?.payment_type) {
            newColumnFilters.push({ id: 'payment_type', value: filters.payment_type });
        }

        if (filters?.product_type) {
            newColumnFilters.push({ id: 'product_type', value: filters.product_type });
        }

        setColumnFilters(newColumnFilters);
    }, [filters?.start_date, filters?.end_date, filters?.status, filters?.payment_type, filters?.product_type]);

    const handleExportToExcel = () => {
        const params = new URLSearchParams();

        // Date filter
        if (startDate) params.append('start_date', format(startDate, 'yyyy-MM-dd'));
        if (endDate) params.append('end_date', format(endDate, 'yyyy-MM-dd'));

        // Column filters
        const statusFilter = table.getColumn('status')?.getFilterValue();
        if (statusFilter) params.append('status', String(statusFilter));

        const paymentTypeFilter = table.getColumn('payment_type')?.getFilterValue();
        if (paymentTypeFilter) params.append('payment_type', String(paymentTypeFilter));

        const productTypeFilter = table.getColumn('product_type')?.getFilterValue();
        if (productTypeFilter) params.append('product_type', String(productTypeFilter));

        // Download
        window.location.href = route('transactions.export') + '?' + params.toString();
    };

    return (
        <div>
            {/* Date Filter Section */}
            <div className="mb-4 rounded-lg border bg-card p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-start">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Filter Berdasarkan Tanggal Transaksi</label>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Popover open={isStartDateOpen} onOpenChange={setIsStartDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-between text-left font-normal sm:w-[200px]',
                                            !startDate && 'text-muted-foreground',
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, 'dd MMM yyyy', { locale: id }) : 'Tanggal mulai'}
                                        </div>
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        captionLayout="dropdown"
                                        onSelect={(date) => {
                                            setStartDate(date);
                                            setIsStartDateOpen(false);
                                        }}
                                        disabled={(date) => date > new Date() || (endDate ? date > endDate : false)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full justify-between text-left font-normal sm:w-[200px]',
                                            !endDate && 'text-muted-foreground',
                                        )}
                                    >
                                        <div className="flex items-center">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, 'dd MMM yyyy', { locale: id }) : 'Tanggal selesai'}
                                        </div>
                                        <ChevronDownIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        captionLayout="dropdown"
                                        onSelect={(date) => {
                                            setEndDate(date);
                                            setIsEndDateOpen(false);
                                        }}
                                        disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center lg:justify-start">
                        <Button onClick={handleApplyDateFilter} disabled={!startDate || !endDate} className="flex w-full items-center gap-2 sm:w-auto">
                            <Filter className="h-4 w-4" />
                            Terapkan Filter
                        </Button>

                        {hasDateFilter && (
                            <Button
                                variant="outline"
                                onClick={handleClearAllFilters}
                                className="flex w-full items-center gap-2 sm:w-auto"
                            >
                                <X className="h-4 w-4" />
                                Hapus Filter
                            </Button>
                        )}

                        <Button onClick={handleExportToExcel} variant="outline" className="flex w-full items-center gap-2 sm:w-auto">
                            <Download className="h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>

                {hasDateFilter && (
                    <div className="mt-3 text-sm text-muted-foreground">
                        Menampilkan transaksi dari <span className="font-medium">{format(startDate, 'dd MMM yyyy', { locale: id })}</span> sampai{' '}
                        <span className="font-medium">{format(endDate, 'dd MMM yyyy', { locale: id })}</span>
                    </div>
                )}
            </div>

            {/* Existing Filters */}
            <div className="flex flex-col items-stretch gap-2 py-4 lg:flex-row lg:items-center">
                <Input
                    placeholder="Cari nama pembeli..."
                    value={(table.getColumn('user_name')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('user_name')?.setFilterValue(event.target.value)}
                    className="lg:max-w-sm"
                />
                <Input
                    placeholder="Cari nama produk..."
                    value={(table.getColumn('items')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('items')?.setFilterValue(event.target.value)}
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
