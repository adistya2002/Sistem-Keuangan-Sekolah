import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileSpreadsheet, Printer, Calendar, Filter, 
  Download, CheckCircle2, TrendingUp, TrendingDown, BookOpen, Layers,
  ChevronRight, Sparkles, RefreshCw, Clock
} from 'lucide-react';
import { SppMonth, ACADEMIC_MONTHS, BudgetPlanItem } from '../../types';
import { 
  formatRupiah, 
  formatDateIndo, 
  formatDateShort,
  formatDateTimeIndo,
  formatReportSignatureDate,
  getTodayDateStr,
  getCurrentMonthDateRange,
  getCurrentAcademicMonth,
  getAcademicYearDateRange, 
  getAcademicYearSemesterRange, 
  getAcademicYearMonthRange 
} from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { PrintHeaderKop } from '../common/PrintHeaderKop';

type ReportType = 'BKU' | 'SPP_RECAP' | 'RAPBS_REALIZATION' | 'MONTHLY_SUMMARY';
type PresetType = 'FULL_YEAR' | 'SEM_1' | 'SEM_2' | 'THIS_MONTH' | 'TODAY' | 'CUSTOM_MONTH' | 'CUSTOM_DATES';

export const ReportsModule: React.FC = () => {
  const { 
    state, 
    activeUnit, 
    activeProfile, 
    activeAcademicYear, 
    currentUser 
  } = useApp();

  const [reportType, setReportType] = useState<ReportType>('BKU');
  const [activePreset, setActivePreset] = useState<PresetType>('FULL_YEAR');
  const [selectedMonth, setSelectedMonth] = useState<SppMonth>(() => getCurrentAcademicMonth());
  
  // Initialize date range based on active academic year
  const initialDateRange = useMemo(() => {
    return getAcademicYearDateRange(activeAcademicYear);
  }, [activeAcademicYear]);

  const [startDate, setStartDate] = useState<string>(initialDateRange.startDate);
  const [endDate, setEndDate] = useState<string>(initialDateRange.endDate);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Synchronize start & end date automatically whenever activeAcademicYear or preset changes!
  useEffect(() => {
    const range = getAcademicYearDateRange(activeAcademicYear);
    if (activePreset === 'FULL_YEAR') {
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    } else if (activePreset === 'SEM_1') {
      const sem1 = getAcademicYearSemesterRange(activeAcademicYear, 1);
      setStartDate(sem1.startDate);
      setEndDate(sem1.endDate);
    } else if (activePreset === 'SEM_2') {
      const sem2 = getAcademicYearSemesterRange(activeAcademicYear, 2);
      setStartDate(sem2.startDate);
      setEndDate(sem2.endDate);
    } else if (activePreset === 'TODAY') {
      const today = getTodayDateStr();
      setStartDate(today);
      setEndDate(today);
    } else if (activePreset === 'THIS_MONTH') {
      const mRange = getCurrentMonthDateRange();
      setStartDate(mRange.startDate);
      setEndDate(mRange.endDate);
    } else if (activePreset === 'CUSTOM_MONTH') {
      const mRange = getAcademicYearMonthRange(activeAcademicYear, selectedMonth);
      setStartDate(mRange.startDate);
      setEndDate(mRange.endDate);
    }
  }, [activeAcademicYear, activePreset, selectedMonth]);

  // Preset Handlers
  const handleApplyPreset = (preset: PresetType, monthVal?: SppMonth) => {
    setActivePreset(preset);
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
    } else if (preset === 'TODAY') {
      const today = getTodayDateStr();
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'THIS_MONTH') {
      const mRange = getCurrentMonthDateRange();
      setStartDate(mRange.startDate);
      setEndDate(mRange.endDate);
    } else if (preset === 'CUSTOM_MONTH') {
      const targetMonth = monthVal || selectedMonth;
      if (monthVal) setSelectedMonth(monthVal);
      const mRange = getAcademicYearMonthRange(activeAcademicYear, targetMonth);
      setStartDate(mRange.startDate);
      setEndDate(mRange.endDate);
    }
  };

  // Transactions in current unit & academic year
  const unitTransactions = useMemo(() => {
    return state.cashTransactions
      .filter(tx => tx.unit === activeUnit && tx.academicYear === activeAcademicYear)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.cashTransactions, activeUnit, activeAcademicYear]);

  // Filtered transactions by selected start and end date
  const filteredTransactions = useMemo(() => {
    return unitTransactions.filter(tx => {
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;
      return true;
    });
  }, [unitTransactions, startDate, endDate]);

  // Calculate cumulative balance for BKU in this period
  const bkuRows = useMemo(() => {
    // Calculate initial starting balance prior to startDate in this academic year
    let startingBalance = 0;
    if (startDate) {
      const priorTx = unitTransactions.filter(tx => tx.date < startDate);
      startingBalance = priorTx.reduce((acc, t) => acc + (t.type === 'MASUK' ? t.amount : -t.amount), 0);
    }

    let runningBalance = startingBalance;
    return filteredTransactions.map((tx, idx) => {
      if (tx.type === 'MASUK') {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
      return {
        ...tx,
        no: idx + 1,
        runningBalance
      };
    });
  }, [filteredTransactions, unitTransactions, startDate]);

  const totalIn = filteredTransactions.filter(t => t.type === 'MASUK').reduce((s, t) => s + t.amount, 0);
  const totalOut = filteredTransactions.filter(t => t.type === 'KELUAR').reduce((s, t) => s + t.amount, 0);
  const finalBalance = totalIn - totalOut;

  // Active students in current unit & academic year
  const unitStudents = useMemo(() => {
    return state.students.filter(
      s => s.unit === activeUnit && s.academicYear === activeAcademicYear
    );
  }, [state.students, activeUnit, activeAcademicYear]);

  // SPP Recap Matrix
  const sppRecapMatrix = useMemo(() => {
    const payments = state.studentPayments.filter(
      p => p.unit === activeUnit && p.academicYear === activeAcademicYear && p.paymentType === 'SPP'
    );

    return unitStudents.map(student => {
      const studentPayments = payments.filter(p => p.studentId === student.id);
      const paidMonths = new Set<SppMonth>();
      studentPayments.forEach(p => p.sppMonths?.forEach(m => paidMonths.add(m)));

      const totalPaid = studentPayments.reduce((s, p) => s + p.totalAmount, 0);
      return {
        student,
        paidMonths,
        totalPaid
      };
    });
  }, [state.studentPayments, unitStudents, activeUnit, activeAcademicYear]);

  // RAPBS Plans with real calculation
  const unitBudgetPlans = useMemo(() => {
    return state.budgetPlans.filter(
      b => b.unit === activeUnit && b.academicYear === activeAcademicYear
    );
  }, [state.budgetPlans, activeUnit, activeAcademicYear]);

  const rapbsRealizationData = useMemo(() => {
    return unitBudgetPlans.map(item => {
      // Find matching cash transactions for this budget item
      const matchingTxs = filteredTransactions.filter(tx => {
        if (item.category === 'PENDAPATAN' && tx.type === 'MASUK') {
          if (
            tx.category.toLowerCase().includes(item.subCategory.toLowerCase()) ||
            item.subCategory.toLowerCase().includes(tx.category.toLowerCase()) ||
            item.title.toLowerCase().includes(tx.category.toLowerCase()) ||
            tx.description.toLowerCase().includes(item.title.toLowerCase()) ||
            tx.description.toLowerCase().includes(item.subCategory.toLowerCase()) ||
            (item.subCategory.toLowerCase().includes('spp') && (tx.category.toLowerCase().includes('spp') || tx.category.toLowerCase().includes('penerimaan') || tx.description.toLowerCase().includes('spp'))) ||
            (item.subCategory.toLowerCase().includes('dsp') && (tx.category.toLowerCase().includes('dsp') || tx.category.toLowerCase().includes('pangkal') || tx.category.toLowerCase().includes('sarpras'))) ||
            (item.subCategory.toLowerCase().includes('bop') && (tx.category.toLowerCase().includes('bop') || tx.category.toLowerCase().includes('bos') || tx.category.toLowerCase().includes('pemerintah'))) ||
            (item.subCategory.toLowerCase().includes('infaq') && (tx.category.toLowerCase().includes('infaq') || tx.category.toLowerCase().includes('santri') || tx.category.toLowerCase().includes('donasi') || tx.category.toLowerCase().includes('wakaf')))
          ) {
            return true;
          }
        } else if (item.category === 'BELANJA' && tx.type === 'KELUAR') {
          if (
            tx.category.toLowerCase().includes(item.subCategory.toLowerCase()) ||
            item.subCategory.toLowerCase().includes(tx.category.toLowerCase()) ||
            item.title.toLowerCase().includes(tx.category.toLowerCase()) ||
            tx.description.toLowerCase().includes(item.title.toLowerCase()) ||
            tx.description.toLowerCase().includes(item.subCategory.toLowerCase()) ||
            (item.subCategory.toLowerCase().includes('gaji') && (tx.category.toLowerCase().includes('gaji') || tx.category.toLowerCase().includes('honor') || tx.category.toLowerCase().includes('bisyarah') || tx.category.toLowerCase().includes('mukafaah'))) ||
            (item.subCategory.toLowerCase().includes('bahan') && (tx.category.toLowerCase().includes('bahan') || tx.category.toLowerCase().includes('atk') || tx.category.toLowerCase().includes('media') || tx.category.toLowerCase().includes('modul') || tx.category.toLowerCase().includes('buku'))) ||
            (item.subCategory.toLowerCase().includes('operasional') && (tx.category.toLowerCase().includes('operasional') || tx.category.toLowerCase().includes('listrik') || tx.category.toLowerCase().includes('air') || tx.category.toLowerCase().includes('internet') || tx.category.toLowerCase().includes('wifi') || tx.category.toLowerCase().includes('pdam') || tx.category.toLowerCase().includes('pln'))) ||
            (item.subCategory.toLowerCase().includes('kegiatan') && (tx.category.toLowerCase().includes('kegiatan') || tx.category.toLowerCase().includes('tema') || tx.category.toLowerCase().includes('wisuda') || tx.category.toLowerCase().includes('outing') || tx.category.toLowerCase().includes('manasik'))) ||
            (item.subCategory.toLowerCase().includes('pemeliharaan') && (tx.category.toLowerCase().includes('pemeliharaan') || tx.category.toLowerCase().includes('sarana') || tx.category.toLowerCase().includes('prasarana') || tx.category.toLowerCase().includes('perawatan'))) ||
            (item.subCategory.toLowerCase().includes('snack') && (tx.category.toLowerCase().includes('snack') || tx.category.toLowerCase().includes('nutrisi') || tx.category.toLowerCase().includes('pmt')))
          ) {
            return true;
          }
        }
        return false;
      });

      const realizedAmount = matchingTxs.reduce((sum, t) => sum + t.amount, 0);
      const percentage = item.plannedAmount > 0 ? (realizedAmount / item.plannedAmount) * 100 : 0;
      const difference = item.category === 'PENDAPATAN' 
        ? (realizedAmount - item.plannedAmount) 
        : (item.plannedAmount - realizedAmount);

      return {
        ...item,
        realizedAmount,
        percentage,
        difference,
        txCount: matchingTxs.length
      };
    });
  }, [unitBudgetPlans, filteredTransactions]);

  const incomeBudgetRealization = useMemo(() => {
    return rapbsRealizationData.filter(b => b.category === 'PENDAPATAN');
  }, [rapbsRealizationData]);

  const expenseBudgetRealization = useMemo(() => {
    return rapbsRealizationData.filter(b => b.category === 'BELANJA');
  }, [rapbsRealizationData]);

  const totalPlannedIncome = useMemo(() => incomeBudgetRealization.reduce((s, b) => s + b.plannedAmount, 0), [incomeBudgetRealization]);
  const totalRealizedIncome = useMemo(() => incomeBudgetRealization.reduce((s, b) => s + b.realizedAmount, 0), [incomeBudgetRealization]);
  const totalPlannedExpense = useMemo(() => expenseBudgetRealization.reduce((s, b) => s + b.plannedAmount, 0), [expenseBudgetRealization]);
  const totalRealizedExpense = useMemo(() => expenseBudgetRealization.reduce((s, b) => s + b.realizedAmount, 0), [expenseBudgetRealization]);

  // Real Cash Flow Summary Data grouped dynamically by Category
  const incomeCategoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'MASUK')
      .forEach(t => {
        const cat = t.category || 'Penerimaan Lain-lain';
        map[cat] = (map[cat] || 0) + t.amount;
      });
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalIn > 0 ? (amount / totalIn) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalIn]);

  const expenseCategoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'KELUAR')
      .forEach(t => {
        const cat = t.category || 'Pengeluaran Lainnya';
        map[cat] = (map[cat] || 0) + t.amount;
      });
    return Object.entries(map).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalOut > 0 ? (amount / totalOut) * 100 : 0
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalOut]);

  // Export to CSV Function
  const exportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Laporan_${reportType}_${activeUnit}_${activeAcademicYear.replace('/', '_')}.csv`;

    if (reportType === 'BKU') {
      headers = ['No', 'Tanggal', 'No. Bukti', 'Uraian Transaksi', 'Kategori', 'Metode', 'Penerimaan (Rp)', 'Pengeluaran (Rp)', 'Saldo Kas (Rp)'];
      rows = bkuRows.map(r => [
        r.no,
        r.date,
        `"${r.receiptNumber || r.referenceNo || '-'}"`,
        `"${r.description.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        r.paymentMethod,
        r.type === 'MASUK' ? r.amount : 0,
        r.type === 'KELUAR' ? r.amount : 0,
        r.runningBalance
      ]);
    } else if (reportType === 'SPP_RECAP') {
      headers = ['No', 'Nama Siswa/Santri', 'Kelas/Halaqoh', ...ACADEMIC_MONTHS, 'Total Terbayar (Rp)'];
      rows = sppRecapMatrix.map((r, i) => [
        i + 1,
        `"${r.student.name}"`,
        `"${r.student.className}"`,
        ...ACADEMIC_MONTHS.map(m => (r.paidMonths.has(m) ? 'LUNAS' : '-')),
        r.totalPaid
      ]);
    } else if (reportType === 'RAPBS_REALIZATION') {
      headers = ['Kode', 'Jenis Anggaran', 'Kategori Pos', 'Pos Anggaran RAPBS', 'Target Anggaran (Rp)', 'Realisasi (Rp)', 'Capaian (%)', 'Selisih (Rp)'];
      rows = rapbsRealizationData.map(b => [
        b.code,
        b.category === 'PENDAPATAN' ? 'PENDAPATAN (Penerimaan)' : 'BELANJA (Pengeluaran)',
        `"${b.subCategory}"`,
        `"${b.title.replace(/"/g, '""')}"`,
        b.plannedAmount,
        b.realizedAmount,
        b.percentage.toFixed(1) + '%',
        b.difference
      ]);
    } else {
      headers = ['Tipe', 'Kategori', 'Nominal (Rp)', 'Persentase (%)'];
      incomeCategoryBreakdown.forEach(item => {
        rows.push(['PENERIMAAN', `"${item.category}"`, item.amount, item.percentage.toFixed(1) + '%']);
      });
      expenseCategoryBreakdown.forEach(item => {
        rows.push(['PENGELUARAN', `"${item.category}"`, item.amount, item.percentage.toFixed(1) + '%']);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-indigo-600">
              Laporan & BKU Terintegrasi
            </span>
            <span className="text-xs font-semibold text-slate-500">Unit {activeUnit} • TA {activeAcademicYear}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Cetak BKU & Rekapitulasi Laporan Keuangan</h2>
          <p className="text-xs text-slate-500">
            Sinkronisasi otomatis Buku Kas Umum, matriks pembayaran SPP 12 bulan, evaluasi realisasi RAPBS & arus kas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <button
            onClick={exportCsv}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1.5 transition-all hover:scale-102"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all hover:scale-102"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 no-print">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => setReportType('BKU')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border text-center ${
              reportType === 'BKU'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            1. Buku Kas Umum (BKU)
          </button>
          <button
            onClick={() => setReportType('SPP_RECAP')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border text-center ${
              reportType === 'SPP_RECAP'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            2. Rekap Matriks SPP 12 Bulan
          </button>
          <button
            onClick={() => setReportType('RAPBS_REALIZATION')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border text-center ${
              reportType === 'RAPBS_REALIZATION'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            3. Laporan Realisasi RAPBS
          </button>
          <button
            onClick={() => setReportType('MONTHLY_SUMMARY')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all border text-center ${
              reportType === 'MONTHLY_SUMMARY'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            4. Ringkasan Arus Kas Masuk/Keluar
          </button>
        </div>

        {/* Date Range & Academic Year Presets */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 mr-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Periode Cepat TA {activeAcademicYear}:
            </span>

            <button
              type="button"
              onClick={() => handleApplyPreset('TODAY')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors border flex items-center gap-1.5 ${
                activePreset === 'TODAY'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3 h-3 text-emerald-600" />
              Hari Ini ({formatDateShort(getTodayDateStr())})
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('THIS_MONTH')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors border ${
                activePreset === 'THIS_MONTH'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Bulan Ini ({getCurrentAcademicMonth()})
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('SEM_1')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors border ${
                activePreset === 'SEM_1'
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
                activePreset === 'SEM_2'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semester 2 (Genap)
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('FULL_YEAR')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors border ${
                activePreset === 'FULL_YEAR'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              1 Tahun Penuh (12 Bln)
            </button>

            {/* Custom Month Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Bulan:</span>
              <select
                value={selectedMonth}
                onChange={(e) => handleApplyPreset('CUSTOM_MONTH', e.target.value as SppMonth)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  activePreset === 'CUSTOM_MONTH'
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

          {/* Manual Date Inputs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Dari Tanggal:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setActivePreset('CUSTOM_DATES');
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
                  setActivePreset('CUSTOM_DATES');
                  setEndDate(e.target.value);
                }}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="text-slate-500 text-[11px] ml-auto flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-1 rounded font-medium">
                Tersaring: <strong>{filteredTransactions.length}</strong> transaksi ({formatRupiah(totalIn)} masuk, {formatRupiah(totalOut)} keluar)
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Official Report Document Container */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-slate-900 printable-document">
        
        {/* Official Kop Surat */}
        <div className="border-b-2 border-slate-900 pb-3 text-center">
          <div className="text-xs font-bold tracking-wider text-slate-600 uppercase">
            {activeProfile.foundation}
          </div>
          <div className="text-xl font-black text-slate-900 uppercase mt-0.5">
            {activeProfile.name}
          </div>
          <div className="text-xs text-slate-600 mt-0.5">
            NPSN: {activeProfile.npsn} • {activeProfile.address} • Telp: {activeProfile.phone}
          </div>
        </div>

        {/* Report Title */}
        <div className="text-center space-y-1">
          <h3 className="text-base font-black uppercase text-slate-900 tracking-wide">
            {reportType === 'BKU' && 'BUKU KAS UMUM (BKU)'}
            {reportType === 'SPP_RECAP' && (activeUnit === 'RQ' ? 'REKAPITULASI PEMBAYARAN SPP SANTRI (12 BULAN)' : 'REKAPITULASI PEMBAYARAN SPP SISWA (12 BULAN)')}
            {reportType === 'RAPBS_REALIZATION' && 'LAPORAN REALISASI ANGGARAN PENDAPATAN & BELANJA SEKOLAH (RAPBS)'}
            {reportType === 'MONTHLY_SUMMARY' && 'RINGKASAN REKAPITULASI PENERIMAAN & PENGELUARAN KAS'}
          </h3>
          <div className="text-xs text-slate-600 font-medium">
            Tahun Ajaran: <strong>{activeAcademicYear}</strong> | Periode: {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}
          </div>
        </div>

        {/* REPORT 1: BKU STANDAR */}
        {reportType === 'BKU' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                  <tr>
                    <th className="p-2.5 w-10 text-center border-r border-slate-300">No</th>
                    <th className="p-2.5 w-24 border-r border-slate-300">Tanggal</th>
                    <th className="p-2.5 w-28 border-r border-slate-300">No. Bukti</th>
                    <th className="p-2.5 border-r border-slate-300">Uraian Transaksi</th>
                    <th className="p-2.5 w-32 text-right border-r border-slate-300">Penerimaan (Rp)</th>
                    <th className="p-2.5 w-32 text-right border-r border-slate-300">Pengeluaran (Rp)</th>
                    <th className="p-2.5 w-36 text-right">Saldo Kas (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bkuRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                        Tidak ada transaksi kas pada periode {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}.
                      </td>
                    </tr>
                  ) : (
                    bkuRows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-2 text-center border-r border-slate-200 font-mono text-[11px]">{row.no}</td>
                        <td className="p-2 border-r border-slate-200 font-mono text-[11px] whitespace-nowrap">{row.date}</td>
                        <td className="p-2 border-r border-slate-200 font-mono font-semibold text-slate-700">{row.receiptNumber || row.referenceNo || '-'}</td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-semibold text-slate-900">{row.description}</div>
                          <div className="text-[10px] text-slate-500">{row.category} • {row.paymentMethod} {row.sourceOrRecipient ? `• ${row.sourceOrRecipient}` : ''}</div>
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold text-emerald-700 whitespace-nowrap">
                          {row.type === 'MASUK' ? formatRupiah(row.amount) : '-'}
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold text-rose-600 whitespace-nowrap">
                          {row.type === 'KELUAR' ? formatRupiah(row.amount) : '-'}
                        </td>
                        <td className="p-2 text-right font-black text-slate-900 whitespace-nowrap">
                          {formatRupiah(row.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Summary Footer */}
                  <tr className="bg-slate-100 font-black text-xs border-t-2 border-slate-400">
                    <td colSpan={4} className="p-2.5 text-right uppercase border-r border-slate-300">TOTAL PERIODE INI:</td>
                    <td className="p-2.5 text-right text-emerald-800 border-r border-slate-300">{formatRupiah(totalIn)}</td>
                    <td className="p-2.5 text-right text-rose-800 border-r border-slate-300">{formatRupiah(totalOut)}</td>
                    <td className="p-2.5 text-right text-slate-900">{formatRupiah(finalBalance)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Closing Cash Count Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-900">Penutupan Kas Buku Kas Umum:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[11px]">1. Saldo Kas Tunai (Brankas):</div>
                  <div className="font-bold text-sm text-slate-900">
                    {formatRupiah(bkuRows.filter(r => r.paymentMethod === 'TUNAI').reduce((s, r) => s + (r.type === 'MASUK' ? r.amount : -r.amount), 0))}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[11px]">2. Saldo Kas di Rekening Bank:</div>
                  <div className="font-bold text-sm text-slate-900">
                    {formatRupiah(bkuRows.filter(r => r.paymentMethod !== 'TUNAI').reduce((s, r) => s + (r.type === 'MASUK' ? r.amount : -r.amount), 0))}
                  </div>
                </div>
                <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="text-indigo-800 font-semibold text-[11px]">3. Total Saldo Kas Akhir Periode:</div>
                  <div className="font-black text-sm text-indigo-950">{formatRupiah(finalBalance)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORT 2: SPP 12-MONTH RECAP MATRIX */}
        {reportType === 'SPP_RECAP' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                <tr>
                  <th className="p-2 w-8 text-center border-r border-slate-300">No</th>
                  <th className="p-2 w-36 border-r border-slate-300">
                    Nama {activeUnit === 'RQ' ? 'Santri' : 'Murid'}
                  </th>
                  <th className="p-2 w-28 border-r border-slate-300">
                    {activeUnit === 'RQ' ? 'Halaqoh / Level' : 'Kelas'}
                  </th>
                  {ACADEMIC_MONTHS.map(m => (
                    <th key={m} className="p-1 text-center border-r border-slate-300 text-[10px]">
                      {m.slice(0, 3)}
                    </th>
                  ))}
                  <th className="p-2 text-right w-28">Total Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sppRecapMatrix.length === 0 ? (
                  <tr>
                    <td colSpan={16} className="p-6 text-center text-slate-400 italic">
                      Belum ada data siswa/santri aktif di unit {activeUnit} untuk Tahun Ajaran {activeAcademicYear}.
                    </td>
                  </tr>
                ) : (
                  sppRecapMatrix.map((row, idx) => (
                    <tr key={row.student.id} className="hover:bg-slate-50">
                      <td className="p-1.5 text-center border-r border-slate-200 font-mono text-[10px]">{idx + 1}</td>
                      <td className="p-1.5 border-r border-slate-200 font-bold text-slate-900">{row.student.name}</td>
                      <td className="p-1.5 border-r border-slate-200 text-slate-600 font-semibold">{row.student.className}</td>
                      {ACADEMIC_MONTHS.map(m => {
                        const isPaid = row.paidMonths.has(m);
                        return (
                          <td key={m} className="p-1 text-center border-r border-slate-200">
                            {isPaid ? (
                              <span className="text-emerald-700 font-black">✓</span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-1.5 text-right font-black text-slate-900">{formatRupiah(row.totalPaid)}</td>
                    </tr>
                  ))
                )}
                {/* Total Row */}
                {sppRecapMatrix.length > 0 && (
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                    <td colSpan={3} className="p-2 text-right uppercase border-r border-slate-300">
                      TOTAL PENERIMAAN SPP ({sppRecapMatrix.length} {activeUnit === 'RQ' ? 'Santri' : 'Siswa'}):
                    </td>
                    {ACADEMIC_MONTHS.map(m => {
                      const countPaid = sppRecapMatrix.filter(r => r.paidMonths.has(m)).length;
                      return (
                        <td key={m} className="p-1 text-center border-r border-slate-300 font-mono text-[10px] text-emerald-800">
                          {countPaid > 0 ? countPaid : '-'}
                        </td>
                      );
                    })}
                    <td className="p-2 text-right text-emerald-800">
                      {formatRupiah(sppRecapMatrix.reduce((s, r) => s + r.totalPaid, 0))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 3: RAPBS REALIZATION */}
        {reportType === 'RAPBS_REALIZATION' && (
          <div className="space-y-4">
            
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Target & Realisasi Pendapatan</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-emerald-950">{formatRupiah(totalRealizedIncome)}</span>
                  <span className="text-xs font-bold text-emerald-700">
                    {totalPlannedIncome > 0 ? ((totalRealizedIncome / totalPlannedIncome) * 100).toFixed(1) + '%' : '0%'}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-700 mt-1">Target RAPBS: {formatRupiah(totalPlannedIncome)}</div>
              </div>

              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider mb-1">Rencana & Realisasi Belanja</div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-rose-950">{formatRupiah(totalRealizedExpense)}</span>
                  <span className="text-xs font-bold text-rose-700">
                    {totalPlannedExpense > 0 ? ((totalRealizedExpense / totalPlannedExpense) * 100).toFixed(1) + '%' : '0%'}
                  </span>
                </div>
                <div className="text-[11px] text-rose-700 mt-1">Target RAPBS: {formatRupiah(totalPlannedExpense)}</div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Surplus / (Defisit) Realisasi</div>
                <div className="flex items-baseline justify-between">
                  <span className={`text-lg font-black ${(totalRealizedIncome - totalRealizedExpense) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatRupiah(totalRealizedIncome - totalRealizedExpense)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Target: {formatRupiah(totalPlannedIncome - totalPlannedExpense)}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  {(totalRealizedIncome - totalRealizedExpense) >= 0 ? 'Surplus Kas Operasional' : 'Defisit Kas Operasional'}
                </div>
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300 text-slate-800">
                <tr>
                  <th className="p-2.5 w-12 text-center border-r border-slate-300">Kode</th>
                  <th className="p-2.5 border-r border-slate-300">Pos Anggaran RAPBS</th>
                  <th className="p-2.5 w-28 border-r border-slate-300">Kategori</th>
                  <th className="p-2.5 w-32 text-right border-r border-slate-300">Target (Rp)</th>
                  <th className="p-2.5 w-32 text-right border-r border-slate-300">Realisasi (Rp)</th>
                  <th className="p-2.5 w-20 text-right border-r border-slate-300">Capaian</th>
                  <th className="p-2.5 w-28 text-right">Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rapbsRealizationData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      Belum ada rancangan pos RAPBS untuk unit {activeUnit} di Tahun Ajaran {activeAcademicYear}.
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* SECTION 1: PENDAPATAN */}
                    <tr className="bg-emerald-50/80 font-bold text-emerald-900 border-t-2 border-emerald-300">
                      <td colSpan={7} className="p-2 text-xs uppercase tracking-wide">
                        I. PENDAPATAN (PENERIMAAN KAS SEKOLAH)
                      </td>
                    </tr>
                    {incomeBudgetRealization.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-2 text-center border-r border-slate-200 font-mono font-bold text-slate-700">{b.code}</td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{b.title}</div>
                          <div className="text-[10px] text-slate-500">{b.subCategory}</div>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            PENDAPATAN
                          </span>
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold">{formatRupiah(b.plannedAmount)}</td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold text-emerald-700">
                          {formatRupiah(b.realizedAmount)}
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 font-mono font-bold text-slate-800">
                          {b.percentage.toFixed(1)}%
                        </td>
                        <td className={`p-2 text-right font-mono font-bold ${b.difference >= 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                          {formatRupiah(b.difference)}
                        </td>
                      </tr>
                    ))}
                    {/* Subtotal Pendapatan */}
                    <tr className="bg-emerald-100/60 font-bold text-xs border-y border-emerald-300">
                      <td colSpan={3} className="p-2 text-right uppercase text-emerald-900 border-r border-emerald-200">
                        SUBTOTAL PENDAPATAN:
                      </td>
                      <td className="p-2 text-right border-r border-emerald-200 text-slate-900 font-bold">
                        {formatRupiah(totalPlannedIncome)}
                      </td>
                      <td className="p-2 text-right border-r border-emerald-200 text-emerald-800 font-black">
                        {formatRupiah(totalRealizedIncome)}
                      </td>
                      <td className="p-2 text-right border-r border-emerald-200 font-mono font-bold text-emerald-900">
                        {totalPlannedIncome > 0 ? ((totalRealizedIncome / totalPlannedIncome) * 100).toFixed(1) + '%' : '0%'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-900">
                        {formatRupiah(totalRealizedIncome - totalPlannedIncome)}
                      </td>
                    </tr>

                    {/* SECTION 2: BELANJA */}
                    <tr className="bg-rose-50/80 font-bold text-rose-900 border-t-2 border-rose-300">
                      <td colSpan={7} className="p-2 text-xs uppercase tracking-wide">
                        II. BELANJA (PENGELUARAN OPERASIONAL SEKOLAH)
                      </td>
                    </tr>
                    {expenseBudgetRealization.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-2 text-center border-r border-slate-200 font-mono font-bold text-slate-700">{b.code}</td>
                        <td className="p-2 border-r border-slate-200">
                          <div className="font-bold text-slate-900">{b.title}</div>
                          <div className="text-[10px] text-slate-500">{b.subCategory}</div>
                        </td>
                        <td className="p-2 border-r border-slate-200">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            BELANJA
                          </span>
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold">{formatRupiah(b.plannedAmount)}</td>
                        <td className="p-2 text-right border-r border-slate-200 font-bold text-rose-700">
                          {formatRupiah(b.realizedAmount)}
                        </td>
                        <td className="p-2 text-right border-r border-slate-200 font-mono font-bold text-slate-800">
                          {b.percentage.toFixed(1)}%
                        </td>
                        <td className={`p-2 text-right font-mono font-bold ${b.difference >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                          {formatRupiah(b.difference)}
                        </td>
                      </tr>
                    ))}
                    {/* Subtotal Belanja */}
                    <tr className="bg-rose-100/60 font-bold text-xs border-y border-rose-300">
                      <td colSpan={3} className="p-2 text-right uppercase text-rose-900 border-r border-rose-200">
                        SUBTOTAL BELANJA:
                      </td>
                      <td className="p-2 text-right border-r border-rose-200 text-slate-900 font-bold">
                        {formatRupiah(totalPlannedExpense)}
                      </td>
                      <td className="p-2 text-right border-r border-rose-200 text-rose-800 font-black">
                        {formatRupiah(totalRealizedExpense)}
                      </td>
                      <td className="p-2 text-right border-r border-rose-200 font-mono font-bold text-rose-900">
                        {totalPlannedExpense > 0 ? ((totalRealizedExpense / totalPlannedExpense) * 100).toFixed(1) + '%' : '0%'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-rose-900">
                        {formatRupiah(totalPlannedExpense - totalRealizedExpense)}
                      </td>
                    </tr>

                    {/* NET SUMMARY: SURPLUS / DEFISIT */}
                    <tr className="bg-slate-200 font-black text-xs border-t-2 border-slate-400">
                      <td colSpan={3} className="p-2.5 text-right uppercase border-r border-slate-300">
                        SURPLUS / (DEFISIT) BERSIH:
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-300">
                        {formatRupiah(totalPlannedIncome - totalPlannedExpense)}
                      </td>
                      <td className={`p-2.5 text-right border-r border-slate-300 ${(totalRealizedIncome - totalRealizedExpense) >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                        {formatRupiah(totalRealizedIncome - totalRealizedExpense)}
                      </td>
                      <td className="p-2.5 text-right border-r border-slate-300 font-mono">
                        -
                      </td>
                      <td className="p-2.5 text-right">
                        {formatRupiah((totalRealizedIncome - totalRealizedExpense) - (totalPlannedIncome - totalPlannedExpense))}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* REPORT 4: MONTHLY CASH SUMMARY */}
        {reportType === 'MONTHLY_SUMMARY' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Income breakdown */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Penerimaan Kas (Masuk)
                  </div>
                  <span className="font-black text-emerald-950 font-mono">{formatRupiah(totalIn)}</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  {incomeCategoryBreakdown.length === 0 ? (
                    <div className="text-slate-400 italic text-center py-3">Tidak ada kas masuk pada periode ini.</div>
                  ) : (
                    incomeCategoryBreakdown.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-emerald-100 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{item.category}</div>
                          <div className="text-[10px] text-slate-400">{item.percentage.toFixed(1)}% dari total masuk</div>
                        </div>
                        <span className="font-bold text-emerald-800 font-mono">{formatRupiah(item.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Expense breakdown */}
              <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-rose-900 text-sm flex items-center gap-1.5">
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    Pengeluaran Kas (Keluar)
                  </div>
                  <span className="font-black text-rose-950 font-mono">{formatRupiah(totalOut)}</span>
                </div>

                <div className="space-y-2 text-xs">
                  {expenseCategoryBreakdown.length === 0 ? (
                    <div className="text-slate-400 italic text-center py-3">Tidak ada kas keluar pada periode ini.</div>
                  ) : (
                    expenseCategoryBreakdown.map((item, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-rose-100 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-800">{item.category}</div>
                          <div className="text-[10px] text-slate-400">{item.percentage.toFixed(1)}% dari total keluar</div>
                        </div>
                        <span className="font-bold text-rose-800 font-mono">{formatRupiah(item.amount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Net Surplus/Deficit Box */}
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              finalBalance >= 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-950' : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              <div>
                <div className="font-bold text-sm">Surplus / (Defisit) Arus Kas Periode Ini:</div>
                <div className="text-[11px] text-slate-500">
                  Total Penerimaan ({formatRupiah(totalIn)}) dikurangi Total Pengeluaran ({formatRupiah(totalOut)})
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black font-mono">{formatRupiah(finalBalance)}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider">
                  {finalBalance >= 0 ? 'Surplus Kas' : 'Defisit Kas'}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Legal Approval Signatures */}
        <div className="grid grid-cols-2 pt-10 text-center text-xs">
          <div>
            <div className="text-slate-500 mb-14">Mengetahui,<br />Kepala Sekolah {activeProfile.name}</div>
            <div className="font-bold underline text-sm">{activeProfile.headmasterName}</div>
            <div className="text-[11px] text-slate-500 font-mono">{activeProfile.headmasterNip || 'NIP. -'}</div>
          </div>
          <div>
            <div className="text-slate-500 mb-14">
              {formatReportSignatureDate(activeProfile)}<br />
              Bendahara Keuangan Sekolah,
            </div>
            <div className="font-bold underline text-sm">{activeProfile.treasurerName}</div>
            <div className="text-[11px] text-slate-500 font-mono">{activeProfile.treasurerNip || 'NIP. -'}</div>
          </div>
        </div>

      </div>

      {/* Print Preview Modal with 1-Page Auto Fit & Paper Presets */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`Cetak ${
            reportType === 'BKU' ? 'Buku Kas Umum (BKU)' :
            reportType === 'SPP_RECAP' ? 'Rekap Matriks SPP 12 Bulan' :
            reportType === 'RAPBS_REALIZATION' ? 'Laporan Realisasi RAPBS' : 'Ringkasan Arus Kas Masuk/Keluar'
          }`}
          subtitle={`Unit ${activeUnit} • TA ${activeAcademicYear} • Periode: ${formatDateIndo(startDate)} s.d ${formatDateIndo(endDate)}`}
          badgeText={reportType === 'SPP_RECAP' ? 'Mode Landscape (Mendatar)' : 'Mode Cetak Sesuai Kertas'}
          defaultPreset={reportType === 'SPP_RECAP' ? 'A4' : 'A4'}
          defaultOrientation={reportType === 'SPP_RECAP' ? 'landscape' : 'portrait'}
          defaultFitOnePage={true}
        >
          <div className="space-y-4 text-slate-900 text-xs">
            <PrintHeaderKop 
              profile={activeProfile}
              documentTitle={
                reportType === 'BKU' ? 'BUKU KAS UMUM (BKU)' :
                reportType === 'SPP_RECAP' ? (activeUnit === 'RQ' ? 'REKAPITULASI PEMBAYARAN SPP SANTRI (12 BULAN)' : 'REKAPITULASI PEMBAYARAN SPP SISWA (12 BULAN)') :
                reportType === 'RAPBS_REALIZATION' ? 'LAPORAN REALISASI ANGGARAN PENDAPATAN & BELANJA SEKOLAH (RAPBS)' :
                'RINGKASAN REKAPITULASI PENERIMAAN & PENGELUARAN KAS'
              }
              documentNumber={`LAP-${reportType}/${activeUnit}/${new Date().getFullYear()}`}
            />

            <div className="text-center text-[11px] text-slate-600 font-medium -mt-2">
              Tahun Ajaran: <strong>{activeAcademicYear}</strong> | Periode: {formatDateIndo(startDate)} s.d {formatDateIndo(endDate)}
            </div>

            {/* REPORT 1: BKU */}
            {reportType === 'BKU' && (
              <div className="space-y-3">
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
                    {bkuRows.map(row => (
                      <tr key={row.id}>
                        <td className="p-1 text-center border-r border-slate-300 font-mono text-[10px]">{row.no}</td>
                        <td className="p-1 border-r border-slate-300 font-mono text-[10px] whitespace-nowrap">{row.date}</td>
                        <td className="p-1 border-r border-slate-300 font-mono font-semibold text-slate-700">{row.receiptNumber || row.referenceNo || '-'}</td>
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
                    ))}
                    <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                      <td colSpan={4} className="p-1.5 text-right uppercase border-r border-slate-400">TOTAL:</td>
                      <td className="p-1.5 text-right text-emerald-800 border-r border-slate-400">{formatRupiah(totalIn)}</td>
                      <td className="p-1.5 text-right text-rose-800 border-r border-slate-400">{formatRupiah(totalOut)}</td>
                      <td className="p-1.5 text-right text-slate-900">{formatRupiah(finalBalance)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Closing Cash Summary */}
                <div className="p-2 bg-slate-50 border border-slate-300 rounded text-[11px] grid grid-cols-3 gap-2 text-center">
                  <div>Kas Tunai: <strong>{formatRupiah(bkuRows.filter(r => r.paymentMethod === 'TUNAI').reduce((s, r) => s + (r.type === 'MASUK' ? r.amount : -r.amount), 0))}</strong></div>
                  <div>Kas Bank: <strong>{formatRupiah(bkuRows.filter(r => r.paymentMethod !== 'TUNAI').reduce((s, r) => s + (r.type === 'MASUK' ? r.amount : -r.amount), 0))}</strong></div>
                  <div>Total Saldo: <strong className="text-emerald-700">{formatRupiah(finalBalance)}</strong></div>
                </div>
              </div>
            )}

            {/* REPORT 2: SPP RECAP MATRIX */}
            {reportType === 'SPP_RECAP' && (
              <table className="w-full text-left text-[10px] border-2 border-slate-800">
                <thead className="bg-slate-100 font-bold border-b-2 border-slate-800 text-slate-900">
                  <tr>
                    <th className="p-1 w-6 text-center border-r border-slate-400">No</th>
                    <th className="p-1 border-r border-slate-400">Nama {activeUnit === 'RQ' ? 'Santri' : 'Murid'}</th>
                    <th className="p-1 w-16 border-r border-slate-400">{activeUnit === 'RQ' ? 'Halaqoh' : 'Kelas'}</th>
                    {ACADEMIC_MONTHS.map(m => (
                      <th key={m} className="p-1 text-center border-r border-slate-400 text-[9px]">
                        {m.slice(0, 3)}
                      </th>
                    ))}
                    <th className="p-1 text-right w-20">Total Bayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {sppRecapMatrix.map((row, idx) => (
                    <tr key={row.student.id}>
                      <td className="p-1 text-center border-r border-slate-300 font-mono text-[9px]">{idx + 1}</td>
                      <td className="p-1 border-r border-slate-300 font-bold text-slate-900">{row.student.name}</td>
                      <td className="p-1 border-r border-slate-300 text-slate-600">{row.student.className}</td>
                      {ACADEMIC_MONTHS.map(m => (
                        <td key={m} className="p-0.5 text-center border-r border-slate-300 text-[9px]">
                          {row.paidMonths.has(m) ? <span className="text-emerald-700 font-bold">✓</span> : <span className="text-slate-300">-</span>}
                        </td>
                      ))}
                      <td className="p-1 text-right font-bold text-slate-900">{formatRupiah(row.totalPaid)}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                    <td colSpan={3} className="p-1 text-right uppercase border-r border-slate-400">TOTAL:</td>
                    {ACADEMIC_MONTHS.map(m => (
                      <td key={m} className="p-0.5 text-center border-r border-slate-400 font-mono text-[9px]">
                        {sppRecapMatrix.filter(r => r.paidMonths.has(m)).length || '-'}
                      </td>
                    ))}
                    <td className="p-1 text-right font-bold text-slate-900">
                      {formatRupiah(sppRecapMatrix.reduce((s, r) => s + r.totalPaid, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REPORT 3: RAPBS REALIZATION */}
            {reportType === 'RAPBS_REALIZATION' && (
              <table className="w-full text-left text-[11px] border-2 border-slate-800">
                <thead className="bg-slate-100 font-bold border-b-2 border-slate-800 text-slate-900">
                  <tr>
                    <th className="p-1.5 w-12 text-center border-r border-slate-400">Kode</th>
                    <th className="p-1.5 border-r border-slate-400">Pos Anggaran RAPBS</th>
                    <th className="p-1.5 w-24 border-r border-slate-400">Kategori</th>
                    <th className="p-1.5 w-28 text-right border-r border-slate-400">Target (Rp)</th>
                    <th className="p-1.5 w-28 text-right border-r border-slate-400">Realisasi (Rp)</th>
                    <th className="p-1.5 w-16 text-right">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {/* SECTION 1: PENDAPATAN */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-400">
                    <td colSpan={6} className="p-1.5 uppercase text-[10px] tracking-wider">
                      I. PENDAPATAN (PENERIMAAN KAS SEKOLAH)
                    </td>
                  </tr>
                  {incomeBudgetRealization.map(b => (
                    <tr key={b.id}>
                      <td className="p-1.5 text-center border-r border-slate-300 font-mono font-bold">{b.code}</td>
                      <td className="p-1.5 border-r border-slate-300">
                        <div className="font-bold text-slate-900">{b.title}</div>
                        <div className="text-[9px] text-slate-500">{b.subCategory}</div>
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-semibold text-emerald-800">PENDAPATAN</td>
                      <td className="p-1.5 text-right border-r border-slate-300 font-bold">{formatRupiah(b.plannedAmount)}</td>
                      <td className="p-1.5 text-right border-r border-slate-300 text-emerald-700 font-bold">{formatRupiah(b.realizedAmount)}</td>
                      <td className="p-1.5 text-right font-bold text-slate-700">{b.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-y border-slate-400">
                    <td colSpan={3} className="p-1.5 text-right uppercase border-r border-slate-400">SUBTOTAL PENDAPATAN:</td>
                    <td className="p-1.5 text-right border-r border-slate-400 font-bold">{formatRupiah(totalPlannedIncome)}</td>
                    <td className="p-1.5 text-right border-r border-slate-400 text-emerald-800 font-black">{formatRupiah(totalRealizedIncome)}</td>
                    <td className="p-1.5 text-right font-bold">
                      {totalPlannedIncome > 0 ? ((totalRealizedIncome / totalPlannedIncome) * 100).toFixed(1) + '%' : '0%'}
                    </td>
                  </tr>

                  {/* SECTION 2: BELANJA */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                    <td colSpan={6} className="p-1.5 uppercase text-[10px] tracking-wider">
                      II. BELANJA (PENGELUARAN OPERASIONAL SEKOLAH)
                    </td>
                  </tr>
                  {expenseBudgetRealization.map(b => (
                    <tr key={b.id}>
                      <td className="p-1.5 text-center border-r border-slate-300 font-mono font-bold">{b.code}</td>
                      <td className="p-1.5 border-r border-slate-300">
                        <div className="font-bold text-slate-900">{b.title}</div>
                        <div className="text-[9px] text-slate-500">{b.subCategory}</div>
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-semibold text-rose-800">BELANJA</td>
                      <td className="p-1.5 text-right border-r border-slate-300 font-bold">{formatRupiah(b.plannedAmount)}</td>
                      <td className="p-1.5 text-right border-r border-slate-300 text-rose-700 font-bold">{formatRupiah(b.realizedAmount)}</td>
                      <td className="p-1.5 text-right font-bold text-slate-700">{b.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold border-y border-slate-400">
                    <td colSpan={3} className="p-1.5 text-right uppercase border-r border-slate-400">SUBTOTAL BELANJA:</td>
                    <td className="p-1.5 text-right border-r border-slate-400 font-bold">{formatRupiah(totalPlannedExpense)}</td>
                    <td className="p-1.5 text-right border-r border-slate-400 text-rose-800 font-black">{formatRupiah(totalRealizedExpense)}</td>
                    <td className="p-1.5 text-right font-bold">
                      {totalPlannedExpense > 0 ? ((totalRealizedExpense / totalPlannedExpense) * 100).toFixed(1) + '%' : '0%'}
                    </td>
                  </tr>

                  {/* SURPLUS / DEFISIT */}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-800 text-slate-900">
                    <td colSpan={3} className="p-1.5 text-right uppercase border-r border-slate-400">SURPLUS / (DEFISIT) BERSIH:</td>
                    <td className="p-1.5 text-right border-r border-slate-400">
                      {formatRupiah(totalPlannedIncome - totalPlannedExpense)}
                    </td>
                    <td className={`p-1.5 text-right border-r border-slate-400 ${(totalRealizedIncome - totalRealizedExpense) >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>
                      {formatRupiah(totalRealizedIncome - totalRealizedExpense)}
                    </td>
                    <td className="p-1.5 text-right font-mono">
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REPORT 4: MONTHLY CASH SUMMARY */}
            {reportType === 'MONTHLY_SUMMARY' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded border border-emerald-300 text-xs">
                    <div className="font-bold text-emerald-900 mb-1.5">Penerimaan Kas ({formatRupiah(totalIn)}):</div>
                    <div className="space-y-1">
                      {incomeCategoryBreakdown.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.category}:</span>
                          <span className="font-bold">{formatRupiah(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-rose-50 rounded border border-rose-300 text-xs">
                    <div className="font-bold text-rose-900 mb-1.5">Pengeluaran Kas ({formatRupiah(totalOut)}):</div>
                    <div className="space-y-1">
                      {expenseCategoryBreakdown.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{item.category}:</span>
                          <span className="font-bold">{formatRupiah(item.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-slate-100 border border-slate-300 rounded text-center font-bold">
                  Surplus / (Defisit) Bersih: <span className={finalBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{formatRupiah(finalBalance)}</span>
                </div>
              </div>
            )}

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
