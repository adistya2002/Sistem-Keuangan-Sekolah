import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Wallet,
  GraduationCap,
  SearchCheck,
  PieChart,
  FileSpreadsheet,
  ReceiptText,
  CopyPlus,
  ShieldCheck,
  BookOpen,
  AlertCircle,
  LogOut,
  Shield,
  UserCheck
} from 'lucide-react';
import { calculateStudentArrears } from '../../utils/formatters';
import { SchoolLogo } from '../common/SchoolLogo';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile?: () => void;
  onOpenSwitchUser?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile, onOpenSwitchUser }) => {
  const { 
    currentTab, 
    setCurrentTab, 
    activeUnit, 
    activeAcademicYear, 
    state, 
    currentUser,
    logout
  } = useApp();

  // Calculate overdue students count for badge indicator
  const unitStudents = state.students.filter(
    s => s.unit === activeUnit && s.academicYear === activeAcademicYear && s.status === 'AKTIF'
  );
  
  const overdueCount = unitStudents.filter(student => {
    const arrears = calculateStudentArrears(
      student,
      activeAcademicYear,
      state.studentPayments,
      state.masterFees,
      'Desember'
    );
    return arrears.totalArrears > 0;
  }).length;

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dasbor Ringkasan',
      icon: LayoutDashboard,
      badge: null,
      color: 'text-emerald-600'
    },
    {
      id: 'cash',
      label: 'Kas Masuk & Keluar (BKU)',
      icon: Wallet,
      badge: null,
      color: 'text-indigo-600'
    },
    {
      id: 'spp',
      label: 'Pembayaran SPP & DSP',
      icon: GraduationCap,
      badge: null,
      color: 'text-teal-600'
    },
    {
      id: 'arrears',
      label: activeUnit === 'RQ' ? 'Pelacak Tunggakan Santri' : 'Pelacak Tunggakan Murid',
      icon: SearchCheck,
      badge: overdueCount > 0 ? `${overdueCount} ${activeUnit === 'RQ' ? 'Santri' : 'Murid'}` : null,
      badgeColor: 'bg-[#BC6C25]/20 text-[#BC6C25] border-[#BC6C25]/30',
      color: 'text-[#BC6C25]'
    },
    {
      id: 'rapbs',
      label: 'Perencanaan RAPBS / RAKS',
      icon: PieChart,
      badge: null,
      color: 'text-[#8B9D83]'
    },
    {
      id: 'reports',
      label: 'Cetak BKU & Laporan',
      icon: FileSpreadsheet,
      badge: null,
      color: 'text-[#6B5E4C]'
    },
    {
      id: 'receipts',
      label: 'Generator Kwitansi Resmi',
      icon: ReceiptText,
      badge: null,
      color: 'text-[#D4A373]'
    },
    {
      id: 'master',
      label: 'Master & Duplikasi TA',
      icon: CopyPlus,
      badge: 'Baru',
      badgeColor: 'bg-[#8B9D83]/20 text-[#55694E] border-[#8B9D83]/30',
      color: 'text-[#8B9D83]'
    },
    {
      id: 'security',
      label: 'Otorisasi & Hak Akses',
      icon: ShieldCheck,
      badge: isSuperAdmin ? 'Super' : 'Akses',
      badgeColor: isSuperAdmin ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300',
      color: isSuperAdmin ? 'text-amber-700' : 'text-emerald-700'
    },
    {
      id: 'guide',
      label: 'Buku Panduan & Tutorial',
      icon: BookOpen,
      badge: 'PDF',
      badgeColor: 'bg-[#D4A373]/20 text-[#8C5C2E] border-[#D4A373]/30',
      color: 'text-[#D4A373]'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-[#2D2821]/40 backdrop-blur-xs z-30 lg:hidden animate-in fade-in duration-150"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#E9E3D8] text-[#4A4238] flex flex-col border-r border-[#D9D1C2] shadow-xs transition-transform lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Brand Header */}
        <div className="p-4 border-b border-[#D9D1C2] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-full bg-white border border-[#D9D1C2] p-0.5 flex items-center justify-center shadow-xs shrink-0">
              <SchoolLogo unit={activeUnit} size={38} />
            </div>
            <div>
              <div className="text-sm font-black text-[#2D2821] tracking-wide leading-tight">Sistem Keuangan App</div>
              <div className="text-[10px] text-[#65A30D] font-bold tracking-wider uppercase leading-tight mt-0.5">
                {activeUnit === 'RQ' ? "RUMAH QUR'AN" : activeUnit === 'KB' ? 'KELOMPOK BERMAIN' : 'TK ISLAM'}
              </div>
              <div className="text-[10px] text-[#8D8271] font-semibold tracking-tight mt-0.5">
                | by Integral for ERP
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-[#8D8271] hover:text-[#2D2821] p-1 rounded-md"
            >
              ✕
            </button>
          )}
        </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-bold text-[#8D8271] uppercase tracking-wider">
          Modul Keuangan
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                setCurrentTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                isActive 
                  ? 'bg-[#D4A373] text-white font-bold shadow-xs' 
                  : 'text-[#6B5E4C] hover:bg-[#D9D1C2]/70 hover:text-[#2D2821]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : item.color} group-hover:text-[#2D2821]`} />
                <span className="text-left">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isActive ? 'bg-white/25 text-white border-white/40' : item.badgeColor || 'bg-[#F4F1EC] text-[#6B5E4C] border-[#D9D1C2]'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active User Session & Logout */}
      <div className="p-3 border-t border-[#D9D1C2] bg-white/60">
        <div className="flex items-center justify-between gap-2">
          <button 
            type="button"
            onClick={() => onOpenSwitchUser ? onOpenSwitchUser() : setCurrentTab('security')}
            title="Klik untuk Otorisasi / Beralih Akun Pengguna"
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity flex-1"
          >
            <div 
              className="w-8 h-8 rounded-xl bg-[#BC6C25] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs"
            >
              {currentUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#2D2821] truncate flex items-center gap-1">
                <span>{currentUser.fullName}</span>
              </div>
              <div className="text-[10px] text-[#6B5E4C] font-semibold flex items-center gap-1">
                <span>@{currentUser.username}</span>
                <span>•</span>
                {currentUser.role === 'SUPER_ADMIN' || currentUser.unitAccess === 'ALL' ? (
                  <span className="text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-bold">Super Admin</span>
                ) : (
                  <span className="text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded font-bold">Unit {currentUser.unitAccess}</span>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              id="btn-sidebar-switch-user"
              onClick={() => onOpenSwitchUser ? onOpenSwitchUser() : setCurrentTab('security')}
              title="Otorisasi & Beralih Akun"
              className="p-1.5 rounded-lg text-[#6B5E4C] hover:text-[#2D2821] hover:bg-[#E9E3D8] border border-transparent transition-colors"
            >
              <UserCheck className="w-4 h-4 text-[#059669]" />
            </button>

            <button
              onClick={() => {
                if (confirm(`Apakah Anda yakin ingin keluar dari aplikasi untuk akun "${currentUser.fullName}"?`)) {
                  logout();
                }
              }}
              title="Keluar / Kunci Aplikasi"
              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer / System Status */}
      <div className="px-3 py-2 border-t border-[#D9D1C2] bg-[#F4F1EC]">
        <div className="flex items-center justify-between text-[11px] text-[#8D8271]">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-[#8B9D83]"></span>
            <span>Versi 3.0.0 Multi-Unit</span>
          </div>
          <span className="text-[10px] bg-[#E9E3D8] text-[#6B5E4C] border border-[#D9D1C2] px-1.5 py-0.5 rounded font-mono font-bold">
            {activeUnit} • {activeAcademicYear}
          </span>
        </div>
      </div>
    </aside>
  </>
  );
};
