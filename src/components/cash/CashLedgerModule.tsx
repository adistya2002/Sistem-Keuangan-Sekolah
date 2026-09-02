import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CashTransaction, TransactionType, SppMonth, ACADEMIC_MONTHS } from '../../types';
import { 
  Plus, Search, Filter, Printer, ArrowDownRight, ArrowUpRight, 
  Trash2, Edit3, X, Check, FileSpreadsheet, Calendar, Wallet, Download, RefreshCw
} from 'lucide-react';
import { 
  formatRupiah, 
  formatDateIndo, 
  formatReportSignatureDate,
  getAcademicYearDateRange, 
  getAcademicYearSemesterRange, 
  getAcademicYearMonthRange 
} from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { PrintHeaderKop } from '../common/PrintHeaderKop';

interface CashLedgerModuleProps {
  initialOpenModal?: boolean;
}

type PeriodPreset = 'FULL_YEAR' | 'SEM_1' | 'SEM_2' | 'THIS_MONTH' | 'CUSTOM_MONTH' | 'CUSTOM_DATES';

export const CashLedgerModule: React.FC<CashLedgerModuleProps> = ({ initialOpenModal = false }) => {
  const { 
    state, 
    activeUnit, 
    activeProfile, 
    activeAcademicYear, 
    currentUser,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'MASUK' | 'KELUAR'>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  
  // Date & Period Filter State
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
      if (monthVal) setSelectedMonth(monthVal);
      const mRange = getAcademicYearMonthRange(activeAcademicYear, targetM);
      setStartDate(mRange.startDate);
      setEndDate(mRange.endDate);
    }
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(initialOpenModal);
  const [editingTx, setEditingTx] = useState<CashTransaction | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'MASUK' as TransactionType,
    category: 'Penerimaan SPP',
    description: '',
    amount: '',
    paymentMethod: 'TRANSFER' as 'TUNAI' | 'TRANSFER' | 'QRIS',
    sourceOrRecipient: '',
    notes: '',
    referenceNo: ''
  });

  const categories = [
    // Income categories
    'Saldo Awal Tahun',
    'Penerimaan SPP',
    'Penerimaan DSP',
    'Penerimaan Biaya Siswa',
    'BOP PAUD / BOS',
    'Infaq & Donasi Yayasan',
    'Infaq & Wakaf Al-Quran',
    'Pendapatan Lain-lain',
    // Expense categories
    'Gaji & Honor Guru',
    'Belanja Bahan Pembelajaran & ATK',
    'Snack & Nutrisi Sehat Anak',
    'Operasional Listrik, Air & Internet',
    'Pemeliharaan Sarana & Prasarana',
    'Kegiatan Siswa & Puncak Tema',
    'Buku & Modul Pembelajaran',
    'Pengeluaran Lainnya'
  ];

  // Get all raw transactions for this unit & academic year sorted ascending
  const rawUnitTransactions = useMemo(() => {
    return state.cashTransactions
      .filter(tx => tx.unit === activeUnit && tx.academicYear === activeAcademicYear)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.cashTransactions, activeUnit, activeAcademicYear]);

  // Filter transactions by date range
  const dateFilteredTransactions = useMemo(() => {
    return rawUnitTransactions.filter(tx => {
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      return true;
    });
  }, [rawUnitTransactions, startDate, endDate]);

  // Compute running balance considering starting balance prior to startDate
  const transactionsWithBalance = useMemo(() => {
    let startingBalance = 0;
    if (startDate) {
      const priorTx = rawUnitTransactions.filter(tx => tx.date < startDate);
      startingBalance = priorTx.reduce((acc, t) => acc + (t.type === 'MASUK' ? t.amount : -t.amount), 0);
    }

    let running = startingBalance;
    return dateFilteredTransactions.map(tx => {
      if (tx.type === 'MASUK') {
        running += tx.amount;
      } else {
        running -= tx.amount;
      }
      return {
        ...tx,
        runningBalance: running
      };
    });
  }, [dateFilteredTransactions, rawUnitTransactions, startDate]);

  // Total sums in the filtered period
  const totalMasuk = dateFilteredTransactions
    .filter(t => t.type === 'MASUK')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalKeluar = dateFilteredTransactions
    .filter(t => t.type === 'KELUAR')
    .reduce((acc, t) => acc + t.amount, 0);

  const saldoAkhir = totalMasuk - totalKeluar;

  // Filtered view with search, type, category, method (reversed for newest first in display table)
  const displayedTransactions = useMemo(() => {
    return [...transactionsWithBalance]
      .filter(tx => {
        if (filterType !== 'ALL' && tx.type !== filterType) return false;
        if (filterCategory !== 'ALL' && tx.category !== filterCategory) return false;
        if (filterMethod !== 'ALL' && tx.paymentMethod !== filterMethod) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches = 
            tx.description.toLowerCase().includes(q) ||
            tx.referenceNo.toLowerCase().includes(q) ||
            tx.sourceOrRecipient.toLowerCase().includes(q) ||
            tx.category.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .reverse();
  }, [transactionsWithBalance, filterType, filterCategory, filterMethod, searchQuery]);

  const handleOpenAdd = () => {
    setEditingTx(null);
    const prefix = formData.type === 'MASUK' ? 'KM' : 'KK';
    const randomSeq = String(Math.floor(Math.random() * 900) + 100);
    const dateStr = new Date().toISOString().slice(2, 7).replace('-', '');
    
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      type: 'MASUK',
      category: 'Penerimaan SPP',
      description: '',
      amount: '',
      paymentMethod: 'TRANSFER',
      sourceOrRecipient: '',
      notes: '',
      referenceNo: `${prefix}-${activeUnit}-${dateStr}-${randomSeq}`
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tx: CashTransaction) => {
    setEditingTx(tx);
    setFormData({
      date: tx.date,
      type: tx.type,
      category: tx.category,
      description: tx.description,
      amount: String(tx.amount),
      paymentMethod: tx.paymentMethod,
      sourceOrRecipient: tx.sourceOrRecipient,
      notes: tx.notes || '',
      referenceNo: tx.referenceNo
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (!numAmount || numAmount <= 0) {
      alert('Mohon masukkan nominal yang valid.');
      return;
    }
    if (!formData.description.trim()) {
      alert('Mohon masukkan uraian transaksi.');
      return;
    }

    if (editingTx) {
      updateCashTransaction({
        ...editingTx,
        date: formData.date,
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
        amount: numAmount,
        paymentMethod: formData.paymentMethod,
        sourceOrRecipient: formData.sourceOrRecipient.trim(),
        notes: formData.notes.trim(),
        referenceNo: formData.referenceNo
      });
      alert('Transaksi berhasil diperbarui!');
    } else {
      addCashTransaction({
        unit: activeUnit,
        academicYear: activeAcademicYear,
        date: formData.date,
        type: formData.type,
        category: formData.category,
        description: formData.description.trim(),
        amount: numAmount,
        paymentMethod: formData.paymentMethod,
        sourceOrRecipient: formData.sourceOrRecipient.trim(),
        notes: formData.notes.trim(),
        referenceNo: formData.referenceNo,
        createdBy: currentUser.fullName || currentUser.username
      });
      alert('Transaksi kas berhasil dicatat ke BKU!');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (txId: string, desc: string) => {
    if (currentUser.role === 'GURU_WALI_KELAS') {
      alert('Akses Ditolak: Guru/Wali Kelas tidak memiliki otoritas menghapus buku kas umum.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus transaksi "${desc}"? Tindakan ini akan dicatat di log audit.`)) {
      deleteCashTransaction(txId);
    }
  };

  const exportCsv = () => {
    const headers = ['No', 'Tanggal', 'No Bukti', 'Jenis', 'Pos Anggaran', 'Uraian / Keterangan', 'Sumber/Penerima', 'Metode', 'Masuk (Rp)', 'Keluar (Rp)', 'Saldo Kumulatif (Rp)'];
    const rows = transactionsWithBalance.map((tx, idx) => [
      idx + 1,
      tx.date,
      `"${tx.referenceNo}"`,
      tx.type,
      `"${tx.category}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.sourceOrRecipient}"`,
      tx.paymentMethod,
      tx.type === 'MASUK' ? tx.amount : 0,
      tx.type === 'KELUAR' ? tx.amount : 0,
      tx.runningBalance
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BKU_${activeUnit}_${activeAcademicYear.replace('/', '_')}_${startDate}_sd_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* Header & Balance Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs ${
              activeUnit === 'TK' ? 'bg-emerald-600' : activeUnit === 'KB' ? 'bg-sky-600' : activeUnit === 'SD' ? 'bg-red-600' : activeUnit === 'SMP' ? 'bg-blue-600' : activeUnit === 'SMA' ? 'bg-slate-600' : 'bg-purple-600'
            }`}>
              BKU Unit {activeUnit}
            </span>
            <span className="text-xs font-semibold text-slate-500">Tahun Ajaran {activeAcademicYear}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Buku Kas Umum (BKU) & Arus Kas</h2>
          <p className="text-xs text-slate-500">Pencatatan kas masuk, kas keluar, mutasi bank & saldo kumulatif terpadu</p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCsv}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-indigo-200"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak BKU Periode Ini</span>
          </button>

          <button
            id="btn-add-cash"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-emerald-800 font-medium">Total Penerimaan (Kas Masuk)</div>
            <div className="text-lg font-bold text-emerald-900 mt-0.5">{formatRupiah(totalMasuk)}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Periode: {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-800 font-medium">Total Pengeluaran (Kas Keluar)</div>
            <div className="text-lg font-bold text-rose-900 mt-0.5">{formatRupiah(totalKeluar)}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Periode: {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs text-indigo-800 font-medium">Saldo Kas Akhir Periode BKU</div>
            <div className={`text-lg font-bold mt-0.5 ${saldoAkhir >= 0 ? 'text-indigo-950' : 'text-rose-700'}`}>
              {formatRupiah(saldoAkhir)}
            </div>
            <div className="text-[10px] text-indigo-700 mt-0.5">Kumulatif terhitung otomatis</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Period Filter Presets Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5 text-indigo-600" />
            Periode TA {activeAcademicYear}:
          </span>

          <button
            type="button"
            onClick={() => handleApplyPreset('FULL_YEAR')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors border ${
              periodPreset === 'FULL_YEAR'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
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
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
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
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
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
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
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
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
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
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="text-slate-400 text-[11px] ml-auto">
            Rentang aktif: {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari uraian, nomor bukti, atau nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">Semua Jenis (Masuk & Keluar)</option>
            <option value="MASUK">Hanya Pemasukan (+)</option>
            <option value="KELUAR">Hanya Pengeluaran (-)</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none max-w-[180px]"
          >
            <option value="ALL">Semua Pos Anggaran</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Method Filter */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="ALL">Semua Metode</option>
            <option value="TUNAI">Tunai</option>
            <option value="TRANSFER">Transfer Bank</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong>{displayedTransactions.length}</strong> transaksi
        </div>
      </div>

      {/* Transactions Table (Standard BKU Layout) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28">Tanggal</th>
                <th className="py-3 px-3 w-36">No. Bukti</th>
                <th className="py-3 px-3">Pos & Uraian Transaksi</th>
                <th className="py-3 px-3 w-28">Sumber / Ke</th>
                <th className="py-3 px-3 w-20 text-center">Metode</th>
                <th className="py-3 px-3 w-32 text-right">Penerimaan (Rp)</th>
                <th className="py-3 px-3 w-32 text-right">Pengeluaran (Rp)</th>
                <th className="py-3 px-3 w-32 text-right">Saldo Kas (Rp)</th>
                <th className="py-3 px-3 w-20 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((tx, index) => {
                  const isMasuk = tx.type === 'MASUK';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-700">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {tx.referenceNo}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{tx.description}</div>
                        <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                          {tx.category} {tx.notes ? `• ${tx.notes}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-[11px] truncate max-w-[120px]">
                        {tx.sourceOrRecipient || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          tx.paymentMethod === 'TUNAI' ? 'bg-amber-100 text-amber-800' :
                          tx.paymentMethod === 'QRIS' ? 'bg-purple-100 text-purple-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-emerald-700">
                        {isMasuk ? formatRupiah(tx.amount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-rose-600">
                        {!isMasuk ? formatRupiah(tx.amount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 font-mono">
                        {formatRupiah(tx.runningBalance || 0)}
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            title="Edit Transaksi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role !== 'GURU_WALI_KELAS' && (
                            <button
                              onClick={() => handleDelete(tx.id, tx.description)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <p className="text-xs">Tidak ada data transaksi kas yang sesuai dengan filter atau periode tanggal.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Tambah/Edit Transaksi Kas */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingTx ? 'Edit Transaksi BKU' : 'Catat Transaksi Kas Baru (BKU)'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'MASUK' })}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    formData.type === 'MASUK' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Kas Masuk (Penerimaan)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'KELUAR' })}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    formData.type === 'KELUAR' 
                      ? 'bg-rose-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  - Kas Keluar (Pengeluaran)
                </button>
              </div>

              {/* Date & Ref No */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nomor Bukti / Ref</label>
                  <input
                    type="text"
                    required
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Pos Anggaran / Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Uraian Transaksi</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Pembelian buku modul semester 1 untuk 25 siswa"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    min="1"
                    step="1000"
                    required
                    placeholder="Contoh: 500000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Metode Pembayaran</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="TUNAI">Kas Tunai</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>
              </div>

              {/* Source/Recipient & Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    {formData.type === 'MASUK' ? 'Diterima Dari' : 'Diserahkan Kepada / Toko'}
                  </label>
                  <input
                    type="text"
                    placeholder="Nama orang / pihak terkait"
                    value={formData.sourceOrRecipient}
                    onChange={(e) => setFormData({ ...formData, sourceOrRecipient: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Faktur / nota / ket. singkat"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-98 ${
                    formData.type === 'MASUK' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTx ? 'Simpan Perubahan' : 'Catat ke BKU'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal for BKU */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`Cetak Buku Kas Umum (BKU) Unit ${activeUnit}`}
          subtitle={`Tahun Ajaran ${activeAcademicYear} • Periode: ${formatDateIndo(startDate)} s.d ${formatDateIndo(endDate)} • Saldo: ${formatRupiah(saldoAkhir)}`}
          badgeText="1-Page Auto Fit"
          defaultPreset="A4"
          defaultOrientation="portrait"
          defaultFitOnePage={true}
        >
          <div className="space-y-4 text-slate-900 text-xs">
            <PrintHeaderKop 
              profile={activeProfile}
              documentTitle={`BUKU KAS UMUM (BKU) - UNIT ${activeUnit}`}
              documentNumber={`BKU/${activeUnit}/${new Date().getFullYear()}`}
            />

            <div className="text-center text-[11px] text-slate-600 font-medium -mt-2">
              Tahun Ajaran: <strong>{activeAcademicYear}</strong> | Periode: {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}
            </div>

            {/* BKU Table */}
            <table className="w-full text-left text-[11px] border-2 border-slate-800">
              <thead className="bg-slate-100 font-bold border-b-2 border-slate-800 text-slate-900">
                <tr>
                  <th className="p-1.5 w-8 text-center border-r border-slate-400">No</th>
                  <th className="p-1.5 w-20 border-r border-slate-400">Tanggal</th>
                  <th className="p-1.5 w-24 border-r border-slate-400">No. Bukti</th>
                  <th className="p-1.5 border-r border-slate-400">Uraian Transaksi</th>
                  <th className="p-1.5 w-24 text-right border-r border-slate-400">Penerimaan</th>
                  <th className="p-1.5 w-24 text-right border-r border-slate-400">Pengeluaran</th>
                  <th className="p-1.5 w-28 text-right">Saldo Kas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {transactionsWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                      Tidak ada transaksi pada periode ini.
                    </td>
                  </tr>
                ) : (
                  transactionsWithBalance.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="p-1 text-center border-r border-slate-300 font-mono text-[10px]">{idx + 1}</td>
                      <td className="p-1 border-r border-slate-300 font-mono text-[10px] whitespace-nowrap">{row.date}</td>
                      <td className="p-1 border-r border-slate-300 font-mono font-semibold text-slate-700">{row.referenceNo || '-'}</td>
                      <td className="p-1 border-r border-slate-300">
                        <div className="font-semibold text-slate-900">{row.description}</div>
                        <div className="text-[9px] text-slate-500">{row.category} • {row.paymentMethod}</div>
                      </td>
                      <td className="p-1 text-right border-r border-slate-300 font-bold text-emerald-700 whitespace-nowrap">
                        {row.type === 'MASUK' ? formatRupiah(row.amount) : '-'}
                      </td>
                      <td className="p-1 text-right border-r border-slate-300 font-bold text-rose-600 whitespace-nowrap">
                        {row.type === 'KELUAR' ? formatRupiah(row.amount) : '-'}
                      </td>
                      <td className="p-1 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(row.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                  <td colSpan={4} className="p-1.5 text-right uppercase border-r border-slate-400">TOTAL:</td>
                  <td className="p-1.5 text-right text-emerald-800 border-r border-slate-400">{formatRupiah(totalMasuk)}</td>
                  <td className="p-1.5 text-right text-rose-800 border-r border-slate-400">{formatRupiah(totalKeluar)}</td>
                  <td className="p-1.5 text-right text-slate-900">{formatRupiah(saldoAkhir)}</td>
                </tr>
              </tbody>
            </table>

            {/* Closing Cash Summary */}
            <div className="p-2.5 bg-slate-50 border border-slate-300 rounded text-[11px] grid grid-cols-3 gap-2 text-center">
              <div>Kas Tunai: <strong>{formatRupiah(transactionsWithBalance.filter(r => r.paymentMethod === 'TUNAI').reduce((s, r) => s + (r.type === 'MASUK' ? r.amount : -r.amount), 0))}</strong></div>
              <div>Kas Rekening Bank: <strong>{formatRupiah(transactionsWithBalance.filter(r => r.paymentMethod !== 'TUNAI').reduce((s, r) => s + (r.type === 'MASUK' ? r.amount : -r.amount), 0))}</strong></div>
              <div>Total Saldo Kas: <strong className="text-emerald-700">{formatRupiah(saldoAkhir)}</strong></div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 pt-6 text-center text-xs print-signature-block">
              <div>
                <div className="text-slate-600 mb-12">Mengetahui,<br />Kepala Sekolah {activeProfile.name}</div>
                <div className="font-bold underline text-slate-900">{activeProfile.headmasterName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeProfile.headmasterNip || 'NIP. -'}</div>
              </div>
              <div>
                <div className="text-slate-600 mb-12">
                  {formatReportSignatureDate(activeProfile)}<br />
                  Bendahara Keuangan Sekolah,
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
