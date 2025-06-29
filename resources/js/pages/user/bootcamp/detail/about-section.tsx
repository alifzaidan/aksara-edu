export default function AboutSection() {
    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-8 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Kurikulum Modern</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Dirancang sesuai kebutuhan industri terkini untuk memastikan Anda siap menghadapi tantangan nyata.
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Siap Karir</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Membangun fondasi yang kuat dengan portofolio proyek nyata untuk memulai karir di dunia teknologi.
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Dukungan Penuh</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Dapatkan dukungan dari mentor berpengalaman dan komunitas belajar yang aktif selama perjalanan Anda.
                    </p>
                </div>
            </div>
        </section>
    );
}
