import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolUnitType } from '../../types';
import { 
  Building2, Calendar, Shield, ChevronDown, 
  PlusCircle, Receipt, DownloadCloud, Sparkles, BookOpen, AlertTriangle, Menu,
  Cloud, RefreshCw, CheckCircle2, AlertCircle, Wifi, Database, LogOut, Lock,
  ShieldCheck, KeyRound, UserCheck
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { SchoolLogo } from '../common/SchoolLogo';
import { DatabaseSyncModal } from '../database/DatabaseSyncModal';

interface HeaderProps {
  className?: string;
  onToggleSidebar?: () => void;
  onOpenSwitchUser?: () => void;
  onOpenNewPayment?: () => void;
  onOpenNewCash?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  className = '',
  onToggleSidebar,
  onOpenSwitchUser,
  onOpenNewPayment,
  onOpenNewCash
}) => {
  const { 
    state, 
    activeUnit, 
    setActiveUnit, 
    activeProfile, 
    activeAcademicYear, 
    setActiveAcademicYear,
    currentUser,
    switchUser,
    setCurrentTab,
    exportBackup,
    syncStatus,
    syncError,
    lastSyncMeta,
    lastSyncedAt,
    forceSyncToCloud,
    forceFetchFromCloud,
    logout
  } = useApp();

  const [unitDropdownOpen, setUnitDropdownOpen] = useState(false);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await forceSyncToCloud();
    setTimeout(() => setIsManualSyncing(false), 500);
  };

  const handleManualFetch = async () => {
    setIsManualSyncing(true);
    await forceFetchFromCloud();
    setTimeout(() => setIsManualSyncing(false), 500);
  };

  // Compute total cash balance across current unit
  const unitTransactions = state.cashTransactions.filter(
    tx => tx.unit === activeUnit && tx.academicYear === activeAcademicYear
  );
  const totalIn = unitTransactions.filter(t => t.type === 'MASUK').reduce((acc, t) => acc + t.amount, 0);
  const totalOut = unitTransactions.filter(t => t.type === 'KELUAR').reduce((acc, t) => acc + t.amount, 0);
  const currentBalance = totalIn - totalOut;

  const unitOptions: { id: SchoolUnitType; label: string; badge: string; desc: string; color: string }[] = [
    { id: 'TK', label: state.profiles?.TK?.name || 'TK Islam Thoriqul Jannah Sinjai', badge: 'TK', desc: 'Taman Kanak-Kanak', color: 'bg-emerald-600' },
    { id: 'KB', label: state.profiles?.KB?.name || 'KB Thoriqul Jannah Sinjai', badge: 'KB', desc: 'Kelompok Bermain', color: 'bg-sky-600' },
    { id: 'SD', label: state.profiles?.SD?.name || 'SD IT Thoriqul Jannah Sinjai', badge: 'SD', desc: 'Sekolah Dasar Islam Terpadu', color: 'bg-red-600' },
    { id: 'SMP', label: state.profiles?.SMP?.name || 'SMP IT Thoriqul Jannah Sinjai', badge: 'SMP', desc: 'Sekolah Menengah Pertama Terpadu', color: 'bg-blue-600' },
    { id: 'SMA', label: state.profiles?.SMA?.name || 'SMA IT Thoriqul Jannah Sinjai', badge: 'SMA', desc: 'Sekolah Menengah Atas Terpadu', color: 'bg-slate-600' },
    { id: 'RQ', label: state.profiles?.RQ?.name || "RQ Aulady Thoriqul Jannah Sinjai", badge: 'RQ', desc: "Rumah Qur'an Aulady", color: 'bg-purple-600' }
  ];

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.unitAccess === 'ALL';

  const handleUnitSelect = (unitId: SchoolUnitType) => {
    if (!isSuperAdmin) {
      if (unitId !== currentUser.unitAccess) {
        alert(`Akses Terbatas: Akun @${currentUser.username} (${currentUser.role.replace(/_/g, ' ')}) hanya memiliki hak akses ke Unit ${currentUser.unitAccess}.\n\nOtoritas akses ke seluruh unit hanya dimiliki oleh Super Admin Yayasan.`);
        return;
      }
      setActiveUnit(unitId);
      setUnitDropdownOpen(false);
      return;
    }

    // Super Admin has full authority to switch to any unit
    setActiveUnit(unitId);
    setUnitDropdownOpen(false);
  };

  return (
    <header className={`bg-[#FDFBF7] border-b border-[#D9D1C2] sticky top-0 z-30 shadow-xs ${className}`}>
      <div className="px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Mobile Toggle & School Unit & Identity */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 rounded-lg border border-[#D9D1C2] hover:bg-[#E9E3D8] text-[#4A4238]"
              title="Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <button
              id="btn-unit-selector"
              onClick={() => setUnitDropdownOpen(!unitDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#D9D1C2] bg-[#E9E3D8] hover:bg-[#DFD8CC] text-left transition-all shadow-2xs"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-[#D9D1C2] p-0.5 flex items-center justify-center shrink-0">
                <SchoolLogo unit={activeUnit} size={28} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#2D2821] tracking-tight">{activeProfile.name}</span>
                  {isSuperAdmin ? (
                    <ChevronDown className="w-4 h-4 text-[#8D8271]" />
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.2 rounded-md">
                      Akses Unit {activeUnit}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#6B5E4C] font-medium flex items-center gap-1">
                  <span>{activeProfile.foundation}</span>
                  {isSuperAdmin ? (
                    <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded font-bold">
                      Super Admin
                    </span>
                  ) : null}
                </div>
              </div>
            </button>

            {/* Dropdown Menu for School Units */}
            {unitDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUnitDropdownOpen(false)} />
                <div 
                  id="menu-unit-dropdown"
                  className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#D9D1C2] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-1.5 flex items-center justify-between border-b border-slate-100 mb-1">
                    <span className="text-[11px] font-bold text-[#8D8271] uppercase tracking-wider">
                      {isSuperAdmin ? 'Pilih Unit Sekolah (Super Admin)' : 'Otoritas Akses Unit'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSuperAdmin ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isSuperAdmin ? 'Akses Semua Unit' : `Hanya Unit ${currentUser.unitAccess}`}
                    </span>
                  </div>

                  {!isSuperAdmin && (
                    <div className="mx-2 mb-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        Akun Anda memiliki hak akses khusus pada <strong>Unit {currentUser.unitAccess}</strong>. Akses lintas unit hanya untuk Super Admin Yayasan.
                      </span>
                    </div>
                  )}

                  <div className="space-y-1 px-1">
                    {unitOptions.map((opt) => {
                      const isCurrent = activeUnit === opt.id;
                      const isAllowed = isSuperAdmin || currentUser.unitAccess === opt.id;

                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleUnitSelect(opt.id)}
                          disabled={!isAllowed}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-xl transition-colors ${
                            isCurrent
                              ? 'bg-[#F4F1EC] font-bold ring-1 ring-emerald-500/30'
                              : isAllowed
                              ? 'hover:bg-[#F4F1EC]'
                              : 'opacity-50 cursor-not-allowed bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-xs ${opt.color}`}>
                              {opt.badge}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-[#2D2821] flex items-center gap-1.5">
                                <span>{opt.label}</span>
                                {!isAllowed && <Lock className="w-3 h-3 text-slate-400" />}
                              </div>
                              <div className="text-[11px] text-[#6B5E4C]">{opt.desc}</div>
                            </div>
                          </div>
                          {isCurrent ? (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Aktif</span>
                          ) : isAllowed ? (
                            <span className="text-[10px] text-[#8D8271] opacity-0 hover:opacity-100 transition-opacity">Pilih &rarr;</span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Terkunci
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Academic Year Selector */}
          <div className="relative hidden sm:block">
            <button
              id="btn-year-selector"
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F1EC] hover:bg-[#E9E3D8] text-[#4A4238] text-xs font-medium rounded-xl transition-colors border border-[#D9D1C2]"
            >
              <Calendar className="w-3.5 h-3.5 text-[#8D8271]" />
              <span>TA: <strong className="text-[#2D2821]">{activeAcademicYear}</strong></span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8D8271]" />
            </button>

            {yearDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setYearDropdownOpen(false)} />
                <div 
                  id="menu-year-dropdown"
                  className="absolute left-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-[#D9D1C2] py-1.5 z-50"
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-[#8D8271] uppercase">Tahun Ajaran</div>
                  {state.academicYears.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => {
                        setActiveAcademicYear(yr);
                        setYearDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F4F1EC] flex items-center justify-between ${
                        activeAcademicYear === yr ? 'text-[#55694E] font-bold bg-[#8B9D83]/15' : 'text-[#4A4238]'
                      }`}
                    >
                      <span>{yr}</span>
                      {activeAcademicYear === yr && <span className="text-[10px] bg-[#8B9D83] text-white px-1.5 py-0.5 rounded font-bold">Aktif</span>}
                    </button>
                  ))}
                  <div className="border-t border-[#D9D1C2] my-1"></div>
                  <button
                    onClick={() => {
                      setCurrentTab('master');
                      setYearDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#BC6C25] hover:bg-[#F4F1EC] font-semibold flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Buat TA Baru</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Middle: Live Balance Indicator & Cloud Sync */}
        <div className="hidden xl:flex items-center gap-3">
          <div className="flex items-center gap-3 bg-[#F4F1EC] border border-[#D9D1C2] px-3.5 py-1.5 rounded-xl">
            <div className="text-[11px] text-[#8D8271] font-medium">Saldo Kas {activeUnit}:</div>
            <div className={`text-sm font-bold ${currentBalance >= 0 ? 'text-[#55694E]' : 'text-[#BC6C25]'}`}>
              {formatRupiah(currentBalance)}
            </div>
          </div>
        </div>

        {/* Right: Actions & User Role & Cloud Sync */}
        <div className="flex items-center gap-2">
          
          {/* Cloud Multi-Device Sync Indicator */}
          <button
            id="btn-cloud-sync-status"
            onClick={() => setSyncModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              syncStatus === 'connected'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : syncStatus === 'syncing'
                ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                : syncStatus === 'connecting'
                ? 'bg-sky-50 border-sky-300 text-sky-800 hover:bg-sky-100'
                : 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
            }`}
            title="Status Sinkronisasi Cloud Antar Komputer / Jaringan"
          >
            {syncStatus === 'connected' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline text-[11px] font-bold">Cloud Online</span>
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span className="hidden lg:inline text-[11px] font-bold">Menyimpan...</span>
              </>
            ) : syncStatus === 'connecting' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                <span className="hidden lg:inline text-[11px] font-bold">Menghubungkan...</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden lg:inline text-[11px] font-bold">Offline</span>
              </>
            )}
          </button>

          {/* Quick Action: Bayar SPP */}
          <button
            id="btn-quick-spp"
            onClick={() => onOpenNewPayment ? onOpenNewPayment() : setCurrentTab('spp')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#8B9D83] hover:bg-[#7A8C72] active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title={`Terima Pembayaran SPP / DSP ${activeUnit === 'RQ' ? 'Santri' : 'Murid'}`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Bayar SPP/DSP</span>
          </button>

          {/* Quick Action: Catat Kas */}
          <button
            id="btn-quick-cash"
            onClick={() => onOpenNewCash ? onOpenNewCash() : setCurrentTab('cash')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D4A373] hover:bg-[#C49363] active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Input Kas Masuk / Keluar BKU"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">+ Catat Kas (BKU)</span>
          </button>

          {/* User Account / Role Badge & Dropdown */}
          <div className="relative">
            <button
              id="btn-user-profile"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#F4F1EC] hover:bg-[#E9E3D8] border border-[#D9D1C2] rounded-xl text-left transition-colors ml-1"
            >
              <div 
                className="w-7 h-7 rounded-full bg-[#BC6C25] flex items-center justify-center text-white text-xs font-bold shadow-xs"
              >
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-[#2D2821] leading-tight max-w-[130px] truncate">
                  {currentUser.fullName}
                </div>
                <div className="text-[10px] text-[#8D8271] font-semibold flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-[#8B9D83]" />
                  <span>{currentUser.role.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8D8271]" />
            </button>

            {/* User Dropdown Menu */}
            {userDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                <div 
                  id="menu-user-dropdown"
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#D9D1C2] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-[#4A4238]"
                >
                  <div className="px-4 py-2 border-b border-[#D9D1C2]/60">
                    <div className="font-bold text-xs text-[#2D2821]">{currentUser.fullName}</div>
                    <div className="text-[11px] text-[#6B5E4C] font-mono">@{currentUser.username}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] bg-[#E9E3D8] text-[#2D2821] px-2 py-0.5 rounded-full font-bold">
                        Akses: {currentUser.unitAccess === 'ALL' ? 'Semua Unit (Yayasan)' : `Unit ${currentUser.unitAccess}`}
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      id="btn-header-switch-user"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (onOpenSwitchUser) onOpenSwitchUser();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs text-[#2D2821] hover:bg-[#F4F1EC] flex items-center gap-2 font-bold transition-colors"
                    >
                      <UserCheck className="w-4 h-4 text-[#059669]" />
                      <span>Otorisasi Akses Pengguna</span>
                    </button>

                    <button
                      id="btn-header-security-settings"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentTab('security');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs text-[#2D2821] hover:bg-[#F4F1EC] flex items-center gap-2 font-semibold transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-[#8B9D83]" />
                      <span>Keamanan & Hak Akses</span>
                    </button>

                    <div className="border-t border-[#D9D1C2]/60 my-1"></div>

                    <button
                      id="btn-header-logout"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        if (confirm(`Apakah Anda yakin ingin keluar dan mengunci aplikasi untuk akun "${currentUser.fullName}"?`)) {
                          logout();
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-bold transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Keluar / Kunci Aplikasi</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Cloud Sync Information & Multi-Unit Control Modal */}
      <DatabaseSyncModal
        isOpen={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
      />
    </header>
  );
};
