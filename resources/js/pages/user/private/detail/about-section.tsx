export default function AboutSection() {
    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-8 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Bimbingan Personal</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Dapatkan perhatian penuh dari mentor dengan sesi kelas yang lebih intim dan interaktif.
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Materi Disesuaikan</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Kurikulum dan materi disesuaikan dengan kebutuhan dan tingkat kemampuan Anda secara personal.
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Fleksibel</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Pilih jadwal yang sesuai dengan ketersediaan waktu Anda. Tersedia secara online maupun offline.
                    </p>
                </div>
            </div>
        </section>
    );
}
