import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Mentor } from './columns';

export default function MentorDetail({ mentor }: { mentor: Mentor }) {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    };

    return (
        <div className="space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Data Mentor</h2>

            <div className="flex items-center gap-4 border-b pb-4">
                {mentor.avatar ? (
                    <img src={`/storage/${mentor.avatar}`} alt={mentor.name} className="h-24 w-24 rounded-full object-cover" />
                ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-300 text-2xl font-bold text-gray-700">
                        {getInitials(mentor.name)}
                    </div>
                )}
                <div>
                    <h3 className="text-xl font-semibold">{mentor.name}</h3>
                    {mentor.bio && <p className="text-sm text-gray-600">{mentor.bio}</p>}
                </div>
            </div>

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
