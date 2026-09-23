import React, { useState, useRef } from 'react';
import { 
  Printer, Download, X, CheckCircle2, ArrowRight, ArrowDownRight, ArrowUpRight, 
  Wallet, FileText, Calendar, Sliders, Sparkles, Building2, HelpCircle, 
  ExternalLink, Layers, ShieldCheck, Check
} from 'lucide-react';
import { SchoolProfile, SchoolUnitType } from '../../types';
import { SchoolLogo } from '../common/SchoolLogo';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';

interface BkuWorkflowPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUnit: SchoolUnitType;
  activeProfile: SchoolProfile;
  academicYear: string;
}

export const BkuWorkflowPdfModal: React.FC<BkuWorkflowPdfModalProps> = ({
  isOpen,
  onClose,
  activeUnit,
  activeProfile,
  academicYear
}) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrintPdf = () => {
    setIsPrinting(true);
    const content = printContentRef.current;
    if (!content) {
      setIsPrinting(false);
      return;
    }

    // Collect all stylesheets and style elements
    const styleSheets = Array.from(document.styleSheets);
    let styleTagsHtml = '';
    
    styleSheets.forEach((sheet) => {
      try {
        if (sheet.href) {
          styleTagsHtml += `<link rel="stylesheet" href="${sheet.href}">`;
        } else if (sheet.cssRules) {
          const rules = Array.from(sheet.cssRules).map(r => r.cssText).join('\n');
          styleTagsHtml += `<style>${rules}</style>`;
        }
      } catch (e) {
        if (sheet.href) {
          styleTagsHtml += `<link rel="stylesheet" href="${sheet.href}">`;
        }
      }
    });

    const frameId = 'bku-workflow-print-frame';
    let frame = document.getElementById(frameId) as HTMLIFrameElement | null;
    if (frame) {
      document.body.removeChild(frame);
    }
    frame = document.createElement('iframe');
    frame.id = frameId;
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = 'none';
    document.body.appendChild(frame);

    const frameDoc = frame.contentWindow?.document;
    if (!frameDoc) {
      setIsPrinting(false);
      return;
    }

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>SOP_Alur_Kerja_BKU_Unit_${activeUnit}_${academicYear.replace('/', '-')}</title>
          ${styleTagsHtml}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 12mm 12mm;
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm 12mm 12mm 12mm;
              }
            }
            html, body {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            .pdf-page-container {
              width: 100% !important;
              max-width: 190mm !important;
              margin: 0 auto !important;
              background: #ffffff !important;
            }
            .page-break-after {
              page-break-after: always !important;
              break-after: page !important;
            }
            .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          <div class="pdf-page-container">
            ${content.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    setTimeout(() => {
      try {
        frame?.contentWindow?.focus();
        frame?.contentWindow?.print();
      } catch (err) {
        window.print();
      } finally {
        setIsPrinting(false);
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-100 rounded-2xl shadow-2xl border border-slate-300 w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Top Action Header Bar */}
        <div className="bg-slate-900 px-4 py-3 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Panduan Alur Transaksi BKU s/d Cetak Sekarang
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full font-mono font-bold text-[10px]">
                  Format PDF A4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                SOP bergambar lengkap 7 tahapan pencatatan transaksi Kas Umum hingga simpan/cetak dokumen resmi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handlePrintPdf}
              disabled={isPrinting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-900/30 transition-all hover:scale-102 disabled:opacity-50"
              title="Unduh / Cetak Dokumen Alur Kerja Ini dalam Format PDF"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Menyiapkan Dokumen PDF...' : 'Cetak / Unduh PDF Sekarang'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Tutup Jendela"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Instruction Ribbon */}
        <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Petunjuk PDF:</strong> Klik tombol <strong>"Cetak / Unduh PDF Sekarang"</strong> lalu pilih <strong>Destination: Save as PDF (Simpan sebagai PDF)</strong> pada dialog cetak browser Anda.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold text-amber-800 hidden md:inline">
            Unit: {activeUnit} • TA {academicYear}
          </span>
        </div>

        {/* Scrollable Document Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/90 flex justify-center">
          
          {/* Printable Sheet Viewport */}
          <div 
            ref={printContentRef}
            className="bg-white shadow-xl rounded-xl border border-slate-300 w-full max-w-[210mm] min-h-[297mm] p-6 sm:p-8 space-y-6 text-slate-900 text-xs"
          >
            
            {/* 1. KOP DOKUMEN RESMI STANDAR SOP */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-center gap-4">
              <div className="shrink-0">
                <SchoolLogo unit={activeUnit} className="w-16 h-16 sm:w-20 sm:h-20" />
              </div>
              <div className="flex-1 text-center pr-2">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-slate-600">
                  {activeProfile.foundation}
                </div>
                <h1 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight">
                  {activeProfile.name}
                </h1>
                <p className="text-[10px] text-slate-600 leading-tight">
                  {activeProfile.address} • Telp/WA: {activeProfile.phone}
                </p>
                <div className="mt-2 pt-1 border-t border-slate-200 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-600">
                  <span>No. Dokumen: <strong>SOP/KEU-BKU/TJ/{new Date().getFullYear()}</strong></span>
                  <span>•</span>
                  <span>Unit: <strong>{activeUnit}</strong></span>
                  <span>•</span>
                  <span>Tahun Ajaran: <strong>{academicYear}</strong></span>
                  <span>•</span>
                  <span>Status: <strong>RESMI</strong></span>
                </div>
              </div>
            </div>

            {/* DOCUMENT TITLE BANNER */}
            <div className="bg-slate-900 text-white p-3 rounded-xl text-center space-y-1">
              <h2 className="text-sm sm:text-base font-black tracking-wide uppercase">
                STANDAR OPERASIONAL PROSEDUR (SOP) & ALUR TRANSAKSI BKU
              </h2>
              <p className="text-[11px] text-slate-300">
                Panduan Langkah Demi Langkah: Pencatatan Kas Masuk & Keluar sampai dengan Tahap Cetak Dokumen PDF
              </p>
            </div>

            {/* QUICK FLOW PROGRESSION DIAGRAM */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Ringkasan Alur 7 Tahapan Transaksi BKU:</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 bg-white border border-emerald-300 rounded-lg shadow-2xs font-semibold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center font-mono font-bold text-[9px] mb-1">1</span>
                  <div className="font-bold">Akses Menu BKU</div>
                  <div className="text-[9px] text-slate-500">Cek Saldo Kas</div>
                </div>

                <div className="p-1.5 bg-white border border-emerald-300 rounded-lg shadow-2xs font-semibold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center font-mono font-bold text-[9px] mb-1">2</span>
                  <div className="font-bold text-emerald-800">Input Kas Masuk</div>
                  <div className="text-[9px] text-slate-500">Penerimaan Dana</div>
                </div>

                <div className="p-1.5 bg-white border border-emerald-300 rounded-lg shadow-2xs font-semibold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center font-mono font-bold text-[9px] mb-1">3</span>
                  <div className="font-bold text-rose-800">Input Kas Keluar</div>
                  <div className="text-[9px] text-slate-500">Pengeluaran Kas</div>
                </div>

                <div className="p-1.5 bg-white border border-emerald-300 rounded-lg shadow-2xs font-semibold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center font-mono font-bold text-[9px] mb-1">4</span>
                  <div className="font-bold">Verifikasi Tabel</div>
                  <div className="text-[9px] text-slate-500">Saldo Berjalan</div>
                </div>

                <div className="p-1.5 bg-white border border-emerald-300 rounded-lg shadow-2xs font-semibold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center font-mono font-bold text-[9px] mb-1">5</span>
                  <div className="font-bold text-indigo-800">Filter Periode</div>
                  <div className="text-[9px] text-slate-500">Tombol Cetak</div>
                </div>

                <div className="p-1.5 bg-white border border-emerald-300 rounded-lg shadow-2xs font-semibold text-slate-800">
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white inline-flex items-center justify-center font-mono font-bold text-[9px] mb-1">6</span>
                  <div className="font-bold">Pratinjau Kertas</div>
                  <div className="text-[9px] text-slate-500">Kop & 1-Page Fit</div>
                </div>

                <div className="p-1.5 bg-emerald-600 border border-emerald-700 rounded-lg shadow-2xs font-semibold text-white">
                  <span className="w-4 h-4 rounded-full bg-white text-emerald-900 inline-flex items-center justify-center font-mono font-bold text-[9px] mb-1">7</span>
                  <div className="font-bold">Cetak Sekarang</div>
                  <div className="text-[9px] text-emerald-100">Simpan File PDF</div>
                </div>
              </div>
            </div>

            {/* DETAIL PER TAHAP DENGAN ILUSTRASI GAMBAR MOCKUP LENGKAP */}

            {/* TAHAP 1: AKSES MENU BKU & MONITORING SALDO */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-mono font-bold flex items-center justify-center text-xs">
                    01
                  </span>
                  <h3 className="font-black text-sm text-slate-900">
                    Tahap 1: Akses Modul BKU & Pemantauan Ringkasan Saldo Kas
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Navigasi & Dashboard Kas
                </span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                Pengguna (Bendahara / Admin Keuangan) membuka menu <strong>Buku Kas Umum (BKU)</strong> melalui sidebar navigasi. Sistem menyajikan informasi ringkasan saldo aktual unit {activeUnit} secara otomatis yang terbagi ke dalam 3 indikator utama: Total Penerimaan (Kas Masuk), Total Pengeluaran (Kas Keluar), dan Saldo Kas Akhir Periode BKU.
              </p>

              {/* TAMPILAN GAMBAR PROSES 1 */}
              <div className="p-3 bg-white rounded-xl border-2 border-slate-300 shadow-xs space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between border-b border-slate-100 pb-1">
                  <span>[Gambar 1. Antarmuka Header BKU & 3 Kartu Saldo Kas Real-Time]</span>
                  <span className="text-emerald-700">● Live View Unit {activeUnit}</span>
                </div>

                {/* Header Mockup */}
                <div className="flex items-center justify-between gap-2 p-2 bg-slate-100 rounded-lg">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-700 text-white text-[9px] font-bold rounded">
                        BKU Unit {activeUnit}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">Tahun Ajaran {academicYear}</span>
                    </div>
                    <div className="font-extrabold text-xs text-slate-900 mt-0.5">Buku Kas Umum (BKU) & Arus Kas</div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                      <Printer className="w-3 h-3" /> Cetak BKU Periode Ini
                    </div>
                    <div className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-2xs">
                      + Catat Transaksi Baru
                    </div>
                  </div>
                </div>

                {/* 3 Summary Cards Mockup */}
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg">
                    <div className="text-[9px] text-emerald-800 font-bold">Total Kas Masuk (Penerimaan)</div>
                    <div className="text-xs font-black text-emerald-950 font-mono mt-0.5">Rp 12.850.000</div>
                    <div className="text-[8px] text-emerald-700">Akumulasi penerimaan unit</div>
                  </div>

                  <div className="p-2 bg-rose-50 border border-rose-300 rounded-lg">
                    <div className="text-[9px] text-rose-800 font-bold">Total Kas Keluar (Belanja)</div>
                    <div className="text-xs font-black text-rose-950 font-mono mt-0.5">Rp 8.420.000</div>
                    <div className="text-[8px] text-rose-700">Akumulasi pengeluaran pos</div>
                  </div>

                  <div className="p-2 bg-indigo-50 border border-indigo-300 rounded-lg">
                    <div className="text-[9px] text-indigo-800 font-bold">Saldo Akhir Kas Kumulatif</div>
                    <div className="text-xs font-black text-indigo-950 font-mono mt-0.5">Rp 4.430.000</div>
                    <div className="text-[8px] text-indigo-700">Kas fisik & saldo rekening bank</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 2: INPUT KAS MASUK (PENERIMAAN) */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white font-mono font-bold flex items-center justify-center text-xs">
                    02
                  </span>
                  <h3 className="font-black text-sm text-slate-900">
                    Tahap 2: Input Transaksi Kas Masuk (Penerimaan Dana)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  Debit / Penerimaan (+)
                </span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                Klik tombol <strong>"+ Catat Transaksi Baru"</strong>, lalu pastikan tab <strong>"+ Kas Masuk (Penerimaan)"</strong> aktif (warna hijau). Isi rincian data: Tanggal Transaksi, Nomor Bukti (misal: <code>KM-TK-2026-001</code>), Kategori Pos Penerimaan (BOP, Infaq/Donasi, Subsidi Yayasan, dsb), Uraian Transaksi, Nominal (Rp), Metode (Tunai / Transfer BSI / QRIS), serta nama Penyetor. Klik <strong>"Catat ke BKU"</strong>.
              </p>

              {/* TAMPILAN GAMBAR PROSES 2 */}
              <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 shadow-xs space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between border-b border-slate-100 pb-1">
                  <span>[Gambar 2. Formulir Pop-up Input Kas Masuk (Penerimaan Dana)]</span>
                  <span className="text-emerald-700 font-bold">✔ Status: Tab Masuk Aktif</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 text-[10px]">
                  {/* Tab Selector Mockup */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200 rounded">
                    <div className="py-1 bg-emerald-600 text-white font-bold text-center rounded shadow-2xs">
                      + Kas Masuk (Penerimaan)
                    </div>
                    <div className="py-1 text-slate-600 font-bold text-center">
                      - Kas Keluar (Pengeluaran)
                    </div>
                  </div>

                  {/* Form Fields Simulation */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Tanggal Transaksi:</span>
                      <div className="p-1 bg-white border border-slate-300 rounded font-mono font-bold">2026-08-10</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Nomor Bukti / Kwitansi:</span>
                      <div className="p-1 bg-white border border-slate-300 rounded font-mono font-bold text-emerald-800">KM-TK-2026-005</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Pos Anggaran:</span>
                      <div className="p-1 bg-white border border-slate-300 rounded font-bold">Infaq & Donasi Sarana</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[9px]">Uraian Deskripsi:</span>
                      <div className="p-1 bg-white border border-slate-300 rounded font-semibold text-slate-800">
                        Penerimaan infaq sukarela wali santri untuk renovasi ruang baca
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Nominal (Rp):</span>
                      <div className="p-1 bg-white border border-emerald-400 text-emerald-800 font-mono font-black rounded">
                        Rp 2.500.000
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-[9px] text-slate-500">Metode: <strong>Transfer Bank BSI</strong> • Dari: <strong>Hamba Allah</strong></span>
                    <div className="px-3 py-1 bg-emerald-600 text-white rounded font-bold text-[9px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Catat ke BKU
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 3: INPUT KAS KELUAR (PENGELUARAN BELANJA) */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-rose-700 text-white font-mono font-bold flex items-center justify-center text-xs">
                    03
                  </span>
                  <h3 className="font-black text-sm text-slate-900">
                    Tahap 3: Input Transaksi Kas Keluar (Pengeluaran Belanja)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                  Kredit / Pengeluaran (-)
                </span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                Buka formulir transaksi dan pilih tab <strong>"- Kas Keluar (Pengeluaran)"</strong> (warna merah). Masukkan Nomor Bukti / Nota Belanja (misal: <code>KK-TK-2026-008</code>), Pos Belanja RAPBS (ATK, Honor Guru, Listrik/Internet, Konsumsi), Uraian Belanja terperinci, Nominal (Rp), Toko / Rekanan Penyedia, serta nomor nota fisik untuk arsip audit. Klik <strong>"Catat ke BKU"</strong>.
              </p>

              {/* TAMPILAN GAMBAR PROSES 3 */}
              <div className="p-3 bg-white rounded-xl border-2 border-rose-300 shadow-xs space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between border-b border-slate-100 pb-1">
                  <span>[Gambar 3. Formulir Pop-up Input Kas Keluar (Pengeluaran Belanja)]</span>
                  <span className="text-rose-700 font-bold">✔ Status: Tab Keluar Aktif</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-2 text-[10px]">
                  {/* Tab Selector Mockup */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200 rounded">
                    <div className="py-1 text-slate-600 font-bold text-center">
                      + Kas Masuk (Penerimaan)
                    </div>
                    <div className="py-1 bg-rose-600 text-white font-bold text-center rounded shadow-2xs">
                      - Kas Keluar (Pengeluaran)
                    </div>
                  </div>

                  {/* Form Fields Simulation */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-slate-500 block text-[9px]">Tanggal Transaksi:</span>
                      <div className="p-1 bg-white border border-slate-300 rounded font-mono font-bold">2026-08-14</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Nomor Bukti / Nota:</span>
                      <div className="p-1 bg-white border border-slate-300 rounded font-mono font-bold text-rose-800">KK-TK-2026-008</div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Pos Belanja RAPBS:</span>
                      <div className="p-1 bg-white border border-slate-300 rounded font-bold">Belanja ATK & Bahan Ajar</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[9px]">Uraian Belanja:</span>
                      <div className="p-1 bg-white border border-slate-300 rounded font-semibold text-slate-800">
                        Pembelian kertas HVS A4, modul mewarnai, dan spidol whiteboard
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">Nominal Belanja:</span>
                      <div className="p-1 bg-white border border-rose-400 text-rose-800 font-mono font-black rounded">
                        Rp 450.000
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-[9px] text-slate-500">Metode: <strong>Kas Tunai</strong> • Toko: <strong>CV Berkah Stationery</strong></span>
                    <div className="px-3 py-1 bg-rose-600 text-white rounded font-bold text-[9px] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Catat ke BKU
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 4: VERIFIKASI REKONSILIASI TABEL BKU & SALDO BERJALAN */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-700 text-white font-mono font-bold flex items-center justify-center text-xs">
                    04
                  </span>
                  <h3 className="font-black text-sm text-slate-900">
                    Tahap 4: Verifikasi Rekonsiliasi & Tabel Buku Kas Umum (BKU)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-300">
                  Running Balance Otomatis
                </span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                Setiap transaksi yang dicatat langsung tampil pada <strong>Tabel Mutasi BKU</strong> secara kronologis. Sistem mengkalkulasi <strong>Saldo Berjalan (Running Balance)</strong> pada kolom paling kanan sehingga saldo akhir selalu akurat. Tersedia tombol Aksi (ikon pensil untuk edit, ikon tempat sampah untuk pembatalan transaksi).
              </p>

              {/* TAMPILAN GAMBAR PROSES 4 */}
              <div className="p-3 bg-white rounded-xl border-2 border-indigo-300 shadow-xs space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between border-b border-slate-100 pb-1">
                  <span>[Gambar 4. Tabel Transaksi Mutasi BKU dengan Kolom Debit, Kredit & Saldo Berjalan]</span>
                  <span className="text-indigo-700 font-bold">✔ Real-Time Ledger</span>
                </div>

                {/* Table Simulation */}
                <table className="w-full text-left text-[10px] border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                    <tr>
                      <th className="p-1 w-6 text-center border-r border-slate-200">No</th>
                      <th className="p-1 w-16 border-r border-slate-200">Tanggal</th>
                      <th className="p-1 w-20 border-r border-slate-200">No. Bukti</th>
                      <th className="p-1 border-r border-slate-200">Uraian Transaksi</th>
                      <th className="p-1 w-20 text-right border-r border-slate-200">Penerimaan</th>
                      <th className="p-1 w-20 text-right border-r border-slate-200">Pengeluaran</th>
                      <th className="p-1 w-24 text-right">Saldo Kas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[9px]">
                    <tr className="bg-white">
                      <td className="p-1 text-center border-r border-slate-200">1</td>
                      <td className="p-1 border-r border-slate-200">2026-08-01</td>
                      <td className="p-1 border-r border-slate-200 font-semibold text-slate-700">SALDO-AWAL</td>
                      <td className="p-1 border-r border-slate-200 font-sans font-semibold text-slate-800">Saldo Awal Kas Tunai & Bank</td>
                      <td className="p-1 text-right border-r border-slate-200 text-emerald-700 font-bold">Rp 5.000.000</td>
                      <td className="p-1 text-right border-r border-slate-200 text-slate-400">-</td>
                      <td className="p-1 text-right font-black text-slate-900">Rp 5.000.000</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-1 text-center border-r border-slate-200">2</td>
                      <td className="p-1 border-r border-slate-200">2026-08-10</td>
                      <td className="p-1 border-r border-slate-200 text-emerald-800 font-semibold">KM-TK-2026-005</td>
                      <td className="p-1 border-r border-slate-200 font-sans">Infaq Sarana Ruang Baca (Hamba Allah)</td>
                      <td className="p-1 text-right border-r border-slate-200 text-emerald-700 font-bold">Rp 2.500.000</td>
                      <td className="p-1 text-right border-r border-slate-200 text-slate-400">-</td>
                      <td className="p-1 text-right font-black text-slate-900">Rp 7.500.000</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="p-1 text-center border-r border-slate-200">3</td>
                      <td className="p-1 border-r border-slate-200">2026-08-14</td>
                      <td className="p-1 border-r border-slate-200 text-rose-800 font-semibold">KK-TK-2026-008</td>
                      <td className="p-1 border-r border-slate-200 font-sans">Belanja ATK & Kertas Modul Siswa</td>
                      <td className="p-1 text-right border-r border-slate-200 text-slate-400">-</td>
                      <td className="p-1 text-right border-r border-slate-200 text-rose-700 font-bold">Rp 450.000</td>
                      <td className="p-1 text-right font-black text-slate-900">Rp 7.050.000</td>
                    </tr>
                    <tr className="bg-slate-100 font-sans font-bold border-t border-slate-300">
                      <td colSpan={4} className="p-1 text-right border-r border-slate-200">TOTAL PERIODE:</td>
                      <td className="p-1 text-right border-r border-slate-200 text-emerald-800 font-mono">Rp 7.500.000</td>
                      <td className="p-1 text-right border-r border-slate-200 text-rose-800 font-mono">Rp 450.000</td>
                      <td className="p-1 text-right text-slate-900 font-mono font-black">Rp 7.050.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* TAHAP 5: FILTER PERIODE WAKTU & TOMBOL CETAK BKU */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                    05
                  </span>
                  <h3 className="font-black text-sm text-slate-900">
                    Tahap 5: Pemilihan Periode Laporan & Menekan Tombol Cetak BKU
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  Filter Periode & Eksekusi Cetak
                </span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                Tentukan rentang tanggal laporan yang akan dicetak dengan memilih salah satu tombol preset: <strong>1 Tahun Penuh</strong>, <strong>Semester 1</strong>, <strong>Semester 2</strong>, <strong>Bulan Ini</strong>, atau <strong>Kustom Tanggal</strong>. Setelah tabel menampilkan data yang sesuai, klik tombol <strong>"Cetak BKU Periode Ini"</strong> pada bilah atas.
              </p>

              {/* TAMPILAN GAMBAR PROSES 5 */}
              <div className="p-3 bg-white rounded-xl border-2 border-amber-300 shadow-xs space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between border-b border-slate-100 pb-1">
                  <span>[Gambar 5. Filter Preset Periode & Tombol Eksekusi Cetak BKU]</span>
                  <span className="text-amber-700 font-bold">✔ Siap Cetak</span>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-bold text-slate-600 mr-1">Filter Periode:</span>
                    <span className="px-2 py-1 rounded bg-slate-900 text-white font-bold">1 Tahun Penuh</span>
                    <span className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100">Semester 1</span>
                    <span className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100">Semester 2</span>
                    <span className="px-2 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100">Bulan Ini</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md ring-2 ring-indigo-400">
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak BKU Periode Ini</span>
                      <ArrowRight className="w-3 h-3 text-indigo-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 6: JENDELA PRATINJAU CETAK (PRINT PREVIEW MODAL) */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-700 text-white font-mono font-bold flex items-center justify-center text-xs">
                    06
                  </span>
                  <h3 className="font-black text-sm text-slate-900">
                    Tahap 6: Jendela Pratinjau Cetak Interaktif (Print Preview Modal)
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-teal-900 bg-teal-100 px-2 py-0.5 rounded border border-teal-300">
                  Kop Surat & Auto-Fit A4
                </span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                Jendela pop-up <strong>Pratinjau Cetak Interaktif</strong> terbuka. Di jendela ini, Anda dapat memverifikasi lembar dokumen BKU resmi lengkap dengan <strong>Kop Surat Lembaga</strong>, rincian tabel transaksi, serta rekapitulasi kas tunai vs kas bank. Sistem secara otomatis menerapkan skala <em>1-Page Auto Fit</em> agar pas rapi dalam 1 lembar A4 tanpa terpotong.
              </p>

              {/* TAMPILAN GAMBAR PROSES 6 */}
              <div className="p-3 bg-white rounded-xl border-2 border-teal-300 shadow-xs space-y-2">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex items-center justify-between border-b border-slate-100 pb-1">
                  <span>[Gambar 6. Jendela Pratinjau Cetak Interaktif dengan Pengaturan Kertas & Tombol "Cetak Sekarang"]</span>
                  <span className="text-teal-700 font-bold">✔ Layout Sempurna</span>
                </div>

                <div className="bg-slate-900 p-2 rounded-t-lg text-white flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400">📄 Cetak Buku Kas Umum (BKU) Unit {activeUnit}</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">1-Page Auto Fit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700">Kertas: A4 Portrait</span>
                    <div className="px-3 py-1 bg-emerald-600 text-white font-bold rounded flex items-center gap-1 shadow-sm">
                      <Printer className="w-3 h-3" /> Cetak Sekarang
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 rounded-b-lg border-x border-b border-slate-300 space-y-2">
                  <div className="bg-white p-3 rounded border border-slate-300 space-y-2 text-[9px] max-w-md mx-auto shadow-sm">
                    <div className="text-center border-b border-slate-800 pb-1">
                      <div className="font-black text-[10px] uppercase text-slate-900">{activeProfile.name}</div>
                      <div className="font-bold text-slate-700">BUKU KAS UMUM (BKU) - UNIT {activeUnit}</div>
                      <div className="text-[8px] text-slate-500">Tahun Ajaran {academicYear}</div>
                    </div>
                    <div className="p-1 bg-slate-50 border border-slate-200 text-[8px] flex justify-between font-mono">
                      <span>Total Penerimaan: <strong>Rp 12.850.000</strong></span>
                      <span>Total Pengeluaran: <strong>Rp 8.420.000</strong></span>
                      <span className="text-emerald-700 font-bold">Saldo: <strong>Rp 4.430.000</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAHAP 7: EKSEKUSI TOMBOL "CETAK SEKARANG" & SIMPAN FILE PDF */}
            <div className="p-4 rounded-xl border border-slate-300 bg-slate-50/50 space-y-3 avoid-break">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                    07
                  </span>
                  <h3 className="font-black text-sm text-slate-900">
                    Tahap 7: Eksekusi Tombol "Cetak Sekarang" & Penyimpanan Dokumen PDF
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-white bg-emerald-700 px-2 py-0.5 rounded shadow-2xs">
                  Selesai / File PDF Tersimpan
                </span>
              </div>

              <p className="text-[11px] text-slate-700 leading-relaxed">
                Klik tombol hijau <strong>"Cetak Sekarang"</strong> pada bilah kanan atas pratinjau. Dialog cetak resmi browser Anda akan terbuka secara instan. Atur opsi <strong>Destination / Tujuan: "Save as PDF" (Simpan sebagai PDF)</strong>, pastikan ukuran kertas adalah <strong>A4</strong> dengan tata letak <strong>Portrait</strong>, lalu klik <strong>"Save" / "Simpan"</strong>. Berkas PDF BKU resmi siap diarsipkan, dikirim ke Yayasan, atau dicetak ke kertas fisik.
              </p>

              {/* TAMPILAN GAMBAR PROSES 7 */}
              <div className="p-3 bg-white rounded-xl border-2 border-emerald-500 shadow-md space-y-3">
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase flex flex-wrap items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-slate-900 font-black">[Gambar 7. Lembar Dokumen Fisik A4 Hasil Eksekusi "Cetak Sekarang" (Format PDF Asli)]</span>
                  </div>
                  <span className="text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                    ✔ 100% Sesuai File PDF Resmi Yayasan
                  </span>
                </div>

                {/* Dialog Browser Instructions Banner */}
                <div className="p-2.5 bg-slate-900 text-white rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded font-mono text-[9px]">PENGATURAN BROWSER</span>
                    <span className="text-slate-300">Destination: <strong>Save as PDF</strong> • Paper Size: <strong>A4</strong> • Layout: <strong>Portrait</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-300 font-mono text-[9px]">Output: 1 Lembar Pas (Tanpa Terpotong)</span>
                  </div>
                </div>

                {/* REPLIKA DOKUMEN FISIK HASIL CETAK SEKARANG SESUAI GAMBAR FILE PDF */}
                <div className="bg-white p-5 sm:p-7 rounded-xl border-2 border-slate-800 shadow-lg space-y-3 text-slate-900">
                  
                  {/* KOP SURAT RESMI */}
                  <div className="border-b-2 border-slate-900 pb-3 select-none">
                    <div className="flex items-center justify-between gap-3">
                      {/* Logo & School Identity */}
                      <div className="flex items-center gap-3">
                        <div className="w-13 h-13 rounded-full bg-white border border-slate-300 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                          <SchoolLogo unit="RQ" size={48} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold tracking-wider text-slate-600 uppercase">
                            YAYASAN THORIQUl JANNAH SINJAI
                          </div>
                          <div className="text-base sm:text-lg font-black text-slate-900 uppercase leading-tight tracking-tight">
                            RQ AULADY THORIQUL JANNAH SINJAI
                          </div>
                          <div className="text-[9px] text-slate-600 mt-0.5 leading-snug">
                            NPSN: RQ-THOJAN-882190 • Jl. Bulu Bicara No. 74, Bongki, Sinjai Utara, Kabupaten Sinjai • Telp: 0813-5574-3247
                          </div>
                        </div>
                      </div>

                      {/* Document Badge */}
                      <div className="text-right shrink-0">
                        <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-900 border border-slate-300 rounded-md font-mono font-bold text-[10px]">
                          BKU/RQ/2026
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 font-bold uppercase tracking-tight">
                          DOKUMEN RESMI
                        </div>
                      </div>
                    </div>

                    {/* Dashed Separator & Title */}
                    <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-center">
                      <div className="font-black uppercase text-xs sm:text-sm tracking-wide text-slate-900">
                        BUKU KAS UMUM (BKU) - UNIT RQ
                      </div>
                    </div>
                  </div>

                  {/* Subtitle Periode */}
                  <div className="text-center text-[11px] text-slate-700 font-medium -mt-1 pb-1">
                    Tahun Ajaran: <strong>2026/2027</strong> | Periode: 01 Juli 2026 s.d 30 Juni 2027
                  </div>

                  {/* TABEL MUTASI TRANSAKSI BKU REALISTIS */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] sm:text-[11px] border-2 border-slate-800 border-collapse">
                      <thead className="bg-slate-100 font-bold border-b-2 border-slate-800 text-slate-900">
                        <tr>
                          <th className="p-1.5 w-8 text-center border-r border-slate-400">No</th>
                          <th className="p-1.5 w-20 border-r border-slate-400">Tanggal</th>
                          <th className="p-1.5 w-24 border-r border-slate-400 font-mono">No. Bukti</th>
                          <th className="p-1.5 border-r border-slate-400">Uraian Transaksi</th>
                          <th className="p-1.5 w-24 text-right border-r border-slate-400">Penerimaan</th>
                          <th className="p-1.5 w-24 text-right border-r border-slate-400">Pengeluaran</th>
                          <th className="p-1.5 w-28 text-right">Saldo Kas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300">
                        {/* Row 1 */}
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 text-center border-r border-slate-300 font-mono text-[10px]">1</td>
                          <td className="p-1 border-r border-slate-300 font-mono text-[10px] whitespace-nowrap">2026-08-21</td>
                          <td className="p-1 border-r border-slate-300 font-mono font-semibold text-slate-700">
                            <div>KW-RQ-2608-</div>
                            <div>6330</div>
                          </td>
                          <td className="p-1 border-r border-slate-300">
                            <div className="font-semibold text-slate-900">
                              Pembayaran SPP ananda Nurhana (UMMI Jilid 5) Bulan: Juli, Agustus
                            </div>
                            <div className="text-[9px] text-slate-500">Penerimaan SPP • TUNAI</div>
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-emerald-700 whitespace-nowrap">
                            Rp 100.000
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-rose-600 whitespace-nowrap">
                            -
                          </td>
                          <td className="p-1 text-right font-bold text-slate-900 whitespace-nowrap">
                            Rp 100.000
                          </td>
                        </tr>

                        {/* Row 2 */}
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 text-center border-r border-slate-300 font-mono text-[10px]">2</td>
                          <td className="p-1 border-r border-slate-300 font-mono text-[10px] whitespace-nowrap">2026-08-21</td>
                          <td className="p-1 border-r border-slate-300 font-mono font-semibold text-slate-700">
                            <div>KW-RQ-2608-</div>
                            <div>6074</div>
                          </td>
                          <td className="p-1 border-r border-slate-300">
                            <div className="font-semibold text-slate-900">
                              Pembayaran SPP ananda Sari Muktiningrum (Program Tartil Metode UMMI) Bulan: Juli, Agustus
                            </div>
                            <div className="text-[9px] text-slate-500">Penerimaan SPP • QRIS</div>
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-emerald-700 whitespace-nowrap">
                            Rp 210.000
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-rose-600 whitespace-nowrap">
                            -
                          </td>
                          <td className="p-1 text-right font-bold text-slate-900 whitespace-nowrap">
                            Rp 310.000
                          </td>
                        </tr>

                        {/* Row 3 */}
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 text-center border-r border-slate-300 font-mono text-[10px]">3</td>
                          <td className="p-1 border-r border-slate-300 font-mono text-[10px] whitespace-nowrap">2026-08-21</td>
                          <td className="p-1 border-r border-slate-300 font-mono font-semibold text-slate-700">
                            <div>KW-RQ-2608-</div>
                            <div>2391</div>
                          </td>
                          <td className="p-1 border-r border-slate-300">
                            <div className="font-semibold text-slate-900">
                              Pembayaran SPP ananda Amir Hamzah (UMMI Jilid 2) Bulan: Juli, Agustus
                            </div>
                            <div className="text-[9px] text-slate-500">Penerimaan SPP • TRANSFER</div>
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-emerald-700 whitespace-nowrap">
                            Rp 200.000
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-rose-600 whitespace-nowrap">
                            -
                          </td>
                          <td className="p-1 text-right font-bold text-slate-900 whitespace-nowrap">
                            Rp 510.000
                          </td>
                        </tr>

                        {/* Row 4 */}
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 text-center border-r border-slate-300 font-mono text-[10px]">4</td>
                          <td className="p-1 border-r border-slate-300 font-mono text-[10px] whitespace-nowrap">2026-08-22</td>
                          <td className="p-1 border-r border-slate-300 font-mono font-semibold text-slate-700">
                            <div>KW-RQ-2608-</div>
                            <div>9403</div>
                          </td>
                          <td className="p-1 border-r border-slate-300">
                            <div className="font-semibold text-slate-900">
                              Pembayaran SPP ananda Amir Hamzah (UMMI Jilid 2) Bulan: September
                            </div>
                            <div className="text-[9px] text-slate-500">Penerimaan SPP • TRANSFER</div>
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-emerald-700 whitespace-nowrap">
                            Rp 100.000
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-rose-600 whitespace-nowrap">
                            -
                          </td>
                          <td className="p-1 text-right font-bold text-slate-900 whitespace-nowrap">
                            Rp 610.000
                          </td>
                        </tr>

                        {/* Row 5 */}
                        <tr className="hover:bg-slate-50">
                          <td className="p-1 text-center border-r border-slate-300 font-mono text-[10px]">5</td>
                          <td className="p-1 border-r border-slate-300 font-mono text-[10px] whitespace-nowrap">2026-09-02</td>
                          <td className="p-1 border-r border-slate-300 font-mono font-semibold text-slate-700">
                            <div>KW-RQ-2609-</div>
                            <div>4719</div>
                          </td>
                          <td className="p-1 border-r border-slate-300">
                            <div className="font-semibold text-slate-900">
                              Pembayaran (SPP Bulanan RQ Aulady (Juli)) ananda Ardi (UMMI Jilid 4)
                            </div>
                            <div className="text-[9px] text-slate-500">Penerimaan SPP • TRANSFER</div>
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-emerald-700 whitespace-nowrap">
                            Rp 50.000
                          </td>
                          <td className="p-1 text-right border-r border-slate-300 font-bold text-rose-600 whitespace-nowrap">
                            -
                          </td>
                          <td className="p-1 text-right font-bold text-slate-900 whitespace-nowrap">
                            Rp 660.000
                          </td>
                        </tr>

                        {/* TOTAL ROW */}
                        <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                          <td colSpan={4} className="p-1.5 text-right uppercase border-r border-slate-400">
                            TOTAL:
                          </td>
                          <td className="p-1.5 text-right text-emerald-800 border-r border-slate-400 font-black">
                            Rp 660.000
                          </td>
                          <td className="p-1.5 text-right text-rose-800 border-r border-slate-400 font-black">
                            Rp 0
                          </td>
                          <td className="p-1.5 text-right text-slate-900 font-black">
                            Rp 660.000
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* KOTAK REKAPITULASI KAS PENUTUPAN */}
                  <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px] grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                    <div>Kas Tunai: <strong className="text-slate-900">Rp 100.000</strong></div>
                    <div>Kas Rekening Bank: <strong className="text-slate-900">Rp 560.000</strong></div>
                    <div>Total Saldo Kas: <strong className="text-emerald-700">Rp 660.000</strong></div>
                  </div>

                  {/* TOMBOL & STATUS EKSEKUSI CETAK SEKARANG RESMI */}
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">Hasil Format Eksekusi "Cetak Sekarang"</div>
                        <div className="text-[11px] text-slate-600">Dokumen Buku Kas Umum (BKU) siap diarsipkan atau dicetak tanpa lembar pengesahan & tanda tangan</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs">
                        <Check className="w-3.5 h-3.5" /> Cetak Sekarang (Selesai)
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* DOKUMEN FOOTER */}
            <div className="pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono avoid-break">
              Dicetak secara elektronik melalui Sistem Informasi Keuangan & SPP (SIKEU) • Dokumen Panduan Alur Transaksi BKU
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
