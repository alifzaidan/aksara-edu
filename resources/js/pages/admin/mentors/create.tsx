import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

interface CreateMentorProps {
    setOpen: (open: boolean) => void;
}

export default function CreateMentor({ setOpen }: CreateMentorProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const bioInput = useRef<HTMLInputElement>(null);
    const emailInput = useRef<HTMLInputElement>(null);
    const phoneInput = useRef<HTMLInputElement>(null);
    const commissionInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        submit: create,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm<Required<{ name: string; bio: string; email: string; phone_number: string; password: string; commission: number }>>({
        name: '',
        bio: '',
        email: '',
        phone_number: '',
        password: '',
        commission: 0,
    });

    const createMentor: FormEventHandler = (e) => {
        e.preventDefault();

        create('post', route('mentors.store'), {
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
            <DialogTitle>Tambah Mentor Baru</DialogTitle>
            <DialogDescription>Silakan masukkan data mentor baru yang ingin Anda tambahkan.</DialogDescription>
            <form className="space-y-6" onSubmit={createMentor}>
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
                        type="email"
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
                        onChange={(e) => {
                            setData('phone_number', e.target.value);
                            setData('password', e.target.value);
                        }}
                        placeholder="Nomor Telepon"
                        autoComplete="off"
                    />
                    <InputError message={errors.phone_number} />

                    <Label htmlFor="password" className="sr-only">
                        Password
                    </Label>
                    <Input
                        id="password"
                        type="text"
                        name="password"
                        ref={phoneInput}
                        value={data.password}
                        placeholder="Password"
                        autoComplete="off"
                        disabled
                    />
                    <InputError message={errors.password} />

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
                        <button type="submit">Tambah Mentor</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
