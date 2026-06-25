import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { Download, FileSpreadsheet, Loader2, UploadCloud, UserPlus } from 'lucide-react';
import { useRef, useState } from 'react';

interface ImportManualParticipantsDialogProps {
    certificateId: string;
}

export default function ImportManualParticipantsDialog({ certificateId }: ImportManualParticipantsDialogProps) {
    const [open, setOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleImport = () => {
        if (!selectedFile) return;

        setIsImporting(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        router.post(route('certificates.import-manual-participants', certificateId), formData, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => {
                setIsImporting(false);
                setSelectedFile(null);
                setOpen(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    const handleOpenChange = (newOpen: boolean) => {
        if (!isImporting) {
            setOpen(newOpen);
            if (!newOpen) {
                setSelectedFile(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <UserPlus className="h-4 w-4" />
                    Import Manual Peserta
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import Manual Peserta
                    </DialogTitle>
                    <DialogDescription>
                        Import peserta langsung ke sertifikat ini melalui file Excel. Peserta tidak dihubungkan ke program manapun.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs text-blue-700">
                            <strong>Catatan:</strong> Kode sertifikat (AKS-{new Date().getFullYear().toString().slice(-2)}XXXX) akan di-generate otomatis untuk setiap
                            peserta. Jika peserta belum terdaftar, akun baru akan dibuat otomatis.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <p className="mb-1.5 text-sm font-medium">1. Unduh template Excel</p>
                            <Button asChild variant="outline" size="sm" className="w-full gap-1.5">
                                <a href={route('certificates.download-participants-template', certificateId)}>
                                    <Download className="h-4 w-4" />
                                    Unduh Template
                                </a>
                            </Button>
                        </div>

                        <div>
                            <p className="mb-1.5 text-sm font-medium">2. Upload file yang sudah diisi</p>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" />

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-1.5"
                                onClick={handleFileSelect}
                                disabled={isImporting}
                            >
                                <UploadCloud className="h-4 w-4" />
                                {selectedFile ? selectedFile.name : 'Pilih File Excel'}
                            </Button>

                            {selectedFile && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                    File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isImporting}>
                        Batal
                    </Button>
                    <Button onClick={handleImport} disabled={!selectedFile || isImporting} className="gap-1.5">
                        {isImporting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Mengimport...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="h-4 w-4" />
                                Import Peserta
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
