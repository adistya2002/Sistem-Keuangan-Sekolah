import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Student, FeeCategory, SppMonth, ACADEMIC_MONTHS, 
  StudentPaymentRecord, MasterFee, PaymentItemDetail 
} from '../../types';
import { 
  GraduationCap, Search, CheckCircle2, AlertCircle, 
  Receipt, DollarSign, Sparkles, User, Calendar, CreditCard,
  Percent, ArrowRight, Check, History, Printer, Trash2,
  BookOpen, Bookmark, Layers, Tag, ShoppingBag, PlusCircle,
  FileText, CheckSquare, Square, Info
} from 'lucide-react';
import { formatRupiah, terbilang } from '../../utils/formatters';
import confetti from 'canvas-confetti';

export type PaymentBundleMode = 'SPP_ONLY' | 'SPP_DSP' | 'SPP_DSP_ADM' | 'DSP_ONLY' | 'ADM_ONLY';

interface SppPaymentModuleProps {
  initialOpenModal?: boolean;
}

export const SppPaymentModule: React.FC<SppPaymentModuleProps> = () => {
  const { 
    state, 
    activeUnit, 
    activeProfile, 
    activeAcademicYear, 
    currentUser,
    addStudentPayment,
    deleteStudentPayment,
    openReceiptModal 
  } = useApp();

  // Active students in current unit & academic year
  const activeStudents = useMemo(() => {
    return state.students.filter(
      s => s.unit === activeUnit && s.academicYear === activeAcademicYear && s.status === 'AKTIF'
    );
  }, [state.students, activeUnit, activeAcademicYear]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    activeStudents[0]?.id || ''
  );
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Bundle Mode selection: 1. SPP saja, 2. SPP dan DSP, 3. SPP, DSP dan Administrasi
  const [bundleMode, setBundleMode] = useState<PaymentBundleMode>('SPP_ONLY');

  // Synchronize selected student and default payerName when activeUnit, academicYear or student list changes
  useEffect(() => {
    if (activeStudents.length > 0) {
      const currentValid = activeStudents.find(s => s.id === selectedStudentId);
      if (!currentValid) {
        setSelectedStudentId(activeStudents[0].id);
        setSelectedMonths([]);
        setPayerName(activeStudents[0].parentName || activeStudents[0].name || '');
      } else {
        setPayerName(currentValid.parentName || currentValid.name || '');
      }
    } else {
      setSelectedStudentId('');
      setPayerName('');
    }
  }, [activeUnit, activeAcademicYear, activeStudents, selectedStudentId]);

  // Dynamic Master Fees for active unit & academic year
  const unitMasterFees = useMemo(() => {
    return state.masterFees.filter(
      f => f.unit === activeUnit && f.academicYear === activeAcademicYear
    );
  }, [state.masterFees, activeUnit, activeAcademicYear]);

  // Master fee objects for SPP & DSP
  const sppMasterFee = useMemo(() => {
    return unitMasterFees.find(f => f.category === 'SPP');
  }, [unitMasterFees]);

  const dspMasterFee = useMemo(() => {
    return unitMasterFees.find(f => f.category === 'DSP');
  }, [unitMasterFees]);

  // Other active Master Fees (Non-SPP & Non-DSP) that are active in payment
  const otherMasterFees = useMemo(() => {
    return unitMasterFees.filter(
      f => f.category !== 'SPP' && f.category !== 'DSP' && f.isActiveInPayment !== false
    );
  }, [unitMasterFees]);

  const masterSppFee = sppMasterFee?.nominal ?? (activeUnit === 'TK' ? 250000 : activeUnit === 'KB' ? 200000 : activeUnit === 'SD' ? 350000 : activeUnit === 'SMP' ? 450000 : activeUnit === 'SMA' ? 550000 : 150000);
  const masterDspFee = dspMasterFee?.nominal ?? (activeUnit === 'TK' ? 2500000 : activeUnit === 'KB' ? 1800000 : activeUnit === 'SD' ? 3500000 : activeUnit === 'SMP' ? 4500000 : activeUnit === 'SMA' ? 5500000 : 1000000);

  // Selected student object
  const selectedStudent = useMemo(() => {
    return activeStudents.find(s => s.id === selectedStudentId) || activeStudents[0];
  }, [activeStudents, selectedStudentId]);

  // Payment Form States
  const [selectedMonths, setSelectedMonths] = useState<SppMonth[]>([]);
  const [dspPayAmount, setDspPayAmount] = useState<string>('500000');
  
  // Selected admin fee item IDs and custom amounts map
  const [selectedAdminFeeIds, setSelectedAdminFeeIds] = useState<string[]>([]);
  const [adminFeeAmounts, setAdminFeeAmounts] = useState<{ [feeId: string]: string }>({});
  
  // Custom Ad-hoc Admin Fee
  const [hasCustomFee, setHasCustomFee] = useState(false);
  const [customFeeName, setCustomFeeName] = useState('');
  const [customFeeNominal, setCustomFeeNominal] = useState('100000');

  // Common payment attributes
  const [paymentMethod, setPaymentMethod] = useState<'TUNAI' | 'TRANSFER' | 'QRIS'>('TRANSFER');
  const [payerName, setPayerName] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  // Initialize or reset selected admin fees when unit or academic year changes
  useEffect(() => {
    if (otherMasterFees.length > 0) {
      // pre-fill adminFeeAmounts map from master fees
      const initialAmounts: { [id: string]: string } = {};
      otherMasterFees.forEach(f => {
        initialAmounts[f.id] = String(f.nominal);
      });
      setAdminFeeAmounts(prev => ({ ...initialAmounts, ...prev }));
    }
  }, [otherMasterFees]);

  // Effective SPP rate per month for selected student (accounting for scholarship/discount)
  const baseSppRate = selectedStudent?.customSppNominal ?? masterSppFee;
  const discountPct = selectedStudent?.discountPercentage || 0;
  const effectiveMonthlySpp = baseSppRate * ((100 - discountPct) / 100);

  // Student's existing payment history for this academic year
  const studentPayments = useMemo(() => {
    if (!selectedStudent) return [];
    return state.studentPayments.filter(
      p => p.studentId === selectedStudent.id && p.academicYear === activeAcademicYear
    );
  }, [state.studentPayments, selectedStudent, activeAcademicYear]);

  // Set of paid SPP months
  const paidMonthsMap = useMemo(() => {
    const map = new Map<SppMonth, { receiptNumber: string; date: string; amount: number }>();
    studentPayments
      .filter(p => p.paymentType === 'SPP' || p.paymentType === 'SPP_DSP' || p.paymentType === 'SPP_DSP_ADM' || (p.sppMonths && p.sppMonths.length > 0))
      .forEach(p => {
        p.sppMonths?.forEach(m => {
          map.set(m, {
            receiptNumber: p.receiptNumber,
            date: p.date,
            amount: p.sppAmount ? (p.sppAmount / (p.sppMonths?.length || 1)) : (p.totalAmount / (p.sppMonths?.length || 1))
          });
        });
      });
    return map;
  }, [studentPayments]);

  // DSP stats for this student
  const dspStats = useMemo(() => {
    const dspPayments = studentPayments.filter(
      p => p.paymentType === 'DSP' || p.paymentType === 'SPP_DSP' || p.paymentType === 'SPP_DSP_ADM' || p.dspInstallment !== undefined
    );
    const totalPaid = dspPayments.reduce((sum, p) => {
      if (p.dspInstallment) return sum + p.dspInstallment.currentPaid;
      if (p.paymentType === 'DSP') return sum + p.totalAmount;
      return sum;
    }, 0);
    const target = masterDspFee;
    const remaining = Math.max(0, target - totalPaid);
    return {
      target,
      totalPaid,
      remaining,
      isLunas: remaining === 0
    };
  }, [studentPayments, masterDspFee]);

  // Sync initial DSP pay amount when student changes
  useEffect(() => {
    if (dspStats.remaining > 0) {
      setDspPayAmount(String(Math.min(dspStats.remaining, 500000)));
    } else {
      setDspPayAmount('0');
    }
  }, [dspStats.remaining, selectedStudentId]);

  // Payment status map for Other Master Fees for the selected student
  const otherFeesPaymentStatus = useMemo(() => {
    const statusMap = new Map<string, { totalPaid: number; isLunas: boolean; remaining: number; receipts: string[] }>();
    
    otherMasterFees.forEach(fee => {
      // Find payments matching items or categories
      const matchingPayments = studentPayments.filter(p => {
        if (p.items && p.items.some(it => it.name.toLowerCase().includes(fee.name.toLowerCase()) || it.category === fee.category)) {
          return true;
        }
        if (p.paymentType === fee.category || (p.otherFeeDetail && p.otherFeeDetail.toLowerCase().includes(fee.name.toLowerCase()))) {
          return true;
        }
        return false;
      });

      const totalPaid = matchingPayments.reduce((sum, p) => {
        if (p.items) {
          const item = p.items.find(it => it.name.toLowerCase().includes(fee.name.toLowerCase()) || it.category === fee.category);
          if (item) return sum + item.nominal;
        }
        if (p.paymentType === fee.category && !p.items) return sum + p.totalAmount;
        if (p.otherFeeAmount) return sum + p.otherFeeAmount;
        return sum;
      }, 0);

      const isLunas = totalPaid >= fee.nominal;
      const remaining = Math.max(0, fee.nominal - totalPaid);
      const receipts = matchingPayments.map(p => `${p.receiptNumber} (${formatRupiah(p.totalAmount)})`);

      statusMap.set(fee.id, {
        totalPaid,
        isLunas,
        remaining,
        receipts
      });
    });

    return statusMap;
  }, [otherMasterFees, studentPayments]);

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return activeStudents;
    const q = studentSearchQuery.toLowerCase();
    return activeStudents.filter(
      s => s.name.toLowerCase().includes(q) || s.nis.toLowerCase().includes(q) || s.className.toLowerCase().includes(q)
    );
  }, [activeStudents, studentSearchQuery]);

  // Toggle month selection
  const handleToggleMonth = (month: SppMonth) => {
    if (paidMonthsMap.has(month)) return; // already paid
    setSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  // Select all unpaid months
  const handleSelectAllUnpaidMonths = () => {
    const unpaid = ACADEMIC_MONTHS.filter(m => !paidMonthsMap.has(m));
    setSelectedMonths(unpaid);
  };

  // Toggle admin fee selection
  const handleToggleAdminFee = (fee: MasterFee) => {
    setSelectedAdminFeeIds(prev => {
      if (prev.includes(fee.id)) {
        return prev.filter(id => id !== fee.id);
      } else {
        // Set default nominal if not already in state
        if (!adminFeeAmounts[fee.id]) {
          const status = otherFeesPaymentStatus.get(fee.id);
          const nominalToSet = status && status.totalPaid > 0 && !status.isLunas ? status.remaining : fee.nominal;
          setAdminFeeAmounts(a => ({ ...a, [fee.id]: String(nominalToSet) }));
        }
        return [...prev, fee.id];
      }
    });
  };

  // Calculate component totals
  const totalSppNominal = useMemo(() => {
    const includesSpp = bundleMode === 'SPP_ONLY' || bundleMode === 'SPP_DSP' || bundleMode === 'SPP_DSP_ADM';
    if (!includesSpp) return 0;
    return selectedMonths.length * effectiveMonthlySpp;
  }, [bundleMode, selectedMonths, effectiveMonthlySpp]);

  const totalDspNominal = useMemo(() => {
    const includesDsp = bundleMode === 'SPP_DSP' || bundleMode === 'SPP_DSP_ADM' || bundleMode === 'DSP_ONLY';
    if (!includesDsp) return 0;
    return Math.max(0, parseFloat(dspPayAmount) || 0);
  }, [bundleMode, dspPayAmount]);

  const totalAdminNominal = useMemo(() => {
    const includesAdmin = bundleMode === 'SPP_DSP_ADM' || bundleMode === 'ADM_ONLY';
    if (!includesAdmin) return 0;
    let sum = 0;
    selectedAdminFeeIds.forEach(id => {
      const val = parseFloat(adminFeeAmounts[id]);
      if (!isNaN(val) && val > 0) sum += val;
    });
    if (hasCustomFee && customFeeName.trim()) {
      const customVal = parseFloat(customFeeNominal);
      if (!isNaN(customVal) && customVal > 0) sum += customVal;
    }
    return sum;
  }, [bundleMode, selectedAdminFeeIds, adminFeeAmounts, hasCustomFee, customFeeName, customFeeNominal]);

  // Grand Total to pay
  const computedTotal = useMemo(() => {
    return totalSppNominal + totalDspNominal + totalAdminNominal;
  }, [totalSppNominal, totalDspNominal, totalAdminNominal]);

  // Submit payment handler
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Silakan pilih santri/murid terlebih dahulu.');
      return;
    }

    if (computedTotal <= 0) {
      alert('Nominal pembayaran harus lebih besar dari Rp 0.');
      return;
    }

    const includesSpp = bundleMode === 'SPP_ONLY' || bundleMode === 'SPP_DSP' || bundleMode === 'SPP_DSP_ADM';
    const includesDsp = bundleMode === 'SPP_DSP' || bundleMode === 'SPP_DSP_ADM' || bundleMode === 'DSP_ONLY';
    const includesAdmin = bundleMode === 'SPP_DSP_ADM' || bundleMode === 'ADM_ONLY';

    if (bundleMode === 'SPP_ONLY' && selectedMonths.length === 0) {
      alert('Silakan pilih minimal 1 bulan SPP yang akan dibayarkan.');
      return;
    }

    if (bundleMode === 'SPP_DSP' && selectedMonths.length === 0 && totalDspNominal <= 0) {
      alert('Silakan pilih bulan SPP atau isi nominal DSP yang akan dibayarkan.');
      return;
    }

    if (bundleMode === 'SPP_DSP_ADM' && selectedMonths.length === 0 && totalDspNominal <= 0 && totalAdminNominal <= 0) {
      alert('Silakan tentukan minimal 1 pos tagihan (SPP, DSP, atau Administrasi) yang akan dibayarkan.');
      return;
    }

    if (bundleMode === 'DSP_ONLY' && totalDspNominal <= 0) {
      alert('Silakan masukkan nominal pembayaran DSP.');
      return;
    }

    if (bundleMode === 'ADM_ONLY' && totalAdminNominal <= 0) {
      alert('Silakan pilih minimal 1 pos tagihan administrasi.');
      return;
    }

    const seq = String(Math.floor(Math.random() * 9000) + 1000);
    const dateStr = paymentDate.replace(/-/g, '').slice(2, 6);
    const receiptNumber = `KW-${activeUnit}-${dateStr}-${seq}`;

    // Construct structured items breakdown
    const items: PaymentItemDetail[] = [];

    if (includesSpp && selectedMonths.length > 0) {
      items.push({
        category: 'SPP',
        name: `${sppMasterFee?.name || (activeUnit === 'RQ' ? 'Infaq / SPP Santri' : 'SPP Bulanan')} (${selectedMonths.join(', ')})`,
        nominal: totalSppNominal,
        months: selectedMonths
      });
    }

    if (includesDsp && totalDspNominal > 0) {
      items.push({
        category: 'DSP',
        name: `${dspMasterFee?.name || (activeUnit === 'RQ' ? 'Infaq Gedung & Sarpras / DSP' : 'DSP / Uang Pangkal')}`,
        nominal: totalDspNominal
      });
    }

    if (includesAdmin) {
      selectedAdminFeeIds.forEach(id => {
        const fee = otherMasterFees.find(f => f.id === id);
        if (fee) {
          const nom = parseFloat(adminFeeAmounts[id]) || fee.nominal;
          if (nom > 0) {
            items.push({
              category: fee.category,
              name: fee.name,
              nominal: nom
            });
          }
        }
      });

      if (hasCustomFee && customFeeName.trim()) {
        const customNom = parseFloat(customFeeNominal) || 0;
        if (customNom > 0) {
          items.push({
            category: 'LAINNYA',
            name: customFeeName.trim(),
            nominal: customNom
          });
        }
      }
    }

    // Determine final FeeCategory
    let finalPaymentType: FeeCategory = 'SPP';
    if (bundleMode === 'SPP_ONLY') {
      finalPaymentType = 'SPP';
    } else if (bundleMode === 'SPP_DSP') {
      finalPaymentType = 'SPP_DSP';
    } else if (bundleMode === 'SPP_DSP_ADM') {
      finalPaymentType = 'SPP_DSP_ADM';
    } else if (bundleMode === 'DSP_ONLY') {
      finalPaymentType = 'DSP';
    } else if (bundleMode === 'ADM_ONLY') {
      if (selectedAdminFeeIds.length === 1) {
        const singleFee = otherMasterFees.find(f => f.id === selectedAdminFeeIds[0]);
        finalPaymentType = singleFee?.category || 'DAFTAR_ULANG';
      } else {
        finalPaymentType = 'DAFTAR_ULANG';
      }
    }

    const adminNames = items
      .filter(i => i.category !== 'SPP' && i.category !== 'DSP')
      .map(i => i.name);

    const otherFeeDetailStr = adminNames.length > 0 ? adminNames.join(', ') : undefined;

    const newPaymentRecord = addStudentPayment({
      unit: activeUnit,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      receiptNumber,
      date: paymentDate,
      academicYear: activeAcademicYear,
      paymentType: finalPaymentType,
      sppMonths: includesSpp && selectedMonths.length > 0 ? selectedMonths : undefined,
      sppAmount: includesSpp && selectedMonths.length > 0 ? totalSppNominal : undefined,
      dspInstallment: includesDsp && totalDspNominal > 0 ? {
        totalDsp: dspStats.target,
        previouslyPaid: dspStats.totalPaid,
        currentPaid: totalDspNominal,
        remaining: Math.max(0, dspStats.remaining - totalDspNominal)
      } : undefined,
      otherFeeDetail: otherFeeDetailStr,
      otherFeeAmount: totalAdminNominal > 0 ? totalAdminNominal : undefined,
      items,
      totalAmount: computedTotal,
      paymentMethod,
      bankDestination: paymentMethod === 'TRANSFER' ? `${activeProfile.bankName} (${activeProfile.bankAccount})` : undefined,
      payerName: payerName.trim() || selectedStudent.parentName || selectedStudent.name,
      treasurerName: activeProfile.treasurerName,
      notes: paymentNotes.trim() || undefined
    }, true);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 85,
        spread: 65,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    // Reset selection & open receipt modal
    setSelectedMonths([]);
    setSelectedAdminFeeIds([]);
    setHasCustomFee(false);
    setCustomFeeName('');
    setPaymentNotes('');
    openReceiptModal(newPaymentRecord);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-emerald-600">
              Modul Pembayaran & Kasir
            </span>
            <span className="text-xs font-semibold text-slate-500">Unit {activeUnit} • TA {activeAcademicYear}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Pembayaran SPP, DSP & Administrasi {activeUnit === 'RQ' ? 'Santri' : 'Murid'}
          </h2>
          <p className="text-xs text-slate-500">
            Tarif dan pos tagihan terhubung otomatis dengan Master Data & Duplikasi Tahun Ajaran Unit {activeUnit}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Student Selector & Info, Right Payment Matrix & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): Student Selection List & Profile */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Search & Student List */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800">
                {activeUnit === 'RQ' ? 'Pilih Santri' : 'Pilih Murid'}
              </span>
              <span className="text-[11px] text-slate-500">
                {activeStudents.length} {activeUnit === 'RQ' ? 'Santri Aktif' : 'Murid Aktif'}
              </span>
            </div>

            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama, NIS atau kelas..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {filteredStudents.map(student => {
                const isSelected = student.id === selectedStudent?.id;
                return (
                  <button
                    key={student.id}
                    onClick={() => {
                      setSelectedStudentId(student.id);
                      setSelectedMonths([]);
                      setPayerName(student.parentName || student.name || '');
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {student.name.charAt(0)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-bold truncate">{student.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {student.nis} • {student.className}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Student Information Card */}
          {selectedStudent && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{selectedStudent.name}</h4>
                  <p className="text-slate-500 text-[11px]">
                    NIS: {selectedStudent.nis} • {selectedStudent.className}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Beasiswa:</span>
                  <span className="font-semibold text-slate-700">
                    {selectedStudent.scholarship === 'REGULER' 
                      ? 'Reguler (Tanpa Beasiswa)' 
                      : `${selectedStudent.scholarship} (${selectedStudent.discountPercentage}%)`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tarif SPP Bulanan:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatRupiah(effectiveMonthlySpp)} / bln</span>
                    {selectedStudent.customSppNominal && selectedStudent.customSppNominal !== masterSppFee && (
                      <div className="text-[10px] text-slate-400">
                        (Standar Master: {formatRupiah(masterSppFee)})
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DSP Status Mini Progress */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Status DSP (Uang Pangkal):</span>
                  <span className={dspStats.isLunas ? 'text-emerald-700' : 'text-amber-700'}>
                    {dspStats.isLunas ? 'LUNAS' : `Sisa ${formatRupiah(dspStats.remaining)}`}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${dspStats.isLunas ? 'bg-emerald-600' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(100, (dspStats.totalPaid / dspStats.target) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Dibayar: {formatRupiah(dspStats.totalPaid)}</span>
                  <span>Target: {formatRupiah(dspStats.target)}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (8 cols): Fee Options, Interactive Matrix, and Checkout Form */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* USER REQUEST REQUIREMENT: Pilih Jenis Tagihan yang Dibayarkan: 1. SPP saja, 2. SPP dan DSP, 3. SPP, DSP dan Administrasi */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Konfigurasi Pembayaran
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mt-0.5">
                  Pilih Jenis Tagihan yang Dibayarkan:
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Unit {activeUnit} • T.A {activeAcademicYear}
              </span>
            </div>

            {/* The 3 Primary Required Payment Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Option 1: SPP saja */}
              <button
                type="button"
                onClick={() => setBundleMode('SPP_ONLY')}
                className={`p-3.5 rounded-xl font-bold text-xs transition-all text-left border flex flex-col justify-between gap-2 relative ${
                  bundleMode === 'SPP_ONLY'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Calendar className="w-4 h-4" />
                    <span>1. SPP saja</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    bundleMode === 'SPP_ONLY' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    Bulanan
                  </span>
                </div>
                <div className="text-[11px] font-normal leading-relaxed opacity-90">
                  Pembayaran SPP/Infaq bulanan ({formatRupiah(effectiveMonthlySpp)}/bln).
                </div>
                <div className={`text-[10px] font-mono pt-1.5 border-t ${
                  bundleMode === 'SPP_ONLY' ? 'border-white/20 text-emerald-100' : 'border-slate-200 text-slate-500'
                }`}>
                  {selectedMonths.length > 0 && bundleMode === 'SPP_ONLY' ? `✓ ${selectedMonths.length} bulan terpilih` : 'Pilih 1 s.d 12 Bulan'}
                </div>
              </button>

              {/* Option 2: SPP dan DSP */}
              <button
                type="button"
                onClick={() => setBundleMode('SPP_DSP')}
                className={`p-3.5 rounded-xl font-bold text-xs transition-all text-left border flex flex-col justify-between gap-2 relative ${
                  bundleMode === 'SPP_DSP'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Layers className="w-4 h-4" />
                    <span>2. SPP dan DSP</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    bundleMode === 'SPP_DSP' ? 'bg-white/20 text-white' : 'bg-cyan-100 text-cyan-800'
                  }`}>
                    Paket 2 Tagihan
                  </span>
                </div>
                <div className="text-[11px] font-normal leading-relaxed opacity-90">
                  SPP Bulanan + Cicilan/Pelunasan DSP Uang Pangkal Gedung.
                </div>
                <div className={`text-[10px] font-mono pt-1.5 border-t ${
                  bundleMode === 'SPP_DSP' ? 'border-white/20 text-cyan-100' : 'border-slate-200 text-slate-500'
                }`}>
                  DSP Sisa: {formatRupiah(dspStats.remaining)}
                </div>
              </button>

              {/* Option 3: SPP, DSP dan Administrasi */}
              <button
                type="button"
                onClick={() => setBundleMode('SPP_DSP_ADM')}
                className={`p-3.5 rounded-xl font-bold text-xs transition-all text-left border flex flex-col justify-between gap-2 relative ${
                  bundleMode === 'SPP_DSP_ADM'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>3. SPP, DSP & Adm</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    bundleMode === 'SPP_DSP_ADM' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                  }`}>
                    Paket Lengkap
                  </span>
                </div>
                <div className="text-[11px] font-normal leading-relaxed opacity-90 truncate">
                  SPP + DSP + Pos Tagihan Master Unit ({otherMasterFees.length} Pos Biaya).
                </div>
                <div className={`text-[10px] font-mono pt-1.5 border-t ${
                  bundleMode === 'SPP_DSP_ADM' ? 'border-white/20 text-purple-100' : 'border-slate-200 text-slate-500'
                }`}>
                  {selectedAdminFeeIds.length > 0 && bundleMode === 'SPP_DSP_ADM' ? `✓ ${selectedAdminFeeIds.length} pos adm terpilih` : 'Daftar Ulang, Buku, Seragam'}
                </div>
              </button>

            </div>

            {/* Standalone payment shortcuts (DSP saja / Administrasi saja) */}
            <div className="flex items-center justify-end gap-2 pt-2.5 mt-2.5 border-t border-slate-100 text-[11px]">
              <span className="text-slate-400">Pilihan Pembayaran Tunggal:</span>
              <button
                type="button"
                onClick={() => setBundleMode('DSP_ONLY')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  bundleMode === 'DSP_ONLY' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Bayar DSP saja
              </button>
              <button
                type="button"
                onClick={() => setBundleMode('ADM_ONLY')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  bundleMode === 'ADM_ONLY' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Bayar Administrasi saja
              </button>
            </div>
          </div>

          {/* Form Content Based on Selected Choice */}
          <form onSubmit={handleProcessPayment} className="space-y-4">
            
            {/* SECTION A: SPP 12-Month Matrix Visual Grid (Shown in: 1. SPP saja, 2. SPP & DSP, 3. SPP, DSP & Adm) */}
            {(bundleMode === 'SPP_ONLY' || bundleMode === 'SPP_DSP' || bundleMode === 'SPP_DSP_ADM') && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>{bundleMode === 'SPP_ONLY' ? 'Pilih Bulan SPP yang Dibayarkan' : 'Bagian 1: Matriks Pembayaran SPP'}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-normal">
                        Tarif: {formatRupiah(effectiveMonthlySpp)}/bln
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">Klik bulan yang belum lunas untuk memilih pembayaran</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllUnpaidMonths}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      Pilih Semua Belum Lunas
                    </button>
                    {selectedMonths.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedMonths([])}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-medium"
                      >
                        Reset Bulan
                      </button>
                    )}
                  </div>
                </div>

                {/* 12 Months Grid (4x3) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                  {ACADEMIC_MONTHS.map((month) => {
                    const isPaid = paidMonthsMap.has(month);
                    const paidInfo = paidMonthsMap.get(month);
                    const isSelected = selectedMonths.includes(month);
                    const isExempt = selectedStudent?.discountPercentage === 100;

                    return (
                      <button
                        key={month}
                        type="button"
                        disabled={isPaid}
                        onClick={() => handleToggleMonth(month)}
                        className={`p-2.5 rounded-xl border text-left transition-all relative ${
                          isPaid
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 cursor-not-allowed opacity-90'
                            : isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                            {month}
                          </span>
                          {isPaid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isSelected ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : null}
                        </div>

                        <div className={`text-[10.5px] font-semibold mt-1 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                          {isExempt ? 'Bebas SPP (100%)' : formatRupiah(effectiveMonthlySpp)}
                        </div>

                        {isPaid && paidInfo && (
                          <div className="text-[9px] text-emerald-700 font-mono mt-1 truncate">
                            {paidInfo.receiptNumber}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedMonths.length > 0 && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-emerald-900 font-medium">
                      Bulan terpilih: <strong>{selectedMonths.join(', ')}</strong> ({selectedMonths.length} bulan)
                    </span>
                    <span className="font-extrabold text-emerald-900 text-sm">
                      Subtotal SPP: {formatRupiah(totalSppNominal)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* SECTION B: DSP Input (Shown in: 2. SPP dan DSP, 3. SPP, DSP dan Administrasi, and DSP_ONLY) */}
            {(bundleMode === 'SPP_DSP' || bundleMode === 'SPP_DSP_ADM' || bundleMode === 'DSP_ONLY') && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>{bundleMode === 'DSP_ONLY' ? 'Pembayaran DSP / Uang Pangkal' : 'Bagian 2: Pembayaran DSP / Uang Pangkal Gedung'}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tarif Master Unit: <strong>{formatRupiah(masterDspFee)}</strong> • Bisa dicicil bertahap atau pelunasan penuh
                    </p>
                  </div>
                  {dspStats.isLunas ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> DSP Telah Lunas
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs">
                      Sisa Tagihan: {formatRupiah(dspStats.remaining)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nominal DSP yang Dibayar Saat Ini (Rp) *</label>
                    <input
                      type="number"
                      min="0"
                      max={dspStats.remaining || undefined}
                      value={dspPayAmount}
                      onChange={(e) => setDspPayAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    
                    {!dspStats.isLunas && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() => setDspPayAmount(String(dspStats.remaining))}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10.5px] font-semibold"
                        >
                          Lunasi Sisa ({formatRupiah(dspStats.remaining)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setDspPayAmount(String(Math.min(dspStats.remaining, 500000)))}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] font-semibold"
                        >
                          Rp 500.000
                        </button>
                        <button
                          type="button"
                          onClick={() => setDspPayAmount(String(Math.min(dspStats.remaining, 1000000)))}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10.5px] font-semibold"
                        >
                          Rp 1.000.000
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-[11px]">
                    <div className="flex justify-between"><span className="text-slate-500">Target DSP Master:</span> <span className="font-semibold">{formatRupiah(dspStats.target)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sudah Masuk (Histori):</span> <span className="font-semibold text-emerald-700">{formatRupiah(dspStats.totalPaid)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Sisa Sebelum Bayar:</span> <span className="font-bold text-amber-700">{formatRupiah(dspStats.remaining)}</span></div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 text-xs"><span className="font-bold text-slate-800">Sisa Setelah Pembayaran Ini:</span> <span className="font-extrabold text-slate-900">{formatRupiah(Math.max(0, dspStats.remaining - (parseFloat(dspPayAmount) || 0)))}</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION C: Administrasi Master Fees (Shown in: 3. SPP, DSP dan Administrasi, and ADM_ONLY) */}
            {(bundleMode === 'SPP_DSP_ADM' || bundleMode === 'ADM_ONLY') && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>{bundleMode === 'ADM_ONLY' ? 'Pilih Pos Tagihan Administrasi' : 'Bagian 3: Pos Tagihan Administrasi Master Unit'}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Centang satu atau beberapa pos tagihan master data yang dibayarkan
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                    {otherMasterFees.length} Pos Tarif Aktif Unit {activeUnit}
                  </span>
                </div>

                {/* Master Fees Multi-Selection Cards */}
                {otherMasterFees.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {otherMasterFees.map((fee) => {
                      const isChecked = selectedAdminFeeIds.includes(fee.id);
                      const feeStatus = otherFeesPaymentStatus.get(fee.id);
                      const isLunas = feeStatus?.isLunas;
                      const customAmount = adminFeeAmounts[fee.id] ?? String(fee.nominal);

                      return (
                        <div
                          key={fee.id}
                          className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                            isChecked
                              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <label className="flex items-start gap-2 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleAdminFee(fee)}
                                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{fee.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Kategori: {fee.category} • Standar: {fee.nominal === 0 ? 'Rp 0 (Gratis/Bebas)' : formatRupiah(fee.nominal)}
                                </div>
                              </div>
                            </label>

                            {fee.nominal === 0 ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                ✓ BEBAS BIAYA (Rp 0)
                              </span>
                            ) : isLunas ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                                ✓ LUNAS
                              </span>
                            ) : feeStatus && feeStatus.totalPaid > 0 ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                                Sudah Cicil {formatRupiah(feeStatus.totalPaid)}
                              </span>
                            ) : null}
                          </div>

                          {/* Editable nominal if checked */}
                          {isChecked && (
                            <div className="mt-2 pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-slate-600 shrink-0">
                                Nominal Bayar:
                              </span>
                              <div className="flex items-center gap-1.5 flex-1 justify-end">
                                <span className="text-xs font-mono text-slate-500">Rp</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={customAmount}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setAdminFeeAmounts(a => ({ ...a, [fee.id]: val }));
                                  }}
                                  className="w-28 px-2 py-1 border border-emerald-300 rounded-lg text-right font-bold text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                    Belum ada pos biaya administrasi selain SPP & DSP yang tercatat di Master Tarif Unit {activeUnit}.
                  </div>
                )}

                {/* Ad-hoc Custom Fee Toggle */}
                <div className="pt-2 border-t border-slate-100">
                  {!hasCustomFee ? (
                    <button
                      type="button"
                      onClick={() => setHasCustomFee(true)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>+ Tambah Pos Biaya Administrasi Kustom Lainnya</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pos Biaya Kustom Tambahan</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setHasCustomFee(false);
                            setCustomFeeName('');
                          }}
                          className="text-[11px] text-rose-600 hover:underline"
                        >
                          Hapus Kustom
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nama pos biaya (misal: Buku Raport / Seragam Batik)"
                          value={customFeeName}
                          onChange={(e) => setCustomFeeName(e.target.value)}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-500">Rp</span>
                          <input
                            type="number"
                            min="1000"
                            placeholder="Nominal"
                            value={customFeeNominal}
                            onChange={(e) => setCustomFeeNominal(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Execution Details & Confirmation Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Bayar *</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Bayar *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="TRANSFER">Transfer Bank ({activeProfile.bankName})</option>
                    <option value="TUNAI">Kas Tunai di Kantor</option>
                    <option value="QRIS">QRIS Resmi Sekolah</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      Nama Penyetor ({activeUnit === 'RQ' ? 'Wali Santri' : 'Wali Murid'})
                    </label>
                    {selectedStudent && (
                      <button
                        type="button"
                        onClick={() => setPayerName(selectedStudent.parentName || selectedStudent.name || '')}
                        className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold"
                        title="Isi otomatis dari data wali"
                      >
                        Reset ke Wali
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder={`misal: ${selectedStudent?.parentName || 'Nama Wali Murid / Penyetor'}`}
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="misal: Ditransfer via mobile banking BSI jam 08:30"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Real-time Summary Card Breakdown */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide flex items-center justify-between">
                  <span>Rincian Pembayaran ({bundleMode === 'SPP_ONLY' ? '1. SPP saja' : bundleMode === 'SPP_DSP' ? '2. SPP dan DSP' : bundleMode === 'SPP_DSP_ADM' ? '3. SPP, DSP dan Administrasi' : bundleMode === 'DSP_ONLY' ? 'DSP saja' : 'Administrasi saja'}):</span>
                  <span className="font-mono text-xs">{activeUnit} • TA {activeAcademicYear}</span>
                </div>

                <div className="divide-y divide-emerald-200/60 text-xs text-slate-800">
                  {(bundleMode === 'SPP_ONLY' || bundleMode === 'SPP_DSP' || bundleMode === 'SPP_DSP_ADM') && (
                    <div className="flex justify-between py-1">
                      <span>• SPP ({selectedMonths.length > 0 ? `${selectedMonths.length} bln: ${selectedMonths.join(', ')}` : 'Belum pilih bulan'}):</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(totalSppNominal)}</span>
                    </div>
                  )}

                  {(bundleMode === 'SPP_DSP' || bundleMode === 'SPP_DSP_ADM' || bundleMode === 'DSP_ONLY') && (
                    <div className="flex justify-between py-1">
                      <span>• DSP / Uang Pangkal:</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(totalDspNominal)}</span>
                    </div>
                  )}

                  {(bundleMode === 'SPP_DSP_ADM' || bundleMode === 'ADM_ONLY') && (
                    <div className="flex justify-between py-1">
                      <span>• Tagihan Administrasi ({selectedAdminFeeIds.length} pos{hasCustomFee && customFeeName ? ' + 1 kustom' : ''}):</span>
                      <span className="font-mono font-bold text-slate-900">{formatRupiah(totalAdminNominal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Total & Submit Button Bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total Keseluruhan yang Dibayar:</div>
                  <div className="text-2xl font-black text-emerald-700 tracking-tight">
                    {formatRupiah(computedTotal)}
                  </div>
                  <div className="text-[11px] text-slate-400 italic">
                    Terbilang: {terbilang(computedTotal)}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={computedTotal <= 0}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-extrabold text-sm shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Proses & Terbitkan Kwitansi</span>
                </button>
              </div>
            </div>

          </form>

          {/* Student Payment History */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600" />
              Riwayat Pembayaran {selectedStudent?.name} ({studentPayments.length} Transaksi)
            </h3>

            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto pr-1">
              {studentPayments.length > 0 ? (
                studentPayments.map(p => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">
                        {p.paymentType === 'SPP_DSP' ? 'SPP & DSP' : p.paymentType === 'SPP_DSP_ADM' ? 'SPP, DSP & Administrasi' : p.paymentType} {p.sppMonths?.length ? `• Bulan ${p.sppMonths.join(', ')}` : ''} {p.otherFeeDetail ? `• ${p.otherFeeDetail}` : ''}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {p.receiptNumber} • {p.date} • {p.paymentMethod}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">{formatRupiah(p.totalAmount)}</span>
                      <button
                        type="button"
                        onClick={() => openReceiptModal(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1"
                        title="Buka & Cetak Kwitansi"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Kwitansi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser.role === 'GURU_WALI_KELAS') {
                            alert('Akses Ditolak: Guru tidak memiliki izin membatalkan kwitansi.');
                            return;
                          }
                          if (confirm(`Batalkan transaksi ${p.receiptNumber} (${p.studentName}) senilai ${formatRupiah(p.totalAmount)}? Kas BKU terkait juga akan dihapus.`)) {
                            deleteStudentPayment(p.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Batalkan / Hapus Pembayaran"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada riwayat pembayaran untuk siswa ini di T.A {activeAcademicYear}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
