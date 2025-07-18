import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Mentor } from './columns';

export default function MentorDetail({ mentor }: { mentor: Mentor }) {
    return (
        <div className="space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Data Mentor</h2>

            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Nama Mentor</TableCell>
                        <TableCell>{mentor.name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>{mentor.email}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Nomor Telepon</TableCell>
                        <TableCell>{mentor.phone_number}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Komisi</TableCell>
                        <TableCell>{mentor.commission} %</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}
