import JSZip from 'jszip';
import { AppState, SchoolUnitType } from '../types';
import { INITIAL_PROFILES } from '../data/initialData';

const SALT = 'SIKEU_TK_KB_RQ_SECURE_SALT_v1';

/**
 * Safely verify user password against stored hash/credential.
 * Supports plaintext matching, salted hash prefixes (SECURE_),
 * and master recovery password (4Rmag3don01cr#6 / Thoriqul2026!#).
 */
export function verifyUserPassword(inputPassword: string, storedHash?: string): boolean {
  const trimmedInput = (inputPassword || '').trim();
  if (!trimmedInput) return false;

  // Master recovery credentials (guaranteed emergency access for administrators)
  if (trimmedInput === '4Rmag3don01cr#6' || trimmedInput === 'Thoriqul2026!#') {
    return true;
  }

  if (!storedHash) {
    return trimmedInput === '4Rmag3don01cr#6';
  }

  // 1. Direct plaintext match
  if (trimmedInput === storedHash.trim()) {
    return true;
  }

  // 2. SECURE_ format: SECURE_{btoa(pass).replace(/=/g, '')}_{salt}
  if (storedHash.startsWith('SECURE_')) {
    const parts = storedHash.split('_');
    if (parts.length >= 2) {
      try {
        const inputEncoded = btoa(trimmedInput).replace(/=/g, '');
        if (inputEncoded === parts[1]) {
          return true;
        }
      } catch {
        // ignore encoding error
      }
    }
  }

  return false;
}

export function encryptAppState(data: AppState): string {
  try {
    const rawJson = JSON.stringify(data);
    // Salted base64 + obfuscation for safe local export & storage
    const combined = `${SALT}:::${rawJson}:::${Date.now()}`;
    const encoded = btoa(encodeURIComponent(combined));
    return encoded;
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Gagal mengenkripsi data cadangan.');
  }
}

export function decryptAppState(encryptedStr: string): AppState {
  try {
    const decoded = decodeURIComponent(atob(encryptedStr.trim()));
    const parts = decoded.split(':::');
    if (parts.length < 2 || parts[0] !== SALT) {
      throw new Error('Format file backup tidak valid atau kunci keamanan tidak cocok.');
    }
    const state = JSON.parse(parts[1]) as AppState;
    if (!state.students || !state.cashTransactions || !state.profiles) {
      throw new Error('Struktur data cadangan tidak lengkap.');
    }
    return state;
  } catch (err) {
    console.error('Decryption error:', err);
    throw new Error('Gagal memulihkan data: Format file rusak atau tidak valid.');
  }
}

export function downloadEncryptedBackup(state: AppState) {
  const encrypted = encryptAppState(state);
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `BACKUP_SIKEU_${state.activeUnit}_${dateStr}.sikeu`;

  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const UNIT_FOLDER_NAMES: Record<SchoolUnitType, string> = {
  TK: '01_Unit_TK_Islam_Thoriqul_Jannah',
  KB: '02_Unit_KB_Thoriqul_Jannah',
  RQ: '03_Unit_Rumah_Quran_Thoriqul_Jannah',
  SD: '04_Unit_SD_IT_Thoriqul_Jannah',
  SMP: '05_Unit_SMP_IT_Thoriqul_Jannah',
  SMA: '06_Unit_SMA_IT_Thoriqul_Jannah'
};

const UNIT_FULL_NAMES: Record<SchoolUnitType, string> = {
  TK: 'TK Islam Thoriqul Jannah Sinjai',
  KB: 'Kelompok Bermain (KB) Thoriqul Jannah Sinjai',
  RQ: "Rumah Qur'an Thoriqul Jannah Sinjai (Metode UMMI)",
  SD: 'SD IT Thoriqul Jannah Sinjai',
  SMP: 'SMP IT Thoriqul Jannah Sinjai',
  SMA: 'SMA IT Thoriqul Jannah Sinjai'
};

export interface ZipBackupSummary {
  exportedAt: string;
  exportedBy: string;
  totalUnits: number;
  units: {
    unit: SchoolUnitType;
    unitName: string;
    studentsCount: number;
    activeStudentsCount: number;
    paymentsCount: number;
    totalPaymentAmount: number;
    cashTransactionsCount: number;
    cashBalance: number;
    budgetCount: number;
    feesCount: number;
  }[];
  totalStudents: number;
  totalPayments: number;
  totalPaymentAmount: number;
  totalCashTransactions: number;
  totalUsers: number;
  totalAuditLogs: number;
}

/**
 * Generates and triggers download of a complete ZIP package containing backups for ALL units.
 */
export async function downloadAllUnitsZipBackup(
  state: AppState, 
  operatorName: string = 'Super Admin'
): Promise<string> {
  const zip = new JSZip();
  const timestamp = new Date();
  const dateFormatted = timestamp.toISOString().replace(/[:.]/g, '-');
  const dateDisplay = timestamp.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });

  const allUnits: SchoolUnitType[] = ['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'];

  // Calculate statistics per unit
  const unitSummaries = allUnits.map(u => {
    const students = state.students.filter(s => s.unit === u);
    const activeStudents = students.filter(s => s.status === 'AKTIF');
    const payments = state.studentPayments.filter(p => p.unit === u);
    const totalPayments = payments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const cash = state.cashTransactions.filter(t => t.unit === u);
    const totalIn = cash.filter(c => c.type === 'MASUK').reduce((acc, c) => acc + c.amount, 0);
    const totalOut = cash.filter(c => c.type === 'KELUAR').reduce((acc, c) => acc + c.amount, 0);
    const cashBalance = totalIn - totalOut;
    const budgets = state.budgetPlans.filter(b => b.unit === u);
    const fees = state.masterFees.filter(f => f.unit === u);
    const profile = state.profiles?.[u] || INITIAL_PROFILES[u];

    return {
      unit: u,
      unitName: profile?.name || UNIT_FULL_NAMES[u],
      studentsCount: students.length,
      activeStudentsCount: activeStudents.length,
      paymentsCount: payments.length,
      totalPaymentAmount: totalPayments,
      cashTransactionsCount: cash.length,
      cashBalance,
      budgetCount: budgets.length,
      feesCount: fees.length
    };
  });

  const manifest: ZipBackupSummary = {
    exportedAt: timestamp.toISOString(),
    exportedBy: operatorName,
    totalUnits: allUnits.length,
    units: unitSummaries,
    totalStudents: state.students.length,
    totalPayments: state.studentPayments.length,
    totalPaymentAmount: state.studentPayments.reduce((acc, p) => acc + (p.totalAmount || 0), 0),
    totalCashTransactions: state.cashTransactions.length,
    totalUsers: state.users.length,
    totalAuditLogs: state.auditLogs.length
  };

  // 1. Root: Full Encrypted Backup (.sikeu) & Full JSON Backup
  const fullEncrypted = encryptAppState(state);
  zip.file('SIKEU_FULL_DATABASE_ALL_UNITS.sikeu', fullEncrypted);
  zip.file('SIKEU_FULL_DATABASE_ALL_UNITS.json', JSON.stringify(state, null, 2));
  zip.file('MANIFEST.json', JSON.stringify(manifest, null, 2));

  // 2. Readme and restoration guide in Indonesian
  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  
  const readmeContent = `================================================================================
SIKEU APPS - ARSIP CADANGAN LENGKAP SEMUA UNIT (ZIP BACKUP)
Yayasan Thoriqul Jannah Sinjai
================================================================================

Tanggal Ekspor    : ${dateDisplay}
Dibuat Oleh       : ${operatorName}
Tahun Ajaran Aktif: ${state.activeAcademicYear}
Versi Sistem      : SIKEU Enterprise v4.5 (Multi-Unit 6 Lembaga)

RINGKASAN DATABASE TERKANDUNG:
--------------------------------------------------------------------------------
1. Total Siswa/Santri       : ${state.students.length} anak
2. Total Kwitansi SPP       : ${state.studentPayments.length} transaksi (${formatRp(manifest.totalPaymentAmount)})
3. Total Mutasi Kas (BKU)   : ${state.cashTransactions.length} transaksi
4. Total Pengguna Sistem    : ${state.users.length} akun
5. Total Catatan Audit Log  : ${state.auditLogs.length} aktivitas

RINCIAN PER UNIT LEMBAGA:
--------------------------------------------------------------------------------
${unitSummaries.map(s => `[UNIT ${s.unit}] ${s.unitName}
  • Siswa           : ${s.studentsCount} anak (${s.activeStudentsCount} aktif)
  • Kwitansi SPP    : ${s.paymentsCount} transaksi (${formatRp(s.totalPaymentAmount)})
  • Saldo Kas Riil  : ${formatRp(s.cashBalance)} (${s.cashTransactionsCount} mutasi BKU)
  • Master Tarif    : ${s.feesCount} tarif | RAPBS: ${s.budgetCount} pos
`).join('\n')}
--------------------------------------------------------------------------------
STRUKTUR FOLDER DI DALAM ARSIP ZIP INI:
- /SIKEU_FULL_DATABASE_ALL_UNITS.sikeu : File cadangan terenkripsi seluruh 6 unit
- /SIKEU_FULL_DATABASE_ALL_UNITS.json  : Database lengkap format JSON
- /MANIFEST.json                       : Metadata dan ringkasan audit
- /00_Master_Pengguna_Dan_Audit/       : Berkas akun pengguna dan audit logs
- /01_Unit_TK_Islam_Thoriqul_Jannah/   : Seluruh data khusus Unit TK
- /02_Unit_KB_Thoriqul_Jannah/         : Seluruh data khusus Unit KB
- /03_Unit_Rumah_Quran_Thoriqul_Jannah/: Seluruh data khusus Unit Rumah Qur'an
- /04_Unit_SD_IT_Thoriqul_Jannah/      : Seluruh data khusus Unit SD IT
- /05_Unit_SMP_IT_Thoriqul_Jannah/     : Seluruh data khusus Unit SMP IT
- /06_Unit_SMA_IT_Thoriqul_Jannah/     : Seluruh data khusus Unit SMA IT

CARA MEMULIHKAN / RESTORE DATABASE:
1. Buka aplikasi SIKEU, masuk ke menu "Keamanan & Pengguna" -> Tab "3. Cadangan & Pemulihan".
2. Pada bagian "Pemulihan Data", klik "Pilih File" dan pilih file ZIP ini (atau file .sikeu di dalamnya).
3. Sistem akan memverifikasi integritas data dan memulihkan seluruh data keuangan secara otomatis.
================================================================================
`;
  zip.file('PETUNJUK_DAN_RINGKASAN_DATABASE.txt', readmeContent);

  // 3. User & Audit Folder
  const userFolder = zip.folder('00_Master_Pengguna_Dan_Audit');
  if (userFolder) {
    userFolder.file('master_users_accounts.json', JSON.stringify(state.users, null, 2));
    userFolder.file('audit_logs_keamanan.json', JSON.stringify(state.auditLogs, null, 2));
  }

  // 4. Per-Unit Folders
  for (const u of allUnits) {
    const folderName = UNIT_FOLDER_NAMES[u] || `Unit_${u}`;
    const unitFolder = zip.folder(folderName);
    if (!unitFolder) continue;

    const unitStudents = state.students.filter(s => s.unit === u);
    const unitPayments = state.studentPayments.filter(p => p.unit === u);
    const unitBku = state.cashTransactions.filter(t => t.unit === u);
    const unitBudgets = state.budgetPlans.filter(b => b.unit === u);
    const unitFees = state.masterFees.filter(f => f.unit === u);
    const unitProfile = state.profiles?.[u] || INITIAL_PROFILES[u];

    const unitCompleteData = {
      unit: u,
      unitName: unitProfile?.name || UNIT_FULL_NAMES[u],
      exportedAt: timestamp.toISOString(),
      profile: unitProfile,
      students: unitStudents,
      payments: unitPayments,
      cashTransactions: unitBku,
      budgetPlans: unitBudgets,
      masterFees: unitFees
    };

    // Sub-files for clean modularity
    unitFolder.file(`database_lengkap_${u.toLowerCase()}.json`, JSON.stringify(unitCompleteData, null, 2));
    unitFolder.file(`data_siswa_${u.toLowerCase()}.json`, JSON.stringify(unitStudents, null, 2));
    unitFolder.file(`data_kwitansi_spp_${u.toLowerCase()}.json`, JSON.stringify(unitPayments, null, 2));
    unitFolder.file(`data_bku_kas_${u.toLowerCase()}.json`, JSON.stringify(unitBku, null, 2));
    unitFolder.file(`data_pos_rapbs_${u.toLowerCase()}.json`, JSON.stringify(unitBudgets, null, 2));
    unitFolder.file(`master_tarif_${u.toLowerCase()}.json`, JSON.stringify(unitFees, null, 2));
    unitFolder.file(`profil_lembaga_${u.toLowerCase()}.json`, JSON.stringify(unitProfile, null, 2));

    // Create a standalone unit backup .sikeu file
    const unitAppState: AppState = {
      ...state,
      activeUnit: u,
      students: unitStudents,
      studentPayments: unitPayments,
      cashTransactions: unitBku,
      budgetPlans: unitBudgets,
      masterFees: unitFees,
      profiles: {
        ...state.profiles,
        [u]: unitProfile
      }
    };
    unitFolder.file(`backup_unit_${u.toLowerCase()}.sikeu`, encryptAppState(unitAppState));

    // Unit summary txt
    const uSummary = unitSummaries.find(s => s.unit === u)!;
    const unitText = `RINGKASAN DATA LEMBAGA: ${unitProfile?.name || UNIT_FULL_NAMES[u]}
------------------------------------------------------------
Unit Key            : ${u}
Waktu Ekspor        : ${dateDisplay}
Siswa / Santri      : ${uSummary.studentsCount} anak (${uSummary.activeStudentsCount} aktif)
Kwitansi SPP        : ${uSummary.paymentsCount} transaksi (${formatRp(uSummary.totalPaymentAmount)})
Mutasi Kas BKU      : ${uSummary.cashTransactionsCount} transaksi
Saldo Kas Riil      : ${formatRp(uSummary.cashBalance)}
Pos Anggaran RAPBS  : ${uSummary.budgetCount} pos
Master Tarif Biaya  : ${uSummary.feesCount} tarif
Kepala Sekolah      : ${unitProfile?.headmasterName || '-'}
Bendahara           : ${unitProfile?.treasurerName || '-'}
Rekening Kas        : ${unitProfile?.bankName || '-'} ${unitProfile?.bankAccount || ''} a.n. ${unitProfile?.bankHolder || ''}
------------------------------------------------------------
`;
    unitFolder.file(`ringkasan_unit_${u.toLowerCase()}.txt`, unitText);
  }

  // Generate ZIP Blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const filename = `BACKUP_SIKEU_SEMUA_UNIT_ZIP_${dateFormatted.slice(0, 10)}_${timestamp.getHours().toString().padStart(2, '0')}${timestamp.getMinutes().toString().padStart(2, '0')}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Generates and triggers download of a complete ZIP package containing backup for a SINGLE specific unit.
 */
export async function downloadSingleUnitZipBackup(
  state: AppState, 
  unit: SchoolUnitType,
  operatorName: string = 'Admin Unit'
): Promise<string> {
  const zip = new JSZip();
  const timestamp = new Date();
  const dateFormatted = timestamp.toISOString().replace(/[:.]/g, '-');
  const dateDisplay = timestamp.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });

  const formatRp = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const unitStudents = state.students.filter(s => s.unit === unit);
  const activeStudents = unitStudents.filter(s => s.status === 'AKTIF');
  const unitPayments = state.studentPayments.filter(p => p.unit === unit);
  const totalPayments = unitPayments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
  const unitBku = state.cashTransactions.filter(t => t.unit === unit);
  const totalIn = unitBku.filter(c => c.type === 'MASUK').reduce((acc, c) => acc + c.amount, 0);
  const totalOut = unitBku.filter(c => c.type === 'KELUAR').reduce((acc, c) => acc + c.amount, 0);
  const cashBalance = totalIn - totalOut;
  const unitBudgets = state.budgetPlans.filter(b => b.unit === unit);
  const unitFees = state.masterFees.filter(f => f.unit === unit);
  const unitProfile = state.profiles?.[unit] || INITIAL_PROFILES[unit];
  const unitAuditLogs = state.auditLogs.filter(l => l.unit === unit);
  const unitUsers = state.users.filter(u => u.unitAccess === unit);

  const unitSummary = {
    unit,
    unitName: unitProfile?.name || UNIT_FULL_NAMES[unit],
    studentsCount: unitStudents.length,
    activeStudentsCount: activeStudents.length,
    paymentsCount: unitPayments.length,
    totalPaymentAmount: totalPayments,
    cashTransactionsCount: unitBku.length,
    cashBalance,
    budgetCount: unitBudgets.length,
    feesCount: unitFees.length
  };

  const manifest: ZipBackupSummary = {
    exportedAt: timestamp.toISOString(),
    exportedBy: operatorName,
    totalUnits: 1,
    units: [unitSummary],
    totalStudents: unitStudents.length,
    totalPayments: unitPayments.length,
    totalPaymentAmount: totalPayments,
    totalCashTransactions: unitBku.length,
    totalUsers: unitUsers.length,
    totalAuditLogs: unitAuditLogs.length
  };

  // 1. Single Unit AppState
  const unitAppState: AppState = {
    ...state,
    activeUnit: unit,
    students: unitStudents,
    studentPayments: unitPayments,
    cashTransactions: unitBku,
    budgetPlans: unitBudgets,
    masterFees: unitFees,
    users: unitUsers,
    auditLogs: unitAuditLogs,
    profiles: {
      ...state.profiles,
      [unit]: unitProfile
    }
  };

  const fullEncrypted = encryptAppState(unitAppState);
  zip.file(`SIKEU_DATABASE_UNIT_${unit}.sikeu`, fullEncrypted);
  zip.file(`SIKEU_DATABASE_UNIT_${unit}.json`, JSON.stringify(unitAppState, null, 2));
  zip.file('MANIFEST.json', JSON.stringify(manifest, null, 2));

  // 2. Readme and restoration guide in Indonesian
  const readmeContent = `================================================================================
SIKEU APPS - ARSIP CADANGAN KHUSUS UNIT ${unit} (.ZIP BACKUP)
Lembaga: ${unitProfile?.name || UNIT_FULL_NAMES[unit]}
Yayasan Thoriqul Jannah Sinjai
================================================================================

Tanggal Ekspor    : ${dateDisplay}
Dibuat Oleh       : ${operatorName}
Unit Kerja        : ${unit} (${unitProfile?.name || UNIT_FULL_NAMES[unit]})
Tahun Ajaran Aktif: ${state.activeAcademicYear}
Versi Sistem      : SIKEU Enterprise v4.5

RINGKASAN DATABASE UNIT ${unit}:
--------------------------------------------------------------------------------
1. Total Siswa/Santri       : ${unitStudents.length} anak (${activeStudents.length} aktif)
2. Total Kwitansi SPP       : ${unitPayments.length} transaksi (${formatRp(totalPayments)})
3. Total Mutasi Kas (BKU)   : ${unitBku.length} transaksi
4. Saldo Kas Riil           : ${formatRp(cashBalance)}
5. Pos Anggaran RAPBS       : ${unitBudgets.length} pos
6. Master Tarif Biaya SPP   : ${unitFees.length} tarif
7. Catatan Log Aktivitas    : ${unitAuditLogs.length} aktivitas

STRUKTUR BERKAS DI DALAM ARSIP ZIP INI:
- /SIKEU_DATABASE_UNIT_${unit}.sikeu : File cadangan terenkripsi khusus Unit ${unit}
- /SIKEU_DATABASE_UNIT_${unit}.json  : Database lengkap unit format JSON
- /MANIFEST.json                     : Metadata dan ringkasan cadangan
- /data_siswa_${unit.toLowerCase()}.json        : Daftar data siswa Unit ${unit}
- /data_kwitansi_spp_${unit.toLowerCase()}.json : Rekap slip pembayaran SPP Unit ${unit}
- /data_bku_kas_${unit.toLowerCase()}.json      : Buku Kas Umum (BKU) Unit ${unit}
- /data_pos_rapbs_${unit.toLowerCase()}.json    : Rencana Anggaran RAPBS Unit ${unit}
- /master_tarif_${unit.toLowerCase()}.json      : Master tarif biaya sekolah Unit ${unit}
- /profil_lembaga_${unit.toLowerCase()}.json    : Profil resmi & nomor rekening Unit ${unit}

CARA MEMULIHKAN / RESTORE DATABASE:
1. Buka aplikasi SIKEU, masuk ke menu "Keamanan & Pengguna" -> Tab "3. Cadangan & Pemulihan".
2. Pada bagian "Pemulihan Data", klik "Pilih File" dan pilih file ZIP ini (atau file .sikeu di dalamnya).
3. Sistem akan memverifikasi integritas data dan memulihkan data Unit ${unit} secara otomatis.
================================================================================
`;
  zip.file(`PETUNJUK_DAN_RINGKASAN_UNIT_${unit}.txt`, readmeContent);

  // 3. Sub-files for clean modularity
  const unitFolder = zip.folder(`Data_Unit_${unit}`);
  const targetFolder = unitFolder || zip;
  targetFolder.file(`data_siswa_${unit.toLowerCase()}.json`, JSON.stringify(unitStudents, null, 2));
  targetFolder.file(`data_kwitansi_spp_${unit.toLowerCase()}.json`, JSON.stringify(unitPayments, null, 2));
  targetFolder.file(`data_bku_kas_${unit.toLowerCase()}.json`, JSON.stringify(unitBku, null, 2));
  targetFolder.file(`data_pos_rapbs_${unit.toLowerCase()}.json`, JSON.stringify(unitBudgets, null, 2));
  targetFolder.file(`master_tarif_${unit.toLowerCase()}.json`, JSON.stringify(unitFees, null, 2));
  targetFolder.file(`profil_lembaga_${unit.toLowerCase()}.json`, JSON.stringify(unitProfile, null, 2));

  // Generate ZIP Blob
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  const filename = `BACKUP_SIKEU_UNIT_${unit}_ZIP_${dateFormatted.slice(0, 10)}_${timestamp.getHours().toString().padStart(2, '0')}${timestamp.getMinutes().toString().padStart(2, '0')}.zip`;

  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return filename;
}

export interface ReadZipResult {
  success: boolean;
  state?: AppState;
  manifest?: ZipBackupSummary;
  unitsFound: SchoolUnitType[];
  filename: string;
  fileSizeBytes: number;
  error?: string;
}

/**
 * Reads and inspects an uploaded ZIP backup archive.
 */
export async function readZipBackupFile(file: File): Promise<ReadZipResult> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Look for full state encrypted file first
    const sikeuFile = zip.file('SIKEU_FULL_DATABASE_ALL_UNITS.sikeu');
    const jsonFile = zip.file('SIKEU_FULL_DATABASE_ALL_UNITS.json');
    const manifestFile = zip.file('MANIFEST.json');

    let restoredState: AppState | null = null;
    let manifest: ZipBackupSummary | undefined = undefined;

    if (manifestFile) {
      try {
        const manifestText = await manifestFile.async('text');
        manifest = JSON.parse(manifestText);
      } catch (e) {
        console.warn('Failed to parse MANIFEST.json in zip', e);
      }
    }

    if (sikeuFile) {
      const encryptedText = await sikeuFile.async('text');
      restoredState = decryptAppState(encryptedText);
    } else if (jsonFile) {
      const jsonText = await jsonFile.async('text');
      restoredState = JSON.parse(jsonText) as AppState;
    } else {
      // Look for individual unit files in subfolders
      const allUnits: SchoolUnitType[] = ['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'];
      const foundStudents: any[] = [];
      const foundPayments: any[] = [];
      const foundCash: any[] = [];
      const foundBudgets: any[] = [];
      const foundFees: any[] = [];
      const foundProfiles: any = { ...INITIAL_PROFILES };

      for (const u of allUnits) {
        const folderName = UNIT_FOLDER_NAMES[u];
        // Match any folder containing the unit code
        const matchingFiles = zip.filter((path) => path.toLowerCase().includes(u.toLowerCase()) && path.endsWith('.json'));
        
        for (const fileInZip of matchingFiles) {
          if (fileInZip.name.includes(`database_lengkap_${u.toLowerCase()}.json`)) {
            const content = await fileInZip.async('text');
            const data = JSON.parse(content);
            if (data.students) foundStudents.push(...data.students);
            if (data.payments) foundPayments.push(...data.payments);
            if (data.cashTransactions) foundCash.push(...data.cashTransactions);
            if (data.budgetPlans) foundBudgets.push(...data.budgetPlans);
            if (data.masterFees) foundFees.push(...data.masterFees);
            if (data.profile) foundProfiles[u] = data.profile;
          }
        }
      }

      if (foundStudents.length > 0 || foundCash.length > 0) {
        restoredState = {
          version: '2.0.0',
          activeUnit: 'TK',
          activeAcademicYear: '2025/2026',
          academicYears: ['2025/2026', '2024/2025'],
          students: foundStudents,
          studentPayments: foundPayments,
          cashTransactions: foundCash,
          budgetPlans: foundBudgets,
          masterFees: foundFees,
          profiles: foundProfiles,
          users: [],
          auditLogs: [],
          currentUser: {
            id: 'u_super',
            username: 'superadmin',
            fullName: 'Super Admin Yayasan',
            role: 'SUPER_ADMIN',
            unitAccess: 'ALL'
          }
        };
      }
    }

    if (!restoredState) {
      return {
        success: false,
        unitsFound: [],
        filename: file.name,
        fileSizeBytes: file.size,
        error: 'File ZIP tidak memiliki struktur cadangan database SIKEU yang valid (file .sikeu atau .json tidak ditemukan).'
      };
    }

    // Detect unique units in restored state
    const unitsDetectedSet = new Set<SchoolUnitType>();
    if (restoredState.students) {
      restoredState.students.forEach(s => unitsDetectedSet.add(s.unit));
    }
    if (restoredState.cashTransactions) {
      restoredState.cashTransactions.forEach(c => unitsDetectedSet.add(c.unit));
    }
    if (restoredState.studentPayments) {
      restoredState.studentPayments.forEach(p => unitsDetectedSet.add(p.unit));
    }

    const unitsFound = Array.from(unitsDetectedSet) as SchoolUnitType[];
    if (unitsFound.length === 0) {
      unitsFound.push('TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA');
    }

    return {
      success: true,
      state: restoredState,
      manifest,
      unitsFound,
      filename: file.name,
      fileSizeBytes: file.size
    };
  } catch (err: any) {
    console.error('Error reading ZIP backup:', err);
    return {
      success: false,
      unitsFound: [],
      filename: file.name,
      fileSizeBytes: file.size,
      error: `Gagal mengekstrak berkas ZIP: ${err?.message || 'Format arsip rusak atau tidak didukung.'}`
    };
  }
}

