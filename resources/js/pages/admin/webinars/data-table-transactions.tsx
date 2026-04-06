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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, CheckCircle, ChevronDownIcon, Clock, Download, Filter, X, XCircle } from 'lucide-react';
import React, { useMemo, useState } from 'react';

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

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    webinarId?: string;
}

export function DataTable<TData, TValue>({ columns, data, webinarId }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    // Date filter states
    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [isStartDateOpen, setIsStartDateOpen] = useState(false);
    const [isEndDateOpen, setIsEndDateOpen] = useState(false);

    // Filter data by date range (client-side)
    const filteredData = useMemo(() => {
        if (!startDate || !endDate) {
            return data;
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return (data as any[]).filter((item) => {
            const status = (item.status || '').toLowerCase();

            if (status === 'paid') {
                if (!item.paid_at) return false;
                const paidAt = new Date(item.paid_at);
                return paidAt >= start && paidAt <= end;
            }

            if (status === 'pending' || status === 'failed') {
                if (!item.created_at) return false;
                const createdAt = new Date(item.created_at);
                return createdAt >= start && createdAt <= end;
            }

            return true;
        });
    }, [data, startDate, endDate]);

    const table = useReactTable({
        data: filteredData,
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

    // Clear all filters including date
    const handleClearAllFilters = () => {
        table.resetColumnFilters();
        setStartDate(undefined);
        setEndDate(undefined);
    };

    const handleExportToExcel = () => {
        const params = new URLSearchParams();

        // Date filter
        if (startDate) params.append('start_date', format(startDate, 'yyyy-MM-dd'));
        if (endDate) params.append('end_date', format(endDate, 'yyyy-MM-dd'));

        // Column/search filters
        const titleFilter = table.getColumn('title')?.getFilterValue() as string;
        if (titleFilter) params.append('title', titleFilter);

        const userNameFilter = table.getColumn('user_name')?.getFilterValue() as string;
        if (userNameFilter) params.append('user_name', userNameFilter);

        const statusFilter = table.getColumn('status')?.getFilterValue();
        if (statusFilter) params.append('status', String(statusFilter));

        const paymentTypeFilter = table.getColumn('payment_type')?.getFilterValue();
        if (paymentTypeFilter) params.append('payment_type', String(paymentTypeFilter));

        params.append('product_type', 'webinar');

        if (webinarId) {
            params.append('webinar_id', webinarId);
        }

        window.location.href = route('transactions.export') + '?' + params.toString();
    };

    return (
        <div>
            {/* Date Filter Section */}
            <div className="mb-4 rounded-lg border bg-card p-4">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Filter Berdasarkan Tanggal Pembayaran</label>
                        <div className="flex flex-col gap-2 sm:flex-row">
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

                    <div className="flex flex-col gap-2 sm:flex-row">
                        {hasDateFilter && (
                            <Button variant="outline" onClick={handleClearAllFilters} className="flex w-full items-center justify-center gap-2 sm:w-auto">
                                <X className="h-4 w-4" />
                                Hapus Filter
                            </Button>
                        )}
                        <Button onClick={handleExportToExcel} variant="outline" className="flex w-full items-center justify-center gap-2 sm:w-auto">
                            <Download className="h-4 w-4" />
                            Export Excel
                        </Button>
                    </div>
                </div>

                {hasDateFilter && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            Menampilkan <span className="font-medium text-foreground">{filteredData.length}</span> dari{' '}
                            <span className="font-medium text-foreground">{(data as any[]).length}</span> transaksi (
                            {format(startDate, 'dd MMM yyyy', { locale: id })} - {format(endDate, 'dd MMM yyyy', { locale: id })})
                        </span>
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
                <div className="flex flex-col items-center gap-2 lg:flex-row">
                    {table.getColumn('status') && <DataTableFacetedFilter column={table.getColumn('status')} title="Status" options={status} />}
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
                                    {hasDateFilter ? 'Tidak ada transaksi dalam rentang tanggal ini.' : 'No results.'}
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
