import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

interface CreateUserProps {
    setOpen: (open: boolean) => void;
}

export default function CreateUser({ setOpen }: CreateUserProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const emailInput = useRef<HTMLInputElement>(null);
    const phoneInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        submit: create,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm<Required<{ name: string; email: string; phone_number: string; password: string }>>({
        name: '',
        email: '',
        phone_number: '',
        password: '',
    });

    const createUser: FormEventHandler = (e) => {
        e.preventDefault();

        create('post', route('users.store'), {
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
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>Silakan masukkan data pengguna baru yang ingin Anda tambahkan.</DialogDescription>
            <form className="space-y-6" onSubmit={createUser}>
                <div className="grid gap-2">
                    <Label htmlFor="name" className="sr-only">
                        Nama Pengguna
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
                        placeholder="Nama Pengguna"
                        autoComplete="off"
                    />
                    <InputError message={errors.name} />

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
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild className="hover:cursor-pointer">
                        <button type="submit">Tambah Pengguna</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
