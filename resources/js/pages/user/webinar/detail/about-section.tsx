export default function AboutSection() {
    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-8 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Pembicara Ahli</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Belajar langsung dari para ahli dan praktisi berpengalaman di bidangnya untuk mendapatkan wawasan mendalam.
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Sesi Interaktif</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Manfaatkan sesi tanya jawab langsung untuk berdiskusi, mengklarifikasi keraguan, dan memperluas pemahaman Anda.
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">Wawasan Terkini</h3>
                    <p className="text-muted-foreground text-center text-sm">
                        Dapatkan pemahaman mendalam tentang tren dan teknologi terbaru yang relevan dengan perkembangan karir Anda.
                    </p>
                </div>
            </div>
        </section>
    );
}
