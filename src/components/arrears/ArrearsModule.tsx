import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  SearchCheck, Search, Filter, MessageCircle, Printer, 
  Send, AlertTriangle, CheckCircle2, User, Phone, FileText, ChevronRight, X
} from 'lucide-react';
import { SppMonth, ACADEMIC_MONTHS } from '../../types';
import { 
  calculateStudentArrears, formatRupiah, generateWhatsAppReminder,
  StudentArrearsInfo, formatDateIndo, formatReportSignatureDate, terbilang
} from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { PrintHeaderKop } from '../common/PrintHeaderKop';

export const ArrearsModule: React.FC = () => {
  const { 
    state, 
    activeUnit, 
    activeProfile, 
    activeAcademicYear, 
    currentUser,
    setCurrentTab 
  } = useApp();

  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [monthLimit, setMonthLimit] = useState<SppMonth>('Desember');
  const [minMonthsOverdue, setMinMonthsOverdue] = useState<number>(1);
  
  // Printable bill modal
  const [selectedArrearForPrint, setSelectedArrearForPrint] = useState<StudentArrearsInfo | null>(null);
  const [showPrintRekapModal, setShowPrintRekapModal] = useState<boolean>(false);

  // Active students in current unit & academic year
  const unitStudents = useMemo(() => {
    return state.students.filter(
      s => s.unit === activeUnit && s.academicYear === activeAcademicYear && s.status === 'AKTIF'
    );
  }, [state.students, activeUnit, activeAcademicYear]);

  // Unique classes in active unit
  const classList = useMemo(() => {
    const set = new Set<string>();
    unitStudents.forEach(s => set.add(s.className));
    return Array.from(set).sort();
  }, [unitStudents]);

  // Reset selected class when unit changes
  useEffect(() => {
    if (selectedClass !== 'ALL' && !classList.includes(selectedClass)) {
      setSelectedClass('ALL');
    }
  }, [activeUnit, classList, selectedClass]);

  // Compute arrears for all students
  const allArrearsInfo = useMemo(() => {
    return unitStudents.map(student => 
      calculateStudentArrears(
        student,
        activeAcademicYear,
        state.studentPayments,
        state.masterFees,
        monthLimit
      )
    );
  }, [unitStudents, activeAcademicYear, state.studentPayments, state.masterFees, monthLimit]);

  // Filtered arrears list
  const filteredArrears = useMemo(() => {
    return allArrearsInfo
      .filter(item => {
        if (item.totalArrears <= 0) return false;
        if (item.monthsOverdueCount < minMonthsOverdue && item.dspRemaining <= 0) return false;
        if (selectedClass !== 'ALL' && item.student.className !== selectedClass) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches = 
            item.student.name.toLowerCase().includes(q) ||
            item.student.nis.toLowerCase().includes(q) ||
            (item.student.parentName || '').toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => b.totalArrears - a.totalArrears);
  }, [allArrearsInfo, minMonthsOverdue, selectedClass, searchQuery]);

  // Aggregate statistics
  const totalArrearsNominal = filteredArrears.reduce((sum, item) => sum + item.totalArrears, 0);
  const totalSppArrears = filteredArrears.reduce((sum, item) => sum + item.sppArrearsTotal, 0);
  const totalDspArrears = filteredArrears.reduce((sum, item) => sum + item.dspRemaining, 0);
  const totalStudentsCount = unitStudents.length;
  const overdueCount = filteredArrears.length;
  const complianceRate = totalStudentsCount > 0 
    ? Math.round(((totalStudentsCount - overdueCount) / totalStudentsCount) * 100)
    : 100;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-amber-600">
              Pelacak Tunggakan
            </span>
            <span className="text-xs font-semibold text-slate-500">Unit {activeUnit} • TA {activeAcademicYear}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Pelacak & Pengingat Tunggakan {activeUnit === 'RQ' ? 'Santri' : 'Murid'} Otomatis
          </h2>
          <p className="text-xs text-slate-500">Kalkulasi tunggakan SPP & DSP per bulan, generator pesan tagihan WhatsApp & surat resmi</p>
        </div>

        {/* Global Print / Report Button */}
        <button
          onClick={() => setShowPrintRekapModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all self-start md:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Cetak Rekap Tunggakan</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
          <div className="text-xs font-semibold text-rose-800">Total Nominal Tunggakan</div>
          <div className="text-xl font-extrabold text-rose-900 mt-1">{formatRupiah(totalArrearsNominal)}</div>
          <div className="text-[11px] text-rose-700 mt-1">SPP: {formatRupiah(totalSppArrears)} • DSP: {formatRupiah(totalDspArrears)}</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
          <div className="text-xs font-semibold text-amber-800">
            Jumlah {activeUnit === 'RQ' ? 'Santri' : 'Murid'} Menunggak
          </div>
          <div className="text-xl font-extrabold text-amber-900 mt-1">
            {overdueCount} <span className="text-xs font-normal text-amber-700">dari {totalStudentsCount} {activeUnit === 'RQ' ? 'Santri' : 'Murid'}</span>
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Status aktif semester berjalan</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
          <div className="text-xs font-semibold text-emerald-800">Tingkat Kepatuhan Bayar</div>
          <div className="text-xl font-extrabold text-emerald-900 mt-1">{complianceRate}%</div>
          <div className="text-[11px] text-emerald-700 mt-1">
            {totalStudentsCount - overdueCount} {activeUnit === 'RQ' ? 'santri' : 'murid'} tertib lunas
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl">
          <div className="text-xs font-semibold text-indigo-800">Batas Perhitungan Bulan</div>
          <div className="text-sm font-bold text-indigo-900 mt-1">Hingga Bulan: {monthLimit}</div>
          <div className="text-[11px] text-indigo-700 mt-1">Dapat disesuaikan di filter</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari siswa atau nama wali..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">
              {activeUnit === 'RQ' ? `Semua Halaqoh / Level (${classList.length} Halaqoh)` : `Semua Kelas (${classList.length} Kelas)`}
            </option>
            {classList.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Academic Month Limit */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1 border border-slate-200 rounded-xl">
            <span className="text-[11px] text-slate-400">Bulan:</span>
            <select
              value={monthLimit}
              onChange={(e) => setMonthLimit(e.target.value as SppMonth)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              {ACADEMIC_MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Min Months Filter */}
          <select
            value={minMonthsOverdue}
            onChange={(e) => setMinMonthsOverdue(Number(e.target.value))}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value={1}>Semua Tunggakan (≥ 1 Bln)</option>
            <option value={2}>Menunggak ≥ 2 Bulan</option>
            <option value={3}>Menunggak ≥ 3 Bulan (Kritis)</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Ditemukan <strong>{filteredArrears.length}</strong> siswa menunggak
        </div>
      </div>

      {/* Arrears List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3">
                  {activeUnit === 'RQ' ? 'Santri & Halaqoh' : 'Murid & Kelas'}
                </th>
                <th className="py-3 px-3">
                  {activeUnit === 'RQ' ? 'Wali Santri & No. WhatsApp' : 'Wali Murid & No. WhatsApp'}
                </th>
                <th className="py-3 px-3">Bulan SPP Belum Lunas</th>
                <th className="py-3 px-3 text-right">Tunggakan SPP</th>
                <th className="py-3 px-3 text-right">Sisa DSP</th>
                <th className="py-3 px-3 text-right">Total Tagihan</th>
                <th className="py-3 px-3 text-center no-print w-40">Kirim Notifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {filteredArrears.length > 0 ? (
                filteredArrears.map((item, idx) => {
                  const wa = generateWhatsAppReminder(item, activeProfile, activeAcademicYear);
                  return (
                    <tr key={item.student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.student.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIS: {item.student.nis} • <span className="text-emerald-700 font-semibold">{item.student.className}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">{item.student.parentName || '-'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{item.student.parentPhone || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {item.unpaidMonths.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {item.unpaidMonths.map(m => (
                              <span key={m} className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-semibold">
                                {m}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-[11px]">SPP Lunas</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-rose-600 whitespace-nowrap">
                        {item.sppArrearsTotal > 0 ? formatRupiah(item.sppArrearsTotal) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-amber-700 whitespace-nowrap">
                        {item.dspRemaining > 0 ? formatRupiah(item.dspRemaining) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-rose-700 whitespace-nowrap text-sm bg-rose-50/30">
                        {formatRupiah(item.totalArrears)}
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* WhatsApp One-Click Direct Link */}
                          <a
                            href={wa.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all hover:scale-105"
                            title="Kirim Tagihan via WhatsApp Langsung"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Kirim WA</span>
                          </a>

                          {/* Print Letter of Overdue */}
                          <button
                            onClick={() => setSelectedArrearForPrint(item)}
                            className="p-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700"
                            title="Cetak Surat Tagihan Resmi"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <span className="font-semibold text-slate-700">Tidak ada data tunggakan untuk kriteria filter ini!</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Printable Surat Pemberitahuan Tagihan / Tunggakan (1 Page Standard) */}
      {selectedArrearForPrint && (
        <PrintPreviewModal
          isOpen={!!selectedArrearForPrint}
          onClose={() => setSelectedArrearForPrint(null)}
          title="Cetak Surat Tagihan Tunggakan"
          subtitle={`No. Ref: 048/SP-KEU/${activeUnit}/${new Date().getFullYear()} • ${selectedArrearForPrint.student.name} (${selectedArrearForPrint.student.className})`}
          badgeText="1-Page Auto Fit"
          defaultPreset="A4"
          defaultOrientation="portrait"
          defaultFitOnePage={true}
        >
          <div className="space-y-4 text-slate-900 text-xs">
            {/* Kop Surat Resmi */}
            <PrintHeaderKop 
              profile={activeProfile} 
              documentNumber={`048/SP-KEU/${activeUnit}/${new Date().getFullYear()}`}
              documentTitle={`SURAT PEMBERITAHUAN TUNGGAKAN ADMINISTRASI ${activeUnit === 'RQ' ? 'SANTRI' : 'MURID'}`}
            />

            {/* Letter Meta */}
            <div className="flex justify-between items-start pt-1 text-xs">
              <div className="space-y-0.5">
                <div>Nomor: <strong>048/SP-KEU/{activeUnit}/{new Date().getFullYear()}</strong></div>
                <div>Lampiran: -</div>
                <div>Hal: <strong>Pemberitahuan Administrasi Keuangan {activeUnit === 'RQ' ? 'Santri' : 'Murid'}</strong></div>
              </div>
              <div className="text-right">
                <div>{activeProfile.address?.toLowerCase().includes('sinjai') ? 'Sinjai' : 'Jakarta'}, {formatDateIndo(new Date().toISOString())}</div>
                <div className="mt-1.5 text-left font-semibold">
                  Kepada Yth.<br />
                  Bpk/Ibu Wali dari <strong>{selectedArrearForPrint.student.name}</strong><br />
                  Kelas {selectedArrearForPrint.student.className}<br />
                  Di Tempat
                </div>
              </div>
            </div>

            {/* Greeting & Body */}
            <div className="space-y-1.5 leading-relaxed text-xs">
              <p><em>Assalamu'alaikum Warahmatullahi Wabarakatuh,</em></p>
              <p>
                Segala puji bagi Allah SWT yang senantiasa melimpahkan rahmat dan hidayah-Nya kepada kita semua.
                Shalawat serta salam semoga senantiasa tercurah kepada junjungan Nabi Muhammad SAW.
              </p>
              <p>
                Berdasarkan evaluasi penatausahaan keuangan Tahun Ajaran {activeAcademicYear}, kami sampaikan informasi kewajiban administrasi ananda <strong>{selectedArrearForPrint.student.name}</strong> sebagai berikut:
              </p>
            </div>

            {/* Breakdown Table */}
            <table className="w-full border-2 border-slate-800 text-left my-2 text-xs">
              <thead className="bg-slate-100 font-bold border-b-2 border-slate-800">
                <tr>
                  <th className="p-2 w-10 text-center border-r border-slate-400">No</th>
                  <th className="p-2 border-r border-slate-400">Rincian Pos Kewajiban / Tagihan</th>
                  <th className="p-2 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {selectedArrearForPrint.unpaidMonths.length > 0 && (
                  <tr>
                    <td className="p-2 text-center border-r border-slate-300">1</td>
                    <td className="p-2 border-r border-slate-300">
                      Tunggakan SPP Bulanan ({selectedArrearForPrint.unpaidMonths.join(', ')})
                    </td>
                    <td className="p-2 text-right font-bold">{formatRupiah(selectedArrearForPrint.sppArrearsTotal)}</td>
                  </tr>
                )}
                {selectedArrearForPrint.dspRemaining > 0 && (
                  <tr>
                    <td className="p-2 text-center border-r border-slate-300">2</td>
                    <td className="p-2 border-r border-slate-300">Sisa DSP / Uang Pangkal Gedung</td>
                    <td className="p-2 text-right font-bold">{formatRupiah(selectedArrearForPrint.dspRemaining)}</td>
                  </tr>
                )}
                <tr className="bg-slate-100 font-black">
                  <td colSpan={2} className="p-2 text-right uppercase border-r border-slate-300">Total Kewajiban Pembayaran:</td>
                  <td className="p-2 text-right text-rose-700 text-sm">{formatRupiah(selectedArrearForPrint.totalArrears)}</td>
                </tr>
              </tbody>
            </table>

            <div className="bg-slate-50 border border-slate-300 p-2 rounded text-[11px]">
              <span className="font-bold">Terbilang: </span>
              <span className="italic font-semibold">"{terbilang(selectedArrearForPrint.totalArrears)}"</span>
            </div>

            {/* Payment Bank Info */}
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-300 text-xs">
              <div className="font-bold mb-0.5 text-slate-900">Informasi Rekening Pembayaran Resmi:</div>
              <div className="flex gap-4">
                <div>Bank: <strong>{activeProfile.bankName}</strong></div>
                <div>No. Rekening: <strong className="font-mono">{activeProfile.bankAccount}</strong></div>
                <div>Atas Nama: <strong>{activeProfile.bankHolder}</strong></div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className="leading-relaxed">
                Demikian surat pemberitahuan ini kami sampaikan. Atas perhatian, pengertian, dan kerjasamanya kami ucapkan terima kasih. <em>Jazakumullahu Khairan Katsiran</em>.
              </p>
              <p><em>Wassalamu'alaikum Warahmatullahi Wabarakatuh.</em></p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 pt-4 text-center text-xs">
              <div>
                <div className="text-slate-600 mb-12">Mengetahui,<br />Kepala Sekolah</div>
                <div className="font-bold underline text-slate-900">{activeProfile.headmasterName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeProfile.headmasterNip || 'NIP. -'}</div>
              </div>
              <div>
                <div className="text-slate-600 mb-12">
                  {formatReportSignatureDate(activeProfile)}<br />
                  Bendahara Sekolah,
                </div>
                <div className="font-bold underline text-slate-900">{activeProfile.treasurerName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeProfile.treasurerNip || 'NIP. -'}</div>
              </div>
            </div>

          </div>
        </PrintPreviewModal>
      )}

      {/* Modal 2: Printable Rekap Daftar Tunggakan Seluruh Murid */}
      {showPrintRekapModal && (
        <PrintPreviewModal
          isOpen={showPrintRekapModal}
          onClose={() => setShowPrintRekapModal(false)}
          title={`Cetak Rekap Tunggakan ${activeUnit === 'RQ' ? 'Santri' : 'Murid'}`}
          subtitle={`Unit ${activeUnit} • Tahun Ajaran ${activeAcademicYear} • Total Menunggak: ${overdueCount} Orang (${formatRupiah(totalArrearsNominal)})`}
          badgeText="1-Page Auto Fit"
          defaultPreset="A4"
          defaultOrientation="portrait"
          defaultFitOnePage={true}
        >
          <div className="space-y-4 text-slate-900 text-xs">
            <PrintHeaderKop 
              profile={activeProfile}
              documentTitle={`LAPORAN REKAPITULASI TUNGGAKAN ${activeUnit === 'RQ' ? 'SANTRI' : 'MURID'} - TA ${activeAcademicYear}`}
              documentNumber={`REKAP-TGK/${activeUnit}/${new Date().getFullYear()}`}
            />

            {/* Ringkasan Header */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-300 text-xs text-center font-bold">
              <div>Total Nominal: <span className="text-rose-700">{formatRupiah(totalArrearsNominal)}</span></div>
              <div>Tunggakan SPP: <span className="text-slate-900">{formatRupiah(totalSppArrears)}</span></div>
              <div>Sisa DSP: <span className="text-slate-900">{formatRupiah(totalDspArrears)}</span></div>
            </div>

            {/* Table of Arrears */}
            <table className="w-full border-2 border-slate-800 text-left text-[11px]">
              <thead className="bg-slate-100 font-bold border-b-2 border-slate-800">
                <tr>
                  <th className="p-1.5 w-8 text-center border-r border-slate-400">No</th>
                  <th className="p-1.5 border-r border-slate-400">Nama {activeUnit === 'RQ' ? 'Santri' : 'Murid'}</th>
                  <th className="p-1.5 w-16 border-r border-slate-400">Kelas</th>
                  <th className="p-1.5 border-r border-slate-400">Bulan Menunggak</th>
                  <th className="p-1.5 w-24 text-right border-r border-slate-400">SPP</th>
                  <th className="p-1.5 w-24 text-right border-r border-slate-400">DSP</th>
                  <th className="p-1.5 w-28 text-right">Total (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filteredArrears.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-slate-50">
                    <td className="p-1.5 text-center font-mono border-r border-slate-300">{idx + 1}</td>
                    <td className="p-1.5 font-bold border-r border-slate-300">{item.student.name}</td>
                    <td className="p-1.5 border-r border-slate-300">{item.student.className}</td>
                    <td className="p-1.5 text-[10px] text-slate-700 border-r border-slate-300 truncate max-w-[140px]">
                      {item.unpaidMonths.join(', ') || '-'}
                    </td>
                    <td className="p-1.5 text-right border-r border-slate-300">{formatRupiah(item.sppArrearsTotal)}</td>
                    <td className="p-1.5 text-right border-r border-slate-300">{formatRupiah(item.dspRemaining)}</td>
                    <td className="p-1.5 text-right font-black text-rose-700">{formatRupiah(item.totalArrears)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                  <td colSpan={4} className="p-2 text-right uppercase border-r border-slate-400">TOTAL KESELURUHAN:</td>
                  <td className="p-2 text-right border-r border-slate-400">{formatRupiah(totalSppArrears)}</td>
                  <td className="p-2 text-right border-r border-slate-400">{formatRupiah(totalDspArrears)}</td>
                  <td className="p-2 text-right text-rose-700 text-xs">{formatRupiah(totalArrearsNominal)}</td>
                </tr>
              </tbody>
            </table>

            {/* Signatures */}
            <div className="grid grid-cols-2 pt-4 text-center text-xs">
              <div>
                <div className="text-slate-600 mb-12">Mengetahui,<br />Kepala Sekolah</div>
                <div className="font-bold underline text-slate-900">{activeProfile.headmasterName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeProfile.headmasterNip || 'NIP. -'}</div>
              </div>
              <div>
                <div className="text-slate-600 mb-12">
                  {formatReportSignatureDate(activeProfile)}<br />
                  Bendahara Sekolah,
                </div>
                <div className="font-bold underline text-slate-900">{activeProfile.treasurerName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeProfile.treasurerNip || 'NIP. -'}</div>
              </div>
            </div>

          </div>
        </PrintPreviewModal>
      )}

    </div>
  );
};
