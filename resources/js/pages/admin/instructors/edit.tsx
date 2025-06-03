import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';

interface EditInstructorProps {
    instructor: {
        id: string;
        name: string;
        email: string;
        phone_number: string;
    };
    setOpen: (open: boolean) => void;
}

export default function EditInstructor({ instructor, setOpen }: EditInstructorProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const emailInput = useRef<HTMLInputElement>(null);
    const phoneInput = useRef<HTMLInputElement>(null);

    const { data, setData, put, processing, reset, errors, clearErrors } = useForm<Required<{ name: string; email: string; phone_number: string }>>({
        name: instructor.name,
        email: instructor.email,
        phone_number: instructor.phone_number,
    });

    useEffect(() => {
        setData({
            name: instructor.name,
            email: instructor.email,
            phone_number: instructor.phone_number,
        });
        clearErrors();
    }, [instructor, setData, clearErrors]);

    const updateInstructor: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('instructors.update', instructor.id), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
            },
            onError: () => nameInput.current?.focus(),
        });
    };

    return (
        <DialogContent>
            <DialogTitle>Edit Instruktur</DialogTitle>
            <DialogDescription>Ubah nama, email, atau nomor telepon instruktur.</DialogDescription>
            <form className="space-y-6" onSubmit={updateInstructor}>
                <div className="grid gap-2">
                    <Label htmlFor="name" className="sr-only">
                        Nama Instruktur
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        name="name"
                        ref={nameInput}
                        value={data.name}
                        onChange={(e) => {
                            setData('name', e.target.value);
                        }}
                        placeholder="Nama Instruktur"
                        autoComplete="off"
                    />
                    <InputError message={errors.name} />

                    <Label htmlFor="email" className="sr-only">
                        Email
                    </Label>
                    <Input
                        id="email"
                        type="text"
                        name="email"
                        ref={emailInput}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        placeholder="Email"
                        autoComplete="off"
                    />
                    <InputError message={errors.email} />

                    <Label htmlFor="phone_number" className="sr-only">
                        Nomor Telepon
                    </Label>
                    <Input
                        id="phone_number"
                        type="text"
                        name="phone_number"
                        ref={phoneInput}
                        value={data.phone_number}
                        onChange={(e) => setData('phone_number', e.target.value)}
                        placeholder="Nomor Telepon"
                        autoComplete="off"
                    />
                    <InputError message={errors.phone_number} />
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild>
                        <button type="submit">Simpan Perubahan</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
