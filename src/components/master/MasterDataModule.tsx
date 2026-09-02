import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, MasterFee, SchoolProfile, ScholarshipType, SchoolUnitType, FeeCategory } from '../../types';
import { 
  Users, DollarSign, CopyPlus, Building2, Plus, 
  Edit3, Trash2, Check, X, ArrowRight, Sparkles, AlertCircle, Save,
  BookOpen, Award, Filter, Search, Layers, Bookmark, CheckCircle2,
  ToggleLeft, ToggleRight, Eye, Settings2, PackageCheck, FileText,
  CheckSquare, Square, HelpCircle, RefreshCw, Sliders, Receipt,
  GraduationCap, Tag, ShoppingBag, ShieldCheck
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { SchoolLogo } from '../common/SchoolLogo';

export const MasterDataModule: React.FC = () => {
  const { 
    state, 
    activeUnit, 
    activeProfile, 
    activeAcademicYear, 
    currentUser,
    addStudent,
    updateStudent,
    deleteStudent,
    addMasterFee,
    updateMasterFee,
    deleteMasterFee,
    updateSchoolProfile,
    duplicateAcademicYear 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'FEES' | 'DUPLICATE' | 'PROFILE'>('STUDENTS');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');

  // Selected Unit for Master Tarif Tab (defaults to activeUnit)
  const [selectedFeeUnit, setSelectedFeeUnit] = useState<SchoolUnitType>(activeUnit);

  // Sync selectedFeeUnit when activeUnit changes
  useEffect(() => {
    setSelectedFeeUnit(activeUnit);
  }, [activeUnit]);

  // Simulation state for Live Kasir Preview in Master Tarif tab
  const [simBundleMode, setSimBundleMode] = useState<'SPP_ONLY' | 'SPP_DSP' | 'SPP_DSP_ADM'>('SPP_DSP_ADM');
  const [simMonthsCount, setSimMonthsCount] = useState<number>(1);

  // Student Form / Edit Modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentForm, setStudentForm] = useState({
    nis: '',
    name: '',
    nickname: '',
    gender: 'L' as 'L' | 'P',
    className: 'TK A1 (Thoriq)',
    status: 'AKTIF' as any,
    scholarship: 'REGULER' as ScholarshipType,
    discountPercentage: 0,
    parentName: '',
    parentPhone: '',
    parentAddress: '',
    notes: '',
    customSppNominal: ''
  });

  // Fee Form / Edit Modal
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<MasterFee | null>(null);
  const [feeForm, setFeeForm] = useState({
    unit: activeUnit as SchoolUnitType,
    category: 'SPP' as FeeCategory,
    name: '',
    nominal: '',
    type: 'MONTHLY' as any,
    targetClass: 'ALL',
    description: '',
    isActiveInPayment: true
  });

  // Duplicate Year Form & Custom Fee Adjustments State
  const [newYearInput, setNewYearInput] = useState('2026/2027');
  const [copyStudentsOption, setCopyStudentsOption] = useState(true);
  const [promoteOption, setPromoteOption] = useState(true);
  
  // Custom fees to be duplicated
  const [dupFeesCustom, setDupFeesCustom] = useState<{ [feeId: string]: { nominal: number; included: boolean } }>({});
  const [dupActiveUnitTab, setDupActiveUnitTab] = useState<SchoolUnitType>('TK');

  // Initialize dupFeesCustom from current academic year masterFees
  useEffect(() => {
    const currentYearFees = state.masterFees.filter(f => f.academicYear === activeAcademicYear);
    const initialMap: { [feeId: string]: { nominal: number; included: boolean } } = {};
    currentYearFees.forEach(f => {
      initialMap[f.id] = {
        nominal: f.nominal,
        included: f.isActiveInPayment !== false
      };
    });
    setDupFeesCustom(initialMap);
  }, [state.masterFees, activeAcademicYear]);

  // Profile Form
  const [profileForm, setProfileForm] = useState<SchoolProfile>({ ...activeProfile });

  // Sync profileForm when activeProfile or activeUnit changes
  useEffect(() => {
    setProfileForm({ ...activeProfile });
    setSelectedClassFilter('ALL');
  }, [activeProfile, activeUnit]);

  // Unit-specific class suggestions (Metode UMMI for RQ, SD/SMP/SMA classes)
  const unitClassPresets = useMemo(() => {
    if (activeUnit === 'TK') {
      return ['TK A1 (Thoriq)', 'TK A2 (Hamzah)', 'TK B1 (Ali)', 'TK B2 (Umar)'];
    }
    if (activeUnit === 'KB') {
      return ['KB Bintang (Usia 3-4)', 'KB Bulan (Usia 2-3)', 'KB Matahari (Usia 3-4)'];
    }
    if (activeUnit === 'SD') {
      return ['Kelas 1 Abu Bakar', 'Kelas 2 Umar', 'Kelas 3 Utsman', 'Kelas 4 Ali', 'Kelas 5 Bilal', 'Kelas 6 Khalid'];
    }
    if (activeUnit === 'SMP') {
      return ['Kelas 7 Al-Fatih', 'Kelas 8 Shalahuddin', 'Kelas 9 Thoriq'];
    }
    if (activeUnit === 'SMA') {
      return ['Kelas 10 MIPA', 'Kelas 11 MIPA', 'Kelas 12 MIPA', 'Kelas 10 IPS', 'Kelas 11 IPS', 'Kelas 12 IPS'];
    }
    return [
      'UMMI Jilid 1',
      'UMMI Jilid 2',
      'UMMI Jilid 3',
      'UMMI Jilid 4',
      'UMMI Jilid 5',
      'UMMI Jilid 6',
      'Program Tartil Metode UMMI',
      'Program Tahfizh Metode UMMI',
      'Program Turjuman Metode UMMI'
    ];
  }, [activeUnit]);

  // Current unit & year students
  const students = useMemo(() => {
    return state.students.filter(
      s => s.unit === activeUnit && s.academicYear === activeAcademicYear
    );
  }, [state.students, activeUnit, activeAcademicYear]);

  // Filtered students for display
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (selectedClassFilter !== 'ALL' && s.className !== selectedClassFilter) {
        return false;
      }
      if (studentSearchTerm.trim()) {
        const q = studentSearchTerm.toLowerCase();
        const match = 
          s.name.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.className.toLowerCase().includes(q) ||
          (s.parentName && s.parentName.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [students, selectedClassFilter, studentSearchTerm]);

  // Current unit & year fees
  const fees = useMemo(() => {
    return state.masterFees.filter(
      f => f.unit === activeUnit && f.academicYear === activeAcademicYear
    );
  }, [state.masterFees, activeUnit, activeAcademicYear]);

  // Handle open student modal
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    const seq = String(students.length + 1).padStart(2, '0');
    setStudentForm({
      nis: `${activeUnit}-25${seq}`,
      name: '',
      nickname: '',
      gender: 'L',
      className: activeUnit === 'TK' 
        ? 'TK A1 (Thoriq)' 
        : activeUnit === 'KB' 
        ? 'KB Bintang (Usia 3-4)' 
        : activeUnit === 'SD' 
        ? 'Kelas 1 Abu Bakar' 
        : activeUnit === 'SMP' 
        ? 'Kelas 7 Al-Fatih' 
        : activeUnit === 'SMA' 
        ? 'Kelas 10 MIPA' 
        : 'UMMI Jilid 1',
      status: 'AKTIF',
      scholarship: 'REGULER',
      discountPercentage: 0,
      parentName: '',
      parentPhone: '',
      parentAddress: '',
      notes: '',
      customSppNominal: ''
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (s: Student) => {
    setEditingStudent(s);
    setStudentForm({
      nis: s.nis,
      name: s.name,
      nickname: s.nickname || '',
      gender: s.gender,
      className: s.className,
      status: s.status,
      scholarship: s.scholarship,
      discountPercentage: s.discountPercentage || 0,
      parentName: s.parentName || '',
      parentPhone: s.parentPhone || '',
      parentAddress: s.parentAddress || '',
      notes: s.notes || '',
      customSppNominal: s.customSppNominal ? String(s.customSppNominal) : ''
    });
    setIsStudentModalOpen(true);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.name.trim()) {
      alert('Mohon isi nama siswa/santri.');
      return;
    }

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        ...studentForm,
        customSppNominal: studentForm.customSppNominal ? parseFloat(studentForm.customSppNominal) : undefined
      });
      alert('Data siswa/santri berhasil diperbarui!');
    } else {
      addStudent({
        unit: activeUnit,
        academicYear: activeAcademicYear,
        ...studentForm,
        customSppNominal: studentForm.customSppNominal ? parseFloat(studentForm.customSppNominal) : undefined
      });
      alert('Siswa/santri baru berhasil ditambahkan!');
    }
    setIsStudentModalOpen(false);
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus data "${name}"?`)) {
      deleteStudent(id);
    }
  };

  // Fees for selected unit
  const feesForSelectedUnit = useMemo(() => {
    return state.masterFees.filter(
      f => f.unit === selectedFeeUnit && f.academicYear === activeAcademicYear
    );
  }, [state.masterFees, selectedFeeUnit, activeAcademicYear]);

  // Master fee objects for SPP & DSP
  const sppMasterFee = useMemo(() => {
    return feesForSelectedUnit.find(f => f.category === 'SPP');
  }, [feesForSelectedUnit]);

  const dspMasterFee = useMemo(() => {
    return feesForSelectedUnit.find(f => f.category === 'DSP');
  }, [feesForSelectedUnit]);

  // Admin and other fees
  const adminMasterFees = useMemo(() => {
    return feesForSelectedUnit.filter(f => f.category !== 'SPP' && f.category !== 'DSP');
  }, [feesForSelectedUnit]);

  // Toggle active in payment for admin fee
  const handleToggleFeeActiveInPayment = (f: MasterFee) => {
    const nextVal = f.isActiveInPayment === false ? true : false;
    updateMasterFee({
      ...f,
      isActiveInPayment: nextVal
    });
  };

  // Fee modal handlers
  const handleOpenAddFee = (presetCategory?: FeeCategory, presetName?: string, presetNominal?: number, presetType?: any) => {
    setEditingFee(null);
    setFeeForm({
      unit: selectedFeeUnit,
      category: presetCategory || 'DAFTAR_ULANG',
      name: presetName || '',
      nominal: presetNominal !== undefined 
        ? String(presetNominal) 
        : (presetCategory === 'SPP' 
            ? (selectedFeeUnit === 'TK' ? '250000' : selectedFeeUnit === 'KB' ? '200000' : '150000') 
            : '0'),
      type: presetType || 'ONCE_PER_YEAR',
      targetClass: 'ALL',
      description: '',
      isActiveInPayment: true
    });
    setIsFeeModalOpen(true);
  };

  const handleOpenEditFee = (f: MasterFee) => {
    setEditingFee(f);
    setFeeForm({
      unit: f.unit,
      category: f.category,
      name: f.name,
      nominal: String(f.nominal),
      type: f.type,
      targetClass: f.targetClass || 'ALL',
      description: f.description || '',
      isActiveInPayment: f.isActiveInPayment !== false
    });
    setIsFeeModalOpen(true);
  };

  const handleFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawVal = feeForm.nominal.trim();
    const num = parseFloat(rawVal === '' ? '0' : rawVal);

    if (isNaN(num) || num < 0) {
      alert('Nominal biaya tidak valid (tidak boleh bernilai negatif).');
      return;
    }

    if (feeForm.category === 'SPP' && num <= 0) {
      alert('Nominal tarif SPP bulanan harus lebih besar dari Rp 0.');
      return;
    }

    if (editingFee) {
      updateMasterFee({
        ...editingFee,
        ...feeForm,
        nominal: num
      });
      alert(`Tarif biaya "${feeForm.name}" berhasil diperbarui!`);
    } else {
      addMasterFee({
        academicYear: activeAcademicYear,
        ...feeForm,
        nominal: num
      });
      alert(`Tarif biaya "${feeForm.name}" berhasil disimpan dan aktif di sistem!`);
    }
    setIsFeeModalOpen(false);
  };

  const handleDeleteFee = (id: string, name: string) => {
    if (confirm(`Hapus tarif "${name}"?`)) {
      deleteMasterFee(id);
    }
  };

  // Standard template reset / seed
  const handleApplyStandardTemplate = (unit: SchoolUnitType) => {
    if (!confirm(`Terapkan template pos tarif standar untuk Unit ${unit}? Pos yang belum ada akan ditambahkan otomatis.`)) {
      return;
    }

    let defaultItems: Array<{ category: FeeCategory; name: string; nominal: number; type: any; desc: string }> = [];

    if (unit === 'TK') {
      defaultItems = [
        { category: 'SPP', name: 'SPP Bulanan TK IT', nominal: 250000, type: 'MONTHLY', desc: 'Iuran wajib bulanan siswa TK IT' },
        { category: 'DSP', name: 'DSP Uang Pangkal Gedung TK', nominal: 2500000, type: 'INSTALLMENT', desc: 'Dana Sumbangan Pendidikan Gedung & Sarana' },
        { category: 'DAFTAR_ULANG', name: 'Daftar Ulang & Puncak Tema', nominal: 450000, type: 'ONCE_PER_YEAR', desc: 'Kegiatan tematik, puncak tema & administrasi tahunan' },
        { category: 'SERAGAM', name: 'Paket 4 Stel Seragam TK + Atribut', nominal: 650000, type: 'ONCE_PER_YEAR', desc: 'Seragam batik, olahraga, muslim, kotak-kotak' },
        { category: 'BUKU', name: 'Paket Buku Sentra & Lembar Kerja', nominal: 350000, type: 'ONCE_PER_YEAR', desc: 'Buku aktivitas tematik sentra & media belajar' },
        { category: 'KEGIATAN', name: 'Outing Class & Renang TK', nominal: 250000, type: 'ONCE_PER_YEAR', desc: 'Edukasi luar kelas & kegiatan outing' },
        { category: 'CATERING', name: 'Catering Sehat / PMT Mingguan', nominal: 120000, type: 'MONTHLY', desc: 'Pemberian Makanan Tambahan bergizi' },
      ];
    } else if (unit === 'KB') {
      defaultItems = [
        { category: 'SPP', name: 'SPP Bulanan Kelompok Bermain', nominal: 200000, type: 'MONTHLY', desc: 'Iuran bulanan bermain & belajar KB' },
        { category: 'DSP', name: 'DSP Uang Pangkal Gedung KB', nominal: 1800000, type: 'INSTALLMENT', desc: 'Dana Sarana Prasarana Gedung KB' },
        { category: 'DAFTAR_ULANG', name: 'Daftar Ulang & Kegiatan Tematik KB', nominal: 350000, type: 'ONCE_PER_YEAR', desc: 'Administrasi tahunan & ragam main sentra' },
        { category: 'SERAGAM', name: 'Paket Seragam KB (2 Stel)', nominal: 450000, type: 'ONCE_PER_YEAR', desc: 'Seragam olahraga & batik KB' },
        { category: 'BUKU', name: 'Buku Cerita & Lembar Kreativitas Sentra', nominal: 250000, type: 'ONCE_PER_YEAR', desc: 'Media stimulasi sensori & motorik' },
      ];
    } else if (unit === 'SD') {
      defaultItems = [
        { category: 'SPP', name: 'SPP Bulanan SD IT', nominal: 350000, type: 'MONTHLY', desc: 'Iuran SPP bulanan program Full Day School SD IT' },
        { category: 'DSP', name: 'DSP Uang Pangkal Gedung SD IT', nominal: 3500000, type: 'INSTALLMENT', desc: 'Infaq pembangunan gedung & sarana belajar SD IT' },
        { category: 'DAFTAR_ULANG', name: 'Daftar Ulang & Administrasi Tahunan SD', nominal: 650000, type: 'ONCE_PER_YEAR', desc: 'Registrasi tahun ajaran baru & kalender akademik' },
        { category: 'SERAGAM', name: 'Paket 5 Stel Seragam SD IT + Atribut', nominal: 850000, type: 'ONCE_PER_YEAR', desc: 'Seragam merah putih, batik khas, pramuka SIT, olahraga, gamis' },
        { category: 'BUKU', name: 'Paket Buku Tematik Kumer & Diniyah SD', nominal: 550000, type: 'ONCE_PER_YEAR', desc: 'Buku kurikulum merdeka & modul diniyah tahfizh' },
        { category: 'KEGIATAN', name: 'Perkemahan Pramuka SIT & Outbound SD', nominal: 350000, type: 'ONCE_PER_YEAR', desc: 'Kemah ukhuwah, field trip, dan rihlah edukatif' },
        { category: 'CATERING', name: 'Katering Makan Siang SD Full Day', nominal: 250000, type: 'MONTHLY', desc: 'Makan siang & snack bergizi harian siswa' },
      ];
    } else if (unit === 'SMP') {
      defaultItems = [
        { category: 'SPP', name: 'SPP Bulanan SMP IT', nominal: 450000, type: 'MONTHLY', desc: 'Iuran SPP bulanan kurikulum terpadu SMP IT' },
        { category: 'DSP', name: 'DSP Uang Sarpras & Gedung SMP IT', nominal: 4500000, type: 'INSTALLMENT', desc: 'Dana pengembangan laboratorium & sarana belajar SMP IT' },
        { category: 'DAFTAR_ULANG', name: 'Daftar Ulang & Registrasi Akademik SMP', nominal: 750000, type: 'ONCE_PER_YEAR', desc: 'Administrasi tahunan, evaluasi berkala & CBT' },
        { category: 'SERAGAM', name: 'Paket Seragam Lengkap SMP IT', nominal: 950000, type: 'ONCE_PER_YEAR', desc: 'Seragam biru putih, pramuka, batik khas, olahraga' },
        { category: 'BUKU', name: 'Paket Buku Teks Nasional & Modul Pesantren', nominal: 650000, type: 'ONCE_PER_YEAR', desc: 'Buku referensi sains, bahasa arab, hadits & tahfizh' },
        { category: 'KEGIATAN', name: 'Mabit, LDKS & Ujian Tahfizh SMP IT', nominal: 450000, type: 'ONCE_PER_YEAR', desc: 'Latihan kepemimpinan, mabit bulanan & tasmi qur\'an' },
      ];
    } else if (unit === 'SMA') {
      defaultItems = [
        { category: 'SPP', name: 'SPP Bulanan SMA IT', nominal: 550000, type: 'MONTHLY', desc: 'Iuran SPP bulanan program unggulan SMA IT' },
        { category: 'DSP', name: 'DSP Uang Pengembangan Gedung SMA IT', nominal: 5500000, type: 'INSTALLMENT', desc: 'Infaq pengembangan fasilitas kampus & riset SMA IT' },
        { category: 'DAFTAR_ULANG', name: 'Daftar Ulang & Registrasi Tahunan SMA', nominal: 850000, type: 'ONCE_PER_YEAR', desc: 'Registrasi tahun ajaran, ujian berbasis komputer & try out' },
        { category: 'SERAGAM', name: 'Paket Seragam Khas SMA IT', nominal: 1050000, type: 'ONCE_PER_YEAR', desc: 'Seragam abu-abu putih, jas almamater, batik, olahraga' },
        { category: 'BUKU', name: 'Paket Modul Persiapan PTN & Studi Islam', nominal: 750000, type: 'ONCE_PER_YEAR', desc: 'Modul UTBK-SNBT, kedinasan & literatur keislaman' },
        { category: 'KEGIATAN', name: 'Studi Kampus, Karir & Karya Tulis Ilmiah', nominal: 600000, type: 'ONCE_PER_YEAR', desc: 'Kunjungan perguruan tinggi, expo karir & seminar riset' },
      ];
    } else {
      defaultItems = [
        { category: 'SPP', name: 'SPP Bulanan Rumah Qur\'an (RQ)', nominal: 150000, type: 'MONTHLY', desc: 'Iuran halaqoh pembelajaran Al-Qur\'an bulanan' },
        { category: 'DSP', name: 'DSP Uang Sarana & Mushaf Gedung RQ', nominal: 1000000, type: 'INSTALLMENT', desc: 'Infaq pengembangan sarana & Al-Qur\'an wakaf' },
        { category: 'BUKU', name: 'Paket Buku & Modul Al-Qur\'an Metode UMMI', nominal: 180000, type: 'ONCE_PER_YEAR', desc: 'Jilid UMMI, Tajwid, Ghorib, Al-Qur\'an & Buku Prestasi' },
        { category: 'SERAGAM', name: 'Rompi & Busana Muslim Santri RQ', nominal: 250000, type: 'ONCE_PER_YEAR', desc: 'Seragam seragam santri RQ metode UMMI' },
        { category: 'KEGIATAN', name: 'Wisuda Munaqosyah & Khotmil Qur\'an', nominal: 300000, type: 'ONCE_PER_YEAR', desc: 'Ujian Munaqosyah UMMI, Sertifikasi & Wisuda' },
      ];
    }

    // Check existing fees and add missing ones
    defaultItems.forEach(item => {
      const exists = state.masterFees.some(
        f => f.unit === unit && f.academicYear === activeAcademicYear && (f.category === item.category || f.name === item.name)
      );
      if (!exists) {
        addMasterFee({
          unit,
          academicYear: activeAcademicYear,
          category: item.category,
          name: item.name,
          nominal: item.nominal,
          type: item.type,
          description: item.desc,
          isActiveInPayment: true,
          targetClass: 'ALL'
        });
      }
    });

    alert(`Template standar tarif Unit ${unit} berhasil diterapkan / diperbarui!`);
  };

  // Handle Duplicate Year with customized fees for all units
  const handleExecuteDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearInput.trim()) {
      alert('Mohon masukkan format tahun ajaran, misal: 2026/2027.');
      return;
    }
    if (state.academicYears.includes(newYearInput.trim())) {
      alert(`Tahun ajaran ${newYearInput} sudah ada dalam sistem.`);
      return;
    }

    // Build custom fees array from current master fees and user customizations
    const currentYearFees = state.masterFees.filter(f => f.academicYear === activeAcademicYear);
    const customClonedFees: MasterFee[] = [];

    currentYearFees.forEach(f => {
      const customConfig = dupFeesCustom[f.id];
      // If fee is SPP or DSP, always include with adjusted nominal
      if (f.category === 'SPP' || f.category === 'DSP') {
        customClonedFees.push({
          ...f,
          nominal: customConfig ? customConfig.nominal : f.nominal,
          isActiveInPayment: true
        });
      } else {
        // Administration fees: include only if checked/included
        const isIncluded = customConfig ? customConfig.included : (f.isActiveInPayment !== false);
        if (isIncluded) {
          customClonedFees.push({
            ...f,
            nominal: customConfig ? customConfig.nominal : f.nominal,
            isActiveInPayment: true
          });
        }
      }
    });

    duplicateAcademicYear(newYearInput.trim(), copyStudentsOption, promoteOption, customClonedFees);
    alert(`🎉 Sukses! Master template tarif dan data telah berhasil digandakan ke Tahun Ajaran Baru: ${newYearInput}. Sistem otomatis beralih ke TA baru.`);
  };

  // Profile save
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(activeUnit, profileForm);
    alert(`Profil dan identitas resmi ${activeProfile.name} berhasil disimpan!`);
  };

  // Helper badge color for classes / halaqoh
  const getClassBadgeStyle = (cls: string) => {
    if (cls.includes('Jilid 1') || cls.includes('Jilid 2') || cls.includes('Jilid 3')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (cls.includes('Jilid 4') || cls.includes('Jilid 5') || cls.includes('Jilid 6')) {
      return 'bg-teal-50 text-teal-800 border-teal-200';
    }
    if (cls.includes('Tartil')) {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (cls.includes('Tahfizh')) {
      return 'bg-purple-50 text-purple-800 border-purple-200';
    }
    if (cls.includes('Turjuman')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-cyan-600">
              Master & Template
            </span>
            <span className="text-xs font-semibold text-slate-500">Unit {activeUnit} • TA {activeAcademicYear}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Master Data, Tarif & Duplikasi Tahun Ajaran</h2>
          <p className="text-xs text-slate-500">Kelola master siswa, struktur tarif, profil yayasan & gandakan konfigurasi tahun ajaran baru</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-xs gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'STUDENTS'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>1. Data Murid / Santri ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('FEES')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'FEES'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>2. Master Tarif & Biaya ({fees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DUPLICATE')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DUPLICATE'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CopyPlus className="w-4 h-4" />
          <span>3. 🔄 Duplikasi Tahun Ajaran Baru</span>
        </button>

        <button
          onClick={() => {
            setProfileForm({ ...activeProfile });
            setActiveTab('PROFILE');
          }}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'PROFILE'
              ? 'border-cyan-600 text-cyan-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>4. Profil Sekolah & Rekening Bank</span>
        </button>
      </div>

      {/* Tab 1: Data Murid / Santri */}
      {activeTab === 'STUDENTS' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                {activeUnit === 'RQ' ? 'Daftar Santri Metode UMMI & Tahfidz RQ' : `Daftar Murid Unit ${activeUnit}`} 
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  T.A {activeAcademicYear} ({filteredStudents.length} {activeUnit === 'RQ' ? 'Santri' : 'Murid'})
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {activeUnit === 'RQ' 
                  ? 'Master data santri Metode UMMI (Jilid 1-6, Tartil, Tahfizh, Turjuman), beasiswa dan kontak wali' 
                  : 'Master data murid, kelompok/kelas, beasiswa dan nomor WhatsApp wali murid'}
              </p>
            </div>
            <button
              onClick={handleOpenAddStudent}
              className="px-4 py-2 bg-[#8B9D83] hover:bg-[#7A8C72] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>{activeUnit === 'RQ' ? '+ Tambah Santri Baru' : '+ Tambah Murid Baru'}</span>
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={activeUnit === 'RQ' ? 'Cari nama santri, NIS, halaqoh UMMI, nama wali...' : 'Cari nama murid, NIS, kelas, nama wali...'}
                  value={studentSearchTerm}
                  onChange={(e) => setStudentSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                {studentSearchTerm && (
                  <button 
                    onClick={() => setStudentSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span className="font-semibold">{activeUnit === 'RQ' ? 'Filter Halaqoh:' : 'Filter Kelas:'}</span>
              </div>
            </div>

            {/* Quick Class Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setSelectedClassFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedClassFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Semua ({students.length})
              </button>
              {unitClassPresets.map((cls) => {
                const count = students.filter(s => s.className === cls).length;
                const isSelected = selectedClassFilter === cls;
                return (
                  <button
                    key={cls}
                    onClick={() => setSelectedClassFilter(cls)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-cyan-700 text-white border-cyan-700 shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <span>{cls}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3 w-28">NIS / No. Induk</th>
                  <th className="p-3">{activeUnit === 'RQ' ? 'Nama Santri' : 'Nama Murid'}</th>
                  <th className="p-3">{activeUnit === 'RQ' ? 'Halaqoh / Level UMMI' : 'Kelas / Kelompok'}</th>
                  <th className="p-3">Kategori Biaya</th>
                  <th className="p-3">{activeUnit === 'RQ' ? 'Wali Santri' : 'Wali Murid'}</th>
                  <th className="p-3">No. WhatsApp</th>
                  <th className="p-3 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      Tidak ada data santri/murid yang sesuai dengan pencarian atau filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-slate-700">{s.nis}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <div>{s.name}</div>
                        {s.notes && (
                          <div className="text-[10px] font-normal text-slate-400 truncate max-w-xs">
                            {s.notes}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${getClassBadgeStyle(s.className)}`}>
                          {s.className.includes('Tartil') ? (
                            <BookOpen className="w-3 h-3 text-blue-600 shrink-0" />
                          ) : s.className.includes('Tahfizh') ? (
                            <Award className="w-3 h-3 text-purple-600 shrink-0" />
                          ) : s.className.includes('Turjuman') ? (
                            <Bookmark className="w-3 h-3 text-amber-600 shrink-0" />
                          ) : null}
                          <span>{s.className}</span>
                        </span>
                      </td>
                      <td className="p-3">
                        {s.scholarship === 'KHUSUS' ? (
                          <span className="inline-flex flex-col items-start gap-0.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            <span className="flex items-center gap-1 text-[11px]">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              Tarif Khusus
                            </span>
                            <span className="text-[10px] font-mono text-amber-700">
                              {formatRupiah(s.customSppNominal ?? (fees.find(f => f.category === 'SPP')?.nominal || 150000) * ((100 - (s.discountPercentage || 0)) / 100))}/bln
                              {s.discountPercentage ? ` (${s.discountPercentage > 0 ? `-${s.discountPercentage}%` : `+${Math.abs(s.discountPercentage)}%`})` : ''}
                            </span>
                          </span>
                        ) : s.scholarship === 'REGULER' ? (
                          <span className="inline-flex flex-col items-start gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            <span>Reguler (Normal)</span>
                            {s.customSppNominal ? (
                              <span className="text-[9px] font-mono text-cyan-700">
                                Kustom: {formatRupiah(s.customSppNominal)}/bln
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                            {s.scholarship.replace('_', ' ')} {s.discountPercentage ? `(-${s.discountPercentage}%)` : ''}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-700">{s.parentName || '-'}</td>
                      <td className="p-3 font-mono text-slate-600">{s.parentPhone || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditStudent(s)}
                            className="p-1 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded"
                            title="Edit Data"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* Tab 2: Master Tarif & Biaya */}
      {activeTab === 'FEES' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-5 space-y-6">
          
          {/* Unit Switcher & Actions Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-cyan-600">
                  Master Tarif & Pos Biaya
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  TA Aktif: {activeAcademicYear}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 mt-1">
                Konfigurasi Tarif & Pilihan Pembayaran Kasir ({selectedFeeUnit})
              </h3>
              <p className="text-xs text-slate-500">
                Pilih unit di bawah untuk mengatur Master Tarif SPP, DSP & Pos Tagihan Administrasi yang otomatis tampil di Pembayaran SPP & DSP.
              </p>
            </div>

            {/* Unit Selector Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-x-auto">
              {(['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[]).map((u) => {
                const count = state.masterFees.filter(f => f.unit === u && f.academicYear === activeAcademicYear).length;
                return (
                  <button
                    key={u}
                    onClick={() => setSelectedFeeUnit(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      selectedFeeUnit === u
                        ? 'bg-white text-cyan-800 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>{u === 'TK' ? '🎓 TK' : u === 'KB' ? '🧸 KB' : u === 'SD' ? '🎒 SD' : u === 'SMP' ? '🏫 SMP' : u === 'SMA' ? '🏛️ SMA' : "📖 RQ"}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedFeeUnit === u ? 'bg-cyan-100 text-cyan-800 font-black' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pedoman Integrasi 3 Pilihan Kasir */}
          <div className="p-4 bg-gradient-to-r from-cyan-50/80 via-sky-50/60 to-emerald-50/80 border border-cyan-200/80 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>Pedoman Pemetaan 3 Opsi Tagihan di Kasir Pembayaran SPP & DSP ({selectedFeeUnit}):</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-700">
                  <div className="p-2.5 rounded-xl bg-white/90 border border-cyan-200/70 shadow-2xs">
                    <div className="font-bold text-cyan-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-cyan-100 text-cyan-800 text-[10px] flex items-center justify-center font-bold">1</span>
                      <span>1. SPP saja</span>
                    </div>
                    <p className="text-slate-600 text-[10px] mt-0.5">
                      Otomatis memuat <strong>Tarif SPP Bulanan</strong> unit aktif, matriks 12 bulan (Juli-Juni), beasiswa & potongan khusus santri.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 border border-emerald-200/70 shadow-2xs">
                    <div className="font-bold text-emerald-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] flex items-center justify-center font-bold">2</span>
                      <span>2. SPP dan DSP</span>
                    </div>
                    <p className="text-slate-600 text-[10px] mt-0.5">
                      Memuat <strong>SPP Bulanan + DSP / Uang Pangkal Gedung</strong>, kalkulasi riwayat cicilan, sisa piutang & status lunas.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/90 border border-purple-200/70 shadow-2xs">
                    <div className="font-bold text-purple-800 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-800 text-[10px] flex items-center justify-center font-bold">3</span>
                      <span>3. SPP, DSP dan Administrasi</span>
                    </div>
                    <p className="text-slate-600 text-[10px] mt-0.5">
                      Paket lengkap: <strong>SPP + DSP + Pos Administrasi Aktif</strong> (Daftar Ulang, Seragam, Buku/Modul UMMI, Kegiatan, dll.).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Categories Grid */}
          <div className="space-y-5">
            
            {/* Kategori 1 & 2: SPP Bulanan & DSP Uang Pangkal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Opsi 1: Master Tarif SPP */}
              <div className="p-5 rounded-2xl border-2 border-cyan-200 bg-linear-to-b from-cyan-50/40 to-white space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Master Tarif SPP Bulanan</h4>
                      <span className="text-[10px] text-cyan-700 font-semibold">Tampil di Kasir: Opsi 1, 2, dan 3</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-cyan-600" />
                    <span>Wajib Aktif</span>
                  </span>
                </div>

                {sppMasterFee ? (
                  <div className="p-4 rounded-xl bg-white border border-cyan-100 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{sppMasterFee.name}</div>
                        <div className="text-[11px] text-slate-500">{sppMasterFee.description || 'Iuran rutin bulanan santri'}</div>
                      </div>
                      <button
                        onClick={() => handleOpenEditFee(sppMasterFee)}
                        className="px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Tarif SPP</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Nominal Standar:</span>
                      <span className="text-xl font-black text-cyan-800 font-mono">
                        {formatRupiah(sppMasterFee.nominal)}
                        <span className="text-xs font-normal text-slate-500"> / bulan</span>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <Award className="w-3 h-3 text-cyan-600" />
                        <span>Penyesuaian Beasiswa / Potongan:</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Siswa dengan status Beasiswa/Khusus pada Master Data Siswa akan otomatis mendapatkan kalkulasi diskon atau tarif khusus per bulan dari nominal dasar ini.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Belum ada Master Tarif SPP untuk Unit {selectedFeeUnit}</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Tambahkan tarif SPP agar sistem kasir dapat menghitung tagihan bulanan santri dengan akurat.
                    </p>
                    <button
                      onClick={() => handleOpenAddFee('SPP', `SPP Bulanan Unit ${selectedFeeUnit}`, selectedFeeUnit === 'TK' ? 250000 : selectedFeeUnit === 'KB' ? 200000 : 150000, 'MONTHLY')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Buat Tarif SPP {selectedFeeUnit}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Opsi 2: Master Tarif DSP / Uang Pangkal Gedung */}
              <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-linear-to-b from-emerald-50/40 to-white space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Master Tarif DSP / Uang Pangkal</h4>
                      <span className="text-[10px] text-emerald-700 font-semibold">Tampil di Kasir: Opsi 2 dan 3</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Cicilan / Bertahap</span>
                  </span>
                </div>

                {dspMasterFee ? (
                  <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800">{dspMasterFee.name}</div>
                        <div className="text-[11px] text-slate-500">{dspMasterFee.description || 'Dana Sumbangan Pendidikan Gedung & Sarana'}</div>
                      </div>
                      <button
                        onClick={() => handleOpenEditFee(dspMasterFee)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Tarif DSP</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Target DSP Santri Baru:</span>
                      <span className="text-xl font-black text-emerald-800 font-mono">
                        {dspMasterFee.nominal === 0 ? 'Rp 0 (Bebas / Gratis)' : formatRupiah(dspMasterFee.nominal)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-700 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-emerald-600" />
                        <span>Integrasi Riwayat & Piutang:</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Di kasir pembayaran, wali santri dapat mencicil nominal DSP sesuai kemampuan. Sistem otomatis menghitung akumulasi terbayar, sisa piutang & status lunas.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Belum ada Master Tarif DSP untuk Unit {selectedFeeUnit}</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Tambahkan tarif DSP untuk menghitung uang pangkal dan sarana gedung santri baru.
                    </p>
                    <button
                      onClick={() => handleOpenAddFee('DSP', `DSP Uang Pangkal Gedung ${selectedFeeUnit}`, selectedFeeUnit === 'TK' ? 2500000 : selectedFeeUnit === 'KB' ? 1800000 : 1000000, 'INSTALLMENT')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Buat Tarif DSP {selectedFeeUnit}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Kategori 3: Master Pos Tagihan Administrasi & Sarana */}
            <div className="p-5 rounded-2xl border-2 border-purple-200 bg-linear-to-b from-purple-50/40 to-white space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">
                      Master Pos Tagihan Administrasi & Sarana Belajar ({selectedFeeUnit})
                    </h4>
                    <span className="text-[10px] text-purple-700 font-semibold">
                      Tampil di Kasir saat memilih Opsi: "3. SPP, DSP dan Administrasi"
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApplyStandardTemplate(selectedFeeUnit)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    title="Terapkan template pos biaya standar untuk unit ini"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                    <span>Reset / Template Standar</span>
                  </button>

                  <button
                    onClick={() => handleOpenAddFee('DAFTAR_ULANG')}
                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Pos Administrasi</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets Toolbar */}
              <div className="p-3 bg-white/90 border border-purple-100 rounded-xl flex items-center gap-2 flex-wrap text-[11px]">
                <span className="font-bold text-slate-600 flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>Tambah Cepat Preset:</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenAddFee('DAFTAR_ULANG', `Daftar Ulang & Puncak Tema ${selectedFeeUnit}`, 450000, 'ONCE_PER_YEAR')}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  + Daftar Ulang
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddFee('SERAGAM', `Paket Seragam Siswa ${selectedFeeUnit}`, 650000, 'ONCE_PER_YEAR')}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  + Paket Seragam
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddFee('BUKU', selectedFeeUnit === 'RQ' ? 'Paket Modul Metode UMMI & Al-Qur\'an' : `Paket Buku & Media Sentra ${selectedFeeUnit}`, selectedFeeUnit === 'RQ' ? 180000 : 350000, 'ONCE_PER_YEAR')}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  + Buku / Modul UMMI
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddFee('KEGIATAN', selectedFeeUnit === 'RQ' ? 'Wisuda Munaqosyah & Khotmil Qur\'an' : `Outing Class & Renang ${selectedFeeUnit}`, 250000, 'ONCE_PER_YEAR')}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  + Kegiatan / Outing
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddFee('CATERING', `Catering / PMT Mingguan ${selectedFeeUnit}`, 120000, 'MONTHLY')}
                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  + PMT / Catering
                </button>
              </div>

              {/* Administration Fees Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-3 text-center w-28">Tampil di Kasir</th>
                      <th className="p-3 w-32">Kategori Pos</th>
                      <th className="p-3">Nama Tagihan / Administrasi</th>
                      <th className="p-3">Tipe Penagihan</th>
                      <th className="p-3 text-right">Nominal Tarif</th>
                      <th className="p-3 text-center w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {adminMasterFees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          <div className="space-y-1">
                            <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="font-semibold text-slate-600">Belum ada pos tagihan administrasi untuk Unit {selectedFeeUnit}</p>
                            <p className="text-[11px] text-slate-400">Klik "Reset / Template Standar" atau "+ Tambah Pos Administrasi" untuk menambahkan item.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      adminMasterFees.map((fee) => {
                        const isActive = fee.isActiveInPayment !== false;
                        return (
                          <tr key={fee.id} className={`hover:bg-purple-50/30 transition-colors ${!isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                            
                            {/* Toggle Tampil di Kasir */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleFeeActiveInPayment(fee)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-2xs cursor-pointer ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                    : 'bg-slate-200 text-slate-600 border border-slate-300 hover:bg-slate-300'
                                }`}
                                title={isActive ? 'Klik untuk nonaktifkan dari kasir' : 'Klik untuk tampilkan di kasir'}
                              >
                                {isActive ? (
                                  <>
                                    <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Aktif</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Nonaktif</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Kategori Badge */}
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                fee.category === 'DAFTAR_ULANG' ? 'bg-purple-100 text-purple-800' :
                                fee.category === 'SERAGAM' ? 'bg-indigo-100 text-indigo-800' :
                                fee.category === 'BUKU' ? 'bg-teal-100 text-teal-800' :
                                fee.category === 'KEGIATAN' ? 'bg-amber-100 text-amber-800' :
                                fee.category === 'CATERING' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-800'
                              }`}>
                                {fee.category.replace('_', ' ')}
                              </span>
                            </td>

                            {/* Nama & Deskripsi */}
                            <td className="p-3">
                              <div className="font-bold text-slate-800">{fee.name}</div>
                              {fee.description && (
                                <div className="text-[10px] text-slate-400">{fee.description}</div>
                              )}
                            </td>

                            {/* Tipe Penagihan */}
                            <td className="p-3 text-slate-600">
                              <span className="text-[11px] font-medium">
                                {fee.type === 'ONCE_PER_YEAR' ? '1x per Tahun Ajaran' : fee.type === 'MONTHLY' ? 'Bulanan' : 'Bertahap / Cicilan'}
                              </span>
                            </td>

                            {/* Nominal */}
                            <td className="p-3 text-right">
                              {fee.nominal === 0 ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                                  Rp 0 (Bebas / Gratis)
                                </span>
                              ) : (
                                <span className="font-black text-slate-900 font-mono text-sm">
                                  {formatRupiah(fee.nominal)}
                                </span>
                              )}
                            </td>

                            {/* Aksi */}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditFee(fee)}
                                  className="p-1 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded cursor-pointer"
                                  title="Edit Pos Tarif"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteFee(fee.id, fee.name)}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Hapus Pos Tarif"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LIVE SIMULATOR / PREVIEW CARD */}
            <div className="p-5 rounded-2xl border-2 border-slate-300 bg-slate-900 text-white space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-900 font-black text-sm flex items-center justify-center shadow-xs">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Simulasi Kasir: Tampilan Pembayaran SPP & DSP ({selectedFeeUnit})</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase">
                        Live Preview
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Lihat bagaimana kasir/bendahara akan melihat pilihan tagihan dan kalkulasi otomatisnya:
                    </p>
                  </div>
                </div>

                {/* 3 Sim Switcher Buttons */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-800 rounded-xl border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSimBundleMode('SPP_ONLY')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      simBundleMode === 'SPP_ONLY'
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    1. SPP saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimBundleMode('SPP_DSP')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      simBundleMode === 'SPP_DSP'
                        ? 'bg-emerald-500 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    2. SPP dan DSP
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimBundleMode('SPP_DSP_ADM')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      simBundleMode === 'SPP_DSP_ADM'
                        ? 'bg-purple-400 text-slate-950 shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    3. SPP, DSP dan Administrasi
                  </button>
                </div>
              </div>

              {/* Simulator Calculation Body */}
              <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  
                  {/* Subtotal SPP */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-cyan-500/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>SPP Bulanan ({simMonthsCount} Bulan)</span>
                      </span>
                      <select
                        value={simMonthsCount}
                        onChange={(e) => setSimMonthsCount(Number(e.target.value))}
                        className="bg-slate-800 text-white border border-slate-600 rounded px-1.5 py-0.5 text-[10px] font-bold"
                      >
                        {[1, 2, 3, 6, 12].map(m => (
                          <option key={m} value={m}>{m} Bulan</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {formatRupiah(sppMasterFee?.nominal || 250000)} x {simMonthsCount} bln
                    </div>
                    <div className="text-base font-black text-cyan-300 font-mono pt-1">
                      {formatRupiah((sppMasterFee?.nominal || 250000) * simMonthsCount)}
                    </div>
                  </div>

                  {/* Subtotal DSP */}
                  <div className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                    simBundleMode !== 'SPP_ONLY'
                      ? 'bg-slate-900/80 border-emerald-500/40'
                      : 'bg-slate-900/40 border-slate-700 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        {simBundleMode !== 'SPP_ONLY' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>DSP / Uang Pangkal</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Cicilan</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Target: {formatRupiah(dspMasterFee?.nominal || 2500000)}
                    </div>
                    <div className="text-base font-black text-emerald-300 font-mono pt-1">
                      {simBundleMode !== 'SPP_ONLY' ? formatRupiah(500000) : 'Rp 0'}
                    </div>
                  </div>

                  {/* Subtotal Administrasi */}
                  <div className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                    simBundleMode === 'SPP_DSP_ADM'
                      ? 'bg-slate-900/80 border-purple-500/40'
                      : 'bg-slate-900/40 border-slate-700 opacity-40'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300 flex items-center gap-1">
                        {simBundleMode === 'SPP_DSP_ADM' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>Pos Administrasi ({adminMasterFees.filter(f => f.isActiveInPayment !== false).length} Pos)</span>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Total {adminMasterFees.filter(f => f.isActiveInPayment !== false).length} pos aktif
                    </div>
                    <div className="text-base font-black text-purple-300 font-mono pt-1">
                      {simBundleMode === 'SPP_DSP_ADM'
                        ? formatRupiah(adminMasterFees.filter(f => f.isActiveInPayment !== false).reduce((acc, curr) => acc + curr.nominal, 0))
                        : 'Rp 0'}
                    </div>
                  </div>

                </div>

                {/* Total Grand Kasir Box */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-slate-300 font-medium">
                      Total Setoran Kasir & Tercetak di Kwitansi Resmi:
                    </span>
                  </div>
                  <div className="text-xl font-black text-amber-400 font-mono">
                    {formatRupiah(
                      ((sppMasterFee?.nominal || 250000) * simMonthsCount) +
                      (simBundleMode !== 'SPP_ONLY' ? 500000 : 0) +
                      (simBundleMode === 'SPP_DSP_ADM' ? adminMasterFees.filter(f => f.isActiveInPayment !== false).reduce((acc, curr) => acc + curr.nominal, 0) : 0)
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 3: Duplikasi Tahun Ajaran Baru */}
      {activeTab === 'DUPLICATE' && (
        <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">
              Kloning Master Template & Duplikasi Tahun Ajaran Baru
            </h3>
            <p className="text-xs text-slate-500 max-w-xl mx-auto">
              Membuat periode tahun ajaran baru dengan mengkloning seluruh tarif SPP, DSP, pos administrasi masing-masing unit (TK, KB, RQ), struktur RAPBS, dan otomatis menaikkan jenjang kelas santri.
            </p>
          </div>

          <form onSubmit={handleExecuteDuplicate} className="space-y-6 text-xs border border-slate-200 p-6 rounded-2xl bg-slate-50/60">
            
            {/* Periode Input */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <label className="block font-bold text-sm text-slate-900">
                Nama / Periode Tahun Ajaran Baru *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  required
                  placeholder="misal: 2026/2027"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  className="w-full max-w-xs px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-slate-500">
                  Tahun ajaran aktif saat ini: <strong>{activeAcademicYear}</strong>
                </span>
              </div>
            </div>

            {/* Opsi Kloning Siswa & Kenaikan Kelas */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <div className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Opsi Kloning Siswa & Kenaikan Jenjang Kelas:</span>
              </div>

              <div className="space-y-2 pl-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={copyStudentsOption}
                    onChange={(e) => setCopyStudentsOption(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-800">
                    Salin seluruh data siswa/santri aktif ke tahun ajaran baru
                  </span>
                </label>

                {copyStudentsOption && (
                  <label className="flex items-center gap-2 cursor-pointer ml-6">
                    <input
                      type="checkbox"
                      checked={promoteOption}
                      onChange={(e) => setPromoteOption(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span className="text-slate-700">
                      Otomatis naikkan jenjang kelas (TK A ➔ TK B, TK B ➔ Lulus, KB ➔ TK A, RQ Jilid 1 ➔ Jilid 2, Tartil, Tahfizh)
                    </span>
                  </label>
                )}
              </div>
            </div>

            {/* Konfigurasi Penyesuaian Tarif Masing-Masing Unit untuk TA Baru */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>Penyesuaian Tarif SPP, DSP & Administrasi untuk TA {newYearInput}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Tentukan nominal tarif baru atau pilih pos biaya mana saja yang mau disalin ke TA {newYearInput}:
                  </p>
                </div>

                {/* Unit Selector inside Duplication */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0 overflow-x-auto">
                  {(['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setDupActiveUnitTab(u)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        dupActiveUnitTab === u
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {u === 'TK' ? '🎓 TK' : u === 'KB' ? '🧸 KB' : u === 'SD' ? '🎒 SD' : u === 'SMP' ? '🏫 SMP' : u === 'SMA' ? '🏛️ SMA' : "📖 RQ"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit Fees Customization Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <th className="p-2.5 text-center w-16">Salin</th>
                      <th className="p-2.5 w-28">Kategori</th>
                      <th className="p-2.5">Nama Tarif / Pos Tagihan</th>
                      <th className="p-2.5 text-right w-44">Nominal TA Baru (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.masterFees
                      .filter(f => f.unit === dupActiveUnitTab && f.academicYear === activeAcademicYear)
                      .map((fee) => {
                        const custom = dupFeesCustom[fee.id] || { nominal: fee.nominal, included: fee.isActiveInPayment !== false };
                        const isMandatory = fee.category === 'SPP' || fee.category === 'DSP';

                        return (
                          <tr key={fee.id} className="hover:bg-slate-50">
                            
                            {/* Checkbox Salin */}
                            <td className="p-2.5 text-center">
                              {isMandatory ? (
                                <span className="inline-flex p-1 text-emerald-600 font-bold" title="Wajib Disalin">
                                  <Check className="w-4 h-4" />
                                </span>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={custom.included}
                                  onChange={(e) => {
                                    setDupFeesCustom(prev => ({
                                      ...prev,
                                      [fee.id]: {
                                        ...custom,
                                        included: e.target.checked
                                      }
                                    }));
                                  }}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                              )}
                            </td>

                            {/* Kategori */}
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                fee.category === 'SPP' ? 'bg-cyan-100 text-cyan-800' :
                                fee.category === 'DSP' ? 'bg-emerald-100 text-emerald-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {fee.category}
                              </span>
                            </td>

                            {/* Nama */}
                            <td className="p-2.5">
                              <span className="font-bold text-slate-800">{fee.name}</span>
                              <span className="text-[10px] text-slate-400 ml-2">({fee.type})</span>
                            </td>

                            {/* Nominal Input */}
                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                value={custom.nominal}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setDupFeesCustom(prev => ({
                                    ...prev,
                                    [fee.id]: {
                                      ...custom,
                                      nominal: val
                                    }
                                  }));
                                }}
                                className="w-full px-2.5 py-1 text-right font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                              />
                            </td>

                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Checklist Box */}
            <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl text-emerald-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Yang akan digandakan dan langsung aktif di sistem kasir:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-emerald-800 text-[11px]">
                <li>Seluruh Master Tarif SPP, DSP, dan Pos Administrasi yang telah disesuaikan untuk Unit TK, KB, RQ, SD, SMP, dan SMA</li>
                <li>Template Pos Anggaran RAPBS / RAKS Pendapatan & Belanja untuk periode baru</li>
                <li>Buku Kas Umum (BKU) baru yang bersih siap digunakan untuk transaksi periode {newYearInput}</li>
              </ul>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-sm shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
              >
                <CopyPlus className="w-5 h-5" />
                <span>Gandakan & Aktifkan Tahun Ajaran {newYearInput}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Tab 4: Profil Sekolah & Rekening Bank */}
      {activeTab === 'PROFILE' && (
        <form onSubmit={handleSaveProfile} className="bg-white rounded-b-2xl border border-slate-200 shadow-xs p-6 max-w-3xl mx-auto space-y-5 text-xs">
          <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-white border border-slate-300 p-1 flex items-center justify-center shadow-xs shrink-0">
                <SchoolLogo unit={activeUnit} size={48} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Logo & Identitas Resmi ({activeUnit})</h3>
                <p className="text-[11px] text-slate-500">Logo resmi {activeProfile.name} tercetak di Kop Kwitansi, BKU, Tab Browser, dan Laporan</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px] uppercase shrink-0">
              Logo Aktif
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-slate-900">Kop Surat Resmi ({activeUnit})</h3>
            <p className="text-xs text-slate-500">Data ini tercetak secara otomatis pada Kop Kwitansi, BKU, Surat Tagihan, dan Laporan Keuangan</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Yayasan Pengelola *</label>
              <input
                type="text"
                required
                value={profileForm.foundation}
                onChange={(e) => setProfileForm({ ...profileForm, foundation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Unit Sekolah *</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">NPSN / Nomor Izin Operasional *</label>
              <input
                type="text"
                required
                value={profileForm.npsn}
                onChange={(e) => setProfileForm({ ...profileForm, npsn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp Resmi *</label>
              <input
                type="text"
                required
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Lengkap *</label>
              <input
                type="text"
                required
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-sm text-slate-900 mb-3">Informasi Rekening Bank Pembayaran SPP & QRIS</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Bank *</label>
                <input
                  type="text"
                  required
                  value={profileForm.bankName}
                  onChange={(e) => setProfileForm({ ...profileForm, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Rekening *</label>
                <input
                  type="text"
                  required
                  value={profileForm.bankAccount}
                  onChange={(e) => setProfileForm({ ...profileForm, bankAccount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Atas Nama Rekening *</label>
                <input
                  type="text"
                  required
                  value={profileForm.bankHolder}
                  onChange={(e) => setProfileForm({ ...profileForm, bankHolder: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-sm text-slate-900 mb-3">Pejabat Pengesah Laporan</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar *</label>
                <input
                  type="text"
                  required
                  value={profileForm.headmasterName}
                  onChange={(e) => setProfileForm({ ...profileForm, headmasterName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={profileForm.headmasterNip || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, headmasterNip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Bendahara Sekolah *</label>
                <input
                  type="text"
                  required
                  value={profileForm.treasurerName}
                  onChange={(e) => setProfileForm({ ...profileForm, treasurerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NIP Bendahara</label>
                <input
                  type="text"
                  value={profileForm.treasurerNip || ''}
                  onChange={(e) => setProfileForm({ ...profileForm, treasurerNip: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Profil & Identitas Sekolah</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal Add / Edit Student */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingStudent 
                  ? (activeUnit === 'RQ' ? 'Edit Data Santri' : 'Edit Data Murid') 
                  : (activeUnit === 'RQ' ? 'Tambah Santri Baru' : 'Tambah Murid Baru')}
              </h3>
              <button onClick={() => setIsStudentModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleStudentSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {activeUnit === 'RQ' ? 'Nomor Induk Santri (NIS)' : 'Nomor Induk Murid (NIS)'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.nis}
                    onChange={(e) => setStudentForm({ ...studentForm, nis: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin *</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="L">Laki-laki (Ikhwan)</option>
                    <option value="P">Perempuan (Akhwat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {activeUnit === 'RQ' ? 'Nama Lengkap Santri' : 'Nama Lengkap Murid'} *
                </label>
                <input
                  type="text"
                  required
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {activeUnit === 'RQ' ? 'Halaqoh / Level Metode UMMI' : 'Kelas / Kelompok'} *
                </label>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <select
                      value={unitClassPresets.includes(studentForm.className) ? studentForm.className : 'CUSTOM'}
                      onChange={(e) => {
                        if (e.target.value !== 'CUSTOM') {
                          setStudentForm({ ...studentForm, className: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    >
                      {activeUnit === 'RQ' ? (
                        <>
                          <optgroup label="Metode UMMI (Jilid 1 - 6)">
                            <option value="UMMI Jilid 1">UMMI Jilid 1</option>
                            <option value="UMMI Jilid 2">UMMI Jilid 2</option>
                            <option value="UMMI Jilid 3">UMMI Jilid 3</option>
                            <option value="UMMI Jilid 4">UMMI Jilid 4</option>
                            <option value="UMMI Jilid 5">UMMI Jilid 5</option>
                            <option value="UMMI Jilid 6">UMMI Jilid 6</option>
                          </optgroup>
                          <optgroup label="Program Lanjutan Metode UMMI">
                            <option value="Program Tartil Metode UMMI">Program Tartil</option>
                            <option value="Program Tahfizh Metode UMMI">Program Tahfizh</option>
                            <option value="Program Turjuman Metode UMMI">Program Turjuman</option>
                          </optgroup>
                        </>
                      ) : (
                        unitClassPresets.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))
                      )}
                      <option value="CUSTOM">-- Kustom / Ketik Manual --</option>
                    </select>
                  </div>

                  {/* Manual input for custom class name or teacher sub-group */}
                  <input
                    type="text"
                    required
                    placeholder={activeUnit === 'RQ' ? 'Ketik nama halaqoh (misal: UMMI Jilid 1)' : 'misal: TK A1 (Thoriq)'}
                    value={studentForm.className}
                    onChange={(e) => setStudentForm({ ...studentForm, className: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Biaya / Beasiswa *</label>
                <select
                  value={studentForm.scholarship}
                  onChange={(e) => {
                    const val = e.target.value as ScholarshipType;
                    let disc = 0;
                    const defaultSpp = fees.find(f => f.category === 'SPP')?.nominal || (
                      activeUnit === 'TK' ? 250000 :
                      activeUnit === 'KB' ? 200000 :
                      activeUnit === 'SD' ? 350000 :
                      activeUnit === 'SMP' ? 450000 :
                      activeUnit === 'SMA' ? 550000 : 150000
                    );
                    if (val === 'YATIM_100') disc = 100;
                    else if (val === 'BEASISWA_50') disc = 50;
                    else if (val === 'BERSAUDARA_25') disc = 25;
                    else if (val === 'KHUSUS') {
                      disc = studentForm.discountPercentage || 0;
                    }
                    
                    setStudentForm({ 
                      ...studentForm, 
                      scholarship: val, 
                      discountPercentage: disc,
                      customSppNominal: val === 'KHUSUS' && !studentForm.customSppNominal ? String(defaultSpp) : studentForm.customSppNominal
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="REGULER">Reguler (Tarif Normal Standar: {formatRupiah(fees.find(f => f.category === 'SPP')?.nominal || (activeUnit === 'TK' ? 250000 : activeUnit === 'KB' ? 200000 : activeUnit === 'SD' ? 350000 : activeUnit === 'SMP' ? 450000 : activeUnit === 'SMA' ? 550000 : 150000))}/bln)</option>
                  <option value="KHUSUS">⭐ Tarif Khusus (Bisa Edit Nominal & Diskon Sendiri)</option>
                  <option value="BERSAUDARA_25">Potongan Bersaudara (Diskon 25%)</option>
                  <option value="BEASISWA_50">Beasiswa Prestasi / Anak Guru (Diskon 50%)</option>
                  <option value="YATIM_100">Yatim Dhuafa (Gratis 100%)</option>
                </select>
              </div>

              {/* Tarif Khusus / Custom SPP Nominal & Discount Box */}
              {(studentForm.scholarship === 'KHUSUS' || studentForm.scholarship === 'REGULER') && (
                <div className={`p-3.5 rounded-xl border space-y-3 transition-all ${
                  studentForm.scholarship === 'KHUSUS' 
                    ? 'bg-amber-50/70 border-amber-300' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs flex items-center gap-1.5 text-slate-800">
                      <Sparkles className={`w-3.5 h-3.5 ${studentForm.scholarship === 'KHUSUS' ? 'text-amber-600' : 'text-slate-400'}`} />
                      {studentForm.scholarship === 'KHUSUS' ? 'Atur Tarif SPP Khusus / Mandiri' : 'Penyesuaian Tarif Kustom (Opsional)'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Standar Master: {formatRupiah(fees.find(f => f.category === 'SPP')?.nominal || (activeUnit === 'TK' ? 250000 : activeUnit === 'KB' ? 200000 : activeUnit === 'SD' ? 350000 : activeUnit === 'SMP' ? 450000 : activeUnit === 'SMA' ? 550000 : 150000))}/bln
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nominal Tarif SPP Bulanan (Rp)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5000"
                        placeholder={`Standar: ${fees.find(f => f.category === 'SPP')?.nominal || 150000}`}
                        value={studentForm.customSppNominal}
                        onChange={(e) => setStudentForm({ ...studentForm, customSppNominal: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Persentase Potongan (%)
                      </label>
                      <input
                        type="number"
                        min="-100"
                        max="100"
                        value={studentForm.discountPercentage}
                        onChange={(e) => setStudentForm({ ...studentForm, discountPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Live Calculation Preview */}
                  {(() => {
                    const masterSpp = fees.find(f => f.category === 'SPP')?.nominal || (activeUnit === 'TK' ? 250000 : activeUnit === 'KB' ? 200000 : activeUnit === 'SD' ? 350000 : activeUnit === 'SMP' ? 450000 : activeUnit === 'SMA' ? 550000 : 150000);
                    const baseSpp = studentForm.customSppNominal ? (parseFloat(studentForm.customSppNominal) || masterSpp) : masterSpp;
                    const disc = studentForm.discountPercentage || 0;
                    const finalEffectiveSpp = Math.max(0, baseSpp * ((100 - disc) / 100));
                    return (
                      <div className="p-2.5 bg-white rounded-lg border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-600">
                          Tarif Dasar: <b className="font-mono text-slate-800">{formatRupiah(baseSpp)}</b>
                          {disc !== 0 && (
                            <span> • Diskon: <b className="font-mono text-amber-700">{disc}%</b></span>
                          )}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">SPP Ditagihkan:</span>
                          <span className="font-bold text-xs text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {formatRupiah(finalEffectiveSpp)} / bln
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {activeUnit === 'RQ' ? 'Nama Wali Santri' : 'Nama Wali Murid'}
                  </label>
                  <input
                    type="text"
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Wali</label>
                  <input
                    type="text"
                    placeholder="misal: 081234567890"
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{activeUnit === 'RQ' ? 'Simpan Data Santri' : 'Simpan Data Murid'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Fee */}
      {isFeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">{editingFee ? `Edit Tarif (${feeForm.unit})` : `Tambah Tarif Baru (${feeForm.unit})`}</h3>
              <button onClick={() => setIsFeeModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleFeeSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Pendidikan *</label>
                  <select
                    value={feeForm.unit}
                    onChange={(e) => setFeeForm({ ...feeForm, unit: e.target.value as SchoolUnitType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                  >
                    <option value="TK">TK Islam</option>
                    <option value="KB">KB (Kelompok Bermain)</option>
                    <option value="SD">SD IT</option>
                    <option value="SMP">SMP IT</option>
                    <option value="SMA">SMA IT</option>
                    <option value="RQ">Rumah Qur'an (RQ)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Biaya *</label>
                  <select
                    value={feeForm.category}
                    onChange={(e) => setFeeForm({ ...feeForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                  >
                    <option value="SPP">SPP Bulanan</option>
                    <option value="DSP">DSP / Uang Pangkal</option>
                    <option value="DAFTAR_ULANG">Daftar Ulang</option>
                    <option value="SERAGAM">Paket Seragam</option>
                    <option value="BUKU">Paket Buku & Modul</option>
                    <option value="KEGIATAN">Kegiatan & Outing</option>
                    <option value="CATERING">Catering / PMT</option>
                    <option value="LAINNYA">Pos Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Tagihan / Tarif *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: SPP Bulanan TK IT / Paket Buku Sentra"
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Nominal Biaya (Rp) *</label>
                    {feeForm.category !== 'SPP' ? (
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Bisa diisi 0 (Nol)
                      </span>
                    ) : (
                      <span className="text-[10px] text-cyan-700 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                        Wajib &gt; Rp 0
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    min={feeForm.category === 'SPP' ? "1" : "0"}
                    placeholder={feeForm.category === 'SPP' ? "misal: 250000" : "0"}
                    value={feeForm.nominal}
                    onChange={(e) => setFeeForm({ ...feeForm, nominal: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {feeForm.category === 'SPP'
                      ? 'Tarif SPP bulanan wajib > Rp 0.'
                      : 'Selain SPP, pos tarif dapat diisi 0 (nol) jika gratis/bebas biaya.'}
                  </p>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Penagihan *</label>
                  <select
                    value={feeForm.type}
                    onChange={(e) => setFeeForm({ ...feeForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="MONTHLY">Bulanan (SPP)</option>
                    <option value="INSTALLMENT">Bertahap / Cicilan (DSP)</option>
                    <option value="ONCE_PER_YEAR">1x per Tahun Ajaran</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Rincian</label>
                <input
                  type="text"
                  placeholder="misal: Buku aktivitas tematik sentra & media belajar"
                  value={feeForm.description}
                  onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feeForm.isActiveInPayment}
                    onChange={(e) => setFeeForm({ ...feeForm, isActiveInPayment: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span className="font-bold text-purple-900 text-xs">
                    Tampilkan di Kasir Pembayaran SPP & DSP
                  </span>
                </label>
                <p className="text-[10px] text-purple-700 pl-6">
                  Jika dicentang, pos biaya ini otomatis muncul dan dapat dipilih saat kasir memilih <strong>"3. SPP, DSP dan Administrasi"</strong>.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFeeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Tarif</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
