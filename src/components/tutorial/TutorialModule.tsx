import React, { useState } from 'react';
import { 
  BookOpen, Printer, CheckCircle2, Shield, Video, 
  HelpCircle, ChevronRight, FileText, Sparkles, Download, Layers
} from 'lucide-react';

export const TutorialModule: React.FC = () => {
  const [activeChapter, setActiveChapter] = useState(0);

  const chapters = [
    {
      title: '1. Pengenalan Multi-Unit (TK, KB, RQ) & Hak Akses',
      badge: 'Dasar',
      content: `
Aplikasi Keuangan & SPP didesain khusus untuk mendukung pengelolaan keuangan terpadu bagi jenjang Taman Kanak-Kanak (TK), Kelompok Bermain (KB), dan Rumah Quran (RQ).

**Fitur Otoritas Multi-User:**
- **Super Admin Yayasan**: Memiliki akses penuh ke seluruh unit (TK, KB, RQ), pengaturan pengguna, audit log keamanan, dan backup terenkripsi.
- **Bendahara / Admin Keuangan**: Menginput transaksi kas (BKU), memproses pembayaran SPP siswa, menerbitkan kwitansi, dan mengelola pelacak tunggakan.
- **Kepala Sekolah**: Otoritas monitoring, pengesahan RAPBS, melihat grafik arus kas, dan menandatangani laporan resmi.
- **Guru / Wali Kelas**: Akses terbatas hanya untuk melihat data siswa kelas masing-masing dan mengecek status kelunasan SPP tanpa hak merubah kas umum.
      `
    },
    {
      title: '2. Tata Cara Pencatatan Buku Kas Umum (BKU)',
      badge: 'Kas & Bank',
      content: `
Buku Kas Umum (BKU) mencatat setiap rupiah aliran dana masuk dan keluar secara kronologis:

1. Klik tombol **"+ Transaksi Baru"** di Modul Kas Masuk & Keluar.
2. Tentukan jenis transaksi: **Kas Masuk** (misal: Subsidi Yayasan, Donasi, BOP) atau **Kas Keluar** (misal: Honor Guru, ATK, Listrik).
3. Pilih metode pembayaran: **Tunai** (masuk ke brankas kas fisik) atau **Transfer Bank BSI/QRIS** (masuk ke rekening sekolah).
4. Masukkan nomor bukti/nota fisik dan catatan deskripsi.
5. Saldo berjalan otomatis terkalkulasi secara real-time dan terintegrasi dengan laporan BKU resmi.
      `
    },
    {
      title: '3. Prosedur Pembayaran SPP & Cicilan DSP Uang Pangkal',
      badge: 'SPP Siswa',
      content: `
Modul SPP dilengkapi matriks visual 12 bulan (Juli s.d Juni):

1. **Pilih Siswa**: Cari berdasarkan nama anak, NIS, atau kelas. Profil dan riwayat tunggakan langsung tampil.
2. **Pembayaran SPP**: Klik pada kotak bulan yang ingin dibayarkan (bisa bayar 1 bulan atau borongan multi-bulan sekaligus). Sistem otomatis menghitung potongan beasiswa siswa jika ada (Yatim 100%, Bersaudara 25%, dsb).
3. **Cicilan DSP**: Pilih tab *DSP / Uang Pangkal*, masukkan nominal angsuran yang disetor wali murid. Sistem otomatis menghitung sisa saldo tagihan.
4. **Terbitkan Kwitansi**: Klik *Proses & Terbitkan Kwitansi*. Pop-up kwitansi resmi siap cetak (A5 2 rangkap atau thermal) otomatis terbuka.
      `
    },
    {
      title: '4. Mengirim Pengingat Tagihan WhatsApp 1-Klik',
      badge: 'Tunggakan',
      content: `
Pelacak tunggakan secara otomatis mendeteksi siswa yang belum membayar SPP berdasarkan bulan aktif:

1. Buka modul **Pelacak Tunggakan**.
2. Filter berdasarkan kelas atau tingkat keterlambatan (≥ 1 bulan / ≥ 3 bulan).
3. Klik tombol hijau **"Kirim WA"** di baris siswa terkait.
4. Sistem otomatis membuat pesan sopan berbahasa Indonesia lengkap dengan rincian bulan tunggakan, total nominal, dan nomor rekening transfer BSI sekolah.
5. Anda juga dapat mencetak **Surat Pemberitahuan Tagihan Resmi** lengkap dengan kop surat dan tanda tangan kepala sekolah.
      `
    },
    {
      title: '5. Perencanaan Anggaran RAPBS & Realisasi Anggaran',
      badge: 'RAPBS',
      content: `
RAPBS / RAKS memetakan target penerimaan dan alokasi pos belanja selama 1 tahun ajaran:

- Masukkan estimasi penerimaan (SPP, DSP, BOP, Infaq) dan rencana pos belanja operasional.
- Sistem otomatis mencocokkan setiap transaksi kas aktual di BKU dengan pos anggaran RAPBS.
- Pantau persentase capaian target pendapatan dan batas serapan belanja melalui grafik komparasi.
      `
    },
    {
      title: '6. Kloning & Duplikasi Tahun Ajaran Baru',
      badge: 'Tahun Ajaran',
      content: `
Setiap pergantian tahun ajaran, Anda **tidak perlu menginput ulang dari awal**:

1. Buka menu **Master Data** ➔ Tab **"Duplikasi Tahun Ajaran"**.
2. Masukkan nama tahun ajaran baru (contoh: \`2026/2027\`).
3. Centang opsi *Naikkan Kelas Otomatis*:
   - Siswa TK A1 otomatis naik ke TK B1.
   - Siswa TK B2 otomatis lulus menjadi Alumni.
   - Siswa KB Bintang otomatis naik ke jenjang TK A.
4. Seluruh struktur tarif SPP dan template pos anggaran RAPBS otomatis disalin ke tahun ajaran baru.
      `
    },
    {
      title: '7. Keamanan Enkripsi Data & Backup File .sikeu',
      badge: 'Keamanan',
      content: `
Menjaga keamanan data keuangan lembaga sangat krusial:

- **Enkripsi File Cadangan**: Gunakan menu **Sistem Keamanan** untuk mengunduh berkas cadangan data terenkripsi (\`.sikeu\`). File ini aman dari modifikasi pihak luar.
- **Audit Log Terbuka**: Setiap aktivitas input transaksi, edit data siswa, atau perubahan tarif dicatat dengan stempel waktu dan username pelaku.
- **Restore Aman**: Jika berganti komputer, cukup upload file \`.sikeu\` dan data keuangan langsung pulih 100%.
      `
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-amber-600">
              Buku Panduan & Tutorial
            </span>
            <span className="text-xs font-semibold text-slate-500">Versi 2.5 • Terintegrasi TK, KB, RQ</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Buku Panduan Operasional Aplikasi Keuangan</h2>
          <p className="text-xs text-slate-500">Panduan langkah demi langkah penggunaan seluruh modul aplikasi keuangan dan SPP</p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Buku Panduan PDF</span>
        </button>
      </div>

      {/* Main Grid: Chapter List & Content Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left: Chapter Sidebar */}
        <div className="md:col-span-4 space-y-2 no-print">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Daftar Bab Panduan</span>
            </div>

            <div className="space-y-1.5">
              {chapters.map((ch, idx) => {
                const isActive = activeChapter === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveChapter(idx)}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate pr-2">{ch.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-700' : 'text-slate-400'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-tr from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-xs space-y-2 text-xs">
            <div className="font-bold flex items-center gap-1.5 text-emerald-300">
              <Shield className="w-4 h-4" />
              <span>Bantuan & Layanan Teknis</span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              Jika mengalami kendala teknis dalam pencatatan BKU atau pembayaran SPP, hubungi administrator yayasan.
            </p>
          </div>
        </div>

        {/* Right: Selected Chapter Content (or all in print mode) */}
        <div className="md:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-slate-900">
          
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                {chapters[activeChapter].badge}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 mt-1">
                {chapters[activeChapter].title}
              </h3>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-3 whitespace-pre-line text-slate-700">
            {chapters[activeChapter].content}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 no-print">
            <button
              disabled={activeChapter === 0}
              onClick={() => setActiveChapter(prev => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 font-medium"
            >
              ← Bab Sebelumnya
            </button>
            <span>Bab {activeChapter + 1} dari {chapters.length}</span>
            <button
              disabled={activeChapter === chapters.length - 1}
              onClick={() => setActiveChapter(prev => Math.min(chapters.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 font-bold"
            >
              Bab Selanjutnya →
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
