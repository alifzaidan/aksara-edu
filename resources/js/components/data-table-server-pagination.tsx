import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaginatedData } from '@/types/pagination';
import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataTableServerPaginationProps<TData> {
    pagination: PaginatedData<TData>;
}

export function DataTableServerPagination<TData>({ pagination }: DataTableServerPaginationProps<TData>) {
    const handlePageChange = (url: string | null) => {
        if (!url) return;
        router.get(url, {}, { preserveState: true, preserveScroll: true });
    };

    const handlePageSizeChange = (newPageSize: string) => {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('per_page', newPageSize);
        searchParams.set('page', '1');
        
        router.get(
            `${window.location.pathname}?${searchParams.toString()}`,
            {},
            { preserveState: true, preserveScroll: true, replace: true }
        );
    };

    const handleJumpPage = (targetPage: number) => {
        if (targetPage < 1 || targetPage > pagination.last_page || targetPage === pagination.current_page) return;
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('page', targetPage.toString());

        router.get(
            `${window.location.pathname}?${searchParams.toString()}`,
            {},
            { preserveState: true, preserveScroll: true }
        );
    };

    const from = pagination.from ?? (pagination.total > 0 ? (pagination.current_page - 1) * pagination.per_page + 1 : 0);
    const to = pagination.to ?? Math.min(pagination.current_page * pagination.per_page, pagination.total);

    return (
        <div className="flex flex-col items-center justify-between gap-4 px-2 py-3 md:flex-row md:gap-0">
            <div className="text-muted-foreground text-sm">
                Menampilkan <span className="font-medium text-foreground">{from}</span> - <span className="font-medium text-foreground">{to}</span> dari{' '}
                <span className="font-medium text-foreground">{pagination.total}</span> data
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Baris per halaman</p>
                    <Select
                        value={`${pagination.per_page}`}
                        onValueChange={handlePageSizeChange}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={pagination.per_page} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[10, 20, 25, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-center text-sm font-medium">
                    Halaman {pagination.current_page} dari {Math.max(1, pagination.last_page)}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => handleJumpPage(1)}
                        disabled={pagination.current_page <= 1}
                    >
                        <span className="sr-only">Halaman pertama</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => handlePageChange(pagination.prev_page_url ?? null)}
                        disabled={!pagination.prev_page_url}
                    >
                        <span className="sr-only">Halaman sebelumnya</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="size-8"
                        onClick={() => handlePageChange(pagination.next_page_url ?? null)}
                        disabled={!pagination.next_page_url}
                    >
                        <span className="sr-only">Halaman berikutnya</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden size-8 lg:flex"
                        onClick={() => handleJumpPage(pagination.last_page)}
                        disabled={pagination.current_page >= pagination.last_page}
                    >
                        <span className="sr-only">Halaman terakhir</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
