import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  TrendingUp, TrendingDown, DollarSign, Users, AlertCircle, 
  ArrowUpRight, ArrowDownRight, Wallet, CheckCircle2, ChevronRight,
  MessageCircle, Receipt, PieChart as PieIcon, FileText,
  Clock, Calendar, Filter, Sparkles, RefreshCw, Layers, ArrowRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area 
} from 'recharts';
import { 
  formatRupiah, 
  formatRupiahShort, 
  formatDateIndo,
  formatDateShort,
  formatDateTimeIndo,
  getCurrentAcademicMonth,
  getTodayDateStr,
  getCurrentMonthDateRange,
  getAcademicYearDateRange,
  getAcademicYearSemesterRange,
  calculateStudentArrears, 
  generateWhatsAppReminder 
} from '../../utils/formatters';
import { SchoolLogo } from '../common/SchoolLogo';

interface DashboardModuleProps {
  onOpenPaymentModal?: () => void;
  onOpenCashModal?: () => void;
}

type DashboardTimeFilter = 'TODAY' | 'THIS_MONTH' | 'SEM_1' | 'SEM_2' | 'FULL_YEAR' | 'CUSTOM';

export const DashboardModule: React.FC<DashboardModuleProps> = () => {
  const { 
    state, 
    activeUnit, 
    activeProfile, 
    activeAcademicYear, 
    setCurrentTab,
    openReceiptModal 
  } = useApp();

  // Real-time clock (updates every second)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time filter state (Default to THIS_MONTH for immediate real-time relevance, with easy 1-click toggles)
  const [timeFilter, setTimeFilter] = useState<DashboardTimeFilter>('THIS_MONTH');
  const todayStr = useMemo(() => getTodayDateStr(), [currentDateTime]);
  const currentMonthInfo = useMemo(() => getCurrentMonthDateRange(), [currentDateTime]);
  const currentAcademicMonth = useMemo(() => getCurrentAcademicMonth(), [currentDateTime]);

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState<string>(currentMonthInfo.startDate);
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // Compute active date range based on filter
  const activeDateRange = useMemo(() => {
    if (timeFilter === 'TODAY') {
      return {
        startDate: todayStr,
        endDate: todayStr,
        label: `Hari Ini (${formatDateIndo(todayStr)})`
      };
    } else if (timeFilter === 'THIS_MONTH') {
      return {
        startDate: currentMonthInfo.startDate,
        endDate: currentMonthInfo.endDate,
        label: `Bulan Ini (${currentMonthInfo.monthName} ${currentMonthInfo.year})`
      };
    } else if (timeFilter === 'SEM_1') {
      const s1 = getAcademicYearSemesterRange(activeAcademicYear, 1);
      return {
        startDate: s1.startDate,
        endDate: s1.endDate,
        label: s1.label
      };
    } else if (timeFilter === 'SEM_2') {
      const s2 = getAcademicYearSemesterRange(activeAcademicYear, 2);
      return {
        startDate: s2.startDate,
        endDate: s2.endDate,
        label: s2.label
      };
    } else if (timeFilter === 'FULL_YEAR') {
      const fy = getAcademicYearDateRange(activeAcademicYear);
      return {
        startDate: fy.startDate,
        endDate: fy.endDate,
        label: `Tahun Ajaran ${activeAcademicYear}`
      };
    } else {
      return {
        startDate: customStartDate,
        endDate: customEndDate,
        label: `${formatDateIndo(customStartDate)} s.d ${formatDateIndo(customEndDate)}`
      };
    }
  }, [timeFilter, todayStr, currentMonthInfo, activeAcademicYear, customStartDate, customEndDate]);

  // All transactions for active unit & academic year
  const unitTransactions = useMemo(() => {
    return state.cashTransactions.filter(
      tx => tx.unit === activeUnit && tx.academicYear === activeAcademicYear
    );
  }, [state.cashTransactions, activeUnit, activeAcademicYear]);

  // Total Cumulative running balance (Kas Saat Ini)
  const totalInAll = unitTransactions
    .filter(t => t.type === 'MASUK')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutAll = unitTransactions
    .filter(t => t.type === 'KELUAR')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCumulativeBalance = totalInAll - totalOutAll;

  // Filtered transactions for the selected real-time period
  const periodTransactions = useMemo(() => {
    return unitTransactions.filter(tx => {
      if (activeDateRange.startDate && tx.date < activeDateRange.startDate) return false;
      if (activeDateRange.endDate && tx.date > activeDateRange.endDate) return false;
      return true;
    });
  }, [unitTransactions, activeDateRange]);

  const periodIn = useMemo(() => {
    return periodTransactions
      .filter(t => t.type === 'MASUK')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  const periodOut = useMemo(() => {
    return periodTransactions
      .filter(t => t.type === 'KELUAR')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  const periodNet = periodIn - periodOut;

  // Today's real-time live activity summary
  const todayTransactions = useMemo(() => {
    return unitTransactions.filter(tx => tx.date === todayStr);
  }, [unitTransactions, todayStr]);

  const todayIn = useMemo(() => {
    return todayTransactions.filter(t => t.type === 'MASUK').reduce((s, t) => s + t.amount, 0);
  }, [todayTransactions]);

  const todayOut = useMemo(() => {
    return todayTransactions.filter(t => t.type === 'KELUAR').reduce((s, t) => s + t.amount, 0);
  }, [todayTransactions]);

  const todayPayments = useMemo(() => {
    return state.studentPayments.filter(
      p => p.unit === activeUnit && p.academicYear === activeAcademicYear && p.date === todayStr
    );
  }, [state.studentPayments, activeUnit, activeAcademicYear, todayStr]);

  // Active students in unit & year
  const activeStudents = useMemo(() => {
    return state.students.filter(
      s => s.unit === activeUnit && s.academicYear === activeAcademicYear && s.status === 'AKTIF'
    );
  }, [state.students, activeUnit, activeAcademicYear]);

  // Real-time Arrears Calculation (up to current real-time month)
  const studentArrearsList = useMemo(() => {
    return activeStudents.map(student => 
      calculateStudentArrears(student, activeAcademicYear, state.studentPayments, state.masterFees, currentAcademicMonth)
    );
  }, [activeStudents, activeAcademicYear, state.studentPayments, state.masterFees, currentAcademicMonth]);

  const totalArrearsNominal = useMemo(() => {
    return studentArrearsList.reduce((sum, item) => sum + item.totalArrears, 0);
  }, [studentArrearsList]);

  const overdueStudentsCount = useMemo(() => {
    return studentArrearsList.filter(item => item.totalArrears > 0).length;
  }, [studentArrearsList]);

  // RAPBS calculation
  const unitBudget = useMemo(() => {
    return state.budgetPlans.filter(
      b => b.unit === activeUnit && b.academicYear === activeAcademicYear
    );
  }, [state.budgetPlans, activeUnit, activeAcademicYear]);

  const targetIncome = useMemo(() => {
    return unitBudget
      .filter(b => b.category === 'PENDAPATAN')
      .reduce((sum, b) => sum + b.plannedAmount, 0);
  }, [unitBudget]);

  const targetExpense = useMemo(() => {
    return unitBudget
      .filter(b => b.category === 'BELANJA')
      .reduce((sum, b) => sum + b.plannedAmount, 0);
  }, [unitBudget]);

  const incomeRealizationPct = targetIncome > 0 ? Math.min(100, Math.round((totalInAll / targetIncome) * 100)) : 0;
  const expenseRealizationPct = targetExpense > 0 ? Math.min(100, Math.round((totalOutAll / targetExpense) * 100)) : 0;

  // Monthly Cash Flow Chart Data (Jul - Jun) with real-time current month highlight
  const monthsData = useMemo(() => {
    const list = [
      { month: 'Jul', monthName: 'Juli', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Juli' },
      { month: 'Agu', monthName: 'Agustus', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Agustus' },
      { month: 'Sep', monthName: 'September', in: 0, out: 0, isCurrent: currentAcademicMonth === 'September' },
      { month: 'Okt', monthName: 'Oktober', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Oktober' },
      { month: 'Nov', monthName: 'November', in: 0, out: 0, isCurrent: currentAcademicMonth === 'November' },
      { month: 'Des', monthName: 'Desember', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Desember' },
      { month: 'Jan', monthName: 'Januari', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Januari' },
      { month: 'Feb', monthName: 'Februari', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Februari' },
      { month: 'Mar', monthName: 'Maret', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Maret' },
      { month: 'Apr', monthName: 'April', in: 0, out: 0, isCurrent: currentAcademicMonth === 'April' },
      { month: 'Mei', monthName: 'Mei', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Mei' },
      { month: 'Jun', monthName: 'Juni', in: 0, out: 0, isCurrent: currentAcademicMonth === 'Juni' },
    ];

    unitTransactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const monthNum = txDate.getMonth(); // 0 = Jan, 6 = Jul, etc.
      const academicIdx = (monthNum + 6) % 12;
      if (academicIdx >= 0 && academicIdx < 12) {
        if (tx.type === 'MASUK') {
          list[academicIdx].in += tx.amount;
        } else {
          list[academicIdx].out += tx.amount;
        }
      }
    });

    return list;
  }, [unitTransactions, currentAcademicMonth]);

  // Income Breakdown by Category (computed for selected period, fallback to all if period has no entries)
  const incomeCategoryData = useMemo(() => {
    const dataSource = periodTransactions.filter(t => t.type === 'MASUK').length > 0
      ? periodTransactions.filter(t => t.type === 'MASUK')
      : unitTransactions.filter(t => t.type === 'MASUK');

    const catMap: Record<string, number> = {};
    dataSource.forEach(tx => {
      const cat = tx.category || 'Lain-lain';
      catMap[cat] = (catMap[cat] || 0) + tx.amount;
    });

    return Object.keys(catMap).map(name => ({
      name,
      value: catMap[name]
    }));
  }, [periodTransactions, unitTransactions]);

  const PIE_COLORS = ['#8B9D83', '#D4A373', '#BC6C25', '#A98467', '#6B5E4C', '#B8AC97', '#55694E'];

  // Top overdue students for immediate action alert
  const topOverdueStudents = useMemo(() => {
    return [...studentArrearsList]
      .filter(a => a.totalArrears > 0)
      .sort((a, b) => b.totalArrears - a.totalArrears)
      .slice(0, 4);
  }, [studentArrearsList]);

  // Recent payments
  const recentPayments = useMemo(() => {
    return state.studentPayments
      .filter(p => p.unit === activeUnit && p.academicYear === activeAcademicYear)
      .slice(0, 5);
  }, [state.studentPayments, activeUnit, activeAcademicYear]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Banner / Unit Context with Real-Time Clock & Quick Actions */}
      <div className="p-5 rounded-2xl border border-[#D9D1C2] bg-[#E9E3D8] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-white border border-[#D9D1C2] p-1 flex items-center justify-center shadow-xs shrink-0">
            <SchoolLogo unit={activeUnit} size={46} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold text-white shadow-xs ${
                activeUnit === 'TK' ? 'bg-emerald-600' : activeUnit === 'KB' ? 'bg-sky-600' : activeUnit === 'SD' ? 'bg-red-600' : activeUnit === 'SMP' ? 'bg-blue-600' : activeUnit === 'SMA' ? 'bg-slate-600' : 'bg-purple-600'
              }`}>
                Unit {activeUnit}
              </span>
              <span className="text-xs font-semibold text-[#8D8271]">Tahun Ajaran {activeAcademicYear}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/80 border border-[#D9D1C2] text-[#2D2821]">
                <Clock className="w-3 h-3 text-[#8B9D83]" />
                <span className="font-mono">{formatDateTimeIndo(currentDateTime)}</span>
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-[#2D2821] mt-1">
              Dasbor Keuangan {activeProfile.name}
            </h1>
            <p className="text-xs text-[#6B5E4C] mt-0.5">
              {activeProfile.foundation} • NPSN: {activeProfile.npsn}
            </p>
          </div>
        </div>
      </div>

      {/* Real-Time Interactive Period Selector Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-[#D9D1C2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E9E3D8] text-[#6B5E4C] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#2D2821]">Filter Periode Real-Time Dasbor</div>
            <div className="text-[11px] text-[#8D8271]">
              Menampilkan data untuk: <span className="font-semibold text-[#2D2821]">{activeDateRange.label}</span>
            </div>
          </div>
        </div>

        {/* Preset Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#FDFBF7] p-1 rounded-xl border border-[#E9E3D8]">
          <button
            id="btn-filter-today"
            onClick={() => setTimeFilter('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'TODAY'
                ? 'bg-[#8B9D83] text-white shadow-xs'
                : 'text-[#6B5E4C] hover:bg-[#E9E3D8]/60'
            }`}
          >
            Hari Ini ({formatDateShort(todayStr)})
          </button>

          <button
            id="btn-filter-month"
            onClick={() => setTimeFilter('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'THIS_MONTH'
                ? 'bg-[#8B9D83] text-white shadow-xs'
                : 'text-[#6B5E4C] hover:bg-[#E9E3D8]/60'
            }`}
          >
            Bulan Ini ({currentMonthInfo.monthName})
          </button>

          <button
            id="btn-filter-sem1"
            onClick={() => setTimeFilter('SEM_1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'SEM_1'
                ? 'bg-[#8B9D83] text-white shadow-xs'
                : 'text-[#6B5E4C] hover:bg-[#E9E3D8]/60'
            }`}
          >
            Sem. Ganjil
          </button>

          <button
            id="btn-filter-sem2"
            onClick={() => setTimeFilter('SEM_2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'SEM_2'
                ? 'bg-[#8B9D83] text-white shadow-xs'
                : 'text-[#6B5E4C] hover:bg-[#E9E3D8]/60'
            }`}
          >
            Sem. Genap
          </button>

          <button
            id="btn-filter-fullyear"
            onClick={() => setTimeFilter('FULL_YEAR')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'FULL_YEAR'
                ? 'bg-[#8B9D83] text-white shadow-xs'
                : 'text-[#6B5E4C] hover:bg-[#E9E3D8]/60'
            }`}
          >
            1 Tahun Penuh ({activeAcademicYear})
          </button>

          <button
            id="btn-filter-custom"
            onClick={() => setTimeFilter('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeFilter === 'CUSTOM'
                ? 'bg-[#8B9D83] text-white shadow-xs'
                : 'text-[#6B5E4C] hover:bg-[#E9E3D8]/60'
            }`}
          >
            Kustom
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Dropdown if CUSTOM is active */}
      {timeFilter === 'CUSTOM' && (
        <div className="bg-[#FDFBF7] p-4 rounded-xl border border-[#D9D1C2] flex flex-wrap items-center gap-3 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-[#2D2821] flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-[#8B9D83]" />
            Tentukan Rentang Tanggal Real-Time:
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-[#6B5E4C] font-medium">Dari:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#D9D1C2] rounded-lg text-xs font-mono font-semibold"
            />
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label className="text-[#6B5E4C] font-medium">Sampai:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#D9D1C2] rounded-lg text-xs font-mono font-semibold"
            />
          </div>
        </div>
      )}

      {/* 5 Dynamic Metric Cards (Real-Time Adjusted) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Saldo Kas Total Terkini */}
        <div className="bg-white p-4 rounded-2xl border border-[#E9E3D8] shadow-xs hover:border-[#D9D1C2] transition-all">
          <div className="flex items-center justify-between text-[#8D8271] mb-2">
            <span className="text-xs font-medium">Saldo Kas Total Terkini</span>
            <div className="w-7 h-7 rounded-lg bg-[#8B9D83]/20 text-[#55694E] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl font-extrabold ${netCumulativeBalance >= 0 ? 'text-[#2D2821]' : 'text-[#BC6C25]'}`}>
            {formatRupiah(netCumulativeBalance)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#8D8271] mt-2 font-medium">
            <span>Posisi Kas Riil {activeUnit}</span>
          </div>
        </div>

        {/* Card 2: Pemasukan Kas (Periode Terpilih) */}
        <div className="bg-white p-4 rounded-2xl border border-[#E9E3D8] shadow-xs hover:border-[#D9D1C2] transition-all">
          <div className="flex items-center justify-between text-[#8D8271] mb-2">
            <span className="text-xs font-medium truncate">
              Penerimaan {timeFilter === 'TODAY' ? 'Hari Ini' : timeFilter === 'THIS_MONTH' ? 'Bulan Ini' : 'Periode Ini'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#8B9D83]/20 text-[#55694E] flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-[#55694E]" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#55694E]">
            {formatRupiah(periodIn)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#8B9D83] mt-2 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{periodTransactions.filter(t => t.type === 'MASUK').length} transaksi masuk</span>
          </div>
        </div>

        {/* Card 3: Pengeluaran Kas (Periode Terpilih) */}
        <div className="bg-white p-4 rounded-2xl border border-[#E9E3D8] shadow-xs hover:border-[#D9D1C2] transition-all">
          <div className="flex items-center justify-between text-[#8D8271] mb-2">
            <span className="text-xs font-medium truncate">
              Pengeluaran {timeFilter === 'TODAY' ? 'Hari Ini' : timeFilter === 'THIS_MONTH' ? 'Bulan Ini' : 'Periode Ini'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#BC6C25]/20 text-[#BC6C25] flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-[#BC6C25]" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#BC6C25]">
            {formatRupiah(periodOut)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#8D8271] mt-2 font-medium">
            <span>{periodTransactions.filter(t => t.type === 'KELUAR').length} transaksi keluar</span>
          </div>
        </div>

        {/* Card 4: Tunggakan Real-Time (Bulan Berjalan) */}
        <div 
          onClick={() => setCurrentTab('arrears')}
          className="bg-white p-4 rounded-2xl border border-[#D4A373]/50 bg-[#FDFBF7] shadow-xs hover:border-[#D4A373] cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-[#8C5C2E] mb-2">
            <span className="text-xs font-bold truncate">Tunggakan Real-Time</span>
            <div className="w-7 h-7 rounded-lg bg-[#D4A373]/20 text-[#8C5C2E] flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#BC6C25]">
            {formatRupiah(totalArrearsNominal)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-[#8C5C2E] font-medium mt-2">
            <span>{overdueStudentsCount} {activeUnit === 'RQ' ? 'Santri' : 'Murid'} s.d {currentAcademicMonth}</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 5: Siswa/Murid/Santri Aktif */}
        <div className="bg-white p-4 rounded-2xl border border-[#E9E3D8] shadow-xs hover:border-[#D9D1C2] transition-all">
          <div className="flex items-center justify-between text-[#8D8271] mb-2">
            <span className="text-xs font-medium">{activeUnit === 'RQ' ? 'Santri Aktif' : 'Murid Aktif'}</span>
            <div className="w-7 h-7 rounded-lg bg-[#E9E3D8] text-[#6B5E4C] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-[#2D2821]">
            {activeStudents.length} <span className="text-xs font-normal text-[#8D8271]">{activeUnit === 'RQ' ? 'Santri' : 'Murid'}</span>
          </div>
          <div className="text-[11px] text-[#8D8271] mt-2 font-medium">
            {activeStudents.filter(s => s.scholarship !== 'REGULER').length} Beasiswa / Potongan
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Monthly Cash Flow with Real-Time Month Highlight */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#F4F1EC] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-[#2D2821]">Arus Kas Masuk vs Keluar Bulanan</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B9D83]/15 text-[#55694E] border border-[#8B9D83]/30">
                  Bulan Berjalan: {currentAcademicMonth}
                </span>
              </div>
              <p className="text-xs text-[#8D8271]">Tahun Ajaran {activeAcademicYear} (Juli s.d Juni)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#8B9D83]"></span>
                <span className="text-[#6B5E4C]">Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-[#BC6C25]"></span>
                <span className="text-[#6B5E4C]">Pengeluaran</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F1EC" />
                <XAxis 
                  dataKey="month" 
                  tick={({ x, y, payload }) => {
                    const isNow = payload.value === monthsData.find(m => m.isCurrent)?.month;
                    return (
                      <text 
                        x={x} 
                        y={y + 12} 
                        textAnchor="middle" 
                        fill={isNow ? '#55694E' : '#8D8271'} 
                        fontWeight={isNow ? 'bold' : 'normal'}
                        fontSize={isNow ? 12 : 11}
                      >
                        {payload.value}{isNow ? ' •' : ''}
                      </text>
                    );
                  }} 
                  axisLine={{ stroke: '#D9D1C2' }} 
                />
                <YAxis 
                  tickFormatter={(val) => formatRupiahShort(val)} 
                  tick={{ fontSize: 11, fill: '#8D8271' }} 
                  axisLine={{ stroke: '#D9D1C2' }}
                  width={65}
                />
                <Tooltip 
                  formatter={(val: any) => [formatRupiah(Number(val)), '']}
                  contentStyle={{ backgroundColor: '#FDFBF7', borderRadius: '12px', borderColor: '#D9D1C2', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                />
                <Bar dataKey="in" name="Pemasukan" fill="#8B9D83" radius={[4, 4, 0, 0]} />
                <Bar dataKey="out" name="Pengeluaran" fill="#BC6C25" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Income Composition Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-xs flex flex-col">
          <div className="pb-4 border-b border-[#F4F1EC]">
            <h3 className="font-bold text-sm text-[#2D2821]">Komposisi Pemasukan Kas</h3>
            <p className="text-xs text-[#8D8271]">
              {timeFilter === 'TODAY' ? 'Penerimaan Hari Ini' : timeFilter === 'THIS_MONTH' ? 'Penerimaan Bulan Ini' : 'Proporsi Kategori Penerimaan'}
            </p>
          </div>

          <div className="h-60 w-full pt-2 flex-1">
            {incomeCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {incomeCategoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => formatRupiah(Number(val))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#8D8271]">
                Belum ada transaksi penerimaan pada periode ini
              </div>
            )}
          </div>

          {/* Custom Legend */}
          <div className="space-y-1.5 pt-2 border-t border-[#F4F1EC] max-h-36 overflow-y-auto">
            {incomeCategoryData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  ></span>
                  <span className="text-[#6B5E4C] truncate">{item.name}</span>
                </div>
                <span className="font-bold text-[#2D2821] shrink-0">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row: Quick Arrears Alert & Recent Live Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Overdue Arrears Quick Action */}
        <div className="bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F4F1EC]">
            <div>
              <h3 className="font-bold text-sm text-[#2D2821] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#BC6C25] animate-pulse"></span>
                Tunggakan Butuh Tindak Lanjut
              </h3>
              <p className="text-xs text-[#8D8271]">
                {activeUnit === 'RQ' ? 'Santri' : 'Murid'} dengan tunggakan terbesar s.d {currentAcademicMonth}
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('arrears')}
              className="text-xs text-[#8C5C2E] hover:text-[#5B3916] font-bold flex items-center gap-1"
            >
              Lihat Semua ({overdueStudentsCount})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#F4F1EC] pt-1">
            {topOverdueStudents.length > 0 ? (
              topOverdueStudents.map(item => {
                const wa = generateWhatsAppReminder(item, activeProfile, activeAcademicYear);
                return (
                  <div key={item.student.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-xs text-[#2D2821]">{item.student.name}</div>
                      <div className="text-[11px] text-[#8D8271] flex items-center gap-2 mt-0.5">
                        <span className="bg-[#F4F1EC] text-[#6B5E4C] border border-[#D9D1C2] px-1.5 py-0.2 rounded font-medium">
                          {item.student.className}
                        </span>
                        <span>•</span>
                        <span className="text-[#BC6C25] font-semibold">
                          {item.unpaidMonths.length} Bln SPP ({item.unpaidMonths.join(', ')})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#BC6C25]">{formatRupiah(item.totalArrears)}</div>
                        <div className="text-[10px] text-[#8D8271]">{item.student.parentName}</div>
                      </div>
                      <a
                        href={wa.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-[#8B9D83] hover:bg-[#7A8C72] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs"
                        title="Kirim Tagihan via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kirim WA</span>
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-[#55694E] flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-[#8B9D83]" />
                <span className="font-bold">Alhamdulillah, tidak ada tagihan menunggak pada periode ini!</span>
              </div>
            )}
          </div>
        </div>

        {/* Recent Payment Receipts */}
        <div className="bg-white p-5 rounded-2xl border border-[#E9E3D8] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#F4F1EC]">
            <div>
              <h3 className="font-bold text-sm text-[#2D2821]">
                Riwayat Pembayaran {activeUnit === 'RQ' ? 'Santri' : 'Murid'} Terbaru
              </h3>
              <p className="text-xs text-[#8D8271]">Kwitansi resmi yang diterbitkan baru-baru ini</p>
            </div>
            <button
              onClick={() => setCurrentTab('receipts')}
              className="text-xs text-[#D4A373] hover:text-[#B58455] font-bold flex items-center gap-1"
            >
              Semua Kwitansi
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#F4F1EC] pt-1">
            {recentPayments.length > 0 ? (
              recentPayments.map(p => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#8B9D83]/20 text-[#55694E] flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[#2D2821]">{p.studentName}</div>
                      <div className="text-[11px] text-[#8D8271]">
                        {p.receiptNumber} • {p.paymentType} {p.sppMonths?.length ? `(${p.sppMonths.join(', ')})` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#55694E]">{formatRupiah(p.totalAmount)}</div>
                      <div className="text-[10px] text-[#8D8271]">{formatDateShort(p.date)}</div>
                    </div>
                    <button
                      onClick={() => openReceiptModal(p)}
                      className="px-2.5 py-1 border border-[#D9D1C2] hover:bg-[#F4F1EC] rounded-lg text-[11px] font-semibold text-[#4A4238]"
                    >
                      Cetak
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#8D8271]">
                Belum ada transaksi pembayaran siswa
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

