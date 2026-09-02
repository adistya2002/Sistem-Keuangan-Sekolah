import { SchoolProfile, Student, StudentPaymentRecord, MasterFee, SppMonth, ACADEMIC_MONTHS } from '../types';

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function formatRupiahShort(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)} jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return formatRupiah(amount);
}

export function terbilang(angka: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima',
    'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];

  function konversi(n: number): string {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return konversi(n - 10) + ' Belas';
    } else if (n < 100) {
      return konversi(Math.floor(n / 10)) + ' Puluh ' + konversi(n % 10);
    } else if (n < 200) {
      return 'Seratus ' + konversi(n - 100);
    } else if (n < 1000) {
      return konversi(Math.floor(n / 100)) + ' Ratus ' + konversi(n % 100);
    } else if (n < 2000) {
      return 'Seribu ' + konversi(n - 1000);
    } else if (n < 1000000) {
      return konversi(Math.floor(n / 1000)) + ' Ribu ' + konversi(n % 1000);
    } else if (n < 1000000000) {
      return konversi(Math.floor(n / 1000000)) + ' Juta ' + konversi(n % 1000000);
    } else if (n < 1000000000000) {
      return konversi(Math.floor(n / 1000000000)) + ' Miliar ' + konversi(n % 1000000000);
    } else {
      return 'Angka Terlalu Besar';
    }
  }

  const clean = Math.abs(Math.floor(angka));
  if (clean === 0) return 'Nol Rupiah';
  const hasil = konversi(clean).replace(/\s+/g, ' ').trim();
  return `${hasil} Rupiah`;
}

export function formatDateIndo(dateInput: string | Date): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export function getReportCity(profile?: { address?: string }): string {
  if (!profile || !profile.address) return 'Sinjai';
  const addr = profile.address;
  if (addr.toLowerCase().includes('sinjai')) return 'Sinjai';
  if (addr.toLowerCase().includes('makassar')) return 'Makassar';
  if (addr.toLowerCase().includes('jakarta')) return 'Jakarta';
  if (addr.toLowerCase().includes('surabaya')) return 'Surabaya';
  if (addr.toLowerCase().includes('bandung')) return 'Bandung';
  if (addr.toLowerCase().includes('gowa')) return 'Gowa';
  if (addr.toLowerCase().includes('bulukumba')) return 'Bulukumba';
  if (addr.toLowerCase().includes('bone')) return 'Bone';
  
  const kabMatch = addr.match(/Kab(?:\.|upaten)?\s+([A-Za-z]+)/i);
  if (kabMatch && kabMatch[1]) return kabMatch[1];
  const kotaMatch = addr.match(/Kota\s+([A-Za-z]+)/i);
  if (kotaMatch && kotaMatch[1]) return kotaMatch[1];

  return 'Sinjai';
}

export function formatReportSignatureDate(profile?: { address?: string }, customDate?: string | Date): string {
  const city = getReportCity(profile);
  // Mengikuti tanggal real-time (hari ini) secara default
  const d = customDate ? (typeof customDate === 'string' ? new Date(customDate) : customDate) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  return `${city}, ${formatDateIndo(validDate)}`;
}

export function formatDateShort(dateInput: string | Date): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function getCurrentAcademicMonth(): SppMonth {
  const monthIdx = new Date().getMonth(); // 0 = Jan, 1 = Feb, ..., 7 = Aug, 11 = Dec
  const calMap: SppMonth[] = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return calMap[monthIdx] || 'Agustus';
}

export function getTodayDateStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentMonthDateRange(): { startDate: string; endDate: string; monthName: SppMonth; year: number } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const mStr = String(m + 1).padStart(2, '0');
  const lastDay = new Date(y, m + 1, 0).getDate();
  const calMap: SppMonth[] = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return {
    startDate: `${y}-${mStr}-01`,
    endDate: `${y}-${mStr}-${String(lastDay).padStart(2, '0')}`,
    monthName: calMap[m] || 'Agustus',
    year: y
  };
}

export function formatDateTimeIndo(dateInput?: string | Date): string {
  const d = dateInput ? (typeof dateInput === 'string' ? new Date(dateInput) : dateInput) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = days[validDate.getDay()];
  const day = validDate.getDate();
  const monthName = months[validDate.getMonth()];
  const year = validDate.getFullYear();
  const hours = String(validDate.getHours()).padStart(2, '0');
  const mins = String(validDate.getMinutes()).padStart(2, '0');
  const secs = String(validDate.getSeconds()).padStart(2, '0');

  return `${dayName}, ${day} ${monthName} ${year} • ${hours}:${mins}:${secs} WITA`;
}

export function getMonthIndexInAcademicYear(monthName: SppMonth): number {
  return ACADEMIC_MONTHS.indexOf(monthName);
}

export interface StudentArrearsInfo {
  student: Student;
  monthlySppRate: number;
  unpaidMonths: SppMonth[];
  sppArrearsTotal: number;
  dspTotal: number;
  dspPaid: number;
  dspRemaining: number;
  otherArrearsTotal: number;
  totalArrears: number;
  monthsOverdueCount: number;
}

export function calculateStudentArrears(
  student: Student,
  academicYear: string,
  payments: StudentPaymentRecord[],
  masterFees: MasterFee[],
  currentAcademicMonthLimit: SppMonth = getCurrentAcademicMonth() // Real-time month default
): StudentArrearsInfo {
  // Find applicable SPP master fee for student unit & year
  const sppFee = masterFees.find(
    f => f.unit === student.unit && f.academicYear === academicYear && f.category === 'SPP'
  );
  const baseSpp = student.customSppNominal ?? sppFee?.nominal ?? 150000;
  const discountMultiplier = (100 - (student.discountPercentage || 0)) / 100;
  const effectiveSpp = baseSpp * discountMultiplier;

  // Find all SPP payments for this student in this academic year
  const studentSppPayments = payments.filter(
    p => p.studentId === student.id && p.academicYear === academicYear && (p.paymentType === 'SPP' || (p.sppMonths && p.sppMonths.length > 0))
  );

  const paidMonthsSet = new Set<SppMonth>();
  studentSppPayments.forEach(p => {
    p.sppMonths?.forEach(m => paidMonthsSet.add(m));
  });

  const limitIndex = getMonthIndexInAcademicYear(currentAcademicMonthLimit);
  const unpaidMonths: SppMonth[] = [];

  ACADEMIC_MONTHS.forEach((month, idx) => {
    // Only count as overdue if within or before the current limit month and student status is AKTIF
    if (idx <= limitIndex && !paidMonthsSet.has(month)) {
      unpaidMonths.push(month);
    }
  });

  const sppArrearsTotal = unpaidMonths.length * effectiveSpp;

  // DSP (Uang Pangkal) calculation
  const dspFee = masterFees.find(
    f => f.unit === student.unit && f.academicYear === academicYear && f.category === 'DSP'
  );
  const dspTarget = dspFee?.nominal || 0;
  
  const dspPayments = payments.filter(
    p => p.studentId === student.id && p.academicYear === academicYear && (p.paymentType === 'DSP' || p.dspInstallment !== undefined)
  );
  const dspPaid = dspPayments.reduce((sum, p) => {
    if (p.dspInstallment) {
      return sum + p.dspInstallment.currentPaid;
    }
    if (p.paymentType === 'DSP') {
      return sum + p.totalAmount;
    }
    return sum;
  }, 0);
  const dspRemaining = Math.max(0, dspTarget - dspPaid);

  const totalArrears = sppArrearsTotal + dspRemaining;

  return {
    student,
    monthlySppRate: effectiveSpp,
    unpaidMonths,
    sppArrearsTotal,
    dspTotal: dspTarget,
    dspPaid,
    dspRemaining,
    otherArrearsTotal: 0,
    totalArrears,
    monthsOverdueCount: unpaidMonths.length
  };
}

export function generateWhatsAppReminder(
  info: StudentArrearsInfo,
  school: SchoolProfile,
  academicYear: string
): { message: string; url: string } {
  const { student, unpaidMonths, sppArrearsTotal, dspRemaining, totalArrears } = info;

  const phone = student.parentPhone.replace(/[^0-9]/g, '');
  const formattedPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;

  let breakdownText = '';
  if (unpaidMonths.length > 0) {
    breakdownText += `• SPP Bulan: ${unpaidMonths.join(', ')} (${formatRupiah(sppArrearsTotal)})\n`;
  }
  if (dspRemaining > 0) {
    breakdownText += `• Sisa DSP/Uang Pangkal: ${formatRupiah(dspRemaining)}\n`;
  }

  const message = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
    `Yth. Bapak/Ibu Wali dari ananda *${student.name}* (Kelas: *${student.className}*)\n` +
    `Unit: *${school.name}*\n\n` +
    `Semoga Bapak/Ibu senantiasa dalam limpahan rahmat dan lindungan Allah SWT.\n\n` +
    `Berdasarkan pencatatan administrasi keuangan Tahun Ajaran ${academicYear}, kami sampaikan informasi tagihan administrasi ananda sebagai berikut:\n\n` +
    `${breakdownText}` +
    `*TOTAL TAGIHAN: ${formatRupiah(totalArrears)}*\n\n` +
    `Pembayaran dapat dilakukan secara tunai di kantor bendahara sekolah atau transfer ke rekening resmi sekolah:\n` +
    `🏦 Bank: *${school.bankName}*\n` +
    `💳 No. Rek: *${school.bankAccount}*\n` +
    `👤 A.n: *${school.bankHolder}*\n\n` +
    `Mohon konfirmasi bukti transfer ke nomor WhatsApp ini setelah melakukan transaksi.\n\n` +
    `Atas perhatian dan kerjasamanya kami ucapkan terima kasih.\n` +
    `_Jazakumullahu Khairan Katsiran_.\n\n` +
    `Wassalamu'alaikum Warahmatullahi Wabarakatuh,\n` +
    `*Bendahara Keuangan ${school.name}*`;

  const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

  return { message, url };
}

export interface AcademicYearDateRange {
  startDate: string;
  endDate: string;
  startYear: number;
  endYear: number;
}

export function parseAcademicYear(academicYear: string): { startYear: number; endYear: number } {
  const parts = academicYear.split(/[\/\-]/);
  let startYear = parseInt(parts[0], 10);
  let endYear = parts.length > 1 ? parseInt(parts[1], 10) : startYear + 1;
  
  if (isNaN(startYear) || startYear < 2000) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-indexed, July is 6
    startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
    endYear = startYear + 1;
  }
  if (isNaN(endYear) || endYear <= startYear) {
    endYear = startYear + 1;
  }

  return { startYear, endYear };
}

export function getAcademicYearDateRange(academicYear: string): AcademicYearDateRange {
  const { startYear, endYear } = parseAcademicYear(academicYear);
  return {
    startDate: `${startYear}-07-01`,
    endDate: `${endYear}-06-30`,
    startYear,
    endYear
  };
}

export function getAcademicYearSemesterRange(academicYear: string, semester: 1 | 2): { startDate: string; endDate: string; label: string } {
  const { startYear, endYear } = parseAcademicYear(academicYear);
  if (semester === 1) {
    return {
      startDate: `${startYear}-07-01`,
      endDate: `${startYear}-12-31`,
      label: `Semester Ganjil (Juli - Desember ${startYear})`
    };
  } else {
    return {
      startDate: `${endYear}-01-01`,
      endDate: `${endYear}-06-30`,
      label: `Semester Genap (Januari - Juni ${endYear})`
    };
  }
}

export function getAcademicYearMonthRange(academicYear: string, monthName: SppMonth): { startDate: string; endDate: string } {
  const { startYear, endYear } = parseAcademicYear(academicYear);
  
  const norm = String(monthName).toUpperCase();
  const monthMap: Record<string, { monthNum: number; isNextYear: boolean; lastDay: number }> = {
    JULI: { monthNum: 7, isNextYear: false, lastDay: 31 },
    AGUSTUS: { monthNum: 8, isNextYear: false, lastDay: 31 },
    SEPTEMBER: { monthNum: 9, isNextYear: false, lastDay: 30 },
    OKTOBER: { monthNum: 10, isNextYear: false, lastDay: 31 },
    NOVEMBER: { monthNum: 11, isNextYear: false, lastDay: 30 },
    DESEMBER: { monthNum: 12, isNextYear: false, lastDay: 31 },
    JANUARI: { monthNum: 1, isNextYear: true, lastDay: 31 },
    FEBRUARI: { monthNum: 2, isNextYear: true, lastDay: (endYear % 4 === 0 && (endYear % 100 !== 0 || endYear % 400 === 0)) ? 29 : 28 },
    MARET: { monthNum: 3, isNextYear: true, lastDay: 31 },
    APRIL: { monthNum: 4, isNextYear: true, lastDay: 30 },
    MEI: { monthNum: 5, isNextYear: true, lastDay: 31 },
    JUNI: { monthNum: 6, isNextYear: true, lastDay: 30 }
  };

  const info = monthMap[norm] || { monthNum: 7, isNextYear: false, lastDay: 31 };
  const y = info.isNextYear ? endYear : startYear;
  const mStr = String(info.monthNum).padStart(2, '0');
  const dStr = String(info.lastDay).padStart(2, '0');

  return {
    startDate: `${y}-${mStr}-01`,
    endDate: `${y}-${mStr}-${dStr}`
  };
}
