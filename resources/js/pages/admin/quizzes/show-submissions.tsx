import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

// Example type, adjust as needed for real data
interface Submission {
    id: string;
    user_name: string;
    user_email: string;
    score: number;
    is_passed: boolean;
    submitted_at: string;
}

interface QuizSubmissionProps {
    submissions?: Submission[];
}

export default function QuizSubmission({ submissions = [] }: QuizSubmissionProps) {
    return (
        <div className="min-h-full space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Riwayat Pengerjaan Quiz</h2>
            {submissions.length === 0 ? (
                <div className="text-center text-sm text-gray-500">Belum ada riwayat pengerjaan.</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1">No</TableHead>
                            <TableHead>Nama Peserta</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Nilai</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {submissions.map((s, idx) => (
                            <TableRow key={s.id}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>{s.user_name}</TableCell>
                                <TableCell>{s.user_email}</TableCell>
                                <TableCell>
                                    <span className={s.is_passed ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                                        {s.score}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    {s.is_passed ? (
                                        <Badge className="bg-green-100 text-green-700 border-0 flex items-center gap-1">
                                            <CheckCircle className="w-4 h-4 mr-1" /> Lulus
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-red-100 text-red-700 border-0 flex items-center gap-1">
                                            <XCircle className="w-4 h-4 mr-1" /> Tidak Lulus
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        const d = new Date(s.submitted_at);
                                        const tanggal = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                        const jam = d.getHours().toString().padStart(2, '0');
                                        const menit = d.getMinutes().toString().padStart(2, '0');
                                        return `${tanggal} ${jam}.${menit}`;
                                    })()}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
