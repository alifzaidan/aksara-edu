import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

export default function TermsAndConditions() {
    const { i18n } = useTranslation();
    const isEn = i18n.language === 'en';

    return (
        <UserLayout>
            <Head title={isEn ? 'Terms and Conditions' : 'Syarat dan Ketentuan'} />

            <div className="min-h-screen bg-gray-50 py-12 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-gray-800">
                        <div className="mb-8 text-center">
                            <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
                                {isEn ? 'Terms and Conditions' : 'Syarat dan Ketentuan'}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {isEn ? 'Last updated: July 12, 2025' : 'Terakhir diperbarui: 12 Juli 2025'}
                            </p>
                        </div>

                        {isEn ? (
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">1. Introduction</h2>
                                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                                        Welcome to Aksademy. These terms and conditions govern your use of the online learning services provided by CV. Aksara Teknologi Mandiri ("we", "us", or "Aksademy").
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        By accessing and using the Aksademy platform, you agree to be bound by these terms and conditions. If you do not agree with any part of these terms, please refrain from using our services.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">2. Definitions</h2>
                                    <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                                        <li>
                                            <strong>Platform:</strong> Aksademy website and applications accessible via aksademy.co.id
                                        </li>
                                        <li>
                                            <strong>User:</strong> Any individual who accesses or uses our platform
                                        </li>
                                        <li>
                                            <strong>Online Courses:</strong> Digital learning courses available on the platform
                                        </li>
                                        <li>
                                            <strong>Bootcamp:</strong> Intensive training programs with a specified duration
                                        </li>
                                        <li>
                                            <strong>Webinar:</strong> Interactive scheduled online seminars
                                        </li>
                                        <li>
                                            <strong>Content:</strong> All learning materials including videos, text, and supporting files
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">3. Account Registration</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <p>
                                            To access certain services, you must create an account by providing accurate and complete information.
                                        </p>
                                        <p>You are responsible for:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Maintaining the confidentiality of your account credentials</li>
                                            <li>Ensuring that information provided is accurate and up to date</li>
                                            <li>Notifying us immediately of any unauthorized use of your account</li>
                                            <li>Not sharing your account access with third parties</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">4. Our Services</h2>
                                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                        <div>
                                            <h3 className="mb-2 font-semibold">4.1 Online Courses</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Lifetime access to purchased courses</li>
                                                <li>Materials accessible anytime upon successful purchase</li>
                                                <li>Periodic content updates without additional charges</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="mb-2 font-semibold">4.2 Bootcamp</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Structured program with scheduled curriculum and duration</li>
                                                <li>Direct interaction with instructors and fellow participants</li>
                                                <li>Certificate of completion upon finishing the program requirements</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="mb-2 font-semibold">4.3 Webinar</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Live sessions on a scheduled timetable</li>
                                                <li>Access to recording after the event concludes</li>
                                                <li>Q&A opportunity with speakers and experts</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">5. Payment and Refund Policy</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <div>
                                            <h3 className="mb-2 font-semibold">5.1 Payment</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>All payments are processed in Indonesian Rupiah (IDR)</li>
                                                <li>Payment can be made through various supported methods</li>
                                                <li>Service access is granted once payment is confirmed</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="mb-2 font-semibold">5.2 Refund Policy</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Refund requests are accepted within 7 days of purchase</li>
                                                <li>Requirement: less than 20% course content completed</li>
                                                <li>For bootcamps and webinars: 100% refund if cancelled before program start</li>
                                                <li>Refunds are processed within 7-14 business days</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">6. Intellectual Property Rights</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <p>All content available on this platform, including but not limited to:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Instructional videos</li>
                                            <li>Written materials</li>
                                            <li>Presentation slides</li>
                                            <li>Source code and repositories</li>
                                            <li>Logos and trademarks</li>
                                        </ul>
                                        <p>Is the property of Aksademy or its licensed contributors. Users are strictly prohibited from:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Distributing content without prior authorization</li>
                                            <li>Using content for commercial purposes</li>
                                            <li>Modifying or altering course materials</li>
                                            <li>Sharing account credentials with third parties</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">7. User Obligations and Restrictions</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <p>Users agree to:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Use the platform solely for educational purposes</li>
                                            <li>Respect the rights and privacy of other users</li>
                                            <li>Refrain from actions that may compromise system security</li>
                                            <li>Comply with all applicable local and international laws</li>
                                        </ul>
                                        <p>Users are strictly forbidden to:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Use the platform for any illegal purpose</li>
                                            <li>Upload unlawful or malicious content</li>
                                            <li>Engage in spam or disruptive behaviors</li>
                                            <li>Attempt unauthorized access to backend systems</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">8. Privacy and Data Protection</h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        The use of your personal data is governed by our{' '}
                                        <Link href={route('privacy-policy')} className="text-blue-600 underline hover:text-blue-800">
                                            Privacy Policy
                                        </Link>. By using our services, you consent to our collection and usage of information in accordance with that policy.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">9. Limitation of Liability</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <p>Aksademy shall not be liable for:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Technical issues or external server outages</li>
                                            <li>Data loss resulting from user error or negligence</li>
                                            <li>Financial losses arising from use of the platform</li>
                                            <li>Inaccuracies in content supplied by third parties</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">10. Modifications to Terms</h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        We reserve the right to amend these terms and conditions at any time. Updates will take effect immediately upon publication on this page. Users are advised to review this page periodically.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">11. Governing Law</h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        These terms and conditions are governed by and construed in accordance with the laws of the Republic of Indonesia. Any disputes shall be submitted to the exclusive jurisdiction of Indonesian courts.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">12. Contact Us</h2>
                                    <div className="text-gray-700 dark:text-gray-300">
                                        <p className="mb-3">
                                            If you have questions regarding these terms, please contact us at:
                                        </p>
                                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                            <p>
                                                <strong>CV. Aksara Teknologi Mandiri</strong>
                                            </p>
                                            <p>Email: aksarateknologimandiri@gmail.com</p>
                                            <p>WhatsApp: +6285142505794</p>
                                            <p>
                                                Address: Perumahan Permata Permadani, Blok B1
                                                <br />
                                                Kel. Pendem Kec. Junrejo Kota Batu
                                                <br />
                                                Prov. Jawa Timur, 65324
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <div className="prose prose-gray dark:prose-invert max-w-none">
                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">1. Pendahuluan</h2>
                                    <p className="mb-4 text-gray-700 dark:text-gray-300">
                                        Selamat datang di Aksademy. Syarat dan ketentuan ini mengatur penggunaan layanan pembelajaran online yang
                                        disediakan oleh CV. Aksara Teknologi Mandiri ("kami", "kita", atau "Aksademy").
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Dengan mengakses dan menggunakan platform Aksademy, Anda menyetujui untuk terikat dengan syarat dan ketentuan ini.
                                        Jika Anda tidak menyetujui syarat dan ketentuan ini, mohon untuk tidak menggunakan layanan kami.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">2. Definisi</h2>
                                    <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                                        <li>
                                            <strong>Platform:</strong> Website dan aplikasi Aksademy yang dapat diakses melalui aksademy.co.id
                                        </li>
                                        <li>
                                            <strong>Pengguna:</strong> Setiap individu yang mengakses atau menggunakan platform kami
                                        </li>
                                        <li>
                                            <strong>Kelas Online:</strong> Kursus pembelajaran digital yang tersedia di platform
                                        </li>
                                        <li>
                                            <strong>Bootcamp:</strong> Program pelatihan intensif dengan durasi tertentu
                                        </li>
                                        <li>
                                            <strong>Webinar:</strong> Seminar online interaktif dengan waktu terjadwal
                                        </li>
                                        <li>
                                            <strong>Konten:</strong> Semua materi pembelajaran termasuk video, teks, dan file pendukung
                                        </li>
                                    </ul>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">3. Pendaftaran Akun</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <p>
                                            Untuk menggunakan layanan tertentu, Anda perlu membuat akun dengan memberikan informasi yang akurat dan
                                            lengkap.
                                        </p>
                                        <p>Anda bertanggung jawab untuk:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Menjaga kerahasiaan informasi akun Anda</li>
                                            <li>Memastikan informasi yang diberikan akurat dan terkini</li>
                                            <li>Memberi tahu kami jika terjadi penggunaan akun yang tidak sah</li>
                                            <li>Tidak membagikan akun kepada pihak lain</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">4. Layanan Kami</h2>
                                    <div className="space-y-4 text-gray-700 dark:text-gray-300">
                                        <div>
                                            <h3 className="mb-2 font-semibold">4.1 Kelas Online</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Akses seumur hidup untuk kelas yang telah dibeli</li>
                                                <li>Materi dapat diakses kapan saja setelah pembelian</li>
                                                <li>Update materi secara berkala tanpa biaya tambahan</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="mb-2 font-semibold">4.2 Bootcamp</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Program dengan jadwal dan durasi yang telah ditentukan</li>
                                                <li>Interaksi langsung dengan instruktur dan peserta lain</li>
                                                <li>Sertifikat kelulusan bagi yang menyelesaikan program</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="mb-2 font-semibold">4.3 Webinar</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Sesi langsung dengan jadwal yang telah ditentukan</li>
                                                <li>Akses rekaman webinar setelah acara selesai</li>
                                                <li>Kesempatan tanya jawab dengan pembicara</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">5. Pembayaran dan Pengembalian Dana</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <div>
                                            <h3 className="mb-2 font-semibold">5.1 Pembayaran</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Semua pembayaran dilakukan dalam mata uang Rupiah (IDR)</li>
                                                <li>Pembayaran dapat dilakukan melalui berbagai metode yang tersedia</li>
                                                <li>Akses ke layanan diberikan setelah pembayaran dikonfirmasi</li>
                                            </ul>
                                        </div>
                                        <div>
                                            <h3 className="mb-2 font-semibold">5.2 Kebijakan Pengembalian Dana</h3>
                                            <ul className="ml-4 list-inside list-disc space-y-1">
                                                <li>Pengembalian dana dapat dilakukan dalam 7 hari setelah pembelian</li>
                                                <li>Syarat: belum mengakses lebih dari 20% materi kelas</li>
                                                <li>Untuk bootcamp dan webinar: pengembalian dana 100% jika dibatalkan sebelum acara dimulai</li>
                                                <li>Proses pengembalian dana akan diproses dalam 7-14 hari kerja</li>
                                            </ul>
                                        </div>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">6. Hak Kekayaan Intelektual</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <p>Semua konten yang tersedia di platform ini, termasuk namun tidak terbatas pada:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Video pembelajaran</li>
                                            <li>Materi tertulis</li>
                                            <li>Slide presentasi</li>
                                            <li>Kode program</li>
                                            <li>Logo dan merek dagang</li>
                                        </ul>
                                        <p>Adalah milik Aksademy atau pembuat konten yang berlisensi kepada kami. Pengguna dilarang untuk:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Mendistribusikan konten tanpa izin</li>
                                            <li>Menggunakan konten untuk keperluan komersial</li>
                                            <li>Memodifikasi atau mengubah konten</li>
                                            <li>Membagikan akses akun kepada pihak lain</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">7. Kewajiban dan Larangan Pengguna</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <p>Pengguna setuju untuk:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Menggunakan platform sesuai dengan tujuan pembelajaran</li>
                                            <li>Menghormati hak pengguna lain</li>
                                            <li>Tidak melakukan tindakan yang dapat merusak platform</li>
                                            <li>Mematuhi semua hukum yang berlaku</li>
                                        </ul>
                                        <p>Pengguna dilarang untuk:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Menggunakan platform untuk tujuan ilegal</li>
                                            <li>Mengunggah konten yang melanggar hukum</li>
                                            <li>Melakukan spam atau tindakan yang mengganggu</li>
                                            <li>Mencoba mengakses sistem tanpa otorisasi</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">8. Privasi dan Perlindungan Data</h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Penggunaan data pribadi Anda diatur dalam{' '}
                                        <Link href={route('privacy-policy')} className="text-blue-600 underline hover:text-blue-800">
                                            Kebijakan Privasi
                                        </Link>{' '}
                                        kami. Dengan menggunakan layanan ini, Anda menyetujui pengumpulan dan penggunaan informasi sesuai dengan kebijakan
                                        tersebut.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">9. Pembatasan Tanggung Jawab</h2>
                                    <div className="space-y-3 text-gray-700 dark:text-gray-300">
                                        <p>Aksademy tidak bertanggung jawab atas:</p>
                                        <ul className="ml-4 list-inside list-disc space-y-1">
                                            <li>Gangguan teknis atau pemadaman server</li>
                                            <li>Kehilangan data akibat kesalahan pengguna</li>
                                            <li>Kerugian finansial yang timbul dari penggunaan platform</li>
                                            <li>Ketidakakuratan informasi yang disediakan oleh pihak ketiga</li>
                                        </ul>
                                    </div>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">10. Perubahan Syarat dan Ketentuan</h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan berlaku efektif setelah dipublikasikan
                                        di halaman ini. Pengguna dianjurkan untuk memeriksa halaman ini secara berkala untuk mengetahui perubahan terbaru.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">11. Hukum yang Berlaku</h2>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum yang berlaku di Republik Indonesia.
                                        Setiap sengketa akan diselesaikan melalui pengadilan yang berwenang di Indonesia.
                                    </p>
                                </section>

                                <section className="mb-8">
                                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">12. Hubungi Kami</h2>
                                    <div className="text-gray-700 dark:text-gray-300">
                                        <p className="mb-3">
                                            Jika Anda memiliki pertanyaan mengenai syarat dan ketentuan ini, silakan hubungi kami melalui:
                                        </p>
                                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
                                            <p>
                                                <strong>CV. Aksara Teknologi Mandiri</strong>
                                            </p>
                                            <p>Email: aksarateknologimandiri@gmail.com</p>
                                            <p>WhatsApp: +6285142505794</p>
                                            <p>
                                                Alamat: Perumahan Permata Permadani, Blok B1
                                                <br />
                                                Kel. Pendem Kec. Junrejo Kota Batu
                                                <br />
                                                Prov. Jawa Timur, 65324
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        <div className="mt-8 border-t border-gray-200 pt-8 text-center dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {isEn
                                    ? 'By using Aksademy services, you agree to the terms and conditions above.'
                                    : 'Dengan menggunakan layanan Aksademy, Anda menyetujui syarat dan ketentuan di atas.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
