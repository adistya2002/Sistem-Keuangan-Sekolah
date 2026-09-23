import { doc, onSnapshot, setDoc, getDoc, getDocFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppState, SchoolUnitType } from '../types';
import { INITIAL_PROFILES } from '../data/initialData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const SYNC_DOC_PATH = {
  collection: 'sikeu_data',
  docId: 'main_database'
};

// Clean object to prevent undefined errors in Firestore
function sanitizeData(data: any): any {
  return JSON.parse(JSON.stringify(data));
}

export interface UnitSyncStats {
  unit: SchoolUnitType;
  unitName: string;
  studentCount: number;
  activeStudentCount: number;
  paymentCount: number;
  totalPaymentAmount: number;
  bkuCount: number;
  totalCashIn: number;
  totalCashOut: number;
  currentCashBalance: number;
  budgetCount: number;
  totalPlannedIncome: number;
  totalPlannedExpense: number;
  feeCount: number;
  lastUpdated?: string;
  integrityStatus: 'EXCELLENT' | 'WARNING' | 'NEEDS_ATTENTION';
  integrityIssues: string[];
}

export interface SyncMetadata {
  lastUpdated: string;
  updatedBy: string;
  unit: string;
  action?: string;
  unitStats?: Record<SchoolUnitType, { studentCount: number; paymentCount: number; bkuCount: number; balance: number }>;
}

export type SyncStatus = 'connecting' | 'connected' | 'syncing' | 'offline' | 'error';

/**
 * Calculate per-unit database metrics and integrity checks
 */
export function calculateUnitDatabaseStats(state: AppState): Record<SchoolUnitType, UnitSyncStats> {
  const units: SchoolUnitType[] = ['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'];
  const unitNames: Record<SchoolUnitType, string> = {
    TK: 'TK Islam Thoriqul Jannah Sinjai',
    KB: 'KB Thoriqul Jannah Sinjai',
    RQ: "RQ Aulady Thoriqul Jannah Sinjai",
    SD: 'SD IT Thoriqul Jannah Sinjai',
    SMP: 'SMP IT Thoriqul Jannah Sinjai',
    SMA: 'SMA IT Thoriqul Jannah Sinjai'
  };

  const result: Record<SchoolUnitType, UnitSyncStats> = {} as any;

  units.forEach(u => {
    const unitProfile = state.profiles?.[u] || INITIAL_PROFILES[u];
    const unitStudents = state.students.filter(s => s.unit === u);
    const activeStudents = unitStudents.filter(s => s.status === 'AKTIF');
    const unitPayments = state.studentPayments.filter(p => p.unit === u);
    const totalPayments = unitPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

    const unitBku = state.cashTransactions.filter(t => t.unit === u);
    const totalCashIn = unitBku.filter(t => t.type === 'MASUK').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalCashOut = unitBku.filter(t => t.type === 'KELUAR').reduce((sum, t) => sum + (t.amount || 0), 0);
    const currentBalance = totalCashIn - totalCashOut;

    const unitBudgets = state.budgetPlans.filter(b => b.unit === u);
    const plannedIncome = unitBudgets.filter(b => b.category === 'PENDAPATAN').reduce((sum, b) => sum + (b.plannedAmount || 0), 0);
    const plannedExpense = unitBudgets.filter(b => b.category === 'BELANJA').reduce((sum, b) => sum + (b.plannedAmount || 0), 0);

    const unitFees = state.masterFees.filter(f => f.unit === u);

    // Integrity check
    const issues: string[] = [];
    if (unitStudents.length === 0) {
      issues.push('Belum ada data siswa/santri');
    }
    if (unitFees.length === 0) {
      issues.push('Belum ada master tarif/biaya');
    }
    if (currentBalance < 0) {
      issues.push('Saldo BKU bernilai minus');
    }

    result[u] = {
      unit: u,
      unitName: unitProfile?.name || unitNames[u] || `Unit ${u}`,
      studentCount: unitStudents.length,
      activeStudentCount: activeStudents.length,
      paymentCount: unitPayments.length,
      totalPaymentAmount: totalPayments,
      bkuCount: unitBku.length,
      totalCashIn,
      totalCashOut,
      currentCashBalance: currentBalance,
      budgetCount: unitBudgets.length,
      totalPlannedIncome: plannedIncome,
      totalPlannedExpense: plannedExpense,
      feeCount: unitFees.length,
      integrityStatus: issues.length === 0 ? 'EXCELLENT' : issues.length === 1 ? 'WARNING' : 'NEEDS_ATTENTION',
      integrityIssues: issues
    };
  });

  return result;
}

/**
 * Test connectivity and measure latency to Firestore database
 */
export async function testCloudConnection(): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const start = Date.now();
  try {
    const testDoc = doc(db, SYNC_DOC_PATH.collection, SYNC_DOC_PATH.docId);
    await getDocFromServer(testDoc);
    const latencyMs = Date.now() - start;
    return {
      success: true,
      latencyMs,
      message: `Terhubung ke Cloud Firestore (${latencyMs}ms)`
    };
  } catch (error: any) {
    const latencyMs = Date.now() - start;
    return {
      success: false,
      latencyMs,
      message: error?.message || 'Gagal tersambung ke Firestore'
    };
  }
}

/**
 * Listen to real-time changes in Firestore database
 */
export function subscribeToCloudDatabase(
  onRemoteUpdate: (remoteState: Partial<AppState>, meta?: SyncMetadata) => void,
  onStatusChange: (status: SyncStatus, error?: string) => void,
  initialFallbackState: AppState
): () => void {
  onStatusChange('connecting');
  const path = `${SYNC_DOC_PATH.collection}/${SYNC_DOC_PATH.docId}`;
  const docRef = doc(db, SYNC_DOC_PATH.collection, SYNC_DOC_PATH.docId);

  const unsubscribe = onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const { _meta, ...remoteData } = data;
        onRemoteUpdate(remoteData as Partial<AppState>, _meta as SyncMetadata);
        onStatusChange('connected');
      } else {
        // Document does not exist yet in Firestore (initial setup)
        // Bootstrap Firestore with the initial app state
        try {
          onStatusChange('syncing');
          await saveDatabaseToCloud(initialFallbackState, {
            lastUpdated: new Date().toISOString(),
            updatedBy: initialFallbackState.currentUser.fullName || 'System Init',
            unit: initialFallbackState.activeUnit,
            action: 'Inisialisasi Database Cloud Awal Seluruh Unit'
          });
          onStatusChange('connected');
        } catch (err: any) {
          console.error('Error bootstrapping cloud database:', err);
          onStatusChange('error', err.message);
        }
      }
    },
    (error) => {
      console.error('Firestore snapshot listener error:', error);
      onStatusChange('error', error.message);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Logged
      }
    }
  );

  return unsubscribe;
}

/**
 * Save current database state to Firestore
 */
export async function saveDatabaseToCloud(
  state: AppState,
  meta?: SyncMetadata
): Promise<void> {
  const path = `${SYNC_DOC_PATH.collection}/${SYNC_DOC_PATH.docId}`;
  const docRef = doc(db, SYNC_DOC_PATH.collection, SYNC_DOC_PATH.docId);

  const stats = calculateUnitDatabaseStats(state);
  const unitStatsSummary: Record<string, any> = {};
  (Object.keys(stats) as SchoolUnitType[]).forEach(u => {
    if (stats[u]) {
      unitStatsSummary[u] = {
        studentCount: stats[u].studentCount,
        paymentCount: stats[u].paymentCount,
        bkuCount: stats[u].bkuCount,
        balance: stats[u].currentCashBalance
      };
    }
  });

  const payload = sanitizeData({
    profiles: state.profiles,
    academicYears: state.academicYears,
    users: state.users,
    students: state.students,
    masterFees: state.masterFees,
    studentPayments: state.studentPayments,
    cashTransactions: state.cashTransactions,
    budgetPlans: state.budgetPlans,
    auditLogs: state.auditLogs,
    _meta: meta || {
      lastUpdated: new Date().toISOString(),
      updatedBy: state.currentUser.fullName || state.currentUser.username,
      unit: state.activeUnit,
      action: `Pembaruan Sinkronisasi Database Unit ${state.activeUnit}`,
      unitStats: unitStatsSummary
    }
  });

  try {
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch latest database once from Firestore
 */
export async function fetchDatabaseFromCloud(): Promise<Partial<AppState> | null> {
  const path = `${SYNC_DOC_PATH.collection}/${SYNC_DOC_PATH.docId}`;
  const docRef = doc(db, SYNC_DOC_PATH.collection, SYNC_DOC_PATH.docId);
  try {
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const { _meta, ...remoteData } = snapshot.data();
      return remoteData as Partial<AppState>;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export const FIRESTORE_DOC_MAX_BYTES = 1048576; // 1 MiB = 1,048,576 bytes
export const FIRESTORE_STORAGE_MAX_BYTES = 1073741824; // 1 GiB = 1,073,741,824 bytes

export interface FirestoreQuotaStats {
  docMaxBytes: number;
  docCurrentBytes: number;
  docRemainingBytes: number;
  docUsagePercent: number;

  storageMaxBytes: number;
  storageCurrentBytes: number;
  storageRemainingBytes: number;
  storageUsagePercent: number;

  status: 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  statusLabel: string;
  isNearLimit: boolean;
  isCritical: boolean;
  quotaExceededError: boolean;
  errorMessage?: string;

  breakdown: {
    studentsBytes: number;
    paymentsBytes: number;
    bkuBytes: number;
    budgetsBytes: number;
    feesBytes: number;
    auditLogsBytes: number;
    usersAndProfilesBytes: number;
  };

  dailyLimits: {
    maxDailyReads: number;
    maxDailyWrites: number;
    maxDailyDeletes: number;
    estimatedDailyReads: number;
    estimatedDailyWrites: number;
  };
}

/**
 * Format bytes into human readable format (Bytes, KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeIndex = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, safeIndex)).toFixed(dm))} ${sizes[safeIndex]}`;
}

/**
 * Calculate real-time Firestore database size, remaining quota, and storage limits
 */
export function calculateFirestoreQuotaStats(
  state: AppState, 
  syncError?: string | null,
  simulatedLoadPercent?: number | null
): FirestoreQuotaStats {
  const getByteSize = (data: any): number => {
    try {
      const json = JSON.stringify(data);
      if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(json).length;
      }
      return json.length;
    } catch {
      return 0;
    }
  };

  const studentsBytes = getByteSize(state.students);
  const paymentsBytes = getByteSize(state.studentPayments);
  const bkuBytes = getByteSize(state.cashTransactions);
  const budgetsBytes = getByteSize(state.budgetPlans);
  const feesBytes = getByteSize(state.masterFees);
  const auditLogsBytes = getByteSize(state.auditLogs);
  const usersAndProfilesBytes = getByteSize({ users: state.users, profiles: state.profiles, academicYears: state.academicYears });

  // Calculate actual consolidated document size in Firestore
  let actualDocBytes = studentsBytes + paymentsBytes + bkuBytes + budgetsBytes + feesBytes + auditLogsBytes + usersAndProfilesBytes + 512; // 512 bytes metadata overhead

  // If simulation is enabled, override for demonstration / testing purpose
  if (typeof simulatedLoadPercent === 'number' && simulatedLoadPercent > 0) {
    actualDocBytes = Math.round((simulatedLoadPercent / 100) * FIRESTORE_DOC_MAX_BYTES);
  }

  const docRemainingBytes = Math.max(0, FIRESTORE_DOC_MAX_BYTES - actualDocBytes);
  const docUsagePercent = parseFloat(((actualDocBytes / FIRESTORE_DOC_MAX_BYTES) * 100).toFixed(2));

  // Multiplier for accumulated storage (including indexes, backups, and historic transaction deltas)
  const estimatedStorageBytes = Math.min(FIRESTORE_STORAGE_MAX_BYTES, actualDocBytes * 8 + 5_242_880); // ~5 MB base project overhead
  const storageRemainingBytes = Math.max(0, FIRESTORE_STORAGE_MAX_BYTES - estimatedStorageBytes);
  const storageUsagePercent = parseFloat(((estimatedStorageBytes / FIRESTORE_STORAGE_MAX_BYTES) * 100).toFixed(2));

  // Check error string for quota exceeded
  const quotaExceededError = Boolean(
    syncError && (
      syncError.toLowerCase().includes('quota') ||
      syncError.toLowerCase().includes('resource-exhausted') ||
      syncError.toLowerCase().includes('exceeded') ||
      syncError.toLowerCase().includes('limit')
    )
  );

  const isCritical = quotaExceededError || docUsagePercent >= 85 || docRemainingBytes < 153_600; // < 150 KB left
  const isNearLimit = isCritical || docUsagePercent >= 70;

  const status: 'OPTIMAL' | 'WARNING' | 'CRITICAL' = isCritical 
    ? 'CRITICAL' 
    : isNearLimit 
      ? 'WARNING' 
      : 'OPTIMAL';

  const statusLabel = isCritical 
    ? 'Kapasitas Kritis (Hampir Habis)' 
    : isNearLimit 
      ? 'Peringatan Kapasitas Menipis' 
      : 'Kapasitas Normal & Sehat';

  // Estimate daily reads/writes based on active records
  const estimatedDailyWrites = Math.min(20000, 120 + state.cashTransactions.length + state.studentPayments.length);
  const estimatedDailyReads = Math.min(50000, 450 + (state.students.length * 2));

  return {
    docMaxBytes: FIRESTORE_DOC_MAX_BYTES,
    docCurrentBytes: actualDocBytes,
    docRemainingBytes,
    docUsagePercent,

    storageMaxBytes: FIRESTORE_STORAGE_MAX_BYTES,
    storageCurrentBytes: estimatedStorageBytes,
    storageRemainingBytes,
    storageUsagePercent,

    status,
    statusLabel,
    isNearLimit,
    isCritical,
    quotaExceededError,
    errorMessage: syncError || undefined,

    breakdown: {
      studentsBytes,
      paymentsBytes,
      bkuBytes,
      budgetsBytes,
      feesBytes,
      auditLogsBytes,
      usersAndProfilesBytes
    },

    dailyLimits: {
      maxDailyReads: 50000,
      maxDailyWrites: 20000,
      maxDailyDeletes: 20000,
      estimatedDailyReads,
      estimatedDailyWrites
    }
  };
}

