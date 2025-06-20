export default function AboutSection() {
    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-white p-6 md:grid-cols-3 dark:border-zinc-700 dark:bg-zinc-800">
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">4.90/5.00</h3>
                    <p className="text-center text-sm">Menjadi nomor #1 Coding Bootcamp di Pendem berdasarkan Penilaian Course Report</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">9 Juta Rupiah</h3>
                    <p className="text-center text-sm">Alumni Aksarise memiliki gaji rata - rata sebesar 9 juta rupiah setelah lulus kuliah</p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                    <h3 className="text-3xl font-bold italic">1000+</h3>
                    <p className="text-center text-sm">Lowongan pekerjaan untuk profesi Front End Developer berdasarkan job portal.</p>
                </div>
            </div>
        </section>
    );
}
