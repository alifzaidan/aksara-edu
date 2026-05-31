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
import { DataTableViewOptions } from '@/components/data-table-view-option';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Download, X } from 'lucide-react';
import React from 'react';
import { DateRange } from 'react-day-picker';
import { Earning } from './columns';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
}

function exportToExcel(dateRange: DateRange | undefined) {
    const params = new URLSearchParams();
    if (dateRange?.from) {
        params.set('start_date', format(dateRange.from, 'yyyy-MM-dd'));
        params.set('end_date', format(dateRange.to ?? dateRange.from, 'yyyy-MM-dd'));
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    window.location.href = route('earnings.export') + query;
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

    const filteredData = React.useMemo(() => {
        if (!dateRange?.from) return data;
        return (data as Earning[]).filter((item) => {
            const date = parseISO(item.created_at);
            const from = startOfDay(dateRange.from!);
            const to = endOfDay(dateRange.to ?? dateRange.from!);
            return isWithinInterval(date, { start: from, end: to });
        }) as TData[];
    }, [data, dateRange]);

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

    const dateRangeLabel = React.useMemo(() => {
        if (!dateRange?.from) return 'Pilih rentang tanggal';
        if (!dateRange.to) return format(dateRange.from, 'd MMM yyyy', { locale: id });
        return `${format(dateRange.from, 'd MMM yyyy', { locale: id })} – ${format(dateRange.to, 'd MMM yyyy', { locale: id })}`;
    }, [dateRange]);

    return (
        <div>
            <div className="flex flex-col items-stretch gap-2 py-4 lg:flex-row lg:items-center">
                <Input
                    placeholder="Cari kode invoice..."
                    value={(table.getColumn('invoice.invoice_code')?.getFilterValue() as string) ?? ''}
                    onChange={(event) => table.getColumn('invoice.invoice_code')?.setFilterValue(event.target.value)}
                    className="lg:max-w-sm"
                />

                {/* Date Range Picker */}
                <div className="flex items-center gap-2">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'justify-start gap-2 text-left font-normal',
                                    !dateRange && 'text-muted-foreground',
                                )}
                            >
                                <CalendarIcon className="size-4" />
                                {dateRangeLabel}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range) => {
                                    setDateRange(range);
                                    if (range?.from && range?.to) {
                                        setIsCalendarOpen(false);
                                    }
                                }}
                                numberOfMonths={2}
                                captionLayout="label"
                            />
                        </PopoverContent>
                    </Popover>

                    {dateRange && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDateRange(undefined)}
                            className="text-muted-foreground hover:text-foreground"
                            title="Reset filter tanggal"
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2 lg:ml-auto">
                    {/* Export Button */}
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => exportToExcel(dateRange)}
                    >
                        <Download className="size-4" />
                        Export Excel
                        {dateRange?.from && (
                            <span className="text-muted-foreground text-xs">
                                ({filteredData.length} baris)
                            </span>
                        )}
                    </Button>
                    <DataTableViewOptions table={table} />
                </div>
            </div>

            {/* Info filter aktif */}
            {dateRange?.from && (
                <div className="bg-muted/50 mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <CalendarIcon className="text-muted-foreground size-3.5" />
                    <span>
                        Menampilkan <strong>{filteredData.length}</strong> dari <strong>{data.length}</strong> data
                        {dateRange.from && (
                            <>
                                {' '}untuk periode{' '}
                                <strong>
                                    {format(dateRange.from, 'd MMM yyyy', { locale: id })}
                                    {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
                                        ? ` – ${format(dateRange.to, 'd MMM yyyy', { locale: id })}`
                                        : ''}
                                </strong>
                            </>
                        )}
                    </span>
                </div>
            )}

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
                                    Tidak ada data.
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
