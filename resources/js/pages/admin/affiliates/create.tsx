import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

interface CreateAffiliateProps {
    setOpen: (open: boolean) => void;
}

function generateAffiliateCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export default function CreateAffiliate({ setOpen }: CreateAffiliateProps) {
    const nameInput = useRef<HTMLInputElement>(null);
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
    } = useForm<
        Required<{
            name: string;
            email: string;
            phone_number: string;
            password: string;
            affiliate_code: string;
            affiliate_status: string;
            commission: number;
        }>
    >({
        name: '',
        email: '',
        phone_number: '',
        affiliate_code: generateAffiliateCode(),
        affiliate_status: 'active',
        commission: 0,
        password: '',
    });

    const createAffiliate: FormEventHandler = (e) => {
        e.preventDefault();

        create('post', route('affiliates.store'), {
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
            <DialogTitle>Tambah Affiliate Baru</DialogTitle>
            <DialogDescription>Silakan masukkan data affiliate baru yang ingin Anda tambahkan.</DialogDescription>
            <form className="space-y-6" onSubmit={createAffiliate}>
                <div className="grid gap-2">
                    <Label htmlFor="name" className="sr-only">
                        Nama Affiliate
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
                        placeholder="Nama Affiliate"
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

                    <Label htmlFor="affiliate_code" className="sr-only">
                        Kode Afiliasi
                    </Label>
                    <Input
                        id="affiliate_code"
                        type="text"
                        name="affiliate_code"
                        value={data.affiliate_code}
                        onChange={(e) => {
                            setData('affiliate_code', e.target.value);
                        }}
                        placeholder="Kode Afiliasi"
                        autoComplete="off"
                        disabled
                    />
                    <InputError message={errors.affiliate_code} />

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
                        <button type="submit">Tambah Affiliate</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
