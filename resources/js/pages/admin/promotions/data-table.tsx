import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Promotion } from './columns';

interface DataTableProps {
    columns: any[];
    data: Promotion[];
}

export function DataTable({ columns, data }: DataTableProps) {
    return (
        <div className="mt-6 rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col, idx) => (
                            <TableHead key={idx}>{col.header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, i) => (
                        <TableRow key={row.id}>
                            {columns.map((col, idx) => (
                                <TableCell key={idx}>
                                    {col.cell
                                        ? col.cell({ row: { original: row, index: i } })
                                        : (row as any)[col.accessorKey]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}