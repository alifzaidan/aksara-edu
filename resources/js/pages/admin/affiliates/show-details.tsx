import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Affiliate } from './columns';

export default function AffiliateDetail({ affiliate }: { affiliate: Affiliate }) {
    return (
        <div className="space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Data Afiliasi</h2>

            <div className="flex flex-col gap-4 md:flex-row">
                <Input
                    type="text"
                    value={`https://aksademy.com/register?ref=${affiliate.affiliate_code}`}
                    readOnly
                    className="rounded border p-2"
                    placeholder="Link Pembelian"
                />
                <Button
                    type="button"
                    onClick={() => {
                        navigator.clipboard.writeText(`https://aksademy.com/register?ref=${affiliate.affiliate_code}`);
                        toast.success('Link afiliasi berhasil disalin!');
                    }}
                    className="w-full hover:cursor-pointer"
                >
                    Salin Link Afiliasi <LinkIcon />
                </Button>
            </div>

            <p className="text-muted-foreground text-center text-sm">
                Share link diatas kepada calon pengguna untuk mendapatkan komisi dari setiap pembelian yang mereka lakukan.
            </p>
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Status</TableCell>
                        <TableCell>
                            {(() => {
                                const status = affiliate.affiliate_status;
                                let color = 'bg-gray-200 text-gray-800';
                                if (status === 'Active') color = 'bg-blue-100 text-blue-800';
                                if (status === 'Not Active') color = 'bg-zinc-300 text-zinc-700';
                                return <Badge className={`capitalize ${color} border-0`}>{status}</Badge>;
                            })()}
                        </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Nama Afiliasi</TableCell>
                        <TableCell>{affiliate.name}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Email</TableCell>
                        <TableCell>{affiliate.email}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Nomor Telepon</TableCell>
                        <TableCell>{affiliate.phone_number}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell>Komisi</TableCell>
                        <TableCell>{affiliate.commission} %</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    );
}
