import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';

interface EditMentorProps {
    mentor: {
        id: string;
        name: string;
        bio?: string;
        email: string;
        phone_number: string;
        commission: number;
    };
    setOpen: (open: boolean) => void;
}

export default function EditMentor({ mentor, setOpen }: EditMentorProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const bioInput = useRef<HTMLInputElement>(null);
    const emailInput = useRef<HTMLInputElement>(null);
    const phoneInput = useRef<HTMLInputElement>(null);
    const commissionInput = useRef<HTMLInputElement>(null);

    const { data, setData, put, processing, reset, errors, clearErrors } = useForm<
        Required<{ name: string; bio: string; email: string; phone_number: string; commission: number }>
    >({
        name: mentor.name,
        bio: mentor.bio ?? '',
        email: mentor.email,
        phone_number: mentor.phone_number,
        commission: mentor.commission,
    });

    useEffect(() => {
        setData({
            name: mentor.name,
            bio: mentor.bio ?? '',
            email: mentor.email,
            phone_number: mentor.phone_number,
            commission: mentor.commission,
        });
        clearErrors();
    }, [mentor, setData, clearErrors]);

    const updateMentor: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('mentors.update', mentor.id), {
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
            <DialogTitle>Edit Mentor</DialogTitle>
            <DialogDescription>Ubah nama, email, atau nomor telepon mentor.</DialogDescription>
            <form className="space-y-6" onSubmit={updateMentor}>
                <div className="grid gap-2">
                    <Label htmlFor="name" className="sr-only">
                        Nama Mentor
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
                        placeholder="Nama Mentor"
                        autoComplete="off"
                    />
                    <InputError message={errors.name} />

                    <Label htmlFor="bio" className="sr-only">
                        Bio Mentor
                    </Label>
                    <Input
                        id="bio"
                        type="text"
                        name="bio"
                        ref={bioInput}
                        value={data.bio}
                        onChange={(e) => {
                            setData('bio', e.target.value);
                        }}
                        placeholder="Bio Mentor, contoh: Frontend Developer, UI/UX Designer, dsb."
                        autoComplete="off"
                    />
                    <InputError message={errors.bio} />

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

                    <Label htmlFor="commission" className="text-xs text-gray-500">
                        Komisi (%) - Komisi yang akan diterima mentor dari setiap transaksi
                    </Label>
                    <Input
                        id="commission"
                        type="number"
                        name="commission"
                        ref={commissionInput}
                        value={data.commission}
                        onChange={(e) => {
                            setData('commission', Number(e.target.value));
                        }}
                        placeholder="Komisi"
                        autoComplete="off"
                    />
                    <InputError message={errors.commission} />
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild className="hover:cursor-pointer">
                        <button type="submit">Simpan Perubahan</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
