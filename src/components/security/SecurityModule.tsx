import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserAccount, UserRole, SchoolUnitType, AppState } from '../../types';
import { INITIAL_PROFILES } from '../../data/initialData';
import { 
  ShieldCheck, KeyRound, Download, Upload, RefreshCw, 
  UserPlus, Edit3, Trash2, Check, X, AlertTriangle, Lock, FileKey,
  Database, Cloud, DownloadCloud, Activity, CheckCircle2, ArrowRight, UserCheck,
  Archive, FolderArchive, Layers, Info, HardDriveDownload, FolderCheck, Sparkles, Search
} from 'lucide-react';
import { 
  downloadEncryptedBackup, 
  downloadAllUnitsZipBackup, 
  readZipBackupFile, 
  ReadZipResult 
} from '../../utils/crypto';
import { calculateUnitDatabaseStats, testCloudConnection } from '../../services/firebaseSync';

export const SecurityModule: React.FC = () => {
  const { 
    state, 
    currentUser, 
    setCurrentTab,
    addUserAccount, 
    updateUserAccount, 
    deleteUserAccount, 
    exportBackup,
    exportAllUnitsZip,
    exportUnitZip,
    restoreBackup, 
    restoreStateDirectly,
    resetDefaultData,
    activeUnit,
    setActiveUnit,
    syncStatus,
    lastSyncMeta,
    lastSyncedAt,
    forceSyncToCloud,
    forceFetchFromCloud
  } = useApp();

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'USERS' | 'SYNC' | 'BACKUP' | 'AUDIT'>('BACKUP');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const [latencyResult, setLatencyResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Unit filter states for Super Admin (for non-super admin, locked to activeUnit)
  const [userUnitFilter, setUserUnitFilter] = useState<'ALL' | SchoolUnitType>(isSuperAdmin ? 'ALL' : activeUnit);
  const [auditUnitFilter, setAuditUnitFilter] = useState<'ALL' | SchoolUnitType>(isSuperAdmin ? 'ALL' : activeUnit);
  const [auditSearchQuery, setAuditSearchQuery] = useState('');

  // ZIP Backup States
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipFeedback, setZipFeedback] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [pendingZipRestore, setPendingZipRestore] = useState<ReadZipResult | null>(null);
  const [restoreMode, setRestoreMode] = useState<'ALL' | 'CUSTOM'>(isSuperAdmin ? 'ALL' : 'CUSTOM');
  const [selectedUnitsToRestore, setSelectedUnitsToRestore] = useState<Record<SchoolUnitType, boolean>>({
    TK: isSuperAdmin || activeUnit === 'TK',
    KB: isSuperAdmin || activeUnit === 'KB',
    RQ: isSuperAdmin || activeUnit === 'RQ',
    SD: isSuperAdmin || activeUnit === 'SD',
    SMP: isSuperAdmin || activeUnit === 'SMP',
    SMA: isSuperAdmin || activeUnit === 'SMA'
  });

  const unitStats = calculateUnitDatabaseStats(state);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await forceSyncToCloud();
      setSyncFeedback(isSuperAdmin 
        ? 'Database seluruh 6 unit berhasil disinkronkan ke Cloud Firestore.' 
        : `Database Unit ${activeUnit} berhasil disinkronkan ke Cloud Firestore.`
      );
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (e: any) {
      alert(`Gagal sinkronisasi: ${e?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualFetch = async () => {
    if (!confirm('Apakah Anda ingin memuat data terbaru dari Cloud Firestore?')) return;
    setIsSyncing(true);
    try {
      await forceFetchFromCloud();
      setSyncFeedback('Data terbaru dari Cloud Firestore berhasil dimuat ke aplikasi.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (e: any) {
      alert(`Gagal memuat dari Cloud: ${e?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestLatency = async () => {
    setIsTestingLatency(true);
    const res = await testCloudConnection();
    setLatencyResult(res);
    setIsTestingLatency(false);
  };

  const handleExportAllZip = async () => {
    setIsExportingZip(true);
    try {
      const filename = await exportAllUnitsZip();
      setZipFeedback(`Paket arsip ZIP untuk semua unit (${filename}) berhasil dibuat dan diunduh!`);
      setTimeout(() => setZipFeedback(null), 6000);
    } catch (e: any) {
      alert(`Gagal membuat paket ZIP: ${e?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportCurrentUnitZip = async (targetUnit: SchoolUnitType = activeUnit) => {
    setIsExportingZip(true);
    try {
      const filename = await exportUnitZip(targetUnit);
      setZipFeedback(`Paket arsip ZIP khusus Unit ${targetUnit} (${filename}) berhasil dibuat dan diunduh!`);
      setTimeout(() => setZipFeedback(null), 6000);
    } catch (e: any) {
      alert(`Gagal membuat paket ZIP Unit ${targetUnit}: ${e?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportUnitJson = (unitKey: SchoolUnitType) => {
    if (!isSuperAdmin && unitKey !== activeUnit) {
      alert(`Otoritas Terbatas: Anda hanya diizinkan mengunduh salinan data Unit aktif (${activeUnit}).`);
      return;
    }

    const unitStudents = state.students.filter(s => s.unit === unitKey);
    const unitPayments = state.studentPayments.filter(p => p.unit === unitKey);
    const unitBku = state.cashTransactions.filter(t => t.unit === unitKey);
    const unitBudgets = state.budgetPlans.filter(b => b.unit === unitKey);
    const unitFees = state.masterFees.filter(f => f.unit === unitKey);
    const unitProfile = state.profiles?.[unitKey] || INITIAL_PROFILES[unitKey];

    const exportData = {
      unit: unitKey,
      exportedAt: new Date().toISOString(),
      profile: unitProfile,
      students: unitStudents,
      payments: unitPayments,
      cashTransactions: unitBku,
      budgetPlans: unitBudgets,
      masterFees: unitFees
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SIKEU_Database_Unit_${unitKey}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };
  
  // User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    role: 'ADMIN_KEUANGAN' as UserRole,
    unitAccess: 'ALL' as SchoolUnitType | 'ALL',
    assignedClass: '',
    passwordHash: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // User form handlers
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      fullName: '',
      role: 'ADMIN_KEUANGAN',
      unitAccess: isSuperAdmin ? 'TK' : activeUnit,
      assignedClass: '',
      passwordHash: '4Rmag3don01cr#6'
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserAccount) => {
    if (!isSuperAdmin && u.unitAccess !== activeUnit && u.id !== currentUser.id) {
      alert(`Anda hanya diizinkan untuk mengelola akun pada unit aktif Anda (${activeUnit}) atau profil Anda sendiri.`);
      return;
    }
    setEditingUser(u);
    setUserForm({
      username: u.username,
      fullName: u.fullName,
      role: u.role,
      unitAccess: u.role === 'SUPER_ADMIN' ? 'ALL' : (u.unitAccess === 'ALL' ? 'TK' : u.unitAccess),
      assignedClass: u.assignedClass || '',
      passwordHash: u.passwordHash || '4Rmag3don01cr#6'
    });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username.trim() || !userForm.fullName.trim()) {
      alert('Mohon lengkapi username dan nama lengkap pengguna.');
      return;
    }

    let finalUnitAccess: SchoolUnitType | 'ALL' = userForm.unitAccess;
    if (userForm.role === 'SUPER_ADMIN') {
      if (!isSuperAdmin) {
        alert('Hanya Super Admin Yayasan yang berwenang membuat atau menetapkan role Super Admin.');
        return;
      }
      finalUnitAccess = 'ALL';
    } else {
      if (!isSuperAdmin) {
        finalUnitAccess = activeUnit;
      } else if (finalUnitAccess === 'ALL') {
        finalUnitAccess = 'TK';
      }
    }

    if (editingUser) {
      updateUserAccount({
        ...editingUser,
        username: userForm.username,
        fullName: userForm.fullName,
        role: userForm.role,
        unitAccess: finalUnitAccess,
        passwordHash: userForm.passwordHash.trim() || editingUser.passwordHash || '4Rmag3don01cr#6',
        assignedClass: userForm.assignedClass || undefined
      });
      alert('Data pengguna dan hak otoritas berhasil diperbarui!');
    } else {
      if (state.users.some(u => u.username.toLowerCase() === userForm.username.toLowerCase())) {
        alert('Username sudah digunakan. Silakan gunakan username lain.');
        return;
      }
      addUserAccount({
        username: userForm.username,
        fullName: userForm.fullName,
        role: userForm.role,
        unitAccess: finalUnitAccess,
        passwordHash: userForm.passwordHash.trim() || '4Rmag3don01cr#6',
        assignedClass: userForm.assignedClass || undefined
      });
      alert('Pengguna baru berhasil ditambahkan!');
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (u: UserAccount) => {
    if (!isSuperAdmin && u.unitAccess !== activeUnit) {
      alert(`Anda hanya berwenang menghapus akun pengguna pada unit Anda (${activeUnit}).`);
      return;
    }
    if (u.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.');
      return;
    }
    if (u.role === 'SUPER_ADMIN' && !isSuperAdmin) {
      alert('Hanya Super Admin Yayasan yang memiliki hak untuk menghapus akun Super Admin.');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun "${u.fullName}" (${u.username})?`)) {
      deleteUserAccount(u.id);
    }
  };

  // Unified File Restore Handler (supports .zip, .sikeu, .json)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreStatus(null);
    setIsReadingFile(true);

    try {
      const fileNameLower = file.name.toLowerCase();

      if (fileNameLower.endsWith('.zip')) {
        // Handle ZIP Archive
        const zipResult = await readZipBackupFile(file);
        setIsReadingFile(false);

        if (!zipResult.success || !zipResult.state) {
          setRestoreStatus(`Gagal membaca file ZIP: ${zipResult.error || 'Struktur arsip tidak dikenali.'}`);
          return;
        }

        // Initialize checkboxes for found units
        const initialUnitMap: Record<SchoolUnitType, boolean> = {
          TK: true,
          KB: true,
          RQ: true,
          SD: true,
          SMP: true,
          SMA: true
        };
        zipResult.unitsFound.forEach(u => {
          initialUnitMap[u] = true;
        });
        setSelectedUnitsToRestore(initialUnitMap);
        setPendingZipRestore(zipResult);

      } else if (fileNameLower.endsWith('.sikeu')) {
        // Handle standalone encrypted .sikeu
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            const success = restoreBackup(text);
            setIsReadingFile(false);
            if (!success) {
              setRestoreStatus('Format file backup .sikeu tidak valid atau rusak!');
              return;
            }
            setRestoreStatus('Data cadangan terenkripsi (.sikeu) berhasil dipulihkan secara sempurna!');
            alert('🎉 Selamat! Data keuangan berhasil dipulihkan dari file backup .sikeu.');
          } catch (err) {
            setIsReadingFile(false);
            setRestoreStatus('Gagal membaca berkas cadangan .sikeu!');
          }
        };
        reader.readAsText(file);

      } else if (fileNameLower.endsWith('.json')) {
        // Handle standalone JSON
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const text = event.target?.result as string;
            const parsed = JSON.parse(text);
            
            // Check if it's full state or single unit
            if (parsed.students && parsed.cashTransactions && parsed.profiles) {
              restoreStateDirectly(parsed, `Pemulihan dari file JSON lengkap: ${file.name}`);
              setIsReadingFile(false);
              setRestoreStatus('Data cadangan dari file JSON berhasil dipulihkan!');
              alert('🎉 Selamat! Seluruh data keuangan berhasil dipulihkan dari file JSON.');
            } else if (parsed.unit && parsed.students) {
              // Single unit JSON
              const targetUnit: SchoolUnitType = parsed.unit;
              const mergedState: AppState = {
                ...state,
                students: [
                  ...state.students.filter(s => s.unit !== targetUnit),
                  ...(parsed.students || [])
                ],
                studentPayments: [
                  ...state.studentPayments.filter(p => p.unit !== targetUnit),
                  ...(parsed.payments || [])
                ],
                cashTransactions: [
                  ...state.cashTransactions.filter(t => t.unit !== targetUnit),
                  ...(parsed.cashTransactions || [])
                ],
                budgetPlans: [
                  ...state.budgetPlans.filter(b => b.unit !== targetUnit),
                  ...(parsed.budgetPlans || [])
                ],
                masterFees: [
                  ...state.masterFees.filter(f => f.unit !== targetUnit),
                  ...(parsed.masterFees || [])
                ],
                profiles: {
                  ...state.profiles,
                  [targetUnit]: parsed.profile || state.profiles[targetUnit]
                }
              };
              restoreStateDirectly(mergedState, `Pemulihan unit ${targetUnit} dari file JSON: ${file.name}`);
              setIsReadingFile(false);
              setRestoreStatus(`Data khusus Unit ${targetUnit} berhasil dipulihkan dan digabungkan!`);
              alert(`🎉 Sukses! Data keuangan Unit ${targetUnit} berhasil dipulihkan.`);
            } else {
              setIsReadingFile(false);
              setRestoreStatus('Format struktur JSON tidak sesuai dengan skema SIKEU.');
            }
          } catch (err) {
            setIsReadingFile(false);
            setRestoreStatus('Gagal membaca isi berkas JSON!');
          }
        };
        reader.readAsText(file);
      } else {
        setIsReadingFile(false);
        setRestoreStatus('Format berkas tidak didukung. Harap pilih berkas .zip, .sikeu, atau .json.');
      }
    } catch (err: any) {
      setIsReadingFile(false);
      setRestoreStatus(`Terjadi kesalahan: ${err?.message || 'Gagal memproses berkas'}`);
    }
  };

  const handleConfirmZipRestore = () => {
    if (!pendingZipRestore || !pendingZipRestore.state) return;

    const sourceState = pendingZipRestore.state;

    if (restoreMode === 'ALL') {
      // Restore all data as is
      restoreStateDirectly(sourceState, `Pemulihan arsip ZIP seluruh unit: ${pendingZipRestore.filename}`);
      setRestoreStatus(`Seluruh database 6 unit berhasil dipulihkan dari arsip ZIP "${pendingZipRestore.filename}"!`);
      alert(`🎉 Selamat! Database seluruh unit berhasil dipulihkan dari arsip ZIP.`);
      setPendingZipRestore(null);
    } else {
      // Selective unit restore
      const unitsToKeepFromSource = Object.entries(selectedUnitsToRestore)
        .filter(([_, isSelected]) => isSelected)
        .map(([u]) => u as SchoolUnitType);

      if (unitsToKeepFromSource.length === 0) {
        alert('Mohon pilih setidaknya satu unit untuk dipulihkan.');
        return;
      }

      // Merge selected units from backup with current state
      const mergedStudents = [
        ...state.students.filter(s => !unitsToKeepFromSource.includes(s.unit)),
        ...sourceState.students.filter(s => unitsToKeepFromSource.includes(s.unit))
      ];

      const mergedPayments = [
        ...state.studentPayments.filter(p => !unitsToKeepFromSource.includes(p.unit)),
        ...sourceState.studentPayments.filter(p => unitsToKeepFromSource.includes(p.unit))
      ];

      const mergedCash = [
        ...state.cashTransactions.filter(t => !unitsToKeepFromSource.includes(t.unit)),
        ...sourceState.cashTransactions.filter(t => unitsToKeepFromSource.includes(t.unit))
      ];

      const mergedBudgets = [
        ...state.budgetPlans.filter(b => !unitsToKeepFromSource.includes(b.unit)),
        ...sourceState.budgetPlans.filter(b => unitsToKeepFromSource.includes(b.unit))
      ];

      const mergedFees = [
        ...state.masterFees.filter(f => !unitsToKeepFromSource.includes(f.unit)),
        ...sourceState.masterFees.filter(f => unitsToKeepFromSource.includes(f.unit))
      ];

      const mergedProfiles = { ...state.profiles };
      unitsToKeepFromSource.forEach(u => {
        if (sourceState.profiles && sourceState.profiles[u]) {
          mergedProfiles[u] = sourceState.profiles[u];
        }
      });

      const finalState: AppState = {
        ...state,
        students: mergedStudents,
        studentPayments: mergedPayments,
        cashTransactions: mergedCash,
        budgetPlans: mergedBudgets,
        masterFees: mergedFees,
        profiles: mergedProfiles
      };

      restoreStateDirectly(finalState, `Pemulihan unit terpilih (${unitsToKeepFromSource.join(', ')}) dari ZIP: ${pendingZipRestore.filename}`);
      setRestoreStatus(`Unit terpilih (${unitsToKeepFromSource.join(', ')}) berhasil dipulihkan dari arsip ZIP!`);
      alert(`🎉 Sukses! Data untuk unit [${unitsToKeepFromSource.join(', ')}] berhasil dipulihkan.`);
      setPendingZipRestore(null);
    }
  };

  // Computed Filtered Users based on role and filter
  const displayedUsers = state.users.filter(u => {
    if (!isSuperAdmin) {
      return u.unitAccess === activeUnit || u.id === currentUser.id;
    }
    if (userUnitFilter === 'ALL') return true;
    return u.unitAccess === userUnitFilter || (userUnitFilter === 'ALL' && u.role === 'SUPER_ADMIN');
  });

  // Computed Filtered Audit Logs
  const displayedAuditLogs = state.auditLogs.filter(log => {
    // Unit match
    let matchesUnit = true;
    if (!isSuperAdmin) {
      matchesUnit = log.unit === activeUnit || (!log.unit && log.userName.toLowerCase().includes(activeUnit.toLowerCase()));
    } else if (auditUnitFilter !== 'ALL') {
      matchesUnit = log.unit === auditUnitFilter;
    }

    // Search query match
    let matchesSearch = true;
    if (auditSearchQuery.trim()) {
      const q = auditSearchQuery.toLowerCase();
      matchesSearch = (
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.timestamp.toLowerCase().includes(q) ||
        (log.unit && log.unit.toLowerCase().includes(q))
      );
    }

    return matchesUnit && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-slate-900">
              Sistem Keamanan
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {isSuperAdmin ? 'Enkripsi Salted v1 • Cadangan ZIP Multi-Unit (Yayasan)' : `Otoritas Khusus Unit ${activeUnit} • Cadangan ZIP & Enkripsi`}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {isSuperAdmin 
              ? 'Otoritas Pengguna, Enkripsi & Cadangan Data Semua Unit (.ZIP)' 
              : `Otoritas Pengguna, Enkripsi & Cadangan Data Unit ${activeUnit} (.ZIP)`}
          </h2>
          <p className="text-xs text-slate-500">
            {isSuperAdmin 
              ? 'Manajemen hak akses, arsip cadangan terkompresi ZIP untuk 6 unit lembaga, dan audit aktivitas yayasan'
              : `Manajemen pengguna terdaftar, arsip cadangan data ZIP terisolasi Unit ${activeUnit}, dan log aktivitas unit`}
          </p>
        </div>

        {/* Fast Action Shortcut for ZIP Backup */}
        <button
          type="button"
          onClick={() => isSuperAdmin ? handleExportAllZip() : handleExportCurrentUnitZip(activeUnit)}
          disabled={isExportingZip}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all shrink-0 hover:scale-102 disabled:opacity-50"
        >
          {isExportingZip ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Membuat Paket ZIP...</span>
            </>
          ) : (
            <>
              <Archive className="w-4 h-4" />
              <span>{isSuperAdmin ? 'Unduh Cadangan Semua Unit (.ZIP)' : `Unduh Cadangan Unit ${activeUnit} (.ZIP)`}</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-xs gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('BACKUP')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'BACKUP'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Archive className="w-4 h-4 text-emerald-600" />
          <span>1. Cadangan & Pemulihan ({isSuperAdmin ? 'ZIP Semua Unit' : `ZIP Unit ${activeUnit}`})</span>
        </button>

        <button
          onClick={() => setActiveTab('SYNC')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SYNC'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          <span>2. Sinkronisasi Cloud Multi-Unit</span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'USERS'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>3. Otoritas Pengguna ({displayedUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'AUDIT'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>4. Audit Log Keamanan ({displayedAuditLogs.length})</span>
        </button>
      </div>

      {/* Tab 3: User Management */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isSuperAdmin ? 'Daftar Akun Pengguna Seluruh Unit Lembaga' : `Daftar Pengguna Otoritas Unit ${activeUnit}`}
              </h3>
              <p className="text-xs text-slate-500">
                {isSuperAdmin 
                  ? 'Setiap role memiliki kewenangan terpisah untuk menjaga integritas data keuangan antar lembaga'
                  : `Menampilkan akun pengguna yang memiliki izin akses resmi ke Unit ${activeUnit}`}
              </p>
            </div>
            <button
              onClick={handleOpenAddUser}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Akun Pengguna</span>
            </button>
          </div>

          {/* Unit Filter Bar for Super Admin */}
          {isSuperAdmin ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-600 mr-1">Filter Unit:</span>
              <button
                type="button"
                onClick={() => setUserUnitFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  userUnitFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                Semua Unit ({state.users.length})
              </button>
              {(['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[]).map(u => {
                const count = state.users.filter(usr => usr.unitAccess === u).length;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUserUnitFilter(u)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      userUnitFilter === u
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    {u} ({count})
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Otoritas Khusus: Menampilkan <strong>{displayedUsers.length} pengguna</strong> terdaftar untuk Unit <strong>{activeUnit}</strong></span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-mono font-bold text-[10px]">
                Unit {activeUnit}
              </span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3">Nama Pengguna</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role / Jabatan</th>
                  <th className="p-3">Otoritas Unit</th>
                  <th className="p-3">Wali Kelas</th>
                  <th className="p-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                      Tidak ada pengguna yang sesuai dengan filter unit.
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((u, idx) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{u.fullName}</span>
                          {u.id === currentUser.id && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold">
                              Akun Anda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700">{u.username}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'ADMIN_KEUANGAN' ? 'bg-emerald-100 text-emerald-800' :
                          u.role === 'KEPALA_SEKOLAH' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        {u.role === 'SUPER_ADMIN' || u.unitAccess === 'ALL' ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-bold text-[10px] inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-700" />
                            <span>Semua Unit (Yayasan)</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-bold text-[10px] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-700" />
                            <span>Khusus Unit {u.unitAccess}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600">{u.assignedClass || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1 text-slate-500 hover:text-slate-900 rounded"
                            title="Edit Pengguna"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {(isSuperAdmin || u.unitAccess === activeUnit) && u.id !== currentUser.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Multi-Unit Database Synchronization */}
      {activeTab === 'SYNC' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs text-slate-800">
          {syncFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Status & Latency Bar */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${
                syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                syncStatus === 'syncing' ? 'bg-amber-500 animate-spin' :
                syncStatus === 'connecting' ? 'bg-sky-500 animate-spin' : 'bg-rose-500'
              }`} />
              <div>
                <h4 className="font-bold text-sm text-slate-900">Status Server Cloud Firestore</h4>
                <p className="text-slate-500 text-xs">
                  {syncStatus === 'connected' ? 'Aktif & Terhubung (Real-time Sync Antar Komputer)' :
                   syncStatus === 'syncing' ? 'Sedang Mengunggah Sinkronisasi...' :
                   syncStatus === 'connecting' ? 'Menghubungkan ke server...' : 'Offline / Terputus'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {latencyResult && (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                  latencyResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {latencyResult.latencyMs} ms
                </span>
              )}
              <button
                type="button"
                onClick={handleTestLatency}
                disabled={isTestingLatency}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <Activity className={`w-3.5 h-3.5 ${isTestingLatency ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
                <span>{isTestingLatency ? 'Menguji...' : 'Uji Latensi'}</span>
              </button>
            </div>
          </div>

          {/* Unit Database Cards */}
          <div>
            <div className="mb-3">
              <h4 className="font-bold text-sm text-slate-900">Integrasi & Rincian Database 6 Unit Lembaga</h4>
              <p className="text-xs text-slate-500">Isolasi data keuangan dan keterhubungan cloud untuk 6 unit sekolah (TK, KB, RQ, SD, SMP, SMA)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[]).map((u) => {
                const s = unitStats[u];
                const isSelected = activeUnit === u;
                const isAllowed = isSuperAdmin || currentUser.unitAccess === u;

                return (
                  <div 
                    key={u}
                    className={`rounded-2xl border p-4.5 flex flex-col justify-between space-y-4 ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50/20 ring-2 ring-emerald-500/20' 
                        : isAllowed
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200 bg-slate-50/70 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                            {u}
                          </span>
                          <span className="font-bold text-xs text-slate-900">{s.unitName}</span>
                        </div>
                        {isAllowed ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Tersinkron
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Terkunci
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 py-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Siswa / Santri:</span>
                          <span className="font-bold text-slate-900">{s.studentCount} ({s.activeStudentCount} aktif)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Kwitansi SPP:</span>
                          <span className="font-bold text-slate-900">{s.paymentCount} transaksi</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Total SPP Masuk:</span>
                          <span className="font-bold text-emerald-700">{formatRupiah(s.totalPaymentAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Transaksi BKU:</span>
                          <span className="font-bold text-slate-900">{s.bkuCount} transaksi</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Saldo Kas Riil:</span>
                          <span className={`font-extrabold ${s.currentCashBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {formatRupiah(s.currentCashBalance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Master Tarif Biaya:</span>
                          <span className="font-bold text-slate-900">{s.feeCount} tarif</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      {isSelected ? (
                        <span className="flex-1 py-1.5 px-3 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-center flex items-center justify-center gap-1 text-xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Unit Aktif</span>
                        </span>
                      ) : isAllowed ? (
                        <button
                          type="button"
                          onClick={() => setActiveUnit(u)}
                          className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors flex items-center justify-center gap-1 text-xs"
                        >
                          <span>Buka Unit</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="flex-1 py-1.5 px-3 bg-slate-100 text-slate-400 rounded-xl font-medium text-center flex items-center justify-center gap-1 text-xs cursor-not-allowed">
                          <Lock className="w-3 h-3" />
                          <span>Hanya Super Admin</span>
                        </span>
                      )}

                      {isAllowed && (
                        <button
                          type="button"
                          onClick={() => handleExportUnitJson(u)}
                          title={`Unduh Salinan JSON Database Unit ${u}`}
                          className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sync Actions Bar */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Sinkron terakhir: <strong className="text-slate-800">{lastSyncedAt ? lastSyncedAt.toLocaleTimeString('id-ID') : 'Baru saja'}</strong>
              {lastSyncMeta && ` oleh ${lastSyncMeta.updatedBy} (${lastSyncMeta.unit})`}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualFetch}
                disabled={isSyncing}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <DownloadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Tarik Data Terbaru</span>
              </button>

              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing 
                    ? 'Menyinkronkan...' 
                    : isSuperAdmin 
                    ? 'Sinkronkan Semua Unit Sekarang' 
                    : `Sinkronkan Database Unit ${activeUnit} Sekarang`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Backup & Restore */}
      {activeTab === 'BACKUP' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-6 space-y-6 text-xs text-slate-800">
          
          {/* Toast / Notification feedback */}
          {zipFeedback && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-3 font-semibold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{zipFeedback}</span>
            </div>
          )}

          {/* MASTER CARD: ZIP Backup (6-Units or Unit-Specific) */}
          <div className="p-6 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/40 shadow-xs relative overflow-hidden space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full font-black text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    {isSuperAdmin ? 'Rekomendasi Utama Cadangan Lengkap' : `Cadangan Terkompresi Unit ${activeUnit}`}
                  </span>
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full font-bold text-[10px]">
                    Format .ZIP Kompresi Standar
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FolderArchive className="w-5 h-5 text-emerald-700" />
                  <span>
                    {isSuperAdmin 
                      ? 'Cadangan Lengkap Semua Unit Sekaligus (6 Lembaga)' 
                      : `Cadangan Lengkap Khusus Unit ${activeUnit} (.ZIP)`}
                  </span>
                </h3>

                <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">
                  {isSuperAdmin ? (
                    <>Mengemas seluruh basis data dari unit <strong>TK Islam, KB, Rumah Qur'an (RQ), SD IT, SMP IT, dan SMA IT Thoriqul Jannah</strong> ke dalam 1 berkas arsip <code>.ZIP</code>. Termasuk data master siswa, riwayat kwitansi SPP, mutasi kas BKU, pos anggaran RAPBS, akun otorisasi, dan catatan audit log.</>
                  ) : (
                    <>Mengemas seluruh basis data khusus <strong>Unit {activeUnit}</strong> ke dalam berkas arsip <code>.ZIP</code> mandiri. Termasuk data master santri/siswa, kwitansi SPP, mutasi BKU, anggaran, dan log aktivitas Unit {activeUnit}.</>
                  )}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => isSuperAdmin ? handleExportAllZip() : handleExportCurrentUnitZip(activeUnit)}
                  disabled={isExportingZip}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 text-xs transition-all hover:scale-102 disabled:opacity-50"
                >
                  {isExportingZip ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Mengompres Arsip ZIP...</span>
                    </>
                  ) : (
                    <>
                      <HardDriveDownload className="w-4.5 h-4.5" />
                      <span>
                        {isSuperAdmin 
                          ? 'Unduh Paket Cadangan Semua Unit (.ZIP)' 
                          : `Unduh Paket Cadangan Unit ${activeUnit} (.ZIP)`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Breakdown of what's inside the ZIP */}
            <div className="p-4 bg-white/80 backdrop-blur-xs rounded-2xl border border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">{isSuperAdmin ? 'Arsip 6 Unit Mandiri:' : `Arsip Khusus Unit ${activeUnit}:`}</strong>
                  <span className="text-slate-500">{isSuperAdmin ? 'Folder terpisah TK, KB, RQ, SD, SMP, SMA' : `Data siswa, transaksi SPP, dan kas BKU ${activeUnit}`}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Ganda Format:</strong>
                  <span className="text-slate-500">Dilengkapi berkas .sikeu terenkripsi & .json</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Laporan Ringkasan:</strong>
                  <span className="text-slate-500">Terdapat manifest & petunjuk pemulihan (.txt)</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block">Keamanan Data:</strong>
                  <span className="text-slate-500">Enkripsi Salted v1 & kompatibel multi-perangkat</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY ROW: Single Unit Backup & JSON Export */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Unit Encrypted Backup (.sikeu) */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <FileKey className="w-4 h-4 text-slate-800" />
                  <h4 className="font-bold text-xs text-slate-900">Cadangan Terenkripsi Unit Aktif ({activeUnit})</h4>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Unduh berkas tunggal terenkripsi <code>.sikeu</code> untuk unit kerja aktif saat ini ({activeUnit}).
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[11px] text-slate-500 font-mono">Unit: <strong>{activeUnit}</strong></span>
                <button
                  type="button"
                  onClick={exportBackup}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh .sikeu ({activeUnit})</span>
                </button>
              </div>
            </div>

            {/* Single Unit JSON Export */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-800" />
                  <h4 className="font-bold text-xs text-slate-900">
                    {isSuperAdmin ? 'Salinan JSON Per Unit' : `Salinan JSON Unit ${activeUnit}`}
                  </h4>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {isSuperAdmin 
                    ? 'Pilih salah satu unit untuk mengunduh data mentah berformat JSON standar:'
                    : `Unduh salinan berkas data mentah berformat JSON khusus untuk Unit ${activeUnit}:`}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
                {isSuperAdmin ? (
                  (['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleExportUnitJson(u)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-lg font-bold border border-slate-300 text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <span>{u}</span>
                      <Download className="w-3 h-3 text-slate-400" />
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => handleExportUnitJson(activeUnit)}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold border border-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Unduh JSON ({activeUnit})</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* RESTORE SECTION */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white space-y-4 shadow-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900">
                  {isSuperAdmin 
                    ? 'Pemulihan / Restore Data (Mendukung .ZIP, .sikeu, & .json)' 
                    : `Pemulihan / Restore Data Khusus Unit ${activeUnit}`}
                </h4>
              </div>
              <p className="text-slate-500 text-xs">
                {isSuperAdmin 
                  ? 'Pilih file arsip .ZIP, berkas terenkripsi .sikeu, atau berkas .json dari komputer Anda untuk memulihkan basis data keuangan.'
                  : `Pilih file arsip .ZIP, berkas .sikeu, atau berkas .json untuk memulihkan data keuangan khusus Unit ${activeUnit}. Data unit lain tidak akan terpengaruh.`}
              </p>
            </div>

            {!isSuperAdmin && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Proteksi Unit Aktif: Pemulihan data hanya akan diterapkan pada Unit {activeUnit}.</span>
              </div>
            )}

            <div className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50/50 transition-colors flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Pilih Berkas Cadangan</span>
                  <span className="text-[11px] text-slate-500">
                    {isSuperAdmin ? 'Mendukung berkas ZIP semua unit, .sikeu, atau .json' : `Mendukung berkas ZIP unit, .sikeu, atau .json`}
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.sikeu,.json"
                  onChange={handleFileChange}
                  disabled={isReadingFile}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer cursor-pointer"
                />
              </div>
            </div>

            {isReadingFile && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
                <span>Membaca dan memverifikasi integritas berkas cadangan...</span>
              </div>
            )}

            {restoreStatus && (
              <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${
                restoreStatus.includes('berhasil') || restoreStatus.includes('Selamat') || restoreStatus.includes('Sukses')
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                <Info className="w-4 h-4 shrink-0" />
                <span>{restoreStatus}</span>
              </div>
            )}
          </div>

          {/* DANGER ZONE: Reset to Initial Data */}
          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-sm text-rose-900">
                  {isSuperAdmin ? 'Reset ke Data Sampel Awal (Seluruh Unit)' : `Reset ke Data Sampel Awal Unit ${activeUnit}`}
                </h4>
              </div>
              <p className="text-rose-700 text-xs">
                {isSuperAdmin 
                  ? 'Mengembalikan seluruh data transaksi ke sampel default awal TK, KB, RQ, SD, SMP, dan SMA.'
                  : `Mengembalikan seluruh data transaksi khusus Unit ${activeUnit} ke data sampel awal. Unit lain tidak berubah.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const promptMsg = isSuperAdmin
                  ? 'PERINGATAN: Semua perubahan transaksi di 6 unit lembaga akan digantikan dengan data sampel awal. Lanjutkan?'
                  : `PERINGATAN: Semua perubahan transaksi khusus Unit ${activeUnit} akan digantikan dengan data sampel awal. Lanjutkan?`;
                if (confirm(promptMsg)) {
                  if (isSuperAdmin) {
                    resetDefaultData();
                  } else {
                    resetDefaultData(activeUnit);
                  }
                  alert(`Data ${isSuperAdmin ? 'seluruh unit' : `Unit ${activeUnit}`} berhasil di-reset ke data awal.`);
                }
              }}
              className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-100 rounded-xl font-bold transition-colors shrink-0 text-xs"
            >
              {isSuperAdmin ? 'Reset Data Sampel' : `Reset Data Sampel (${activeUnit})`}
            </button>
          </div>

        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isSuperAdmin ? 'Catatan Aktivitas & Keamanan Real-Time (Seluruh Lembaga)' : `Catatan Aktivitas & Keamanan Unit ${activeUnit}`}
              </h3>
              <p className="text-xs text-slate-500">
                {isSuperAdmin 
                  ? 'Merekam setiap aktivitas transaksi keuangan, perubahan tarif, dan login pengguna di seluruh unit yayasan'
                  : `Merekam setiap aktivitas transaksi keuangan dan akses pengguna khusus Unit ${activeUnit}`}
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Total {displayedAuditLogs.length} Aktivitas
            </div>
          </div>

          {/* Audit Search and Filter Bar */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {isSuperAdmin ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 mr-1">Filter Unit:</span>
                <button
                  type="button"
                  onClick={() => setAuditUnitFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    auditUnitFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  Semua Unit ({state.auditLogs.length})
                </button>
                {(['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[]).map(u => {
                  const count = state.auditLogs.filter(log => log.unit === u).length;
                  return (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setAuditUnitFilter(u)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        auditUnitFilter === u
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      {u} ({count})
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                  Unit Aktif: {activeUnit}
                </span>
                <span className="text-slate-500 text-[11px]">Log otomatis terfilter khusus unit Anda</span>
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Cari pengguna, aksi, transaksi..."
                className="w-full md:w-64 pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3 w-40">Waktu</th>
                  <th className="p-3 w-32">Pengguna</th>
                  <th className="p-3 w-28">Tindakan</th>
                  <th className="p-3">Rincian Deskripsi</th>
                  <th className="p-3 w-16 text-center">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                      Tidak ada catatan aktivitas audit yang sesuai.
                    </td>
                  </tr>
                ) : (
                  displayedAuditLogs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="p-3 font-mono text-slate-600 whitespace-nowrap">{log.timestamp}</td>
                      <td className="p-3 font-bold text-slate-900">{log.userName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">{log.details}</td>
                      <td className="p-3 text-center font-bold font-mono text-emerald-700">{log.unit || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ZIP Restore Preview & Selection */}
      {pendingZipRestore && pendingZipRestore.state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FolderArchive className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm text-white">Verifikasi Arsip Cadangan ZIP</h3>
                  <p className="text-[11px] text-slate-300">File: {pendingZipRestore.filename} ({(pendingZipRestore.fileSizeBytes / 1024).toFixed(1)} KB)</p>
                </div>
              </div>
              <button 
                onClick={() => setPendingZipRestore(null)} 
                className="text-slate-400 hover:text-white rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 flex-1">
              
              {/* Manifest / Summary Info */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Arsip ZIP Valid Terdeteksi
                  </span>
                  <span className="text-[11px] text-emerald-800 font-mono">
                    {pendingZipRestore.manifest?.exportedAt ? new Date(pendingZipRestore.manifest.exportedAt).toLocaleString('id-ID') : 'Cadangan Database SIKEU'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/50 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Unit Terkandung:</span>
                    <strong className="text-slate-900 font-mono">{pendingZipRestore.unitsFound.join(', ')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Total Siswa:</span>
                    <strong className="text-slate-900">{pendingZipRestore.state.students.length} anak</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kwitansi SPP:</span>
                    <strong className="text-slate-900">{pendingZipRestore.state.studentPayments.length} slip</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Transaksi Kas:</span>
                    <strong className="text-slate-900">{pendingZipRestore.state.cashTransactions.length} mutasi</strong>
                  </div>
                </div>
              </div>

              {/* Mode Selection */}
              {isSuperAdmin ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900">Pilih Metode Pemulihan:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      restoreMode === 'ALL'
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'ALL'}
                        onChange={() => setRestoreMode('ALL')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <strong className="text-slate-900 block text-xs">Pulihkan Seluruh Unit Sekaligus</strong>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Mengganti seluruh database dengan isi arsip ZIP secara komprehensif.
                        </span>
                      </div>
                    </label>

                    <label className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      restoreMode === 'CUSTOM'
                        ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="restoreMode"
                        checked={restoreMode === 'CUSTOM'}
                        onChange={() => setRestoreMode('CUSTOM')}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <strong className="text-slate-900 block text-xs">Pilih Unit Tertentu Saja</strong>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Hanya memulihkan unit yang Anda centang tanpa mengubah unit lainnya.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs text-emerald-950">Otoritas Terisolasi: Pemulihan Khusus Unit {activeUnit}</h4>
                      <p className="text-[11px] text-emerald-800">
                        Sistem hanya akan mengekstrak dan memulihkan data untuk <strong>Unit {activeUnit}</strong> dari berkas ZIP ini. Seluruh data 5 unit lembaga lainnya tidak akan disentuh atau diubah sama sekali.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unit Checkboxes if Custom Mode & Super Admin */}
              {isSuperAdmin && restoreMode === 'CUSTOM' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Centang Unit yang Ingin Dipulihkan:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allChecked = Object.values(selectedUnitsToRestore).every(v => v);
                        const nextVal = !allChecked;
                        setSelectedUnitsToRestore({
                          TK: nextVal,
                          KB: nextVal,
                          RQ: nextVal,
                          SD: nextVal,
                          SMP: nextVal,
                          SMA: nextVal
                        });
                      }}
                      className="text-[11px] text-emerald-700 font-bold hover:underline"
                    >
                      Pilih / Batal Semua
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[]).map((u) => {
                      const isFoundInZip = pendingZipRestore.unitsFound.includes(u);
                      const isChecked = !!selectedUnitsToRestore[u];

                      return (
                        <label 
                          key={u}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors text-xs ${
                            isChecked ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-slate-200 text-slate-600'
                          } ${!isFoundInZip ? 'opacity-50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setSelectedUnitsToRestore(prev => ({ ...prev, [u]: e.target.checked }))}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Unit {u}</span>
                          {isFoundInZip ? (
                            <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 bg-emerald-200/60 text-emerald-900 rounded">
                              Ada di ZIP
                            </span>
                          ) : (
                            <span className="ml-auto text-[9px] text-slate-400">Kosong</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Perhatian:</strong> Tindakan ini akan memperbarui data transaksi pada unit yang dipulihkan. Pastikan Anda telah mengunduh salinan cadangan saat ini jika diperlukan.
                </span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPendingZipRestore(null)}
                className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmZipRestore}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-102"
              >
                <FolderCheck className="w-4 h-4" />
                <span>Terapkan Pemulihan Database</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Add / Edit User */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">{editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Pengguna'}</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleUserSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Ustadzah Siti Fatimah, S.Pd"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: bendahara_tk"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password Sandi Akun *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: 4Rmag3don01cr#6"
                  value={userForm.passwordHash}
                  onChange={(e) => setUserForm({ ...userForm, passwordHash: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">Sandi digunakan saat masuk otorisasi login unit</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Peran / Otoritas *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as UserRole;
                    setUserForm(prev => ({
                      ...prev,
                      role: nextRole,
                      unitAccess: nextRole === 'SUPER_ADMIN' ? 'ALL' : (prev.unitAccess === 'ALL' ? 'TK' : prev.unitAccess)
                    }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none font-semibold"
                >
                  <option value="ADMIN_KEUANGAN">Admin Keuangan / Bendahara (Input Kas & SPP)</option>
                  <option value="SUPER_ADMIN">Super Admin Yayasan (Otoritas Penuh Semua 6 Unit)</option>
                  <option value="KEPALA_SEKOLAH">Kepala Sekolah (Monitoring & Tanda Tangan)</option>
                  <option value="GURU_WALI_KELAS">Guru / Wali Kelas (Hanya Cek Status Siswa)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Izin Akses Unit Sekolah *</label>
                {userForm.role === 'SUPER_ADMIN' ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-semibold text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Semua Unit (Otoritas Super Admin ke 6 Unit Sekolah)</span>
                  </div>
                ) : (
                  <select
                    value={userForm.unitAccess}
                    onChange={(e) => setUserForm({ ...userForm, unitAccess: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <option value="TK">Hanya Unit TK (Taman Kanak-Kanak)</option>
                    <option value="KB">Hanya Unit KB (Kelompok Bermain)</option>
                    <option value="SD">Hanya Unit SD (Sekolah Dasar)</option>
                    <option value="SMP">Hanya Unit SMP (Sekolah Menengah Pertama)</option>
                    <option value="SMA">Hanya Unit SMA (Sekolah Menengah Atas)</option>
                    <option value="RQ">Hanya Unit RQ (Rumah Quran)</option>
                  </select>
                )}
                <span className="text-[10px] text-slate-500 block mt-1">
                  {userForm.role === 'SUPER_ADMIN' 
                    ? 'Super Admin memiliki otoritas berpindah dan mengelola data di seluruh unit sekolah.' 
                    : 'Selain Super Admin, akun hanya berwenang mengakses unit yang ditugaskan.'}
                </span>
              </div>

              {userForm.role === 'GURU_WALI_KELAS' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wali Kelas</label>
                  <input
                    type="text"
                    placeholder="misal: TK A1 (Thoriq)"
                    value={userForm.assignedClass}
                    onChange={(e) => setUserForm({ ...userForm, assignedClass: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
