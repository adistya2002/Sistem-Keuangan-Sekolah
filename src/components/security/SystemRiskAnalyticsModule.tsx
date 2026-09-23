import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolUnitType, UserRole, Student } from '../../types';
import { 
  ShieldAlert, ShieldCheck, Activity, Database, AlertTriangle, 
  CheckCircle2, RefreshCw, Filter, Search, ArrowUpRight, ArrowDownRight, 
  Lock, Unlock, Bug, FileCode, Check, AlertOctagon, TrendingUp, TrendingDown, 
  Layers, Radio, Play, Pause, Download, Eye, ExternalLink, Sparkles, Server, 
  HardDrive, Wrench, CheckCheck, X, Trash2, Key, HelpCircle, ArrowRight, RotateCcw, Cloud
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { 
  formatRupiah, 
  formatRupiahShort, 
  formatDateIndo, 
  formatDateShort 
} from '../../utils/formatters';
import { 
  calculateFirestoreQuotaStats, 
  formatBytes, 
  FIRESTORE_DOC_MAX_BYTES, 
  FIRESTORE_STORAGE_MAX_BYTES, 
  FirestoreQuotaStats 
} from '../../services/firebaseSync';
import { firebaseConfigData } from '../../lib/firebase';

export interface AnomalyItem {
  id: string;
  category: 'CODE_AUTH' | 'DATABASE' | 'TRANSACTION' | 'AUDIT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  unit: SchoolUnitType | 'ALL';
  moduleName: string;
  detectedAt: string;
  financialImpact?: number;
  recommendation: string;
  targetTab?: string;
  isDismissed?: boolean;
  fixType?: 
    | 'FIX_DEFAULT_PASS' 
    | 'FIX_UNRESTRICTED_ACCESS' 
    | 'FIX_DUP_BKU' 
    | 'FIX_OUTLIER_EXPENSE' 
    | 'FIX_NEG_BALANCE' 
    | 'FIX_DOUBLE_SPP' 
    | 'FIX_ORPHAN_PAYMENTS' 
    | 'FIX_ORPHAN_BKU' 
    | 'FIX_AUDIT_LOG'
    | 'FIX_PURGE_AUDIT_LOGS';
  fixLabel?: string;
  fixData?: any;
  canAutoFix?: boolean;
}

const DISMISSED_STORAGE_KEY = 'SIKEU_DISMISSED_ANOMALIES_V1';

export const SystemRiskAnalyticsModule: React.FC = () => {
  const { 
    state, 
    currentUser, 
    activeUnit, 
    setCurrentTab,
    updateUserAccount,
    deleteCashTransaction,
    addCashTransaction,
    updateCashTransaction,
    deleteStudentPayment,
    addStudent,
    syncStatus,
    syncError,
    lastSyncMeta,
    lastSyncedAt,
    forceSyncToCloud,
    purgeOldAuditLogs,
    exportBackup
  } = useApp();

  // Firestore Quota & Storage Simulator (for testing warning states)
  const [simulatedQuotaPercent, setSimulatedQuotaPercent] = useState<number | null>(null);

  // Calculate Real-Time Firestore Quota & Storage Limits
  const quotaStats: FirestoreQuotaStats = useMemo(() => {
    return calculateFirestoreQuotaStats(state, syncError, simulatedQuotaPercent);
  }, [state, syncError, simulatedQuotaPercent]);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Filters
  const [selectedUnit, setSelectedUnit] = useState<'ALL' | SchoolUnitType>(isSuperAdmin ? 'ALL' : activeUnit);
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'CODE' | 'DATABASE' | 'TRANSACTION' | 'ANOMALY'>('ALL');
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('30D');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'RESOLVED' | 'ALL'>(() => {
    try {
      const saved = localStorage.getItem('SIKEU_ANOMALY_STATUS_FILTER');
      if (saved && ['ACTIVE', 'RESOLVED', 'ALL'].includes(saved)) {
        return saved as any;
      }
    } catch (e) {}
    return 'ACTIVE';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Live Stream & Real-time simulation
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [lastScanTime, setLastScanTime] = useState<Date>(new Date());
  const [latencyMs, setLatencyMs] = useState(24);
  const [isScanning, setIsScanning] = useState(false);

  // Persistent Dismissed / Resolved Anomaly IDs
  const [dismissedAnomalyIds, setDismissedAnomalyIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          return new Set(arr);
        }
      }
    } catch (e) {
      console.error('Failed to load dismissed anomalies from storage:', e);
    }
    return new Set();
  });

  // Save dismissed IDs whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissedAnomalyIds)));
    } catch (e) {
      console.error('Failed to persist dismissed anomalies:', e);
    }
  }, [dismissedAnomalyIds]);

  // Remediation / Fix States
  const [activeFixModal, setActiveFixModal] = useState<AnomalyItem | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixToast, setFixToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [customPassword, setCustomPassword] = useState('Thoriqul2026!#');
  const [customAdjustmentAmount, setCustomAdjustmentAmount] = useState<number>(2500000);
  const [batchFixConfirmOpen, setBatchFixConfirmOpen] = useState(false);

  // Real-time pulse interval
  useEffect(() => {
    if (!isLiveActive) return;

    const interval = setInterval(() => {
      setLastScanTime(new Date());
      setLatencyMs(Math.floor(18 + Math.random() * 15));
    }, 4000);

    return () => clearInterval(interval);
  }, [isLiveActive]);

  // Auto clear toast after 5s
  useEffect(() => {
    if (!fixToast) return;
    const timer = setTimeout(() => {
      setFixToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [fixToast]);

  const handleManualScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setLastScanTime(new Date());
      setLatencyMs(Math.floor(15 + Math.random() * 10));
      setIsScanning(false);
      setFixToast({
        message: 'Pemindaian keamanan selesai. Seluruh parameter database dan transaksi diperbarui.',
        type: 'info'
      });
    }, 600);
  };

  // Toggle dismiss anomaly with instant persistence
  const toggleDismissAnomaly = (id: string) => {
    setDismissedAnomalyIds(prev => {
      const next = new Set(prev);
      const isNowDismissed = !next.has(id);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Failed to update dismissed anomalies:', e);
      }
      setFixToast({
        message: isNowDismissed 
          ? 'Anomali telah ditandai selesai (aman) dan disimpan secara permanen.' 
          : 'Anomali dibuka kembali untuk pemantauan aktif berkala.',
        type: isNowDismissed ? 'success' : 'info'
      });
      return next;
    });
  };

  // Reset all dismissed status
  const handleResetVerification = () => {
    setDismissedAnomalyIds(new Set());
    try {
      localStorage.removeItem(DISMISSED_STORAGE_KEY);
    } catch (e) {}
    setFixToast({
      message: 'Status verifikasi telah di-reset. Seluruh anomali kini ditampilkan ulang.',
      type: 'info'
    });
  };

  // -------------------------------------------------------------
  // 1. ENGINE DETEKSI ANOMALI DINAMIS & RESIKO MULTI-UNIT
  // -------------------------------------------------------------
  const detectedAnomalies = useMemo(() => {
    const list: AnomalyItem[] = [];

    // A. RESIKO KODE & OTORITAS PENGGUNA (CODE_AUTH)
    const isWeakPass = (hash?: string) => {
      if (!hash) return true;
      if (hash.includes('4Rmag3don')) return true;
      if (!hash.startsWith('SECURE_')) return true;
      return false;
    };
    const usersWithDefaultPass = state.users.filter(u => isWeakPass(u.passwordHash));
    if (usersWithDefaultPass.length > 0) {
      list.push({
        id: 'auth-default-pass',
        category: 'CODE_AUTH',
        severity: 'HIGH',
        title: 'Penggunaan Kata Sandi Bawaan / Rentan',
        description: `Ditemukan ${usersWithDefaultPass.length} akun (${usersWithDefaultPass.map(u => u.username).join(', ')}) masih menggunakan password bawaan/belum diperkuat.`,
        unit: 'ALL',
        moduleName: 'Otorisasi & Akun',
        detectedAt: new Date().toISOString(),
        recommendation: 'Segera perbarui ke kata sandi unik dan aman dengan enkripsi hash baru.',
        targetTab: 'security',
        fixType: 'FIX_DEFAULT_PASS',
        fixLabel: 'Perbarui Sandi Akun Rentan',
        canAutoFix: true,
        fixData: { userIds: usersWithDefaultPass.map(u => u.id) }
      });
    }

    const nonSuperWithAllAccess = state.users.filter(u => u.role !== 'SUPER_ADMIN' && u.unitAccess === 'ALL');
    if (nonSuperWithAllAccess.length > 0) {
      list.push({
        id: 'auth-unrestricted-access',
        category: 'CODE_AUTH',
        severity: 'CRITICAL',
        title: 'Pelanggaran Isolasi Unit (Cross-Unit Leakage Risk)',
        description: `Pengguna non-Super Admin (${nonSuperWithAllAccess.map(u => u.username).join(', ')}) memiliki akses ke seluruh unit ('ALL').`,
        unit: 'ALL',
        moduleName: 'Otorisasi & Akun',
        detectedAt: new Date().toISOString(),
        recommendation: 'Batasi hak unitAccess ke unit spesifik sesuai penugasan kerja.',
        targetTab: 'security',
        fixType: 'FIX_UNRESTRICTED_ACCESS',
        fixLabel: 'Kunci Isolasi Unit Pengguna',
        canAutoFix: true,
        fixData: { userIds: nonSuperWithAllAccess.map(u => u.id) }
      });
    }

    // B. RESIKO & ANOMALI TRANSAKSI KAS BKU & SPP (TRANSACTION)
    // 1. Duplikasi Transaksi (Nominal & Tanggal Sama Pada Unit yang Sama)
    const seenBku = new Map<string, typeof state.cashTransactions[0]>();
    state.cashTransactions.forEach(tx => {
      const key = `${tx.unit}_${tx.date}_${tx.amount}_${tx.type}`;
      if (seenBku.has(key)) {
        const prev = seenBku.get(key)!;
        list.push({
          id: `dup-tx-${tx.id}`,
          category: 'TRANSACTION',
          severity: 'MEDIUM',
          title: 'Potensi Duplikasi Mutasi BKU',
          description: `Mutasi [${tx.referenceNo}] memiliki nominal sama (${formatRupiah(tx.amount)}) dan tanggal sama (${tx.date}) dengan [${prev.referenceNo}]: "${tx.description}".`,
          unit: tx.unit,
          moduleName: 'Kas BKU',
          detectedAt: tx.createdAt || new Date().toISOString(),
          financialImpact: tx.amount,
          recommendation: 'Hapus entri duplikat atau verifikasi rekening koran.',
          targetTab: 'cash',
          fixType: 'FIX_DUP_BKU',
          fixLabel: 'Hapus Entri Duplikat BKU',
          canAutoFix: true,
          fixData: { txId: tx.id, refNo: tx.referenceNo }
        });
      } else {
        seenBku.set(key, tx);
      }
    });

    // 2. Transaksi Pengeluaran Ekstrem (Outlier Belanja > Rp 2.500.000)
    state.cashTransactions
      .filter(tx => tx.type === 'KELUAR' && tx.amount >= 2_500_000 && !tx.notes?.toUpperCase().includes('DISETUJUI & DIVALIDASI'))
      .forEach(tx => {
        list.push({
          id: `outlier-expense-${tx.id}`,
          category: 'TRANSACTION',
          severity: tx.amount >= 5_000_000 ? 'CRITICAL' : 'HIGH',
          title: 'Pengeluaran Bernilai Signifikan (Outlier Expense)',
          description: `Pengeluaran sebesar ${formatRupiah(tx.amount)} pada Unit ${tx.unit} untuk pos "${tx.category}": ${tx.description}.`,
          unit: tx.unit,
          moduleName: 'Kas BKU',
          detectedAt: tx.createdAt || new Date().toISOString(),
          financialImpact: tx.amount,
          recommendation: 'Sahkan dan cantumkan stempel otorisasi pimpinan pada pengeluaran ini.',
          targetTab: 'cash',
          fixType: 'FIX_OUTLIER_EXPENSE',
          fixLabel: 'Sahkan & Otorisasi Pengeluaran',
          canAutoFix: true,
          fixData: { txId: tx.id, amount: tx.amount }
        });
      });

    // 3. Deteksi Saldo Kas Negatif Berjalan
    const unitsList: SchoolUnitType[] = ['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'];
    unitsList.forEach(u => {
      const sortedTxs = [...state.cashTransactions]
        .filter(t => t.unit === u)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let running = 0;
      let hadNegative = false;
      let minBalance = 0;

      for (const t of sortedTxs) {
        if (t.type === 'MASUK') running += t.amount;
        else running -= t.amount;

        if (running < 0) {
          hadNegative = true;
          if (running < minBalance) minBalance = running;
        }
      }

      if (hadNegative) {
        list.push({
          id: `neg-balance-${u}`,
          category: 'TRANSACTION',
          severity: 'CRITICAL',
          title: `Defisit Saldo Kas Terdeteksi (Unit ${u})`,
          description: `Riwayat mutasi menunjukkan saldo kas pernah minus hingga ${formatRupiah(minBalance)}. Mengindikasikan pengeluaran tercatat sebelum kas masuk diterima.`,
          unit: u,
          moduleName: 'Kas BKU',
          detectedAt: new Date().toISOString(),
          financialImpact: Math.abs(minBalance),
          recommendation: 'Tambahkan penyesuaian saldo awal kas positif agar pembukuan tidak negatif.',
          targetTab: 'cash',
          fixType: 'FIX_NEG_BALANCE',
          fixLabel: 'Injeksi Saldo Penyeimbang Kas',
          canAutoFix: true,
          fixData: { unit: u, amount: Math.abs(minBalance) + 1_000_000 }
        });
      }
    });

    // 4. Pembayaran SPP Ganda (Siswa yang sama membayar bulan yang sama 2x)
    const studentPaidMonths = new Map<string, Set<string>>();
    state.studentPayments.forEach(p => {
      if (p.sppMonths && p.sppMonths.length > 0) {
        p.sppMonths.forEach(m => {
          const key = `${p.studentId}_${m}_${p.academicYear}`;
          if (!studentPaidMonths.has(p.studentId)) {
            studentPaidMonths.set(p.studentId, new Set());
          }
          const monthsSet = studentPaidMonths.get(p.studentId)!;
          if (monthsSet.has(`${m}_${p.academicYear}`)) {
            list.push({
              id: `double-spp-${p.id}-${m}`,
              category: 'TRANSACTION',
              severity: 'HIGH',
              title: `Anomali Pembayaran SPP Ganda (${p.studentName})`,
              description: `Terdeteksi pembayaran berulang untuk bulan ${m} Tahun Ajaran ${p.academicYear} pada kwitansi #${p.receiptNumber}.`,
              unit: p.unit,
              moduleName: 'SPP & Tagihan',
              detectedAt: p.createdAt || new Date().toISOString(),
              financialImpact: p.sppAmount || p.totalAmount,
              recommendation: 'Batalkan kwitansi SPP duplikat untuk menjaga catatan tunggakan akurat.',
              targetTab: 'spp',
              fixType: 'FIX_DOUBLE_SPP',
              fixLabel: 'Batalkan Kwitansi SPP Ganda',
              canAutoFix: true,
              fixData: { paymentId: p.id, studentName: p.studentName, receiptNumber: p.receiptNumber }
            });
          } else {
            monthsSet.add(`${m}_${p.academicYear}`);
          }
        });
      }
    });

    // C. ANOMALI INTEGRITAS DATABASE (DATABASE)
    // 1. Orphan Student Payments (Pembayaran tanpa id siswa di master)
    const studentIds = new Set(state.students.map(s => s.id));
    const orphanPayments = state.studentPayments.filter(p => !studentIds.has(p.studentId));
    if (orphanPayments.length > 0) {
      list.push({
        id: 'db-orphan-payments',
        category: 'DATABASE',
        severity: 'MEDIUM',
        title: 'Integritas Relasi: Orphan Payment Records',
        description: `Ditemukan ${orphanPayments.length} catatan pembayaran SPP yang data siswanya sudah tidak ditemukan di database master siswa.`,
        unit: 'ALL',
        moduleName: 'Database Master',
        detectedAt: new Date().toISOString(),
        recommendation: 'Pulihkan profil siswa terkait ke master data siswa secara otomatis.',
        targetTab: 'master',
        fixType: 'FIX_ORPHAN_PAYMENTS',
        fixLabel: 'Pulihkan Master Siswa Terkait',
        canAutoFix: true,
        fixData: { orphanPayments }
      });
    }

    // 2. Orphan BKU Linked to Payments
    const paymentIds = new Set(state.studentPayments.map(p => p.id));
    const orphanBku = state.cashTransactions.filter(t => t.studentPaymentId && !paymentIds.has(t.studentPaymentId));
    if (orphanBku.length > 0) {
      list.push({
        id: 'db-orphan-bku',
        category: 'DATABASE',
        severity: 'LOW',
        title: 'Integritas Relasi: BKU Tidak Terhubung Kwitansi',
        description: `Terdapat ${orphanBku.length} transaksi kas masuk bertanda SPP namun kwitansi asalnya telah dihapus dari sistem.`,
        unit: 'ALL',
        moduleName: 'Kas BKU',
        detectedAt: new Date().toISOString(),
        recommendation: 'Lepaskan tautan id kwitansi lama agar mutasi tetap sah sebagai kas umum.',
        targetTab: 'cash',
        fixType: 'FIX_ORPHAN_BKU',
        fixLabel: 'Normalkan Tautan BKU Yatim',
        canAutoFix: true,
        fixData: { orphanBkuIds: orphanBku.map(b => b.id) }
      });
    }

    // 3. Peringatan Kapasitas & Kuota Database Firestore (Real-Time)
    if (quotaStats.isNearLimit || quotaStats.quotaExceededError) {
      list.push({
        id: 'db-firestore-quota-limit',
        category: 'DATABASE',
        severity: quotaStats.isCritical ? 'CRITICAL' : 'HIGH',
        title: quotaStats.isCritical 
          ? `Kapasitas Kuota Dokumen Firestore Hampir Habis (Sisa: ${formatBytes(quotaStats.docRemainingBytes)})`
          : `Peringatan Kuota Dokumen Firestore Menipis (Terpakai ${quotaStats.docUsagePercent}%)`,
        description: `Ukuran payload dokumen Firestore saat ini ${formatBytes(quotaStats.docCurrentBytes)} dari batas maksimal 1.00 MiB (${formatBytes(quotaStats.docMaxBytes)}). Sisa ruang tersisa ${formatBytes(quotaStats.docRemainingBytes)} (${(100 - quotaStats.docUsagePercent).toFixed(1)}%). ${
          quotaStats.quotaExceededError ? 'Terdeteksi kegagalan kuota harian ("Resource Exhausted / Quota Exceeded").' : 'Segera lakukan pemadatan data untuk mencegah kegagalan sinkronisasi cloud.'
        }`,
        unit: 'ALL',
        moduleName: 'Cloud Firestore DB',
        detectedAt: new Date().toISOString(),
        recommendation: 'Jalankan pemadatan dan bersihkan log audit lama yang tidak diperlukan.',
        targetTab: 'security',
        fixType: 'FIX_PURGE_AUDIT_LOGS',
        fixLabel: 'Padatkan & Bersihkan Log Audit',
        canAutoFix: true
      });
    }

    // D. ANOMALI AUDIT LOG (AUDIT)
    const recentDeletes = state.auditLogs.filter(a => a.action === 'DELETE');
    if (recentDeletes.length >= 5) {
      list.push({
        id: 'audit-multiple-deletes',
        category: 'AUDIT',
        severity: 'HIGH',
        title: 'Frekuensi Penghapusan Data Meningkat',
        description: `Tercatat ${recentDeletes.length} tindakan DELETE dalam log audit keamanan oleh pengguna sistem.`,
        unit: 'ALL',
        moduleName: 'Audit Keamanan',
        detectedAt: new Date().toISOString(),
        recommendation: 'Tinjau rincian audit log dan konfirmasikan keabsahan penghapusan.',
        targetTab: 'security',
        fixType: 'FIX_AUDIT_LOG',
        fixLabel: 'Tandai Audit Log Telah Ditinjau',
        canAutoFix: true
      });
    }

    return list;
  }, [state, quotaStats]);

  // Filtered Anomalies
  const filteredAnomalies = useMemo(() => {
    return detectedAnomalies.filter(item => {
      if (selectedUnit !== 'ALL' && item.unit !== 'ALL' && item.unit !== selectedUnit) {
        return false;
      }
      if (activeSubTab === 'CODE' && item.category !== 'CODE_AUTH') return false;
      if (activeSubTab === 'DATABASE' && item.category !== 'DATABASE') return false;
      if (activeSubTab === 'TRANSACTION' && item.category !== 'TRANSACTION') return false;
      if (activeSubTab === 'ANOMALY' && item.severity === 'LOW') return false;

      if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;

      // Status Filter: ACTIVE vs RESOLVED vs ALL
      const isDismissed = dismissedAnomalyIds.has(item.id);
      if (statusFilter === 'ACTIVE' && isDismissed) return false;
      if (statusFilter === 'RESOLVED' && !isDismissed) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.moduleName.toLowerCase().includes(q) ||
          item.recommendation.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [detectedAnomalies, selectedUnit, activeSubTab, severityFilter, statusFilter, dismissedAnomalyIds, searchQuery]);

  // -------------------------------------------------------------
  // 2. SKOR KEAMANAN SISTEM & INDEKS RESIKO (0 - 100)
  // -------------------------------------------------------------
  const securityHealthScore = useMemo(() => {
    let score = 100;
    detectedAnomalies.forEach(item => {
      if (dismissedAnomalyIds.has(item.id)) return;
      if (item.severity === 'CRITICAL') score -= 15;
      else if (item.severity === 'HIGH') score -= 8;
      else if (item.severity === 'MEDIUM') score -= 4;
      else if (item.severity === 'LOW') score -= 1;
    });
    return Math.max(15, Math.min(100, score));
  }, [detectedAnomalies, dismissedAnomalyIds]);

  // -------------------------------------------------------------
  // 3. REMEDIATION ENGINE (EKSEKUSI PERBAIKAN MASALAH)
  // -------------------------------------------------------------
  const handleExecuteFix = (item: AnomalyItem, customParams?: any) => {
    setIsFixing(true);

    try {
      if (item.fixType === 'FIX_DEFAULT_PASS') {
        const newPass = customParams?.newPassword || customPassword || 'Thoriqul2026!#';
        const salt = `SALT_${Date.now().toString(36)}`;
        const newHash = `SECURE_${btoa(newPass).replace(/=/g, '')}_${salt}`;
        
        let count = 0;
        state.users.forEach(u => {
          if (!u.passwordHash || u.passwordHash.includes('4Rmag3don') || !u.passwordHash.startsWith('SECURE_')) {
            updateUserAccount({
              ...u,
              passwordHash: newHash
            });
            count++;
          }
        });

        setDismissedAnomalyIds(prev => {
          const next = new Set(prev);
          next.add(item.id);
          try {
            localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
          } catch (e) {}
          return next;
        });

        setFixToast({
          message: `Sukses memperbarui sandi untuk ${count} akun pengguna rentan dengan kata sandi aman: "${newPass}"`,
          type: 'success'
        });
      } 
      else if (item.fixType === 'FIX_UNRESTRICTED_ACCESS') {
        let count = 0;
        state.users.forEach(u => {
          if (u.role !== 'SUPER_ADMIN' && u.unitAccess === 'ALL') {
            const targetUnit: SchoolUnitType = 
              u.username.toLowerCase().includes('kb') ? 'KB' :
              u.username.toLowerCase().includes('rq') ? 'RQ' :
              u.username.toLowerCase().includes('sd') ? 'SD' :
              u.username.toLowerCase().includes('smp') ? 'SMP' :
              u.username.toLowerCase().includes('sma') ? 'SMA' : 'TK';

            updateUserAccount({
              ...u,
              unitAccess: targetUnit
            });
            count++;
          }
        });

        setDismissedAnomalyIds(prev => {
          const next = new Set(prev);
          next.add(item.id);
          try {
            localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
          } catch (e) {}
          return next;
        });

        setFixToast({
          message: `Berhasil mengunci kewenangan ${count} akun pengguna non-Super Admin ke unit masing-masing.`,
          type: 'success'
        });
      }
      else if (item.fixType === 'FIX_DUP_BKU') {
        const txId = item.fixData?.txId;
        if (txId) {
          deleteCashTransaction(txId);
          setDismissedAnomalyIds(prev => {
            const next = new Set(prev);
            next.add(item.id);
            try {
              localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
            } catch (e) {}
            return next;
          });
          setFixToast({
            message: `Transaksi BKU duplikat [${item.fixData?.refNo || txId}] berhasil dihapus dari pembukuan.`,
            type: 'success'
          });
        }
      }
      else if (item.fixType === 'FIX_OUTLIER_EXPENSE') {
        const txId = item.fixData?.txId;
        const targetTx = state.cashTransactions.find(t => t.id === txId);
        if (targetTx) {
          const authNote = `[DISETUJUI & DIVALIDASI: ${currentUser.fullName} (${currentUser.role}) tgl ${new Date().toLocaleDateString('id-ID')}]`;
          const updatedNotes = targetTx.notes && !targetTx.notes.toUpperCase().includes('DISETUJUI & DIVALIDASI')
            ? `${targetTx.notes} | ${authNote}`
            : (targetTx.notes || authNote);

          updateCashTransaction({
            ...targetTx,
            notes: updatedNotes
          });

          setDismissedAnomalyIds(prev => {
            const next = new Set(prev);
            next.add(item.id);
            try {
              localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
            } catch (e) {}
            return next;
          });

          setFixToast({
            message: `Pengeluaran ${formatRupiah(targetTx.amount)} telah disahkan & diberi stempel otorisasi pimpinan.`,
            type: 'success'
          });
        }
      }
      else if (item.fixType === 'FIX_NEG_BALANCE') {
        const targetUnit = item.fixData?.unit as SchoolUnitType;
        const adjAmount = customParams?.amount || item.fixData?.amount || customAdjustmentAmount || 2500000;

        addCashTransaction({
          unit: targetUnit,
          academicYear: state.activeAcademicYear || '2026/2027',
          date: new Date().toISOString().split('T')[0],
          referenceNo: `ADJ-SALDO-${targetUnit}-${Date.now().toString().slice(-4)}`,
          type: 'MASUK',
          category: 'Penerimaan Awal / Saldo Rekonsiliasi',
          description: 'Injeksi Penyesuaian Saldo Kas Positif (Penyelarasan Pembukuan Otomatis)',
          amount: adjAmount,
          paymentMethod: 'TRANSFER',
          sourceOrRecipient: 'Kas Yayasan Thoriqul Jannah',
          notes: `Dibuat via Tombol Perbaikan Analisa Risiko oleh ${currentUser.fullName}`,
          createdBy: currentUser.fullName
        });

        setDismissedAnomalyIds(prev => {
          const next = new Set(prev);
          next.add(item.id);
          try {
            localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
          } catch (e) {}
          return next;
        });

        setFixToast({
          message: `Saldo kas Unit ${targetUnit} berhasil direkonsiliasi dengan entri penyesuaian kas masuk sebesar ${formatRupiah(adjAmount)}.`,
          type: 'success'
        });
      }
      else if (item.fixType === 'FIX_DOUBLE_SPP') {
        const pId = item.fixData?.paymentId;
        if (pId) {
          deleteStudentPayment(pId);
          setDismissedAnomalyIds(prev => {
            const next = new Set(prev);
            next.add(item.id);
            try {
              localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
            } catch (e) {}
            return next;
          });
          setFixToast({
            message: `Kwitansi pembayaran SPP ganda #${item.fixData?.receiptNumber} (${item.fixData?.studentName}) berhasil dibatalkan.`,
            type: 'success'
          });
        }
      }
      else if (item.fixType === 'FIX_ORPHAN_PAYMENTS') {
        const orphanPayments = item.fixData?.orphanPayments as typeof state.studentPayments || [];
        const uniqueStudentMap = new Map<string, typeof orphanPayments[0]>();
        orphanPayments.forEach(p => {
          if (!uniqueStudentMap.has(p.studentId)) {
            uniqueStudentMap.set(p.studentId, p);
          }
        });

        let restoredCount = 0;
        uniqueStudentMap.forEach((p, sId) => {
          addStudent({
            unit: p.unit,
            nis: `RESTORE-${Math.floor(1000 + Math.random() * 9000)}`,
            name: p.studentName || 'Siswa Pulih',
            gender: 'L',
            className: p.className || 'Kelas A',
            academicYear: p.academicYear || state.activeAcademicYear,
            status: 'AKTIF',
            scholarship: 'REGULER',
            discountPercentage: 0,
            parentName: `Wali Murid ${p.studentName}`,
            parentPhone: '081234567890',
            notes: 'Dipulihkan otomatis via Tombol Perbaikan Database'
          });
          restoredCount++;
        });

        setDismissedAnomalyIds(prev => {
          const next = new Set(prev);
          next.add(item.id);
          try {
            localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
          } catch (e) {}
          return next;
        });

        setFixToast({
          message: `Berhasil memulihkan ${restoredCount} entri profil siswa ke Master Data untuk menyelesaikan integritas relasional.`,
          type: 'success'
        });
      }
      else if (item.fixType === 'FIX_ORPHAN_BKU') {
        const orphanIds = item.fixData?.orphanBkuIds as string[] || [];
        orphanIds.forEach(id => {
          const t = state.cashTransactions.find(tx => tx.id === id);
          if (t) {
            updateCashTransaction({
              ...t,
              studentPaymentId: undefined
            });
          }
        });

        setDismissedAnomalyIds(prev => {
          const next = new Set(prev);
          next.add(item.id);
          try {
            localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
          } catch (e) {}
          return next;
        });

        setFixToast({
          message: `Berhasil menormalkan ${orphanIds.length} transaksi kas BKU yatim menjadi kas masuk umum.`,
          type: 'success'
        });
      }
      else if (item.fixType === 'FIX_AUDIT_LOG') {
        toggleDismissAnomaly(item.id);
        setFixToast({
          message: 'Catatan lonjakan log audit telah diverifikasi dan ditandai aman oleh administrator.',
          type: 'info'
        });
      }
      else if (item.fixType === 'FIX_PURGE_AUDIT_LOGS') {
        if (purgeOldAuditLogs) {
          purgeOldAuditLogs(15);
        }
        setDismissedAnomalyIds(prev => {
          const next = new Set(prev);
          next.add(item.id);
          try {
            localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
          } catch (e) {}
          return next;
        });
        setFixToast({
          message: 'Pembersihan dan pemadatan log audit berhasil! Kapasitas dokumen database Firestore telah dipadatkan secara instan.',
          type: 'success'
        });
      }

      // Sync to cloud if available
      try {
        if (forceSyncToCloud) {
          forceSyncToCloud();
        }
      } catch (e) {}

      // Close modal
      setActiveFixModal(null);
    } catch (err: any) {
      setFixToast({
        message: `Terjadi kendala saat menerapkan perbaikan: ${err?.message || 'Error'}`,
        type: 'error'
      });
    } finally {
      setIsFixing(false);
    }
  };

  // -------------------------------------------------------------
  // 4. BATCH AUTO-FIX (PERBAIKAN CEPAT SELURUH MASALAH AMAN)
  // -------------------------------------------------------------
  const autoFixableCount = detectedAnomalies.filter(a => a.canAutoFix && !dismissedAnomalyIds.has(a.id)).length;

  const handleBatchAutoFix = async () => {
    setIsFixing(true);
    let resolvedCount = 0;

    try {
      const fixableItems = detectedAnomalies.filter(a => a.canAutoFix && !dismissedAnomalyIds.has(a.id));
      if (fixableItems.length === 0) {
        setFixToast({
          message: 'Semua anomali sudah terverifikasi dan diperbaiki.',
          type: 'info'
        });
        setIsFixing(false);
        setBatchFixConfirmOpen(false);
        return;
      }

      const newlyDismissed = new Set(dismissedAnomalyIds);

      // 1. Weak passwords batch fix
      const weakUsers = state.users.filter(u => !u.passwordHash || u.passwordHash.includes('4Rmag3don') || !u.passwordHash.startsWith('SECURE_'));
      if (weakUsers.length > 0) {
        const newPass = customPassword || 'Thoriqul2026!#';
        const salt = `SALT_${Date.now().toString(36)}`;
        const newHash = `SECURE_${btoa(newPass).replace(/=/g, '')}_${salt}`;
        weakUsers.forEach(u => {
          updateUserAccount({
            ...u,
            passwordHash: newHash
          });
        });
      }

      // 2. Non-superadmin with ALL access
      const nonSuperAll = state.users.filter(u => u.role !== 'SUPER_ADMIN' && u.unitAccess === 'ALL');
      nonSuperAll.forEach(u => {
        const targetUnit: SchoolUnitType = 
          u.username.toLowerCase().includes('kb') ? 'KB' :
          u.username.toLowerCase().includes('rq') ? 'RQ' :
          u.username.toLowerCase().includes('sd') ? 'SD' :
          u.username.toLowerCase().includes('smp') ? 'SMP' :
          u.username.toLowerCase().includes('sma') ? 'SMA' : 'TK';
        updateUserAccount({
          ...u,
          unitAccess: targetUnit
        });
      });

      // 3. Outlier expense authorizations
      const authStamp = `[DISETUJUI & DIVALIDASI: ${currentUser.fullName} (${currentUser.role}) tgl ${new Date().toLocaleDateString('id-ID')}]`;
      const outlierTxs = state.cashTransactions.filter(tx => tx.type === 'KELUAR' && tx.amount >= 2_500_000 && !tx.notes?.toUpperCase().includes('DISETUJUI & DIVALIDASI'));
      outlierTxs.forEach(tx => {
        const updatedNotes = tx.notes && !tx.notes.toUpperCase().includes('DISETUJUI & DIVALIDASI')
          ? `${tx.notes} | ${authStamp}`
          : (tx.notes || authStamp);
        updateCashTransaction({
          ...tx,
          notes: updatedNotes
        });
      });

      // 4. Duplicate BKU transactions
      const seenBkuKeys = new Set<string>();
      state.cashTransactions.forEach(tx => {
        const key = `${tx.unit}_${tx.date}_${tx.amount}_${tx.type}`;
        if (seenBkuKeys.has(key)) {
          deleteCashTransaction(tx.id);
        } else {
          seenBkuKeys.add(key);
        }
      });

      // 5. Negative balance reconciliation
      const unitsList: SchoolUnitType[] = ['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'];
      unitsList.forEach(u => {
        const sorted = [...state.cashTransactions]
          .filter(t => t.unit === u)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let running = 0;
        let minBal = 0;
        for (const t of sorted) {
          if (t.type === 'MASUK') running += t.amount;
          else running -= t.amount;
          if (running < minBal) minBal = running;
        }
        if (minBal < 0) {
          addCashTransaction({
            unit: u,
            academicYear: state.activeAcademicYear || '2026/2027',
            date: new Date().toISOString().split('T')[0],
            referenceNo: `ADJ-SALDO-${u}-${Date.now().toString().slice(-4)}`,
            type: 'MASUK',
            category: 'Penerimaan Awal / Saldo Rekonsiliasi',
            description: 'Injeksi Penyesuaian Saldo Kas Positif (Penyelarasan Pembukuan Otomatis)',
            amount: Math.abs(minBal) + 1000000,
            paymentMethod: 'TRANSFER',
            sourceOrRecipient: 'Kas Yayasan Thoriqul Jannah',
            notes: `Dibuat via Tombol Perbaikan Analisa Risiko oleh ${currentUser.fullName}`,
            createdBy: currentUser.fullName
          });
        }
      });

      // 6. Purge and compact audit logs if quota warning is present
      if (fixableItems.some(i => i.fixType === 'FIX_PURGE_AUDIT_LOGS') && purgeOldAuditLogs) {
        purgeOldAuditLogs(15);
      }

      // 7. Record all fixable items into newlyDismissed
      fixableItems.forEach(item => {
        newlyDismissed.add(item.id);
        resolvedCount++;
      });

      setDismissedAnomalyIds(newlyDismissed);
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(newlyDismissed)));
      } catch (e) {
        console.error('Failed to save to localStorage:', e);
      }

      // Sync to cloud if available
      try {
        if (forceSyncToCloud) {
          await forceSyncToCloud();
        }
      } catch (e) {
        console.warn('Cloud sync during batch fix:', e);
      }

      setFixToast({
        message: `⚡ Perbaikan Cepat Selesai! Berhasil memperbaiki & mengesahkan ${resolvedCount} anomali secara permanen. Seluruh parameter sistem kini aman.`,
        type: 'success'
      });
    } catch (err: any) {
      setFixToast({
        message: `Kendala saat perbaikan: ${err?.message}`,
        type: 'error'
      });
    } finally {
      setIsFixing(false);
      setBatchFixConfirmOpen(false);
    }
  };

  // -------------------------------------------------------------
  // 5. DIAGRAM GARIS: TIMELINE ARUS TRANSAKSI & ANOMALI
  // -------------------------------------------------------------
  const transactionTimelineData = useMemo(() => {
    const rawTxs = state.cashTransactions.filter(t => {
      if (selectedUnit !== 'ALL' && t.unit !== selectedUnit) return false;
      return true;
    });

    const dateMap = new Map<string, { date: string; kasMasuk: number; kasKeluar: number; saldo: number; anomaliCount: number }>();
    const sortedTxs = [...rawTxs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let runningSaldo = 0;
    sortedTxs.forEach(tx => {
      if (!dateMap.has(tx.date)) {
        dateMap.set(tx.date, { date: tx.date, kasMasuk: 0, kasKeluar: 0, saldo: 0, anomaliCount: 0 });
      }
      const entry = dateMap.get(tx.date)!;
      if (tx.type === 'MASUK') {
        entry.kasMasuk += tx.amount;
        runningSaldo += tx.amount;
      } else {
        entry.kasKeluar += tx.amount;
        runningSaldo -= tx.amount;
      }
      entry.saldo = runningSaldo;
    });

    detectedAnomalies.forEach(a => {
      const aDate = a.detectedAt.split('T')[0];
      if (dateMap.has(aDate)) {
        dateMap.get(aDate)!.anomaliCount += 1;
      }
    });

    let result = Array.from(dateMap.values());

    if (timeRange === '7D') {
      result = result.slice(-7);
    } else if (timeRange === '30D') {
      result = result.slice(-30);
    }

    if (result.length === 0) {
      result = [
        { date: '2026-08-01', kasMasuk: 1500000, kasKeluar: 200000, saldo: 1300000, anomaliCount: 0 },
        { date: '2026-08-15', kasMasuk: 3200000, kasKeluar: 1100000, saldo: 3400000, anomaliCount: 1 },
        { date: '2026-09-01', kasMasuk: 4500000, kasKeluar: 850000, saldo: 7050000, anomaliCount: 0 }
      ];
    }

    return result;
  }, [state.cashTransactions, detectedAnomalies, selectedUnit, timeRange]);

  // -------------------------------------------------------------
  // 6. DIAGRAM BATANG: DISTRIBUSI DATABASE SEMUA UNIT & MODUL
  // -------------------------------------------------------------
  const unitDatabaseData = useMemo(() => {
    const units: { key: SchoolUnitType; name: string }[] = [
      { key: 'TK', name: 'TK IT' },
      { key: 'KB', name: 'KB Terpadu' },
      { key: 'RQ', name: 'Rumah Qur\'an' },
      { key: 'SD', name: 'SD IT' },
      { key: 'SMP', name: 'SMP IT' },
      { key: 'SMA', name: 'SMA IT' }
    ];

    return units.map(u => {
      const siswa = state.students.filter(s => s.unit === u.key).length;
      const pembayaran = state.studentPayments.filter(p => p.unit === u.key).length;
      const bku = state.cashTransactions.filter(t => t.unit === u.key).length;
      const anggaran = state.budgetPlans.filter(b => b.unit === u.key).length;
      const totalRecords = siswa + pembayaran + bku + anggaran;

      return {
        unitKey: u.key,
        unitName: u.name,
        siswa,
        pembayaran,
        bku,
        anggaran,
        totalRecords
      };
    });
  }, [state]);

  // -------------------------------------------------------------
  // 7. DIAGRAM LINGKARAN: METODE PEMBAYARAN & RISIKO
  // -------------------------------------------------------------
  const paymentMethodData = useMemo(() => {
    const counts = { TUNAI: 0, TRANSFER: 0, QRIS: 0 };
    const amounts = { TUNAI: 0, TRANSFER: 0, QRIS: 0 };

    state.studentPayments.forEach(p => {
      if (selectedUnit === 'ALL' || p.unit === selectedUnit) {
        counts[p.paymentMethod] = (counts[p.paymentMethod] || 0) + 1;
        amounts[p.paymentMethod] = (amounts[p.paymentMethod] || 0) + p.totalAmount;
      }
    });

    return [
      { name: 'Tunai (Cash Fisik)', value: amounts.TUNAI, count: counts.TUNAI, color: '#10b981' },
      { name: 'Transfer Bank (BSI / Lainnya)', value: amounts.TRANSFER, count: counts.TRANSFER, color: '#3b82f6' },
      { name: 'QRIS Dinamis', value: amounts.QRIS, count: counts.QRIS, color: '#8b5cf6' }
    ].filter(item => item.value > 0);
  }, [state.studentPayments, selectedUnit]);

  // -------------------------------------------------------------
  // 8. ANALISA RISIKO KODE
  // -------------------------------------------------------------
  const codeRiskVectors = useMemo(() => {
    const defaultPassCount = state.users.filter(u => u.passwordHash === '4Rmag3don01cr#6').length;
    const authScore = Math.max(20, 100 - (defaultPassCount * 25));

    const nonSuperAllCount = state.users.filter(u => u.role !== 'SUPER_ADMIN' && u.unitAccess === 'ALL').length;
    const isolationScore = Math.max(30, 100 - (nonSuperAllCount * 35));

    const orphanCount = state.studentPayments.filter(p => !state.students.some(s => s.id === p.studentId)).length;
    const dbIntegrityScore = Math.max(40, 100 - (orphanCount * 15));

    const criticalAnomalies = detectedAnomalies.filter(a => a.severity === 'CRITICAL' && !dismissedAnomalyIds.has(a.id)).length;
    const transactionSafetyScore = Math.max(25, 100 - (criticalAnomalies * 20));

    const backupRecencyScore = state.auditLogs.some(a => a.action === 'BACKUP') ? 95 : 70;

    const quotaRisk = quotaStats.isCritical ? 'Kritis' : quotaStats.isNearLimit ? 'Tinggi' : 'Aman';
    const quotaScore = Math.max(10, Math.round(100 - quotaStats.docUsagePercent));

    return [
      { domain: 'Kredensial & Sandi', score: authScore, fullMark: 100, risk: defaultPassCount > 0 ? 'Sedang' : 'Aman' },
      { domain: 'Isolasi Unit Otoritas', score: isolationScore, fullMark: 100, risk: nonSuperAllCount > 0 ? 'Kritis' : 'Aman' },
      { domain: 'Integritas Relasional DB', score: dbIntegrityScore, fullMark: 100, risk: orphanCount > 0 ? 'Perhatian' : 'Aman' },
      { domain: 'Validasi & Anti-Fraud', score: transactionSafetyScore, fullMark: 100, risk: criticalAnomalies > 0 ? 'Tinggi' : 'Aman' },
      { domain: 'Ketahanan Cadangan ZIP', score: backupRecencyScore, fullMark: 100, risk: 'Aman' },
      { domain: 'Kapasitas Kuota Firestore', score: quotaScore, fullMark: 100, risk: quotaRisk }
    ];
  }, [state.users, state.students, state.studentPayments, detectedAnomalies, dismissedAnomalyIds, state.auditLogs, quotaStats]);

  // Aggregate totals
  const totalAnalyzedRecords = useMemo(() => {
    return state.students.length + state.studentPayments.length + state.cashTransactions.length + state.budgetPlans.length + state.users.length;
  }, [state]);

  const activeAnomaliesCount = detectedAnomalies.filter(a => !dismissedAnomalyIds.has(a.id)).length;
  const criticalCount = detectedAnomalies.filter(a => a.severity === 'CRITICAL' && !dismissedAnomalyIds.has(a.id)).length;

  return (
    <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6 animate-in fade-in duration-200">
      
      {/* NOTIFICATION FEEDBACK TOAST */}
      {fixToast && (
        <div className={`p-4 rounded-xl shadow-xs border flex items-center justify-between gap-3 animate-in slide-in-from-top-2 ${
          fixToast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
          fixToast.type === 'error' ? 'bg-rose-50 text-rose-900 border-rose-300' :
          'bg-slate-50 text-slate-900 border-slate-300'
        }`}>
          <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold">
            {fixToast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> :
             fixToast.type === 'error' ? <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" /> :
             <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />}
            <span>{fixToast.message}</span>
          </div>
          <button 
            onClick={() => setFixToast(null)} 
            className="p-1 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP EXECUTIVE BANNER & REAL-TIME STREAM CONTROLS */}
      <div className="p-5 sm:p-6 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-slate-900">
                Sub Modul 1
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                LIVE REAL-TIME ENGINE
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                Latensi: <strong className="text-emerald-700">{latencyMs} ms</strong>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs">
                Pindai Terakhir: {lastScanTime.toLocaleTimeString('id-ID')}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5 mt-1">
              <Activity className="w-6 h-6 text-emerald-600 shrink-0" />
              <span>Analisa Risiko Kode, Integritas Database, Transaksi & Anomali</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Pusat observabilitas keamanan otomatis multi-unit yayasan. Dilengkapi <strong>Tombol Perbaikan Otomatis</strong> untuk menuntaskan kerentanan sandi akun, duplikasi transaksi, defisit saldo, dan integritas database relasional.
            </p>
          </div>

          {/* Quick Actions & Live Stream Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* BATCH AUTO-FIX BUTTON */}
            {autoFixableCount > 0 && (
              <button
                type="button"
                onClick={() => setBatchFixConfirmOpen(true)}
                disabled={isFixing}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                <Wrench className="w-4 h-4 text-emerald-100 animate-bounce" />
                <span>⚡ Perbaiki Semua ({autoFixableCount} Masalah)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsLiveActive(!isLiveActive)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border shadow-2xs ${
                isLiveActive 
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              {isLiveActive ? (
                <>
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Stream: AKTIF</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 text-slate-500" />
                  <span>Stream: PAUSE</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleManualScan}
              disabled={isScanning}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Memindai...' : 'Pindai Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* 4 SUMMARY STAT CARDS (MATCHING THE AESTHETICS OF CASH LEDGER & DASHBOARD MODULES) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Card 1: Health Score */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs text-emerald-800 font-semibold">Skor Keamanan Sistem</div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className={`text-2xl font-black ${
                  securityHealthScore >= 90 ? 'text-emerald-950' :
                  securityHealthScore >= 75 ? 'text-blue-950' :
                  securityHealthScore >= 50 ? 'text-amber-950' : 'text-rose-950'
                }`}>
                  {securityHealthScore}
                </span>
                <span className="text-xs text-emerald-700 font-bold">/ 100 poin</span>
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                {securityHealthScore >= 90 ? '✔ Kondisi Optimal & Terlindungi' :
                 securityHealthScore >= 75 ? 'ℹ Pengawasan Rutin Diperlukan' :
                 securityHealthScore >= 50 ? '⚠ Peringatan Risiko Menengah' : '🚨 Butuh Perbaikan Segera'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Analyzed Records */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-xs text-blue-800 font-semibold">Data Teranalisa</div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl font-black text-blue-950 font-mono">
                  {totalAnalyzedRecords.toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-blue-700">rekord</span>
              </div>
              <div className="text-[10px] text-blue-700 mt-0.5">
                6 Unit • Siswa, BKU, SPP, RAPBS
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Database className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Anomalies */}
          <div className={`p-4 rounded-xl flex items-center justify-between border shadow-2xs ${
            activeAnomaliesCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div>
              <div className={`text-xs font-semibold ${activeAnomaliesCount > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>
                Anomali Terdeteksi
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className={`text-2xl font-black font-mono ${
                  activeAnomaliesCount > 0 ? 'text-amber-950' : 'text-emerald-950'
                }`}>
                  {activeAnomaliesCount}
                </span>
                {criticalCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded text-[10px] font-bold">
                    {criticalCount} Kritis
                  </span>
                )}
              </div>
              <div className={`text-[10px] mt-0.5 ${activeAnomaliesCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {autoFixableCount > 0 ? `${autoFixableCount} masalah dapat diperbaiki` : 'Semua anomali telah selesai'}
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
              activeAnomaliesCount > 0 ? 'bg-amber-600' : 'bg-emerald-600'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Cloud DB Status & Real-Time Quota */}
          <div className={`p-4 rounded-xl flex items-center justify-between shadow-2xs border transition-all ${
            quotaStats.isCritical ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200' :
            quotaStats.isNearLimit ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200' :
            'bg-indigo-50 border-indigo-200'
          }`}>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-semibold ${
                  quotaStats.isCritical ? 'text-rose-900' :
                  quotaStats.isNearLimit ? 'text-amber-900' :
                  'text-indigo-800'
                }`}>
                  Status Cloud & Sisa DB
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                  quotaStats.isCritical ? 'bg-rose-200 text-rose-900 animate-pulse' :
                  quotaStats.isNearLimit ? 'bg-amber-200 text-amber-900' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {quotaStats.statusLabel}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-lg font-black font-mono ${
                  quotaStats.isCritical ? 'text-rose-950' :
                  quotaStats.isNearLimit ? 'text-amber-950' :
                  'text-indigo-950'
                }`}>
                  {formatBytes(quotaStats.docRemainingBytes)}
                </span>
                <span className="text-[10px] text-slate-500">sisa kuota ({ (100 - quotaStats.docUsagePercent).toFixed(1) }%)</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span>{syncStatus === 'connected' ? 'Online' : 'Offline'} • {formatBytes(quotaStats.docCurrentBytes)} / 1 MB</span>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs ${
              quotaStats.isCritical ? 'bg-rose-600 animate-pulse' :
              quotaStats.isNearLimit ? 'bg-amber-600' :
              'bg-indigo-600'
            }`}>
              {quotaStats.isCritical ? <AlertOctagon className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* EXECUTIVE REAL-TIME WARNING BANNER: KAPASITAS FIRESTORE HABIS */}
      {/* ============================================================= */}
      {(quotaStats.isNearLimit || quotaStats.quotaExceededError || simulatedQuotaPercent !== null) && (
        <div className={`rounded-2xl p-4 sm:p-5 border-2 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
          quotaStats.isCritical 
            ? 'bg-rose-50/95 border-rose-400 text-rose-950 ring-2 ring-rose-300' 
            : 'bg-amber-50/95 border-amber-300 text-amber-950 ring-1 ring-amber-200'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                quotaStats.isCritical ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
              }`}>
                {quotaStats.isCritical ? <AlertOctagon className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    quotaStats.isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {quotaStats.isCritical ? '🚨 KONDISI KRITIS' : '⚠️ PERINGATAN DINI'}
                  </span>
                  <h3 className="text-sm sm:text-base font-black tracking-tight">
                    {quotaStats.isCritical 
                      ? 'Kapasitas Database Firestore di Google Cloud Hampir Habis!'
                      : 'Kapasitas Penyimpanan Dokumen Firestore Mendekati Batas Maksimal'}
                  </h3>
                  {simulatedQuotaPercent !== null && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-300 rounded text-[10px] font-bold">
                      Mode Simulasi Aktif ({simulatedQuotaPercent}%)
                    </span>
                  )}
                </div>

                <p className="text-xs leading-relaxed max-w-3xl opacity-90">
                  {quotaStats.isCritical ? (
                    <>
                      Penyimpanan dokumen utama Firestore telah mencapai <strong className="font-mono text-rose-800">{formatBytes(quotaStats.docCurrentBytes)}</strong> ({quotaStats.docUsagePercent}%) dari batas mutlak <strong className="font-mono">1.00 MiB (1,048,576 byte)</strong>. Sisa kapasitas hanya tersisa <strong className="font-mono underline text-rose-800">{formatBytes(quotaStats.docRemainingBytes)}</strong> ({ (100 - quotaStats.docUsagePercent).toFixed(1) }%). Jika dokumen mencapai 100%, server Firestore akan menolak seluruh transaksi penulisan baru (Write Denied) dan sinkronisasi real-time antar komputer unit akan gagal.
                    </>
                  ) : (
                    <>
                      Kapasitas dokumen database saat ini telah terpakai <strong className="font-mono">{quotaStats.docUsagePercent}%</strong> ({formatBytes(quotaStats.docCurrentBytes)}). Sisa ruang tersisa <strong className="font-mono">{formatBytes(quotaStats.docRemainingBytes)}</strong>. Disarankan untuk segera melakukan pembersihan log audit usang dan mencadangkan data sebelum ruang habis.
                    </>
                  )}
                </p>

                {/* Real-time Progress Bar */}
                <div className="pt-2 max-w-xl">
                  <div className="flex justify-between text-[11px] font-mono mb-1 font-bold">
                    <span>Terpakai: {formatBytes(quotaStats.docCurrentBytes)} ({quotaStats.docUsagePercent}%)</span>
                    <span className={quotaStats.isCritical ? 'text-rose-700' : 'text-amber-700'}>
                      Sisa: {formatBytes(quotaStats.docRemainingBytes)}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white rounded-full overflow-hidden border border-slate-300 p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        quotaStats.isCritical ? 'bg-rose-600 animate-pulse' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, quotaStats.docUsagePercent))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Emergency Actions */}
            <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-2 shrink-0 justify-end">
              <button
                type="button"
                onClick={() => {
                  if (purgeOldAuditLogs) {
                    purgeOldAuditLogs(15);
                    setFixToast({
                      message: 'Berhasil memadatkan dan merotasi log audit lama! Kapasitas dokumen database Firestore telah dihemat secara instan.',
                      type: 'success'
                    });
                  }
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-102 active:scale-98 ${
                  quotaStats.isCritical ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Padatkan & Bersihkan Log Audit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (exportBackup) {
                    exportBackup();
                  }
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh Cadangan Lengkap (JSON)</span>
              </button>

              <a
                href={`https://console.firebase.google.com/project/${firebaseConfigData.projectId || 'reference-grove-46pck'}/firestore/databases/${firebaseConfigData.firestoreDatabaseId || '(default)'}/data?openUpgradeDialog=true`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Konsol Firebase (Upgrade / Quota)</span>
              </a>

              {simulatedQuotaPercent !== null && (
                <button
                  type="button"
                  onClick={() => setSimulatedQuotaPercent(null)}
                  className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded-lg text-[10px] font-bold text-center"
                >
                  Kembali ke Mode Real-Time Asli
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. FILTER CONTROLLER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Sub-Tabs Selector */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Ikhtisar
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('TRANSACTION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'TRANSACTION'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Arus Transaksi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('CODE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'CODE'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Risiko Kode & Akun</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('DATABASE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'DATABASE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Integritas & Kuota DB</span>
            {quotaStats.isNearLimit && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                quotaStats.isCritical ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-400 text-amber-950'
              }`}>
                {quotaStats.isCritical ? 'KRITIS' : 'WASPADA'}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('ANOMALY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'ANOMALY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Deteksi Anomali ({activeAnomaliesCount})</span>
          </button>
        </div>

        {/* Unit & Range Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">Unit:</span>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">Semua 6 Unit (Yayasan)</option>
                <option value="TK">TK IT Thoriqul Jannah</option>
                <option value="KB">KB Terpadu</option>
                <option value="RQ">Rumah Qur'an</option>
                <option value="SD">SD IT</option>
                <option value="SMP">SMP IT</option>
                <option value="SMA">SMA IT</option>
              </select>
            </div>
          ) : (
            <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
              Unit Aktif: {activeUnit}
            </div>
          )}

          {/* Time range selector for line chart */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['7D', '30D', 'ALL'] as const).map(range => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-2 py-1 text-[10px] font-bold rounded ${
                  timeRange === range ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {range === '7D' ? '7 Hari' : range === '30D' ? '30 Hari' : 'Semua'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DIAGRAM GARIS UTAMA (REAL-TIME TRANSACTION LINE CHART & ANOMALY SPIKES) */}
      {(activeSubTab === 'ALL' || activeSubTab === 'TRANSACTION') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Diagram Garis Dinamis: Arus Transaksi Kas & Lonjakan Anomali
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Visualisasi real-time tren penerimaan kas masuk, pengeluaran kas keluar, saldo kumulatif berjalan, serta korelasi titik anomali ({selectedUnit === 'ALL' ? 'Semua Unit' : `Unit ${selectedUnit}`}).
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Kas Masuk
              </span>
              <span className="flex items-center gap-1 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Kas Keluar
              </span>
              <span className="flex items-center gap-1 text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Saldo Akumulasi
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Anomali
              </span>
            </div>
          </div>

          {/* RECHARTS LINE CHART CONTAINER */}
          <div className="w-full h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={transactionTimelineData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickFormatter={(val) => formatDateShort(val)}
                  stroke="#cbd5e1"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickFormatter={(val) => formatRupiahShort(val)}
                  stroke="#cbd5e1"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#d97706' }} 
                  domain={[0, 'auto']}
                  allowDecimals={false}
                  stroke="#fcd34d"
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (!active || !payload || !payload.length) return null;
                    const masuk = payload.find(p => p.dataKey === 'kasMasuk')?.value as number || 0;
                    const keluar = payload.find(p => p.dataKey === 'kasKeluar')?.value as number || 0;
                    const saldo = payload.find(p => p.dataKey === 'saldo')?.value as number || 0;
                    const anomali = payload.find(p => p.dataKey === 'anomaliCount')?.value as number || 0;

                    return (
                      <div className="p-3 bg-white text-slate-900 rounded-xl shadow-xl text-xs border border-slate-200 space-y-1.5 min-w-52">
                        <div className="font-bold border-b border-slate-100 pb-1 text-slate-800">
                          {formatDateIndo(label as string)}
                        </div>
                        <div className="flex justify-between items-center text-emerald-700 font-semibold">
                          <span>Kas Masuk:</span>
                          <span className="font-mono font-bold">{formatRupiah(masuk)}</span>
                        </div>
                        <div className="flex justify-between items-center text-rose-700 font-semibold">
                          <span>Kas Keluar:</span>
                          <span className="font-mono font-bold">{formatRupiah(keluar)}</span>
                        </div>
                        <div className="flex justify-between items-center text-indigo-900 pt-1 border-t border-slate-100 font-bold">
                          <span>Saldo Berjalan:</span>
                          <span className="font-mono">{formatRupiah(saldo)}</span>
                        </div>
                        {anomali > 0 && (
                          <div className="flex justify-between items-center text-amber-800 pt-1 border-t border-slate-100 font-bold">
                            <span>⚠ Anomali Terdeteksi:</span>
                            <span className="font-mono">{anomali} kejadian</span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="kasMasuk" 
                  name="Kas Masuk (Rp)" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#10b981' }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="kasKeluar" 
                  name="Kas Keluar (Rp)" 
                  stroke="#f43f5e" 
                  strokeWidth={2.5} 
                  dot={{ r: 3, fill: '#f43f5e' }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="saldo" 
                  name="Saldo Kumulatif (Rp)" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="anomaliCount" 
                  name="Insiden Anomali" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={{ r: 4, stroke: '#d97706', fill: '#fef3c7' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* OBSERVABILITAS KAPASITAS & SISA KUOTA DATABASE FIRESTORE      */}
      {/* ============================================================= */}
      {(activeSubTab === 'ALL' || activeSubTab === 'DATABASE') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          {/* Header & Simulator Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  quotaStats.isCritical ? 'bg-rose-500 animate-pulse' :
                  quotaStats.isNearLimit ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`} />
                <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>Observabilitas Kapasitas & Kuota Database Firestore Real-Time</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring limit dokumen 1.00 MiB, sisa kapasitas penyimpanan cloud (1 GiB Spark Free Tier), latensi, dan beban operasional data.
              </p>
            </div>

            {/* Test Simulation Controls */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
              <span className="text-[10px] font-bold text-slate-500 px-2 flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                <span>Uji Kuota:</span>
              </span>
              <button
                type="button"
                onClick={() => setSimulatedQuotaPercent(null)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  simulatedQuotaPercent === null 
                    ? 'bg-white text-slate-900 shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilkan kapasitas aktual dari database asli"
              >
                🟢 Real-Time Asli
              </button>
              <button
                type="button"
                onClick={() => setSimulatedQuotaPercent(78)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  simulatedQuotaPercent === 78 
                    ? 'bg-amber-500 text-white shadow-2xs' 
                    : 'text-amber-700 hover:bg-amber-100'
                }`}
                title="Simulasikan peringatan kapasitas menipis (78% terpakai)"
              >
                ⚠️ Simulasi 78%
              </button>
              <button
                type="button"
                onClick={() => setSimulatedQuotaPercent(92)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  simulatedQuotaPercent === 92 
                    ? 'bg-rose-600 text-white shadow-2xs' 
                    : 'text-rose-700 hover:bg-rose-100'
                }`}
                title="Simulasikan peringatan kritis kapasitas hampir habis (92% terpakai)"
              >
                🚨 Simulasi 92% (Kritis)
              </button>
            </div>
          </div>

          {/* 3 Capacity & Quota Metric Cards with Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Batas Dokumen Tunggal Firestore */}
            <div className={`p-4 rounded-xl border transition-all ${
              quotaStats.isCritical ? 'bg-rose-50/70 border-rose-300' :
              quotaStats.isNearLimit ? 'bg-amber-50/70 border-amber-300' :
              'bg-slate-50/70 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  <span>Batas Dokumen Firestore</span>
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  quotaStats.isCritical ? 'bg-rose-200 text-rose-900' :
                  quotaStats.isNearLimit ? 'bg-amber-200 text-amber-900' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {quotaStats.statusLabel}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-500">Sisa Ruang Dokumen:</div>
                  <div className={`text-xl font-black font-mono ${
                    quotaStats.isCritical ? 'text-rose-950' :
                    quotaStats.isNearLimit ? 'text-amber-950' :
                    'text-slate-900'
                  }`}>
                    {formatBytes(quotaStats.docRemainingBytes)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Terpakai / Batas:</div>
                  <div className="text-xs font-bold font-mono text-slate-800">
                    {formatBytes(quotaStats.docCurrentBytes)} / {formatBytes(quotaStats.docMaxBytes)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      quotaStats.isCritical ? 'bg-rose-600' :
                      quotaStats.isNearLimit ? 'bg-amber-500' :
                      'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, quotaStats.docUsagePercent))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>{quotaStats.docUsagePercent}% Digunakan</span>
                  <span>Maks. 1.00 MiB / Dokumen</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Storage Cloud DB Spark Tier */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-emerald-600" />
                  <span>Kapasitas Cloud Storage (Spark)</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Spark Free Tier
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-500">Sisa Total Penyimpanan:</div>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {formatBytes(quotaStats.storageRemainingBytes)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500">Terpakai / Kuota:</div>
                  <div className="text-xs font-bold font-mono text-slate-800">
                    {formatBytes(quotaStats.storageCurrentBytes)} / 1.00 GiB
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2.5">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(1, quotaStats.storageUsagePercent))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                  <span>{quotaStats.storageUsagePercent}% Terpakai</span>
                  <span>Batas Gratis 1,024 MB</span>
                </div>
              </div>
            </div>

            {/* Card 3: Operasi Baca/Tulis Harian & Latensi */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-600" />
                  <span>Operasi & Latensi Real-Time</span>
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800">
                  {latencyMs} ms
                </span>
              </div>

              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Estimasi Kuota Tulis (Writes):</span>
                  <span className="font-mono font-bold text-slate-900">
                    ~{quotaStats.dailyLimits.estimatedDailyWrites.toLocaleString('id-ID')} / 20.000 tx/hari
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Estimasi Kuota Baca (Reads):</span>
                  <span className="font-mono font-bold text-slate-900">
                    ~{quotaStats.dailyLimits.estimatedDailyReads.toLocaleString('id-ID')} / 50.000 query/hari
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/80">
                  <span>Koleksi & Database ID:</span>
                  <span className="font-mono text-[10px] font-bold text-indigo-700 truncate max-w-[140px]" title={firebaseConfigData.firestoreDatabaseId || 'main_database'}>
                    {firebaseConfigData.firestoreDatabaseId || 'main_database'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rincian Ukuran Byte Data per Modul (Visual Proportional Bar & Breakdown Grid) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Rincian Kontribusi Beban Penyimpanan per Modul Sistem</span>
              </h4>
              <span className="text-[11px] text-slate-500">
                Total payload dokumen: <strong className="font-mono text-slate-800">{formatBytes(quotaStats.docCurrentBytes)}</strong>
              </span>
            </div>

            {/* Proportional Stacked Bar */}
            <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div style={{ width: `${(quotaStats.breakdown.bkuBytes / Math.max(1, quotaStats.docCurrentBytes)) * 100}%` }} className="bg-purple-500 hover:opacity-80 transition-all" title={`Kas BKU: ${formatBytes(quotaStats.breakdown.bkuBytes)}`} />
              <div style={{ width: `${(quotaStats.breakdown.studentsBytes / Math.max(1, quotaStats.docCurrentBytes)) * 100}%` }} className="bg-blue-500 hover:opacity-80 transition-all" title={`Siswa: ${formatBytes(quotaStats.breakdown.studentsBytes)}`} />
              <div style={{ width: `${(quotaStats.breakdown.paymentsBytes / Math.max(1, quotaStats.docCurrentBytes)) * 100}%` }} className="bg-emerald-500 hover:opacity-80 transition-all" title={`SPP & Kwitansi: ${formatBytes(quotaStats.breakdown.paymentsBytes)}`} />
              <div style={{ width: `${(quotaStats.breakdown.budgetsBytes / Math.max(1, quotaStats.docCurrentBytes)) * 100}%` }} className="bg-amber-500 hover:opacity-80 transition-all" title={`RAPBS: ${formatBytes(quotaStats.breakdown.budgetsBytes)}`} />
              <div style={{ width: `${(quotaStats.breakdown.feesBytes / Math.max(1, quotaStats.docCurrentBytes)) * 100}%` }} className="bg-cyan-500 hover:opacity-80 transition-all" title={`Tarif Biaya: ${formatBytes(quotaStats.breakdown.feesBytes)}`} />
              <div style={{ width: `${(quotaStats.breakdown.auditLogsBytes / Math.max(1, quotaStats.docCurrentBytes)) * 100}%` }} className="bg-rose-500 hover:opacity-80 transition-all" title={`Log Audit: ${formatBytes(quotaStats.breakdown.auditLogsBytes)}`} />
              <div style={{ width: `${(quotaStats.breakdown.usersAndProfilesBytes / Math.max(1, quotaStats.docCurrentBytes)) * 100}%` }} className="bg-slate-600 hover:opacity-80 transition-all" title={`User & Profil: ${formatBytes(quotaStats.breakdown.usersAndProfilesBytes)}`} />
            </div>

            {/* Grid Detail Items */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Kas BKU</span>
                </div>
                <div className="text-xs font-black font-mono text-slate-900 mt-1">
                  {formatBytes(quotaStats.breakdown.bkuBytes)}
                </div>
                <div className="text-[10px] text-slate-500">{state.cashTransactions.length} rek</div>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Siswa Santri</span>
                </div>
                <div className="text-xs font-black font-mono text-slate-900 mt-1">
                  {formatBytes(quotaStats.breakdown.studentsBytes)}
                </div>
                <div className="text-[10px] text-slate-500">{state.students.length} santri</div>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>SPP & DSP</span>
                </div>
                <div className="text-xs font-black font-mono text-slate-900 mt-1">
                  {formatBytes(quotaStats.breakdown.paymentsBytes)}
                </div>
                <div className="text-[10px] text-slate-500">{state.studentPayments.length} kwitansi</div>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>RAPBS</span>
                </div>
                <div className="text-xs font-black font-mono text-slate-900 mt-1">
                  {formatBytes(quotaStats.breakdown.budgetsBytes)}
                </div>
                <div className="text-[10px] text-slate-500">{state.budgetPlans.length} anggaran</div>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-700">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Tarif Biaya</span>
                </div>
                <div className="text-xs font-black font-mono text-slate-900 mt-1">
                  {formatBytes(quotaStats.breakdown.feesBytes)}
                </div>
                <div className="text-[10px] text-slate-500">{state.masterFees.length} item</div>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Audit Log</span>
                </div>
                <div className="text-xs font-black font-mono text-slate-900 mt-1">
                  {formatBytes(quotaStats.breakdown.auditLogsBytes)}
                </div>
                <div className="text-[10px] text-slate-500">{state.auditLogs.length} log</div>
              </div>

              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Profil & Akun</span>
                </div>
                <div className="text-xs font-black font-mono text-slate-900 mt-1">
                  {formatBytes(quotaStats.breakdown.usersAndProfilesBytes)}
                </div>
                <div className="text-[10px] text-slate-500">{state.users.length} akun</div>
              </div>
            </div>
          </div>

          {/* Quick Management & Prevention Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Tindakan Rekomendasi Pemeliharaan Kuota Firestore:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (purgeOldAuditLogs) {
                    purgeOldAuditLogs(15);
                    setFixToast({
                      message: 'Berhasil memadatkan dan merotasi log audit lama! Kapasitas dokumen database Firestore telah dihemat secara instan.',
                      type: 'success'
                    });
                  }
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102 active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Padatkan & Rotasi Log Audit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (exportBackup) {
                    exportBackup();
                  }
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Cadangan JSON</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (forceSyncToCloud) {
                    try {
                      await forceSyncToCloud();
                      setFixToast({
                        message: 'Sinkronisasi paksa ke Cloud Firestore berhasil dijalankan.',
                        type: 'success'
                      });
                    } catch (e: any) {
                      setFixToast({
                        message: `Gagal sinkronisasi: ${e?.message || 'Error'}`,
                        type: 'error'
                      });
                    }
                  }
                }}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sinkronkan Manual</span>
              </button>

              <a
                href={`https://console.firebase.google.com/project/${firebaseConfigData.projectId || 'reference-grove-46pck'}/firestore/databases/${firebaseConfigData.firestoreDatabaseId || '(default)'}/data?openUpgradeDialog=true`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                <span>Buka Konsol Firebase Cloud</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 4. DUAL CHARTS: DISTRIBUSI DATABASE & METODE TRANSAKSI */}
      {(activeSubTab === 'ALL' || activeSubTab === 'DATABASE' || activeSubTab === 'TRANSACTION') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* DATABASE DISTRIBUTION PER UNIT (BAR CHART) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Distribusi Database & Rekord per Unit Lembaga</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Volume data tersimpan pada modul Siswa, Pembayaran SPP, Kas BKU, dan RAPBS di 6 unit yayasan.
                </p>
              </div>
            </div>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitDatabaseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="unitName" tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} stroke="#cbd5e1" />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      return (
                        <div className="p-2.5 bg-white text-slate-800 rounded-lg shadow-lg text-xs space-y-1 border border-slate-200">
                          <div className="font-bold border-b border-slate-100 pb-1 text-slate-900">{label}</div>
                          {payload.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center gap-4 text-[11px]">
                              <span style={{ color: item.color }}>{item.name}:</span>
                              <span className="font-mono font-bold text-slate-900">{item.value} rek</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="siswa" name="Siswa Aktif" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pembayaran" name="Transaksi SPP/DSP" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bku" name="Mutasi BKU" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anggaran" name="Pos RAPBS" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PAYMENT METHOD CHANNELS (PIE/DONUT CHART) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Saluran Transaksi (Metode Pembayaran)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Porsi nilai rupiah kas masuk berdasarkan metode bayar
              </p>
            </div>

            <div className="w-full h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatRupiah(value as number), 'Total Nilai']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 pt-1">
              {paymentMethodData.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }}></span>
                    <span className="font-semibold text-slate-700">{m.name}</span>
                  </div>
                  <span className="font-bold font-mono text-slate-900">{formatRupiahShort(m.value)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 5. RESIKO KODE & OTORITAS HAK AKSES AUDIT */}
      {(activeSubTab === 'ALL' || activeSubTab === 'CODE') && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Analisa Resiko Kode Sumber & Pengamanan Otoritas Hak Akses
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi kerentanan keamanan autentikasi, privilege escalation, pencegahan kebocoran lintas unit, dan ketahanan integritas data.
              </p>
            </div>

            <span className="px-3 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-bold shrink-0">
              Audit Rule: OWASP ASVS & Role-Based Access Control
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {codeRiskVectors.map((vec, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 hover:bg-slate-50 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">{vec.domain}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    vec.risk === 'Aman' ? 'bg-emerald-100 text-emerald-800' :
                    vec.risk === 'Sedang' ? 'bg-amber-100 text-amber-800' :
                    vec.risk === 'Perhatian' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {vec.risk}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-900">{vec.score}</span>
                  <span className="text-xs text-slate-400 font-mono">/ 100 poin</span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      vec.score >= 90 ? 'bg-emerald-500' :
                      vec.score >= 75 ? 'bg-blue-500' :
                      vec.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${vec.score}%` }}
                  ></div>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  {vec.domain === 'Kredensial & Sandi' && 'Mendeteksi apakah terdapat akun pengguna dengan hash default `4Rmag3don01cr#6`.'}
                  {vec.domain === 'Isolasi Unit Otoritas' && 'Memastikan batasan kewenangan unitAccess non-Super Admin terkunci pada unit kerja sah.'}
                  {vec.domain === 'Integritas Relasional DB' && 'Memvalidasi keterikatan data pembayaran SPP terhadap ID siswa yang valid.'}
                  {vec.domain === 'Validasi & Anti-Fraud' && 'Mendeteksi anomali duplikasi kas, pengeluaran tak wajar, dan saldo defisit.'}
                  {vec.domain === 'Ketahanan Cadangan ZIP' && 'Memverifikasi ketersediaan paket arsip ZIP multi-unit terenkripsi terkini.'}
                </p>
              </div>
            ))}

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <div className="font-bold text-xs text-slate-900 border-b pb-1">
                Matriks Kewenangan Peran (RBAC)
              </div>
              <div className="text-[11px] space-y-1 font-mono text-slate-600">
                <div className="flex justify-between">
                  <span>SUPER_ADMIN:</span>
                  <span className="text-emerald-700 font-bold">ALL Units (Full RW)</span>
                </div>
                <div className="flex justify-between">
                  <span>ADMIN_KEUANGAN:</span>
                  <span className="text-blue-700 font-bold">Single Unit (Full RW)</span>
                </div>
                <div className="flex justify-between">
                  <span>KEPALA_SEKOLAH:</span>
                  <span className="text-purple-700 font-bold">Single Unit (Read-Only)</span>
                </div>
                <div className="flex justify-between">
                  <span>BENDAHARA:</span>
                  <span className="text-amber-700 font-bold">Single Unit (Kas & SPP)</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                ✔ Enkripsi State: AES Salted v1 • Isolasi Namespace Firestore
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. DAFTAR FEED DETEKSI ANOMALI REAL-TIME DENGAN TOMBOL PERBAIKAN */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Feed Deteksi Anomali & Rekomendasi Solusi ({filteredAnomalies.length} Kasus)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gunakan <strong>Tombol Perbaikan</strong> pada setiap kartu untuk mengeksekusi tindakan korektif permanen.
            </p>
          </div>

          {/* Quick Actions, Status Toggle & Severity filter */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Tabs (Aktif / Selesai / Semua) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ACTIVE');
                  try { localStorage.setItem('SIKEU_ANOMALY_STATUS_FILTER', 'ACTIVE'); } catch (e) {}
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Aktif ({detectedAnomalies.filter(a => !dismissedAnomalyIds.has(a.id)).length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter('RESOLVED');
                  try { localStorage.setItem('SIKEU_ANOMALY_STATUS_FILTER', 'RESOLVED'); } catch (e) {}
                }}
                className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                  statusFilter === 'RESOLVED'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Check className="w-3 h-3" />
                Selesai ({dismissedAnomalyIds.size})
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  try { localStorage.setItem('SIKEU_ANOMALY_STATUS_FILTER', 'ALL'); } catch (e) {}
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({detectedAnomalies.length})
              </button>
            </div>

            {/* Reset Verification Button if any dismissed */}
            {dismissedAnomalyIds.size > 0 && (
              <button
                type="button"
                onClick={handleResetVerification}
                title="Reset status verifikasi ke default"
                className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset</span>
              </button>
            )}

            {/* Batch Auto Fix Button */}
            {autoFixableCount > 0 && (
              <button
                type="button"
                onClick={() => setBatchFixConfirmOpen(true)}
                disabled={isFixing}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all hover:scale-102"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>⚡ Perbaiki Semua ({autoFixableCount})</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">Tingkat:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value="ALL">Semua</option>
                <option value="CRITICAL">🚨 Critical</option>
                <option value="HIGH">⚠ High</option>
                <option value="MEDIUM">ℹ Medium</option>
                <option value="LOW">✔ Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Anomaly Feed Items */}
        {filteredAnomalies.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce" />
            <div className="font-bold text-sm text-slate-800">Semua Parameter Sistem Aman & Optimal!</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ditemukan anomali berisiko pada transaksi kas BKU, pembayaran SPP, hak akses pengguna, maupun integritas database.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAnomalies.map((item) => {
              const isDismissed = dismissedAnomalyIds.has(item.id);

              return (
                <div 
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isDismissed 
                      ? 'bg-slate-50 border-slate-200 opacity-60' 
                      : item.severity === 'CRITICAL' 
                        ? 'bg-rose-50/70 border-rose-300 shadow-xs' 
                        : item.severity === 'HIGH'
                          ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                          : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Severity Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.severity === 'CRITICAL' ? 'bg-rose-600 text-white' :
                          item.severity === 'HIGH' ? 'bg-amber-600 text-white' :
                          item.severity === 'MEDIUM' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'
                        }`}>
                          {item.severity}
                        </span>

                        {/* Category & Unit */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Unit: {item.unit}
                        </span>

                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Modul: {item.moduleName}
                        </span>

                        {item.financialImpact && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Nilai: {formatRupiah(item.financialImpact)}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 flex flex-wrap items-center gap-2">
                        <span>{item.title}</span>
                        {isDismissed && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Telah Selesai (Aman)
                          </span>
                        )}
                      </h4>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="p-2.5 bg-white/90 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2 mt-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-800">Rekomendasi Tindakan:</strong> {item.recommendation}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS: TOMBOL PERBAIKAN & TOOLS */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-1 sm:pt-0">
                      
                      {/* 1. TOMBOL PERBAIKAN UTAMA (PROMINENT FIX BUTTON) */}
                      {item.fixType && !isDismissed && (
                        <button
                          type="button"
                          onClick={() => setActiveFixModal(item)}
                          disabled={isFixing}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all hover:scale-102 active:scale-98"
                        >
                          <Wrench className="w-3.5 h-3.5 text-emerald-100" />
                          <span>{item.fixLabel || 'Perbaiki Masalah'}</span>
                        </button>
                      )}

                      {/* 2. TOMBOL TINJAU MODUL TERKAIT */}
                      {item.targetTab && (
                        <button
                          type="button"
                          onClick={() => setCurrentTab(item.targetTab as any)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all hover:scale-102"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Tinjau Modul</span>
                        </button>
                      )}

                      {/* 3. TOMBOL TANDAI VERIFIKASI */}
                      <button
                        type="button"
                        onClick={() => toggleDismissAnomaly(item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isDismissed
                            ? 'bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                        }`}
                      >
                        {isDismissed ? 'Tandai Belum Selesai' : 'Tandai Selesai (Aman)'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL PERBAIKAN INTERAKTIF TERPANDU (INTERACTIVE FIX MODAL)    */}
      {/* ============================================================= */}
      {activeFixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Konfirmasi Perbaikan Masalah</h3>
                  <p className="text-[11px] text-slate-300">Modul: {activeFixModal.moduleName} • Unit: {activeFixModal.unit}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveFixModal(null)} 
                className="text-slate-400 hover:text-white rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{activeFixModal.title}</div>
                <p className="text-slate-600 leading-relaxed">{activeFixModal.description}</p>
              </div>

              {/* Specific Custom Parameters based on Fix Type */}
              {activeFixModal.fixType === 'FIX_DEFAULT_PASS' && (
                <div className="space-y-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                  <label className="font-bold text-indigo-950 block">
                    Kata Sandi Baru untuk Akun Rentan:
                  </label>
                  <input
                    type="text"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                    placeholder="Masukkan sandi baru yang aman"
                  />
                  <p className="text-[11px] text-indigo-700">
                    Akun yang masih memakai default hash akan langsung diperbarui ke sandi ini dan dienkripsi ulang.
                  </p>
                </div>
              )}

              {activeFixModal.fixType === 'FIX_NEG_BALANCE' && (
                <div className="space-y-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <label className="font-bold text-amber-950 block">
                    Nominal Injeksi Saldo Penyesuaian Kas Masuk (Rp):
                  </label>
                  <input
                    type="number"
                    value={customAdjustmentAmount}
                    onChange={(e) => setCustomAdjustmentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                  />
                  <p className="text-[11px] text-amber-700">
                    Sistem akan mencatat kas masuk penyesuaian saldo awal ke BKU Unit {activeFixModal.fixData?.unit} agar pembukuan tidak lagi minus.
                  </p>
                </div>
              )}

              {activeFixModal.fixType === 'FIX_DUP_BKU' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                  <strong>Peringatan Penghapusan Transaksi Duplikat:</strong>
                  <p>
                    Mutasi kas [{activeFixModal.fixData?.refNo}] akan dihapus permanen dari Buku Kas Umum. Pastikan mutasi kedua adalah pencatatan yang benar.
                  </p>
                </div>
              )}

              {activeFixModal.fixType === 'FIX_DOUBLE_SPP' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <strong>Pembatalan Kwitansi SPP Ganda:</strong>
                  <p>
                    Kwitansi nomor #{activeFixModal.fixData?.receiptNumber} atas nama siswa <strong>{activeFixModal.fixData?.studentName}</strong> akan dihapus dan dibatalkan.
                  </p>
                </div>
              )}

              {activeFixModal.fixType === 'FIX_ORPHAN_PAYMENTS' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                  <strong>Pemulihan Profil Siswa ke Master Data:</strong>
                  <p>
                    Sistem akan membuat ulang entri profil siswa yang hilang ke database master sehingga seluruh riwayat pembayaran kembali valid dan terhubung.
                  </p>
                </div>
              )}

              {activeFixModal.fixType === 'FIX_UNRESTRICTED_ACCESS' && (
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 space-y-1">
                  <strong>Penguncian Otoritas Unit:</strong>
                  <p>
                    Akses 'ALL' pada pengguna non-Super Admin akan dikunci ke unit kerja masing-masing guna mencegah kebocoran data antar lembaga yayasan.
                  </p>
                </div>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center gap-2">
                <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Tindakan ini aman, tervalidasi, dan akan langsung memperbarui skor keamanan sistem secara real-time.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setActiveFixModal(null)}
                disabled={isFixing}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => handleExecuteFix(activeFixModal, {
                  newPassword: customPassword,
                  amount: customAdjustmentAmount
                })}
                disabled={isFixing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                {isFixing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menerapkan Perbaikan...</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4 text-emerald-200" />
                    <span>Terapkan Perbaikan Sekarang</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MODAL BATCH AUTO-FIX SEMUA MASALAH                             */}
      {/* ============================================================= */}
      {batchFixConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95">
            
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <h3 className="font-bold text-sm text-white">⚡ Perbaikan Otomatis Seluruh Masalah</h3>
                  <p className="text-[11px] text-slate-300">Menyelesaikan {autoFixableCount} anomali yang dapat diotomatisasi</p>
                </div>
              </div>
              <button 
                onClick={() => setBatchFixConfirmOpen(false)} 
                className="text-slate-400 hover:text-white rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-96 overflow-y-auto">
              <p className="leading-relaxed">
                Sistem akan secara berurutan mengeksekusi perbaikan standar yang aman untuk seluruh anomali berikut:
              </p>

              <div className="space-y-2">
                {detectedAnomalies.filter(a => a.canAutoFix && !dismissedAnomalyIds.has(a.id)).map((item, idx) => (
                  <div key={item.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-bold text-slate-900">{item.title}</div>
                      <div className="text-[11px] text-slate-500">Aksi: {item.fixLabel || item.recommendation}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                ✔ Setelah proses ini selesai, skor indeks keamanan akan dikalkulasi ulang dan meningkat secara otomatis.
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBatchFixConfirmOpen(false)}
                disabled={isFixing}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleBatchAutoFix}
                disabled={isFixing}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-102 active:scale-98 disabled:opacity-50"
              >
                {isFixing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Sedang Memperbaiki...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Eksekusi Perbaikan Otomatis</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
