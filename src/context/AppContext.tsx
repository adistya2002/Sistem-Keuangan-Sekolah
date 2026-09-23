import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback, useMemo } from 'react';
import {
  AppState, SchoolUnitType, UserAccount, Student, MasterFee,
  StudentPaymentRecord, CashTransaction, BudgetPlanItem,
  SchoolProfile, AuditLog
} from '../types';
import { 
  INITIAL_APP_STATE, 
  INITIAL_PROFILES, 
  INITIAL_USERS, 
  INITIAL_MASTER_FEES, 
  INITIAL_STUDENTS, 
  INITIAL_BUDGET_PLANS, 
  INITIAL_CASH_TRANSACTIONS, 
  INITIAL_STUDENT_PAYMENTS, 
  INITIAL_AUDIT_LOGS 
} from '../data/initialData';
import { downloadEncryptedBackup, decryptAppState, downloadAllUnitsZipBackup, downloadSingleUnitZipBackup, verifyUserPassword } from '../utils/crypto';
import { 
  subscribeToCloudDatabase, 
  saveDatabaseToCloud, 
  fetchDatabaseFromCloud, 
  SyncStatus, 
  SyncMetadata 
} from '../services/firebaseSync';

interface AppContextValue {
  state: AppState;
  activeUnit: SchoolUnitType;
  activeProfile: SchoolProfile;
  activeAcademicYear: string;
  currentUser: UserAccount;
  activeReceipt: StudentPaymentRecord | null;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  setActiveUnit: (unit: SchoolUnitType) => void;
  setActiveAcademicYear: (year: string) => void;
  switchUser: (userId: string) => void;
  openReceiptModal: (payment: StudentPaymentRecord) => void;
  closeReceiptModal: () => void;
  
  // Real-time Cloud Sync Status
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncMeta: SyncMetadata | null;
  lastSyncedAt: Date | null;
  forceSyncToCloud: () => Promise<void>;
  forceFetchFromCloud: () => Promise<void>;
  
  // Student Actions
  addStudent: (student: Omit<Student, 'id'>) => Student;
  updateStudent: (student: Student) => void;
  deleteStudent: (studentId: string) => void;
  
  // Payment Actions
  addStudentPayment: (payment: Omit<StudentPaymentRecord, 'id' | 'createdAt'>, syncToBku?: boolean) => StudentPaymentRecord;
  deleteStudentPayment: (paymentId: string) => void;
  
  // Cash / BKU Actions
  addCashTransaction: (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => void;
  updateCashTransaction: (tx: CashTransaction) => void;
  deleteCashTransaction: (txId: string) => void;
  
  // Budget / RAPBS Actions
  addBudgetPlan: (item: Omit<BudgetPlanItem, 'id'>) => void;
  updateBudgetPlan: (item: BudgetPlanItem) => void;
  deleteBudgetPlan: (itemId: string) => void;

  // Master Fees Actions
  addMasterFee: (fee: Omit<MasterFee, 'id'>) => void;
  updateMasterFee: (fee: MasterFee) => void;
  deleteMasterFee: (feeId: string) => void;

  // School Profile Actions
  updateSchoolProfile: (unit: SchoolUnitType, profile: SchoolProfile) => void;

  // User Management
  addUserAccount: (user: Omit<UserAccount, 'id'>) => void;
  updateUserAccount: (user: UserAccount) => void;
  deleteUserAccount: (userId: string) => void;

  // Authentication & Session
  isAuthenticated: boolean;
  login: (username: string, password: string, remember?: boolean) => { success: boolean; message?: string; user?: UserAccount };
  logout: () => void;

  // Academic Year Duplication
  duplicateAcademicYear: (newYear: string, copyStudents: boolean, promoteStudents: boolean, customFees?: MasterFee[]) => void;

  // Security & Data
  exportBackup: () => void;
  exportAllUnitsZip: () => Promise<string>;
  exportUnitZip: (unit: SchoolUnitType) => Promise<string>;
  restoreBackup: (encryptedData: string, restrictToUnit?: SchoolUnitType) => boolean;
  restoreStateDirectly: (newState: AppState, description?: string, restrictToUnit?: SchoolUnitType) => boolean;
  resetDefaultData: (unitOnly?: SchoolUnitType) => void;
  purgeOldAuditLogs: (keepCount?: number) => void;
}

const STORAGE_KEY = 'SIKEU_TK_KB_RQ_THOJAN_V4';
const AUTH_SESSION_KEY = 'SIKEU_AUTH_SESSION_V4';

const AppContext = createContext<AppContextValue | null>(null);

const ALL_UNITS: SchoolUnitType[] = ['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'];

export function ensureCompleteAppState(rawState: any): AppState {
  if (!rawState || typeof rawState !== 'object') {
    return INITIAL_APP_STATE;
  }

  // 1. Ensure all profiles exist for all 6 units
  const mergedProfiles: Record<SchoolUnitType, SchoolProfile> = {
    ...INITIAL_PROFILES
  };
  ALL_UNITS.forEach(u => {
    if (rawState.profiles && rawState.profiles[u]) {
      mergedProfiles[u] = {
        ...INITIAL_PROFILES[u],
        ...rawState.profiles[u]
      };
    }
  });

  // Ensure official names for SD, SMP, SMA, TK, KB, RQ
  if (mergedProfiles.SD) {
    if (!mergedProfiles.SD.name || mergedProfiles.SD.name.includes('Thojan') || mergedProfiles.SD.name === 'SD Islam Thoriqul Jannah Sinjai') {
      mergedProfiles.SD.name = 'SD IT Thoriqul Jannah Sinjai';
    }
    if (!mergedProfiles.SD.subName) {
      mergedProfiles.SD.subName = 'Sekolah Dasar Islam Terpadu Thoriqul Jannah Sinjai';
    }
    if (!mergedProfiles.SD.bankHolder) {
      mergedProfiles.SD.bankHolder = 'SD IT Thoriqul Jannah Sinjai';
    }
  }
  if (mergedProfiles.SMP) {
    if (!mergedProfiles.SMP.name || mergedProfiles.SMP.name.includes('Thojan') || mergedProfiles.SMP.name === 'SMP Islam Thoriqul Jannah Sinjai') {
      mergedProfiles.SMP.name = 'SMP IT Thoriqul Jannah Sinjai';
    }
    if (!mergedProfiles.SMP.subName) {
      mergedProfiles.SMP.subName = 'Sekolah Menengah Pertama Islam Terpadu Thoriqul Jannah Sinjai';
    }
    if (!mergedProfiles.SMP.bankHolder) {
      mergedProfiles.SMP.bankHolder = 'SMP IT Thoriqul Jannah Sinjai';
    }
  }
  if (mergedProfiles.SMA) {
    if (!mergedProfiles.SMA.name || mergedProfiles.SMA.name.includes('Thojan') || mergedProfiles.SMA.name === 'SMA Islam Thoriqul Jannah Sinjai') {
      mergedProfiles.SMA.name = 'SMA IT Thoriqul Jannah Sinjai';
    }
    if (!mergedProfiles.SMA.subName) {
      mergedProfiles.SMA.subName = 'Sekolah Menengah Atas Islam Terpadu Thoriqul Jannah Sinjai';
    }
    if (!mergedProfiles.SMA.bankHolder) {
      mergedProfiles.SMA.bankHolder = 'SMA IT Thoriqul Jannah Sinjai';
    }
  }

  // 2. Ensure all users exist
  const existingUsers: UserAccount[] = Array.isArray(rawState.users) ? [...rawState.users] : [...INITIAL_USERS];
  const userMap = new Map<string, UserAccount>();
  existingUsers.forEach(u => {
    if (u && u.username) {
      userMap.set(u.username.toLowerCase(), u);
    }
  });

  INITIAL_USERS.forEach(iu => {
    if (!userMap.has(iu.username.toLowerCase())) {
      userMap.set(iu.username.toLowerCase(), iu);
    }
  });
  const mergedUsers: UserAccount[] = Array.from(userMap.values()).map(u => {
    let role: UserAccount['role'] = u.role || 'ADMIN_KEUANGAN';
    let unitAccess: 'ALL' | SchoolUnitType = (u.unitAccess as ('ALL' | SchoolUnitType)) || 'TK';

    // Strictly enforce: only SUPER_ADMIN can have unitAccess = 'ALL'
    if (role !== 'SUPER_ADMIN' && unitAccess === 'ALL') {
      unitAccess = 'TK';
    } else if (role === 'SUPER_ADMIN') {
      unitAccess = 'ALL';
    }

    if (u.username === 'sdthojan' && (!u.fullName || u.fullName.includes('Thojan'))) {
      return { ...u, role, unitAccess: 'SD' as SchoolUnitType, fullName: 'Admin Keuangan SD IT Thoriqul Jannah Sinjai' };
    }
    if (u.username === 'smpthojan' && (!u.fullName || u.fullName.includes('Thojan'))) {
      return { ...u, role, unitAccess: 'SMP' as SchoolUnitType, fullName: 'Admin Keuangan SMP IT Thoriqul Jannah Sinjai' };
    }
    if (u.username === 'smathojan' && (!u.fullName || u.fullName.includes('Thojan'))) {
      return { ...u, role, unitAccess: 'SMA' as SchoolUnitType, fullName: 'Admin Keuangan SMA IT Thoriqul Jannah Sinjai' };
    }
    return { ...u, role, unitAccess };
  });

  // 3. Ensure masterFees for each unit
  const existingFees: MasterFee[] = Array.isArray(rawState.masterFees) ? [...rawState.masterFees] : [];
  ALL_UNITS.forEach(u => {
    const hasUnitFees = existingFees.some(f => f.unit === u);
    if (!hasUnitFees) {
      const defaultFees = INITIAL_MASTER_FEES.filter(f => f.unit === u);
      existingFees.push(...defaultFees);
    }
  });

  // 4. Ensure students for each unit
  const existingStudents: Student[] = Array.isArray(rawState.students) ? [...rawState.students] : [];
  ALL_UNITS.forEach(u => {
    const hasUnitStudents = existingStudents.some(s => s.unit === u);
    if (!hasUnitStudents) {
      const defaultStudents = INITIAL_STUDENTS.filter(s => s.unit === u);
      existingStudents.push(...defaultStudents);
    }
  });

  // 5. Ensure budget plans for each unit
  const existingBudgets: BudgetPlanItem[] = Array.isArray(rawState.budgetPlans) ? [...rawState.budgetPlans] : [];
  ALL_UNITS.forEach(u => {
    const hasUnitBudgets = existingBudgets.some(b => b.unit === u);
    if (!hasUnitBudgets) {
      const defaultBudgets = INITIAL_BUDGET_PLANS.filter(b => b.unit === u);
      existingBudgets.push(...defaultBudgets);
    }
  });

  // 6. Ensure cash transactions for each unit
  const existingCash: CashTransaction[] = Array.isArray(rawState.cashTransactions) ? [...rawState.cashTransactions] : [];
  ALL_UNITS.forEach(u => {
    const hasUnitCash = existingCash.some(t => t.unit === u);
    if (!hasUnitCash) {
      const defaultCash = INITIAL_CASH_TRANSACTIONS.filter(t => t.unit === u);
      existingCash.push(...defaultCash);
    }
  });

  // 7. Academic years
  const academicYears = Array.isArray(rawState.academicYears) && rawState.academicYears.length > 0
    ? rawState.academicYears
    : ['2025/2026', '2024/2025'];
  const activeAcademicYear = rawState.activeAcademicYear || academicYears[0];

  // 8. Active unit & Current User
  const currentUser = rawState.currentUser && mergedUsers.find(u => u.id === rawState.currentUser.id || u.username === rawState.currentUser.username)
    ? mergedUsers.find(u => u.id === rawState.currentUser.id || u.username === rawState.currentUser.username)!
    : mergedUsers[0] || INITIAL_USERS[0];

  let activeUnit: SchoolUnitType = ALL_UNITS.includes(rawState.activeUnit) ? rawState.activeUnit : 'TK';
  // If current user is not Super Admin, lock activeUnit strictly to their assigned unitAccess
  if (currentUser.role !== 'SUPER_ADMIN' && currentUser.unitAccess !== 'ALL') {
    activeUnit = currentUser.unitAccess as SchoolUnitType;
  }

  return {
    version: rawState.version || '3.0.0',
    activeUnit,
    activeAcademicYear,
    academicYears,
    currentUser,
    users: mergedUsers,
    profiles: mergedProfiles,
    students: existingStudents,
    masterFees: existingFees,
    studentPayments: Array.isArray(rawState.studentPayments) ? rawState.studentPayments : INITIAL_STUDENT_PAYMENTS,
    cashTransactions: existingCash,
    budgetPlans: existingBudgets,
    auditLogs: Array.isArray(rawState.auditLogs) ? rawState.auditLogs : INITIAL_AUDIT_LOGS
  };
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const session = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
      return !!session;
    } catch (e) {
      return false;
    }
  });

  const [state, setState] = useState<AppState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const validated = ensureCompleteAppState(parsed);

          // Synchronize active session user on page load
          const sessionRaw = localStorage.getItem(AUTH_SESSION_KEY) || sessionStorage.getItem(AUTH_SESSION_KEY);
          if (sessionRaw) {
            try {
              const sessionObj = JSON.parse(sessionRaw);
              const userInState = validated.users.find((u: any) => u.id === sessionObj.userId || u.username === sessionObj.username);
              if (userInState) {
                validated.currentUser = userInState;
                if (userInState.unitAccess !== 'ALL') {
                  validated.activeUnit = userInState.unitAccess;
                }
              }
            } catch {
              // ignore session parse errors
            }
          }
          return validated;
        }
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
    return INITIAL_APP_STATE;
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeReceipt, setActiveReceipt] = useState<StudentPaymentRecord | null>(null);
  
  // Cloud Sync State
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncMeta, setLastSyncMeta] = useState<SyncMetadata | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Flags for avoiding loopback updates
  const isRemoteUpdateRef = useRef<boolean>(false);
  const isInitialMountRef = useRef<boolean>(true);
  const saveTimeoutRef = useRef<any>(null);

  // 1. Subscribe to Firestore Real-time changes across devices
  useEffect(() => {
    const unsubscribe = subscribeToCloudDatabase(
      (remoteData, meta) => {
        isRemoteUpdateRef.current = true;
        setState(prev => {
          return ensureCompleteAppState({
            ...prev,
            ...remoteData,
            profiles: {
              ...prev.profiles,
              ...(remoteData.profiles || {})
            }
          });
        });
        if (meta) {
          setLastSyncMeta(meta);
        }
        setLastSyncedAt(new Date());
        setSyncStatus('connected');
        setSyncError(null);
      },
      (status, errorMsg) => {
        setSyncStatus(status);
        if (errorMsg) setSyncError(errorMsg);
      },
      state
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 2. Save state to localStorage and sync local changes to Firestore
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    // Debounced sync to cloud on local changes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSyncStatus('syncing');
        await saveDatabaseToCloud(state, {
          lastUpdated: new Date().toISOString(),
          updatedBy: state.currentUser.fullName || state.currentUser.username,
          unit: state.activeUnit,
          action: 'Pembaruan Data Sistem'
        });
        setSyncStatus('connected');
        setLastSyncedAt(new Date());
        setSyncError(null);
      } catch (err: any) {
        console.error('Failed to sync changes to Firestore:', err);
        setSyncStatus('error');
        setSyncError(err.message || 'Gagal menyimpan ke Cloud');
      }
    }, 400);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    state.students,
    state.studentPayments,
    state.cashTransactions,
    state.budgetPlans,
    state.masterFees,
    state.profiles,
    state.users,
    state.academicYears,
    state.auditLogs
  ]);

  const activeUnit = state.activeUnit;
  const activeProfile: SchoolProfile = useMemo(() => {
    return state.profiles?.[activeUnit] || INITIAL_PROFILES[activeUnit] || INITIAL_PROFILES.TK;
  }, [state.profiles, activeUnit]);
  const activeAcademicYear = state.activeAcademicYear;
  const currentUser = state.currentUser;

  // Manual Force Push to Cloud
  const forceSyncToCloud = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      await saveDatabaseToCloud(state, {
        lastUpdated: new Date().toISOString(),
        updatedBy: state.currentUser.fullName || state.currentUser.username,
        unit: state.activeUnit,
        action: 'Manual Force Sync ke Cloud'
      });
      setSyncStatus('connected');
      setLastSyncedAt(new Date());
      setSyncError(null);
    } catch (err: any) {
      console.error('Force sync error:', err);
      setSyncStatus('error');
      setSyncError(err.message);
    }
  }, [state]);

  // Manual Force Fetch from Cloud
  const forceFetchFromCloud = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const remoteData = await fetchDatabaseFromCloud();
      if (remoteData) {
        isRemoteUpdateRef.current = true;
        setState(prev => {
          return ensureCompleteAppState({
            ...prev,
            ...remoteData,
            profiles: {
              ...prev.profiles,
              ...(remoteData.profiles || {})
            }
          });
        });
        setLastSyncedAt(new Date());
      }
      setSyncStatus('connected');
      setSyncError(null);
    } catch (err: any) {
      console.error('Force fetch error:', err);
      setSyncStatus('error');
      setSyncError(err.message);
    }
  }, []);

  const logAudit = useCallback((action: AuditLog['action'], module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      unit: state.activeUnit,
      timestamp: new Date().toISOString(),
      userName: state.currentUser.fullName || state.currentUser.username,
      userRole: state.currentUser.role,
      action,
      module,
      details
    };
    setState(prev => ({
      ...prev,
      auditLogs: [newLog, ...prev.auditLogs.slice(0, 150)]
    }));
  }, [state.activeUnit, state.currentUser]);

  const setActiveUnit = useCallback((unit: SchoolUnitType) => {
    setState(prev => {
      // Security Enforcement: Only Super Admin (or accounts with 'ALL' access) can change active units
      if (prev.currentUser.role !== 'SUPER_ADMIN' && prev.currentUser.unitAccess !== 'ALL') {
        if (unit !== prev.currentUser.unitAccess) {
          console.warn(`Akses Ditolak: Pengguna @${prev.currentUser.username} (${prev.currentUser.role}) hanya berhak mengakses Unit ${prev.currentUser.unitAccess}.`);
          return prev;
        }
      }
      return { ...prev, activeUnit: unit };
    });
  }, []);

  const setActiveAcademicYear = useCallback((year: string) => {
    setState(prev => ({ ...prev, activeAcademicYear: year }));
  }, []);

  const switchUser = useCallback((userId: string) => {
    setState(prev => {
      const found = prev.users.find(u => u.id === userId);
      if (!found) return prev;
      let newUnit = prev.activeUnit;
      if (found.unitAccess !== 'ALL') {
        newUnit = found.unitAccess;
      }
      return {
        ...prev,
        currentUser: found,
        activeUnit: newUnit
      };
    });
    logAudit('LOGIN', 'Sistem Otoritas', `Ganti pengguna aktif ke: ${userId}`);
  }, [logAudit]);

  const login = useCallback((usernameInput: string, passwordInput: string, remember: boolean = true) => {
    const cleanUsername = usernameInput.trim().toLowerCase();
    const foundUser = state.users.find(u => u.username.toLowerCase() === cleanUsername);

    if (!foundUser) {
      return { 
        success: false, 
        message: `Username "${usernameInput}" tidak terdaftar dalam sistem. Periksa kembali nama pengguna Anda.` 
      };
    }

    const expectedPassword = foundUser.passwordHash || '4Rmag3don01cr#6';
    if (!verifyUserPassword(passwordInput, expectedPassword)) {
      return { 
        success: false, 
        message: 'Password sandi yang Anda masukkan salah. Silakan periksa kembali.' 
      };
    }

    // Login successful
    let newUnit = state.activeUnit;
    if (foundUser.unitAccess !== 'ALL') {
      newUnit = foundUser.unitAccess;
    }

    setState(prev => ({
      ...prev,
      currentUser: foundUser,
      activeUnit: newUnit
    }));

    setIsAuthenticated(true);

    try {
      const sessionData = JSON.stringify({
        userId: foundUser.id,
        username: foundUser.username,
        loginAt: new Date().toISOString()
      });
      if (remember) {
        localStorage.setItem(AUTH_SESSION_KEY, sessionData);
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      } else {
        sessionStorage.setItem(AUTH_SESSION_KEY, sessionData);
        localStorage.removeItem(AUTH_SESSION_KEY);
      }
    } catch (e) {
      console.error('Failed to save session:', e);
    }

    logAudit('LOGIN', 'Otorisasi Masuk', `Pengguna ${foundUser.fullName} (${foundUser.username}) berhasil masuk.`);
    return { success: true, user: foundUser };
  }, [state.users, state.activeUnit, logAudit]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
      sessionStorage.removeItem(AUTH_SESSION_KEY);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
    setIsAuthenticated(false);
    logAudit('LOGIN', 'Otorisasi Keluar', `Pengguna ${state.currentUser.fullName} (@${state.currentUser.username}) keluar dari aplikasi.`);
  }, [state.currentUser, logAudit]);

  const openReceiptModal = useCallback((payment: StudentPaymentRecord) => {
    setActiveReceipt(payment);
  }, []);

  const closeReceiptModal = useCallback(() => {
    setActiveReceipt(null);
  }, []);

  // --- Student Management ---
  const addStudent = useCallback((studentData: Omit<Student, 'id'>): Student => {
    const newId = `std_${studentData.unit.toLowerCase()}_${Date.now()}`;
    const newStudent: Student = {
      ...studentData,
      id: newId
    };
    setState(prev => ({
      ...prev,
      students: [newStudent, ...prev.students]
    }));
    logAudit('CREATE', 'Master Siswa', `Menambah data siswa baru: ${newStudent.name} (${newStudent.nis}) - Kelas ${newStudent.className}`);
    return newStudent;
  }, [logAudit]);

  const updateStudent = useCallback((updated: Student) => {
    setState(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === updated.id ? updated : s)
    }));
    logAudit('UPDATE', 'Master Siswa', `Memperbarui data siswa: ${updated.name} (${updated.nis})`);
  }, [logAudit]);

  const deleteStudent = useCallback((studentId: string) => {
    const target = state.students.find(s => s.id === studentId);
    setState(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== studentId)
    }));
    logAudit('DELETE', 'Master Siswa', `Menghapus data siswa: ${target?.name || studentId}`);
  }, [state.students, logAudit]);

  // --- Payment Management ---
  const addStudentPayment = useCallback((paymentData: Omit<StudentPaymentRecord, 'id' | 'createdAt'>, syncToBku = true): StudentPaymentRecord => {
    const newPaymentId = `pay_${paymentData.unit.toLowerCase()}_${Date.now()}`;
    const newPayment: StudentPaymentRecord = {
      ...paymentData,
      id: newPaymentId,
      createdAt: new Date().toISOString()
    };

    let newCashTx: CashTransaction | null = null;
    if (syncToBku) {
      newCashTx = {
        id: `tx_bku_${Date.now()}`,
        unit: paymentData.unit,
        academicYear: paymentData.academicYear,
        date: paymentData.date,
        referenceNo: paymentData.receiptNumber,
        type: 'MASUK',
        category: paymentData.paymentType === 'SPP' ? 'Penerimaan SPP' :
                  paymentData.paymentType === 'DSP' ? 'Penerimaan DSP' :
                  paymentData.paymentType === 'SPP_DSP' ? 'Penerimaan SPP & DSP' :
                  paymentData.paymentType === 'SPP_DSP_ADM' ? 'Penerimaan SPP, DSP & Administrasi' : 'Penerimaan Biaya Siswa',
        description: paymentData.items && paymentData.items.length > 0
          ? `Pembayaran (${paymentData.items.map(i => i.name).join(', ')}) ananda ${paymentData.studentName} (${paymentData.className})`
          : `Pembayaran ${paymentData.paymentType} ananda ${paymentData.studentName} (${paymentData.className}) ${paymentData.sppMonths?.length ? 'Bulan: ' + paymentData.sppMonths.join(', ') : ''} ${paymentData.otherFeeDetail || ''}`,
        amount: paymentData.totalAmount,
        paymentMethod: paymentData.paymentMethod,
        sourceOrRecipient: paymentData.payerName || paymentData.studentName,
        notes: `Kwitansi No: ${paymentData.receiptNumber}`,
        studentPaymentId: newPaymentId,
        createdBy: paymentData.treasurerName,
        createdAt: new Date().toISOString()
      };
    }

    setState(prev => ({
      ...prev,
      studentPayments: [newPayment, ...prev.studentPayments],
      cashTransactions: newCashTx ? [newCashTx, ...prev.cashTransactions] : prev.cashTransactions
    }));

    logAudit('CREATE', 'Pembayaran SPP/DSP', `Menerbitkan kwitansi ${newPayment.receiptNumber} untuk ${newPayment.studentName} nominal Rp ${newPayment.totalAmount.toLocaleString('id-ID')}`);
    return newPayment;
  }, [logAudit]);

  const deleteStudentPayment = useCallback((paymentId: string) => {
    const target = state.studentPayments.find(p => p.id === paymentId);
    setState(prev => ({
      ...prev,
      studentPayments: prev.studentPayments.filter(p => p.id !== paymentId),
      cashTransactions: prev.cashTransactions.filter(tx => tx.studentPaymentId !== paymentId)
    }));
    logAudit('DELETE', 'Pembayaran SPP/DSP', `Membatalkan / menghapus kwitansi: ${target?.receiptNumber || paymentId}`);
  }, [state.studentPayments, logAudit]);

  // --- Cash / BKU Management ---
  const addCashTransaction = useCallback((txData: Omit<CashTransaction, 'id' | 'createdAt'>) => {
    const newTx: CashTransaction = {
      ...txData,
      id: `tx_${txData.unit.toLowerCase()}_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      cashTransactions: [newTx, ...prev.cashTransactions]
    }));
    logAudit('CREATE', 'Buku Kas Umum', `Input Kas ${newTx.type}: [${newTx.category}] ${newTx.description} (Rp ${newTx.amount.toLocaleString('id-ID')})`);
  }, [logAudit]);

  const updateCashTransaction = useCallback((updated: CashTransaction) => {
    setState(prev => ({
      ...prev,
      cashTransactions: prev.cashTransactions.map(tx => tx.id === updated.id ? updated : tx)
    }));
    logAudit('UPDATE', 'Buku Kas Umum', `Edit transaksi BKU: ${updated.referenceNo} - ${updated.description}`);
  }, [logAudit]);

  const deleteCashTransaction = useCallback((txId: string) => {
    const target = state.cashTransactions.find(t => t.id === txId);
    setState(prev => ({
      ...prev,
      cashTransactions: prev.cashTransactions.filter(tx => tx.id !== txId)
    }));
    logAudit('DELETE', 'Buku Kas Umum', `Hapus transaksi BKU: ${target?.referenceNo} (${target?.description})`);
  }, [state.cashTransactions, logAudit]);

  // --- RAPBS Management ---
  const addBudgetPlan = useCallback((itemData: Omit<BudgetPlanItem, 'id'>) => {
    const newItem: BudgetPlanItem = {
      ...itemData,
      id: `rapbs_${itemData.unit.toLowerCase()}_${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      budgetPlans: [...prev.budgetPlans, newItem]
    }));
    logAudit('CREATE', 'RAPBS', `Tambah Pos Anggaran ${newItem.code} - ${newItem.title} (${newItem.category})`);
  }, [logAudit]);

  const updateBudgetPlan = useCallback((updated: BudgetPlanItem) => {
    setState(prev => ({
      ...prev,
      budgetPlans: prev.budgetPlans.map(b => b.id === updated.id ? updated : b)
    }));
    logAudit('UPDATE', 'RAPBS', `Perbarui Pos Anggaran ${updated.code} - ${updated.title}`);
  }, [logAudit]);

  const deleteBudgetPlan = useCallback((itemId: string) => {
    const target = state.budgetPlans.find(b => b.id === itemId);
    setState(prev => ({
      ...prev,
      budgetPlans: prev.budgetPlans.filter(b => b.id !== itemId)
    }));
    logAudit('DELETE', 'RAPBS', `Hapus Pos Anggaran: ${target?.code} - ${target?.title}`);
  }, [state.budgetPlans, logAudit]);

  // --- Master Fee Management ---
  const addMasterFee = useCallback((feeData: Omit<MasterFee, 'id'>) => {
    const newFee: MasterFee = {
      ...feeData,
      id: `fee_${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      masterFees: [...prev.masterFees, newFee]
    }));
    logAudit('CREATE', 'Master Tarif', `Tambah Tarif: ${newFee.name} (Rp ${newFee.nominal.toLocaleString('id-ID')})`);
  }, [logAudit]);

  const updateMasterFee = useCallback((updated: MasterFee) => {
    setState(prev => ({
      ...prev,
      masterFees: prev.masterFees.map(f => f.id === updated.id ? updated : f)
    }));
    logAudit('UPDATE', 'Master Tarif', `Update Tarif: ${updated.name} (Rp ${updated.nominal.toLocaleString('id-ID')})`);
  }, [logAudit]);

  const deleteMasterFee = useCallback((feeId: string) => {
    setState(prev => ({
      ...prev,
      masterFees: prev.masterFees.filter(f => f.id !== feeId)
    }));
    logAudit('DELETE', 'Master Tarif', `Hapus Tarif ID: ${feeId}`);
  }, [logAudit]);

  // --- Profile Management ---
  const updateSchoolProfile = useCallback((unit: SchoolUnitType, profile: SchoolProfile) => {
    setState(prev => ({
      ...prev,
      profiles: {
        ...prev.profiles,
        [unit]: profile
      }
    }));
    logAudit('UPDATE', 'Profil Sekolah', `Perbarui identitas & rekening sekolah: ${unit}`);
  }, [logAudit]);

  // --- User Management ---
  const addUserAccount = useCallback((userData: Omit<UserAccount, 'id'>) => {
    let finalUnitAccess = userData.unitAccess;
    if (userData.role === 'SUPER_ADMIN') {
      finalUnitAccess = 'ALL';
    } else if (finalUnitAccess === 'ALL') {
      finalUnitAccess = 'TK';
    }

    const newUser: UserAccount = {
      ...userData,
      unitAccess: finalUnitAccess,
      id: `usr_${Date.now()}`
    };
    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser]
    }));
    logAudit('CREATE', 'Manajemen Pengguna', `Tambah pengguna baru: ${newUser.username} (${newUser.role}, Otoritas Unit: ${newUser.unitAccess})`);
  }, [logAudit]);

  const updateUserAccount = useCallback((updated: UserAccount) => {
    let finalUnitAccess = updated.unitAccess;
    if (updated.role === 'SUPER_ADMIN') {
      finalUnitAccess = 'ALL';
    } else if (finalUnitAccess === 'ALL') {
      finalUnitAccess = 'TK';
    }

    const sanitizedUser: UserAccount = {
      ...updated,
      unitAccess: finalUnitAccess
    };

    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === sanitizedUser.id ? sanitizedUser : u),
      currentUser: prev.currentUser.id === sanitizedUser.id ? sanitizedUser : prev.currentUser
    }));
    logAudit('UPDATE', 'Manajemen Pengguna', `Perbarui data akun: ${sanitizedUser.username} (${sanitizedUser.role}, Otoritas Unit: ${sanitizedUser.unitAccess})`);
  }, [logAudit]);

  const deleteUserAccount = useCallback((userId: string) => {
    setState(prev => ({
      ...prev,
      users: prev.users.filter(u => u.id !== userId)
    }));
    logAudit('DELETE', 'Manajemen Pengguna', `Hapus pengguna ID: ${userId}`);
  }, [logAudit]);

  // --- Academic Year Duplication Engine ---
  const duplicateAcademicYear = useCallback((newYear: string, copyStudents: boolean, promoteStudents: boolean, customFees?: MasterFee[]) => {
    setState(prev => {
      const currentYear = prev.activeAcademicYear;
      if (prev.academicYears.includes(newYear)) {
        return prev;
      }

      // Clone master fees (use customFees if provided, otherwise clone current fees)
      let clonedFees: MasterFee[] = [];
      if (customFees && customFees.length > 0) {
        clonedFees = customFees.map(f => ({
          ...f,
          id: `fee_clone_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          academicYear: newYear
        }));
      } else {
        const currentFees = prev.masterFees.filter(f => f.academicYear === currentYear);
        clonedFees = currentFees.map(f => ({
          ...f,
          id: `fee_clone_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          academicYear: newYear
        }));
      }

      // Clone budget plans
      const currentBudget = prev.budgetPlans.filter(b => b.academicYear === currentYear);
      const clonedBudget: BudgetPlanItem[] = currentBudget.map(b => ({
        ...b,
        id: `rapbs_clone_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        academicYear: newYear
      }));

      // Optionally clone students / promote them
      let newStudents: Student[] = [];
      if (copyStudents) {
        const activeStudentsInCurrentYear = prev.students.filter(
          s => s.academicYear === currentYear && s.status === 'AKTIF'
        );

        newStudents = activeStudentsInCurrentYear.map(s => {
          let nextClass = s.className;
          let nextStatus = s.status;

          if (promoteStudents) {
            // TK Promotion Logic: TK A -> TK B, TK B -> LULUS
            if (s.unit === 'TK') {
              if (s.className.includes('TK A1')) nextClass = 'TK B1 (Ali)';
              else if (s.className.includes('TK A2')) nextClass = 'TK B2 (Umar)';
              else if (s.className.includes('TK B')) {
                nextClass = 'Alumni TK B';
                nextStatus = 'LULUS';
              }
            } else if (s.unit === 'KB') {
              // KB -> TK A
              if (s.className.includes('KB Bintang')) nextClass = 'TK A1 (Thoriq)';
              else if (s.className.includes('KB Bulan')) nextClass = 'KB Bintang (Usia 3-4)';
            } else if (s.unit === 'SD') {
              // SD: Kelas 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> LULUS
              if (s.className.includes('Kelas 1')) nextClass = 'Kelas 2 Umar';
              else if (s.className.includes('Kelas 2')) nextClass = 'Kelas 3 Utsman';
              else if (s.className.includes('Kelas 3')) nextClass = 'Kelas 4 Ali';
              else if (s.className.includes('Kelas 4')) nextClass = 'Kelas 5 Bilal';
              else if (s.className.includes('Kelas 5')) nextClass = 'Kelas 6 Khalid';
              else if (s.className.includes('Kelas 6')) {
                nextClass = 'Alumni SD IT';
                nextStatus = 'LULUS';
              }
            } else if (s.unit === 'SMP') {
              // SMP: Kelas 7 -> 8 -> 9 -> LULUS
              if (s.className.includes('Kelas 7') || s.className.includes('VII')) nextClass = 'Kelas 8 Shalahuddin';
              else if (s.className.includes('Kelas 8') || s.className.includes('VIII')) nextClass = 'Kelas 9 Thoriq';
              else if (s.className.includes('Kelas 9') || s.className.includes('IX')) {
                nextClass = 'Alumni SMP IT';
                nextStatus = 'LULUS';
              }
            } else if (s.unit === 'SMA') {
              // SMA: Kelas 10 -> 11 -> 12 -> LULUS
              if (s.className.includes('Kelas 10') || s.className.includes('X')) nextClass = s.className.includes('IPS') ? 'Kelas 11 IPS' : 'Kelas 11 MIPA';
              else if (s.className.includes('Kelas 11') || s.className.includes('XI')) nextClass = s.className.includes('IPS') ? 'Kelas 12 IPS' : 'Kelas 12 MIPA';
              else if (s.className.includes('Kelas 12') || s.className.includes('XII')) {
                nextClass = 'Alumni SMA IT';
                nextStatus = 'LULUS';
              }
            } else if (s.unit === 'RQ') {
              // RQ Metode UMMI progression: Jilid 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> Tartil -> Tahfizh -> Turjuman -> Lulus
              if (s.className.includes('Jilid 1') || s.className.includes('Level 1')) nextClass = 'UMMI Jilid 2';
              else if (s.className.includes('Jilid 2')) nextClass = 'UMMI Jilid 3';
              else if (s.className.includes('Jilid 3') || s.className.includes('Level 2')) nextClass = 'UMMI Jilid 4';
              else if (s.className.includes('Jilid 4')) nextClass = 'UMMI Jilid 5';
              else if (s.className.includes('Jilid 5') || s.className.includes('Level 3')) nextClass = 'UMMI Jilid 6';
              else if (s.className.includes('Jilid 6')) nextClass = 'Program Tartil Metode UMMI';
              else if (s.className.includes('Tartil')) nextClass = 'Program Tahfizh Metode UMMI';
              else if (s.className.includes('Tahfizh') || s.className.includes('Khusus')) nextClass = 'Program Turjuman Metode UMMI';
              else if (s.className.includes('Turjuman')) {
                nextClass = 'Wisudawan / Khotimin Metode UMMI';
                nextStatus = 'LULUS';
              }
            }
          }

          return {
            ...s,
            id: `std_${s.unit.toLowerCase()}_${newYear.replace('/', '_')}_${s.nis}`,
            academicYear: newYear,
            className: nextClass,
            status: nextStatus
          };
        });
      }

      return {
        ...prev,
        academicYears: [newYear, ...prev.academicYears],
        activeAcademicYear: newYear,
        masterFees: [...prev.masterFees, ...clonedFees],
        budgetPlans: [...prev.budgetPlans, ...clonedBudget],
        students: [...prev.students, ...newStudents]
      };
    });

    logAudit('DUPLICATE_YEAR', 'Tahun Ajaran Baru', `Berhasil menggandakan master template & konfigurasi ke Tahun Ajaran Baru: ${newYear}`);
  }, [logAudit]);

  // --- Security Backup & Restore ---
  const exportBackup = useCallback(() => {
    downloadEncryptedBackup(state);
    logAudit('BACKUP', 'Enkripsi & Keamanan', `Melakukan export file backup terenkripsi (.sikeu) untuk Unit ${state.activeUnit}`);
  }, [state, logAudit]);

  const exportAllUnitsZip = useCallback(async (): Promise<string> => {
    const filename = await downloadAllUnitsZipBackup(state, currentUser.fullName);
    logAudit('BACKUP', 'Paket Arsip ZIP', `Mengunduh seluruh berkas cadangan database semua unit (TK, KB, RQ, SD, SMP, SMA) dalam file ZIP: ${filename}`);
    return filename;
  }, [state, currentUser, logAudit]);

  const exportUnitZip = useCallback(async (unit: SchoolUnitType): Promise<string> => {
    const filename = await downloadSingleUnitZipBackup(state, unit, currentUser.fullName);
    logAudit('BACKUP', 'Paket Arsip ZIP Unit', `Mengunduh berkas cadangan kompresi ZIP untuk Unit ${unit}: ${filename}`);
    return filename;
  }, [state, currentUser, logAudit]);

  const restoreBackup = useCallback((encryptedData: string, restrictToUnit?: SchoolUnitType): boolean => {
    try {
      const decryptedState = decryptAppState(encryptedData);
      const standardizedState = ensureCompleteAppState(decryptedState);

      const targetUnit = restrictToUnit || (currentUser.role !== 'SUPER_ADMIN' ? activeUnit : undefined);

      if (targetUnit) {
        // Scoped to single unit only
        setState(prev => ({
          ...prev,
          students: [
            ...prev.students.filter(s => s.unit !== targetUnit),
            ...standardizedState.students.filter(s => s.unit === targetUnit)
          ],
          studentPayments: [
            ...prev.studentPayments.filter(p => p.unit !== targetUnit),
            ...standardizedState.studentPayments.filter(p => p.unit === targetUnit)
          ],
          cashTransactions: [
            ...prev.cashTransactions.filter(t => t.unit !== targetUnit),
            ...standardizedState.cashTransactions.filter(t => t.unit === targetUnit)
          ],
          budgetPlans: [
            ...prev.budgetPlans.filter(b => b.unit !== targetUnit),
            ...standardizedState.budgetPlans.filter(b => b.unit === targetUnit)
          ],
          masterFees: [
            ...prev.masterFees.filter(f => f.unit !== targetUnit),
            ...standardizedState.masterFees.filter(f => f.unit === targetUnit)
          ],
          profiles: {
            ...prev.profiles,
            [targetUnit]: standardizedState.profiles[targetUnit] || prev.profiles[targetUnit]
          }
        }));
        logAudit('RESTORE', 'Enkripsi & Keamanan', `Berhasil memulihkan data khusus Unit ${targetUnit} dari file backup terenkripsi`);
      } else {
        setState(standardizedState);
        logAudit('RESTORE', 'Enkripsi & Keamanan', `Berhasil memulihkan seluruh basis data dari file backup terenkripsi`);
      }
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  }, [currentUser.role, activeUnit, logAudit]);

  const restoreStateDirectly = useCallback((newState: AppState, description?: string, restrictToUnit?: SchoolUnitType): boolean => {
    try {
      const standardizedState = ensureCompleteAppState(newState);
      const targetUnit = restrictToUnit || (currentUser.role !== 'SUPER_ADMIN' ? activeUnit : undefined);

      if (targetUnit) {
        setState(prev => ({
          ...prev,
          students: [
            ...prev.students.filter(s => s.unit !== targetUnit),
            ...standardizedState.students.filter(s => s.unit === targetUnit)
          ],
          studentPayments: [
            ...prev.studentPayments.filter(p => p.unit !== targetUnit),
            ...standardizedState.studentPayments.filter(p => p.unit === targetUnit)
          ],
          cashTransactions: [
            ...prev.cashTransactions.filter(t => t.unit !== targetUnit),
            ...standardizedState.cashTransactions.filter(t => t.unit === targetUnit)
          ],
          budgetPlans: [
            ...prev.budgetPlans.filter(b => b.unit !== targetUnit),
            ...standardizedState.budgetPlans.filter(b => b.unit === targetUnit)
          ],
          masterFees: [
            ...prev.masterFees.filter(f => f.unit !== targetUnit),
            ...standardizedState.masterFees.filter(f => f.unit === targetUnit)
          ],
          profiles: {
            ...prev.profiles,
            [targetUnit]: standardizedState.profiles[targetUnit] || prev.profiles[targetUnit]
          }
        }));
        logAudit('RESTORE', 'Pemulihan ZIP / Database', description || `Berhasil memulihkan basis data khusus Unit ${targetUnit}`);
      } else {
        setState(standardizedState);
        logAudit('RESTORE', 'Pemulihan ZIP / Database', description || `Berhasil memulihkan seluruh basis data dari berkas cadangan arsip ZIP`);
      }
      return true;
    } catch (e) {
      console.error('Failed to restore state directly:', e);
      return false;
    }
  }, [currentUser.role, activeUnit, logAudit]);

  const resetDefaultData = useCallback((unitOnly?: SchoolUnitType) => {
    const targetUnit = unitOnly || (currentUser.role !== 'SUPER_ADMIN' ? activeUnit : undefined);

    if (targetUnit) {
      setState(prev => ({
        ...prev,
        students: [
          ...prev.students.filter(s => s.unit !== targetUnit),
          ...INITIAL_STUDENTS.filter(s => s.unit === targetUnit)
        ],
        studentPayments: [
          ...prev.studentPayments.filter(p => p.unit !== targetUnit),
          ...INITIAL_STUDENT_PAYMENTS.filter(p => p.unit === targetUnit)
        ],
        cashTransactions: [
          ...prev.cashTransactions.filter(t => t.unit !== targetUnit),
          ...INITIAL_CASH_TRANSACTIONS.filter(t => t.unit === targetUnit)
        ],
        budgetPlans: [
          ...prev.budgetPlans.filter(b => b.unit !== targetUnit),
          ...INITIAL_BUDGET_PLANS.filter(b => b.unit === targetUnit)
        ],
        masterFees: [
          ...prev.masterFees.filter(f => f.unit !== targetUnit),
          ...INITIAL_MASTER_FEES.filter(f => f.unit === targetUnit)
        ],
        profiles: {
          ...prev.profiles,
          [targetUnit]: INITIAL_PROFILES[targetUnit]
        }
      }));
      logAudit('UPDATE', 'Sistem', `Reset data sampel default khusus Unit ${targetUnit}`);
    } else {
      setState(INITIAL_APP_STATE);
      localStorage.removeItem(STORAGE_KEY);
      logAudit('UPDATE', 'Sistem', `Reset data ke sampel default seluruh unit aplikasi`);
    }
  }, [currentUser.role, activeUnit, logAudit]);

  const purgeOldAuditLogs = useCallback((keepCount = 25) => {
    setState(prev => ({
      ...prev,
      auditLogs: prev.auditLogs.slice(0, keepCount)
    }));
    logAudit('UPDATE', 'Optimasi Database', `Pembersihan & pemadatan data audit log usang (menyimpan ${keepCount} entri terbaru untuk efisiensi penyimpanan Cloud Firestore)`);
  }, [logAudit]);

  const value: AppContextValue = {
    state,
    activeUnit,
    activeProfile,
    activeAcademicYear,
    currentUser,
    activeReceipt,
    currentTab,
    setCurrentTab,
    setActiveUnit,
    setActiveAcademicYear,
    switchUser,
    openReceiptModal,
    closeReceiptModal,
    syncStatus,
    syncError,
    lastSyncMeta,
    lastSyncedAt,
    forceSyncToCloud,
    forceFetchFromCloud,
    addStudent,
    updateStudent,
    deleteStudent,
    addStudentPayment,
    deleteStudentPayment,
    addCashTransaction,
    updateCashTransaction,
    deleteCashTransaction,
    addBudgetPlan,
    updateBudgetPlan,
    deleteBudgetPlan,
    addMasterFee,
    updateMasterFee,
    deleteMasterFee,
    updateSchoolProfile,
    addUserAccount,
    updateUserAccount,
    deleteUserAccount,
    isAuthenticated,
    login,
    logout,
    duplicateAcademicYear,
    exportBackup,
    exportAllUnitsZip,
    exportUnitZip,
    restoreBackup,
    restoreStateDirectly,
    resetDefaultData,
    purgeOldAuditLogs
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
