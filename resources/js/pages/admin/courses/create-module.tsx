import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEventHandler, useRef, useState } from 'react';

interface Module {
    title: string;
    description?: string;
}

interface ModuleProps {
    setOpen: (open: boolean) => void;
    onAdd: (module: Module) => void;
}

export default function CreateModule({ setOpen, onAdd }: ModuleProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const titleInput = useRef<HTMLInputElement>(null);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Judul modul harus diisi');
            titleInput.current?.focus();
            return;
        }
        onAdd({ title, description });
        setTitle('');
        setDescription('');
        setError('');
    };

    return (
        <DialogContent>
            <DialogTitle>Tambah Modul</DialogTitle>
            <DialogDescription>Masukkan judul dan deskripsi modul.</DialogDescription>
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
                        Tambah Modul
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
