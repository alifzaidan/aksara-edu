import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';

export default function PrivacyPolicy() {
    return (
        <UserLayout>
            <Head title="Kebijakan Privasi" />

            <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
                        <div className="mb-8 text-center">
                            <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">Kebijakan Privasi</h1>
                            <p className="text-gray-600 dark:text-gray-400">Terakhir diperbarui: 12 Juli 2025</p>
                        </div>

                        <div className="prose prose-gray dark:prose-invert max-w-none">
                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">1. Pendahuluan</h2>
                                <p className="mb-4 text-gray-700 dark:text-gray-300">
                                    CV. Aksara Teknologi Mandiri ("kami", "kita", atau "Aksademy") berkomitmen untuk melindungi privasi dan keamanan
                                    informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan
                                    melindungi informasi pribadi Anda ketika menggunakan platform pembelajaran online kami.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Dengan menggunakan layanan Aksademy, Anda menyetujui praktik yang dijelaskan dalam Kebijakan Privasi ini. Jika
                                    Anda tidak menyetujui kebijakan ini, mohon untuk tidak menggunakan layanan kami.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">2. Informasi yang Kami Kumpulkan</h2>

                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    <div>
                                        <h3 className="mb-2 font-semibold">2.1 Informasi yang Anda Berikan</h3>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Nama lengkap</li>
                                            <li>Alamat email</li>
                                            <li>Nomor telepon</li>
                                            <li>Tanggal lahir</li>
                                            <li>Jenis kelamin</li>
                                            <li>Alamat domisili</li>
                                            <li>Pekerjaan dan latar belakang pendidikan</li>
                                            <li>Foto profil (opsional)</li>
                                            <li>Informasi pembayaran</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">2.2 Informasi yang Dikumpulkan Secara Otomatis</h3>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Alamat IP dan lokasi geografis</li>
                                            <li>Jenis perangkat dan sistem operasi</li>
                                            <li>Browser yang digunakan</li>
                                            <li>Aktivitas browsing di platform kami</li>
                                            <li>Waktu akses dan durasi penggunaan</li>
                                            <li>Halaman yang dikunjungi</li>
                                            <li>Progres pembelajaran</li>
                                            <li>Interaksi dengan konten</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">2.3 Informasi dari Pihak Ketiga</h3>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Informasi dari platform media sosial (jika Anda login menggunakan akun sosial media)</li>
                                            <li>Data dari penyedia layanan pembayaran</li>
                                            <li>Informasi dari mitra bisnis kami</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">3. Tujuan Penggunaan Informasi</h2>
                                <p className="mb-3 text-gray-700 dark:text-gray-300">Kami menggunakan informasi pribadi Anda untuk:</p>
                                <ul className="ml-4 list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                                    <li>Menyediakan dan mengelola layanan pembelajaran</li>
                                    <li>Memproses pendaftaran dan pembayaran</li>
                                    <li>Memberikan dukungan pelanggan</li>
                                    <li>Mengirimkan komunikasi terkait layanan</li>
                                    <li>Mempersonalisasi pengalaman belajar</li>
                                    <li>Menganalisis dan meningkatkan layanan kami</li>
                                    <li>Mencegah penipuan dan aktivitas yang merugikan</li>
                                    <li>Mematuhi kewajiban hukum</li>
                                    <li>Mengirimkan materi pemasaran (dengan persetujuan Anda)</li>
                                    <li>Melakukan riset dan analisis untuk pengembangan produk</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">4. Pembagian Informasi</h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    <p>
                                        Kami tidak menjual, menyewakan, atau memperdagangkan informasi pribadi Anda kepada pihak ketiga. Namun, kami
                                        dapat membagikan informasi Anda dalam situasi berikut:
                                    </p>

                                    <div>
                                        <h3 className="mb-2 font-semibold">4.1 Penyedia Layanan</h3>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Penyedia layanan pembayaran</li>
                                            <li>Penyedia layanan cloud dan hosting</li>
                                            <li>Penyedia layanan email dan komunikasi</li>
                                            <li>Penyedia layanan analitik</li>
                                        </ul>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">4.2 Kewajiban Hukum</h3>
                                        <p>Ketika diharuskan oleh hukum, perintah pengadilan, atau permintaan pemerintah yang sah.</p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">4.3 Perlindungan Hak</h3>
                                        <p>Untuk melindungi hak, properti, dan keselamatan Aksademy, pengguna kami, atau masyarakat umum.</p>
                                    </div>

                                    <div>
                                        <h3 className="mb-2 font-semibold">4.4 Transaksi Bisnis</h3>
                                        <p>Dalam hal merger, akuisisi, atau penjualan aset perusahaan.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">5. Keamanan Data</h2>
                                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                    <p>
                                        Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi informasi pribadi
                                        Anda, termasuk:
                                    </p>
                                    <ul className="ml-4 list-inside list-disc space-y-1">
                                        <li>Enkripsi data saat transit dan penyimpanan</li>
                                        <li>Kontrol akses yang ketat</li>
                                        <li>Pemantauan keamanan secara berkala</li>
                                        <li>Pelatihan keamanan untuk karyawan</li>
                                        <li>Audit keamanan reguler</li>
                                        <li>Backup data secara teratur</li>
                                    </ul>
                                    <p>
                                        Meskipun kami berusaha maksimal melindungi data Anda, tidak ada sistem yang 100% aman. Kami mendorong Anda
                                        untuk menggunakan kata sandi yang kuat dan menjaga kerahasiaan informasi akun Anda.
                                    </p>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">6. Penyimpanan dan Retensi Data</h2>
                                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                    <p>Kami menyimpan informasi pribadi Anda selama:</p>
                                    <ul className="ml-4 list-inside list-disc space-y-1">
                                        <li>Akun aktif: Selama akun Anda masih aktif</li>
                                        <li>Data transaksi: 10 tahun setelah transaksi terakhir</li>
                                        <li>Data komunikasi: 3 tahun setelah komunikasi terakhir</li>
                                        <li>Log sistem: 1 tahun setelah pencatatan</li>
                                        <li>Data marketing: Hingga Anda menarik persetujuan</li>
                                    </ul>
                                    <p>
                                        Data akan dihapus secara aman setelah periode retensi berakhir, kecuali jika diwajibkan oleh hukum untuk
                                        menyimpannya lebih lama.
                                    </p>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">7. Hak Anda atas Data Pribadi</h2>
                                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                    <p>Anda memiliki hak untuk:</p>
                                    <ul className="ml-4 list-inside list-disc space-y-1">
                                        <li>
                                            <strong>Akses:</strong> Meminta salinan data pribadi yang kami miliki tentang Anda
                                        </li>
                                        <li>
                                            <strong>Perbaikan:</strong> Meminta koreksi data yang tidak akurat atau tidak lengkap
                                        </li>
                                        <li>
                                            <strong>Penghapusan:</strong> Meminta penghapusan data pribadi Anda
                                        </li>
                                        <li>
                                            <strong>Pembatasan:</strong> Meminta pembatasan pemrosesan data Anda
                                        </li>
                                        <li>
                                            <strong>Portabilitas:</strong> Meminta transfer data ke penyedia layanan lain
                                        </li>
                                        <li>
                                            <strong>Keberatan:</strong> Menolak pemrosesan data untuk tujuan tertentu
                                        </li>
                                        <li>
                                            <strong>Penarikan persetujuan:</strong> Menarik persetujuan yang telah diberikan
                                        </li>
                                    </ul>
                                    <p>
                                        Untuk menggunakan hak-hak ini, silakan hubungi kami melalui informasi kontak yang tercantum di bagian akhir
                                        kebijakan ini.
                                    </p>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">8. Cookies dan Teknologi Serupa</h2>
                                <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                    <p>Kami menggunakan cookies dan teknologi serupa untuk:</p>
                                    <ul className="ml-4 list-inside list-disc space-y-1">
                                        <li>Menjaga sesi login Anda</li>
                                        <li>Menyimpan preferensi pengguna</li>
                                        <li>Menganalisis penggunaan website</li>
                                        <li>Menyediakan konten yang dipersonalisasi</li>
                                        <li>Meningkatkan keamanan</li>
                                    </ul>

                                    <div>
                                        <h3 className="mb-2 font-semibold">Jenis Cookies:</h3>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>
                                                <strong>Essential Cookies:</strong> Diperlukan untuk fungsi dasar website
                                            </li>
                                            <li>
                                                <strong>Analytics Cookies:</strong> Membantu kami memahami penggunaan website
                                            </li>
                                            <li>
                                                <strong>Functional Cookies:</strong> Menyimpan preferensi pengguna
                                            </li>
                                            <li>
                                                <strong>Marketing Cookies:</strong> Digunakan untuk menampilkan iklan yang relevan
                                            </li>
                                        </ul>
                                    </div>

                                    <p>
                                        Anda dapat mengatur preferensi cookies melalui pengaturan browser Anda. Namun, menonaktifkan cookies tertentu
                                        dapat mempengaruhi fungsionalitas website.
                                    </p>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">9. Transfer Data Internasional</h2>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Data pribadi Anda dapat diproses dan disimpan di server yang berlokasi di luar Indonesia. Kami memastikan bahwa
                                    setiap transfer data internasional dilakukan dengan perlindungan yang memadai sesuai dengan hukum yang berlaku,
                                    termasuk melalui perjanjian perlindungan data yang sesuai.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">10. Perlindungan Data Anak</h2>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Layanan kami tidak ditujukan untuk anak-anak di bawah usia 13 tahun. Kami tidak dengan sengaja mengumpulkan
                                    informasi pribadi dari anak-anak di bawah usia 13 tahun. Jika Anda adalah orang tua atau wali dan mengetahui bahwa
                                    anak Anda telah memberikan informasi pribadi kepada kami, silakan hubungi kami untuk menghapus informasi tersebut.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">11. Perubahan Kebijakan Privasi</h2>
                                <p className="text-gray-700 dark:text-gray-300">
                                    Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu untuk mencerminkan perubahan dalam praktik kami
                                    atau karena alasan operasional, hukum, atau regulasi lainnya. Perubahan material akan diberitahukan kepada Anda
                                    melalui email atau pemberitahuan di platform kami. Kebijakan yang diperbarui akan berlaku sejak tanggal "Terakhir
                                    diperbarui" yang tercantum di bagian atas halaman ini.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">12. Dasar Hukum Pemrosesan</h2>
                                <div className="text-gray-700 dark:text-gray-300">
                                    <p className="mb-3">Kami memproses data pribadi Anda berdasarkan:</p>
                                    <ul className="ml-4 list-inside list-disc space-y-1">
                                        <li>
                                            <strong>Persetujuan:</strong> Ketika Anda memberikan persetujuan untuk pemrosesan tertentu
                                        </li>
                                        <li>
                                            <strong>Kontrak:</strong> Untuk melaksanakan kontrak layanan dengan Anda
                                        </li>
                                        <li>
                                            <strong>Kewajiban hukum:</strong> Untuk mematuhi kewajiban hukum kami
                                        </li>
                                        <li>
                                            <strong>Kepentingan sah:</strong> Untuk menjalankan kepentingan bisnis yang sah
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            <section className="mb-8">
                                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">13. Hubungi Kami</h2>
                                <div className="text-gray-700 dark:text-gray-300">
                                    <p className="mb-3">
                                        Jika Anda memiliki pertanyaan, kekhawatiran, atau permintaan terkait kebijakan privasi ini atau pemrosesan
                                        data pribadi Anda, silakan hubungi kami melalui:
                                    </p>
                                    <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                        <p>
                                            <strong>Tim Perlindungan Data</strong>
                                        </p>
                                        <p>
                                            <strong>CV. Aksara Teknologi Mandiri</strong>
                                        </p>
                                        <p>Email: privacy@aksademy.co.id</p>
                                        <p>Email umum: info@aksademy.co.id</p>
                                        <p>WhatsApp: +6285142505794</p>
                                        <p>
                                            Alamat: Perumahan Permata Permadani, Blok B1
                                            <br />
                                            Kel. Pendem Kec. Junrejo Kota Batu
                                            <br />
                                            Prov. Jawa Timur, 65324
                                        </p>
                                    </div>
                                    <p className="mt-4 text-sm">
                                        Kami akan merespons permintaan Anda dalam waktu 30 hari setelah menerima permintaan yang lengkap.
                                    </p>
                                </div>
                            </section>
                        </div>

                        <div className="mt-8 border-t border-gray-200 pt-8 text-center dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Dengan menggunakan layanan Aksademy, Anda menyetujui kebijakan privasi di atas.
                            </p>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Baca juga{' '}
                                <Link href={route('terms-and-conditions')} className="text-blue-600 underline hover:text-blue-800">
                                    Syarat dan Ketentuan
                                </Link>{' '}
                                kami.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
