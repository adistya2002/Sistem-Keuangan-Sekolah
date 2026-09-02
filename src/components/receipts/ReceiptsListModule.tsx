import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ReceiptText, Search, Printer, Trash2, Calendar, 
  User, DollarSign, Filter, Download
} from 'lucide-react';
import { 
  formatRupiah, 
  formatDateIndo, 
  getAcademicYearDateRange, 
  getAcademicYearSemesterRange, 
  getAcademicYearMonthRange 
} from '../../utils/formatters';
import { SppMonth, ACADEMIC_MONTHS } from '../../types';

type PeriodPreset = 'FULL_YEAR' | 'SEM_1' | 'SEM_2' | 'THIS_MONTH' | 'CUSTOM_MONTH' | 'CUSTOM_DATES';

export const ReceiptsListModule: React.FC = () => {
  const { 
    state, 
    activeUnit, 
    activeProfile, 
    activeAcademicYear, 
    openReceiptModal, 
    deleteStudentPayment,
    currentUser 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('FULL_YEAR');
  const [selectedMonth, setSelectedMonth] = useState<SppMonth>('Juli');

  const initialRange = useMemo(() => {
    return getAcademicYearDateRange(activeAcademicYear);
  }, [activeAcademicYear]);

  const [startDate, setStartDate] = useState<string>(initialRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialRange.endDate);

  // Auto-sync start and end date when activeAcademicYear changes
  useEffect(() => {
    const range = getAcademicYearDateRange(activeAcademicYear);
    if (periodPreset === 'FULL_YEAR') {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    } else if (periodPreset === 'SEM_1') {
      const s1 = getAcademicYearSemesterRange(activeAcademicYear, 1);
      setStartDate(s1.startDate);
      setEndDate(s1.endDate);
    } else if (periodPreset === 'SEM_2') {
      const s2 = getAcademicYearSemesterRange(activeAcademicYear, 2);
      setStartDate(s2.startDate);
      setEndDate(s2.endDate);
    } else if (periodPreset === 'CUSTOM_MONTH') {
      const mRange = getAcademicYearMonthRange(activeAcademicYear, selectedMonth);
      setStartDate(mRange.startDate);
      setEndDate(mRange.endDate);
    }
  }, [activeAcademicYear, periodPreset, selectedMonth]);

  const handleApplyPreset = (preset: PeriodPreset, monthVal?: SppMonth) => {
    setPeriodPreset(preset);
    if (preset === 'FULL_YEAR') {
      const r = getAcademicYearDateRange(activeAcademicYear);
      setStartDate(r.startDate);
      setEndDate(r.endDate);
    } else if (preset === 'SEM_1') {
      const s1 = getAcademicYearSemesterRange(activeAcademicYear, 1);
      setStartDate(s1.startDate);
      setEndDate(s1.endDate);
    } else if (preset === 'SEM_2') {
      const s2 = getAcademicYearSemesterRange(activeAcademicYear, 2);
      setStartDate(s2.startDate);
      setEndDate(s2.endDate);
    } else if (preset === 'THIS_MONTH') {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setStartDate(`${y}-${m}-01`);
      setEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'CUSTOM_MONTH') {
      const targetM = monthVal || selectedMonth;
      if (monthVal) setSelectedMonth(targetM);
      const mRange = getAcademicYearMonthRange(activeAcademicYear, targetM);
      setStartDate(mRange.startDate);
      setEndDate(mRange.endDate);
    }
  };

  // Receipts in current unit & academic year
  const unitPayments = useMemo(() => {
    return state.studentPayments
      .filter(p => p.unit === activeUnit && p.academicYear === activeAcademicYear)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.studentPayments, activeUnit, activeAcademicYear]);

  // Filtered by date range, type, search
  const displayedPayments = useMemo(() => {
    return unitPayments.filter(p => {
      if (startDate && p.date < startDate) return false;
      if (endDate && p.date > endDate) return false;
      if (filterType !== 'ALL' && p.paymentType !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          p.receiptNumber.toLowerCase().includes(q) ||
          p.studentName.toLowerCase().includes(q) ||
          p.payerName.toLowerCase().includes(q) ||
          p.className.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [unitPayments, startDate, endDate, filterType, searchQuery]);

  const totalReceiptsNominal = displayedPayments.reduce((sum, p) => sum + p.totalAmount, 0);

  const handleDeleteReceipt = (paymentId: string, receiptNo: string) => {
    if (currentUser.role === 'GURU_WALI_KELAS') {
      alert('Akses Ditolak: Guru tidak memiliki izin membatalkan kwitansi.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin membatalkan/menghapus kwitansi ${receiptNo}? Data kas BKU terkait juga akan disesuaikan otomatis.`)) {
      deleteStudentPayment(paymentId);
    }
  };

  const exportCsv = () => {
    const headers = ['No', 'No Kwitansi', 'Tanggal', 'Nama Siswa/Santri', 'Kelas/Halaqoh', 'Jenis Pembayaran', 'Rincian Bulan', 'Penyetor', 'Metode', 'Nominal (Rp)'];
    const rows = displayedPayments.map((p, idx) => [
      idx + 1,
      `"${p.receiptNumber}"`,
      p.date,
      `"${p.studentName}"`,
      `"${p.className}"`,
      p.paymentType,
      `"${p.sppMonths?.join(', ') || '-'}"`,
      `"${p.payerName}"`,
      p.paymentMethod,
      p.totalAmount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kwitansi_${activeUnit}_${activeAcademicYear.replace('/', '_')}_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-violet-600">
              Generator Kwitansi
            </span>
            <span className="text-xs font-semibold text-slate-500">Unit {activeUnit} • TA {activeAcademicYear}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Arsip & Cetak Ulang Kwitansi Resmi</h2>
          <p className="text-xs text-slate-500">Pencarian nomor seri kwitansi, validasi barcode, dan cetak ulang slip pembayaran siswa</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <div className="flex items-center gap-3 bg-violet-50 border border-violet-200 px-4 py-2 rounded-xl">
            <div className="text-xs text-violet-800 font-medium">Total Nominal Terbit:</div>
            <div className="text-base font-extrabold text-violet-950">{formatRupiah(totalReceiptsNominal)}</div>
          </div>
        </div>
      </div>

      {/* Period Filter Presets */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-violet-600" />
            Periode TA {activeAcademicYear}:
          </span>

          <button
            type="button"
            onClick={() => handleApplyPreset('FULL_YEAR')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors border ${
              periodPreset === 'FULL_YEAR'
                ? 'bg-violet-50 text-violet-700 border-violet-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            1 Tahun Penuh (12 Bln)
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('SEM_1')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors border ${
              periodPreset === 'SEM_1'
                ? 'bg-violet-50 text-violet-700 border-violet-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semester 1 (Ganjil)
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('SEM_2')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors border ${
              periodPreset === 'SEM_2'
                ? 'bg-violet-50 text-violet-700 border-violet-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Semester 2 (Genap)
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors border ${
              periodPreset === 'THIS_MONTH'
                ? 'bg-violet-50 text-violet-700 border-violet-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Bulan Ini
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => handleApplyPreset('CUSTOM_MONTH', e.target.value as SppMonth)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                periodPreset === 'CUSTOM_MONTH'
                  ? 'bg-violet-50 text-violet-800 border-violet-300'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              {ACADEMIC_MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Dari Tanggal:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPeriodPreset('CUSTOM_DATES');
                setStartDate(e.target.value);
              }}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sampai Tanggal:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPeriodPreset('CUSTOM_DATES');
                setEndDate(e.target.value);
              }}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          <div className="text-slate-400 text-[11px] ml-auto">
            Rentang: {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari nomor kwitansi, nama siswa, atau penyetor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-violet-500 focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          >
            <option value="ALL">Semua Jenis Tagihan</option>
            <option value="SPP">Hanya SPP Bulanan</option>
            <option value="DSP">Hanya DSP / Uang Pangkal</option>
            <option value="DAFTAR_ULANG">Daftar Ulang & Lainnya</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Ditemukan <strong>{displayedPayments.length}</strong> kwitansi
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-36">No. Kwitansi</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3">Nama {activeUnit === 'RQ' ? 'Santri' : 'Murid'} & Kelas</th>
                <th className="py-3 px-3">Rincian Pembayaran</th>
                <th className="py-3 px-3">Penyetor</th>
                <th className="py-3 px-3 text-center w-20">Metode</th>
                <th className="py-3 px-3 text-right w-32">Nominal (Rp)</th>
                <th className="py-3 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {displayedPayments.length > 0 ? (
                displayedPayments.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-violet-700">
                      <span className="bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                        {p.receiptNumber}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                      {p.date}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{p.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.className}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {p.paymentType} {p.sppMonths?.length ? `• Bln: ${p.sppMonths.join(', ')}` : ''}
                      </div>
                      {p.notes && <div className="text-[11px] text-slate-400 italic">{p.notes}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-700 text-[11px]">
                      {p.payerName}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-700 text-sm whitespace-nowrap">
                      {formatRupiah(p.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openReceiptModal(p)}
                          className="px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                          title="Buka & Cetak Kwitansi"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Cetak</span>
                        </button>
                        {currentUser.role !== 'GURU_WALI_KELAS' && (
                          <button
                            onClick={() => handleDeleteReceipt(p.id, p.receiptNumber)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus Kwitansi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Belum ada kwitansi yang diterbitkan untuk periode ini
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
