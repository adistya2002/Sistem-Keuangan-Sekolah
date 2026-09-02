export type SchoolUnitType = 'TK' | 'KB' | 'RQ' | 'SD' | 'SMP' | 'SMA';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN_KEUANGAN' | 'KEPALA_SEKOLAH' | 'GURU_WALI_KELAS';

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  unitAccess: SchoolUnitType | 'ALL';
  assignedClass?: string; // e.g. for Guru Wali Kelas
  passwordHash?: string;
  avatarColor?: string;
}

export interface SchoolProfile {
  id: SchoolUnitType;
  name: string;
  subName: string;
  foundation: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  qrisInfo?: string;
  headmasterName: string;
  headmasterNip?: string;
  treasurerName: string;
  treasurerNip?: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    bgBadge: string;
    textBadge: string;
  };
}

export type StudentStatus = 'AKTIF' | 'LULUS' | 'PINDAH' | 'NONAKTIF';
export type ScholarshipType = 'REGULER' | 'YATIM_100' | 'BEASISWA_50' | 'BERSAUDARA_25' | 'KHUSUS';

export interface Student {
  id: string;
  unit: SchoolUnitType;
  nis: string;
  nisn?: string;
  name: string;
  nickname?: string;
  gender: 'L' | 'P';
  className: string;
  academicYear: string;
  status: StudentStatus;
  scholarship: ScholarshipType;
  discountPercentage: number; // e.g. -5, 0, 25, 50, 100
  parentName: string;
  parentPhone: string; // WhatsApp
  parentAddress?: string;
  notes?: string;
  customSppNominal?: number; // if overriding standard rate
}

export type FeeCategory = 'SPP' | 'DSP' | 'DAFTAR_ULANG' | 'SERAGAM' | 'BUKU' | 'KEGIATAN' | 'CATERING' | 'LAINNYA' | 'SPP_DSP' | 'SPP_DSP_ADM';

export interface PaymentItemDetail {
  id?: string;
  category: FeeCategory;
  name: string;
  nominal: number;
  months?: SppMonth[];
  notes?: string;
}

export interface MasterFee {
  id: string;
  unit: SchoolUnitType;
  academicYear: string;
  category: FeeCategory;
  name: string;
  nominal: number;
  type: 'MONTHLY' | 'ONCE_PER_YEAR' | 'INSTALLMENT';
  targetClass?: string; // 'ALL' or specific class
  description?: string;
  isActiveInPayment?: boolean; // Tampil di kasir Pembayaran SPP & DSP
  bundleGroup?: 'SPP' | 'DSP' | 'ADM';
}

export type SppMonth = 
  | 'Juli' | 'Agustus' | 'September' | 'Oktober' | 'November' | 'Desember'
  | 'Januari' | 'Februari' | 'Maret' | 'April' | 'Mei' | 'Juni';

export const ACADEMIC_MONTHS: SppMonth[] = [
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni'
];

export interface SppPaymentItem {
  month: SppMonth;
  academicYear: string;
  nominal: number;
  discount: number;
  paidAmount: number;
  status: 'LUNAS' | 'SEBAGIAN' | 'BELUM';
  paymentDate?: string;
  receiptNumber?: string;
}

export interface StudentPaymentRecord {
  id: string;
  unit: SchoolUnitType;
  studentId: string;
  studentName: string;
  className: string;
  receiptNumber: string;
  date: string;
  academicYear: string;
  paymentType: FeeCategory;
  // Detail breakdown
  sppMonths?: SppMonth[];
  sppAmount?: number;
  dspInstallment?: {
    totalDsp: number;
    previouslyPaid: number;
    currentPaid: number;
    remaining: number;
  };
  otherFeeDetail?: string;
  otherFeeAmount?: number;
  items?: PaymentItemDetail[];
  totalAmount: number;
  paymentMethod: 'TUNAI' | 'TRANSFER' | 'QRIS';
  bankDestination?: string;
  payerName: string;
  treasurerName: string;
  notes?: string;
  createdAt: string;
}

export type TransactionType = 'MASUK' | 'KELUAR';

export interface CashTransaction {
  id: string;
  unit: SchoolUnitType;
  academicYear: string;
  date: string;
  referenceNo: string; // e.g. BKU-TK-2025-001
  type: TransactionType;
  category: string; // Pos Anggaran
  description: string;
  amount: number;
  paymentMethod: 'TUNAI' | 'TRANSFER' | 'QRIS';
  sourceOrRecipient: string; // dari / untuk
  notes?: string;
  studentPaymentId?: string; // linked to student payment if from SPP
  createdBy: string;
  createdAt: string;
}

export interface BudgetPlanItem {
  id: string;
  unit: SchoolUnitType;
  academicYear: string;
  code: string; // e.g. 1.1, 2.1
  category: 'PENDAPATAN' | 'BELANJA';
  subCategory: string; // e.g. 'Penerimaan SPP', 'Gaji & Honor Guru', 'Bahan Ajar & Media Belajar'
  title: string;
  plannedAmount: number;
  notes?: string;
}

export interface AuditLog {
  id: string;
  unit: SchoolUnitType | 'SYSTEM';
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'DUPLICATE_YEAR' | 'BACKUP' | 'RESTORE';
  module: string;
  details: string;
}

export interface AppState {
  version: string;
  activeUnit: SchoolUnitType;
  activeAcademicYear: string;
  academicYears: string[];
  currentUser: UserAccount;
  users: UserAccount[];
  profiles: Record<SchoolUnitType, SchoolProfile>;
  students: Student[];
  masterFees: MasterFee[];
  studentPayments: StudentPaymentRecord[];
  cashTransactions: CashTransaction[];
  budgetPlans: BudgetPlanItem[];
  auditLogs: AuditLog[];
}
