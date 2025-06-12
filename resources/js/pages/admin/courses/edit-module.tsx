import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

interface Module {
    title: string;
    description?: string;
}

interface EditModuleProps {
    setOpen: (open: boolean) => void;
    onEdit: (module: Module) => void;
    module: Module;
}

export default function EditModule({ setOpen, onEdit, module }: EditModuleProps) {
    const [title, setTitle] = useState(module.title);
    const [description, setDescription] = useState(module.description ?? '');
    const [error, setError] = useState('');
    const titleInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(module.title);
        setDescription(module.description ?? '');
        setError('');
    }, [module]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Judul modul harus diisi');
            titleInput.current?.focus();
            return;
        }
        onEdit({ title, description });
    };

    return (
        <DialogContent>
            <DialogTitle>Edit Modul</DialogTitle>
            <DialogDescription>Ubah judul dan deskripsi modul.</DialogDescription>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                    <Label htmlFor="title" className="sr-only">
                        Judul Modul
                    </Label>
                    <Input
                        id="title"
                        type="text"
                        name="title"
                        ref={titleInput}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Judul Modul"
                        autoComplete="off"
                    />
                    <InputError message={error} />
                    <Label htmlFor="description" className="sr-only">
                        Deskripsi Modul
                    </Label>
                    <Input
                        id="description"
                        type="text"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Deskripsi Modul (opsional)"
                        autoComplete="off"
                    />
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button type="submit" className="hover:cursor-pointer">
                        Simpan Perubahan
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
