import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolUnitType } from '../../types';
import { SchoolLogo } from '../common/SchoolLogo';
import { 
  Lock, User, Eye, EyeOff, ShieldCheck, 
  ArrowRight, AlertCircle, Crown, ShieldAlert,
  KeyRound, CheckCircle2, X, Sparkles
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, setActiveUnit, state } = useApp();

  const [selectedUnitTab, setSelectedUnitTab] = useState<SchoolUnitType | 'SUPER'>('TK');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Switch unit tab
  const handleTabChange = (tab: SchoolUnitType | 'SUPER') => {
    setSelectedUnitTab(tab);
    setErrorMessage(null);
    if (tab !== 'SUPER') {
      setActiveUnit(tab);
    }
  };

  const handleSelectPreAuthorizedAccount = (accUsername: string, unitTab: SchoolUnitType | 'SUPER') => {
    handleTabChange(unitTab);
    setUsername(accUsername);
    setPassword('4Rmag3don01cr#6');
    setIsAuthModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Silakan masukkan username akun.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan password akun.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = login(username.trim(), password, rememberMe);
      setIsLoading(false);
      if (!res.success) {
        setErrorMessage(res.message || 'Username atau password yang Anda masukkan salah.');
      }
    }, 250);
  };

  // Color scheme based on selected tab
  const getThemeStyles = () => {
    switch (selectedUnitTab) {
      case 'TK':
        return {
          activeTab: 'bg-[#059669] text-white shadow-xs',
          btnPrimary: 'bg-[#059669] hover:bg-[#047857] text-white',
          title: 'TK Islam Thoriqul Jannah Sinjai',
          sub: 'Taman Kanak-Kanak Islam Terpadu',
          unitLabel: 'Admin Unit TK'
        };
      case 'KB':
        return {
          activeTab: 'bg-[#0284c7] text-white shadow-xs',
          btnPrimary: 'bg-[#0284c7] hover:bg-[#0369a1] text-white',
          title: 'KB Thoriqul Jannah Sinjai',
          sub: 'Kelompok Bermain & Pendidikan Usia Dini',
          unitLabel: 'Admin Unit KB'
        };
      case 'SD':
        return {
          activeTab: 'bg-[#dc2626] text-white shadow-xs',
          btnPrimary: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white',
          title: 'SD IT Thoriqul Jannah Sinjai',
          sub: 'Sekolah Dasar Islam Terpadu',
          unitLabel: 'Admin Unit SD'
        };
      case 'SMP':
        return {
          activeTab: 'bg-[#2563eb] text-white shadow-xs',
          btnPrimary: 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white',
          title: 'SMP IT Thoriqul Jannah Sinjai',
          sub: 'Sekolah Menengah Pertama Islam Terpadu',
          unitLabel: 'Admin Unit SMP'
        };
      case 'SMA':
        return {
          activeTab: 'bg-[#475569] text-white shadow-xs',
          btnPrimary: 'bg-[#475569] hover:bg-[#334155] text-white',
          title: 'SMA IT Thoriqul Jannah Sinjai',
          sub: 'Sekolah Menengah Atas Islam Terpadu',
          unitLabel: 'Admin Unit SMA'
        };
      case 'RQ':
        return {
          activeTab: 'bg-[#7c3aed] text-white shadow-xs',
          btnPrimary: 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white',
          title: 'RQ Aulady Thoriqul Jannah Sinjai',
          sub: "Rumah Qur'an Metode UMMI & Tahfizh",
          unitLabel: 'Admin Unit RQ'
        };
      case 'SUPER':
      default:
        return {
          activeTab: 'bg-[#d97706] text-white shadow-xs',
          btnPrimary: 'bg-[#d97706] hover:bg-[#b45309] text-white',
          title: 'Super Admin Yayasan Thoriqul Jannah',
          sub: 'Akses Otoritas Penuh Seluruh Unit Pendidikan',
          unitLabel: 'Super Admin Yayasan'
        };
    }
  };

  const theme = getThemeStyles();

  return (
    <div className="min-h-screen bg-[#F4F1EC] flex flex-col justify-between text-[#4A4238] font-sans antialiased p-4 sm:p-6 lg:p-8">
      
      {/* Top Ambient Brand Header */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#D9D1C2] p-1 flex items-center justify-center shadow-xs">
            <SchoolLogo unit={selectedUnitTab} size={32} />
          </div>
          <div>
            <h1 className="text-sm font-black text-[#2D2821] tracking-tight">Yayasan Thoriqul Jannah Sinjai</h1>
            <p className="text-[11px] text-[#8D8271] font-medium">Sistem Informasi Manajemen Keuangan Terpadu (SIKEU)</p>
          </div>
        </div>

        <button 
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className="flex items-center gap-1.5 text-xs text-[#2D2821] bg-white hover:bg-[#E9E3D8] border border-[#D9D1C2] px-3 py-1.5 rounded-xl font-bold shadow-2xs transition-colors cursor-pointer"
          title="Klik untuk memilih akun dan otorisasi akses pengguna"
        >
          <ShieldCheck className="w-4 h-4 text-[#059669]" />
          <span>Otorisasi Akses Pengguna</span>
        </button>
      </div>

      {/* Main Login Portal Card */}
      <div className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-[#FDFBF7] rounded-3xl border border-[#D9D1C2] shadow-2xl overflow-hidden">
          
          {/* Card Header with Unit Badges */}
          <div className="bg-[#2D2821] p-6 sm:p-7 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-16 h-16 rounded-2xl bg-white border-2 border-white/20 p-1.5 mx-auto mb-3.5 flex items-center justify-center shadow-lg">
              <SchoolLogo unit={selectedUnitTab} size={52} />
            </div>

            <h2 className="text-lg font-black tracking-tight text-white">{theme.title}</h2>
            <p className="text-xs text-[#D9D1C2] mt-1 font-medium">{theme.sub}</p>

            {/* Unit Access Selector Tabs */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 mt-5 bg-white/10 p-1.5 rounded-2xl backdrop-blur-xs text-[11px]">
              <button
                type="button"
                id="tab-login-tk"
                onClick={() => handleTabChange('TK')}
                className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedUnitTab === 'TK' ? 'bg-[#059669] text-white shadow-xs' : 'text-[#D9D1C2] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>TK</span>
              </button>

              <button
                type="button"
                id="tab-login-kb"
                onClick={() => handleTabChange('KB')}
                className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedUnitTab === 'KB' ? 'bg-[#0284c7] text-white shadow-xs' : 'text-[#D9D1C2] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>KB</span>
              </button>

              <button
                type="button"
                id="tab-login-sd"
                onClick={() => handleTabChange('SD')}
                className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedUnitTab === 'SD' ? 'bg-[#dc2626] text-white shadow-xs' : 'text-[#D9D1C2] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>SD</span>
              </button>

              <button
                type="button"
                id="tab-login-smp"
                onClick={() => handleTabChange('SMP')}
                className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedUnitTab === 'SMP' ? 'bg-[#2563eb] text-white shadow-xs' : 'text-[#D9D1C2] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span>SMP</span>
              </button>

              <button
                type="button"
                id="tab-login-sma"
                onClick={() => handleTabChange('SMA')}
                className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedUnitTab === 'SMA' ? 'bg-[#475569] text-white shadow-xs' : 'text-[#D9D1C2] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                <span>SMA</span>
              </button>

              <button
                type="button"
                id="tab-login-rq"
                onClick={() => handleTabChange('RQ')}
                className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedUnitTab === 'RQ' ? 'bg-[#7c3aed] text-white shadow-xs' : 'text-[#D9D1C2] hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span>RQ</span>
              </button>

              <button
                type="button"
                id="tab-login-super"
                onClick={() => handleTabChange('SUPER')}
                className={`py-1.5 px-1 rounded-xl font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                  selectedUnitTab === 'SUPER' ? 'bg-[#d97706] text-white shadow-xs' : 'text-[#D9D1C2] hover:text-white hover:bg-white/5'
                }`}
              >
                <Crown className="w-2.5 h-2.5 text-amber-300" />
                <span>Yayasan</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-8 space-y-5">
            
            {/* Error Notification */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Otorisasi Masuk Ditolak</div>
                  <div className="text-rose-700 text-[11px] mt-0.5">{errorMessage}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Field */}
              <div>
                <label className="block text-xs font-bold text-[#2D2821] mb-1.5 flex items-center justify-between">
                  <span>Username Akun *</span>
                  <span className="text-[11px] text-[#8D8271] font-normal font-mono">
                    {theme.unitLabel}
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8D8271]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setErrorMessage(null); }}
                    placeholder="Masukkan nama pengguna..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#D9D1C2] rounded-xl text-xs font-medium text-[#2D2821] focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent focus:outline-none transition-all placeholder:text-[#A0988A]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-bold text-[#2D2821] mb-1.5 flex items-center justify-between">
                  <span>Password Akun *</span>
                  <span className="text-[11px] text-[#8D8271] font-normal">Sandi Akses</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8D8271]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setErrorMessage(null); }}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#D9D1C2] rounded-xl text-xs font-medium text-[#2D2821] focus:ring-2 focus:ring-[#8B9D83] focus:border-transparent focus:outline-none transition-all placeholder:text-[#A0988A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8D8271] hover:text-[#2D2821] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#6B5E4C] font-medium select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#059669] border-[#D9D1C2] focus:ring-[#059669]"
                  />
                  <span>Ingat sesi masuk di perangkat ini</span>
                </label>
                <span className="text-[11px] text-[#8D8271] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Aman</span>
                </span>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                id="btn-submit-login"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-50 ${theme.btnPrimary}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Masuk ke {theme.title}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-[#8D8271] bg-[#F4F1EC] px-3 py-1 rounded-lg border border-[#D9D1C2]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#BC6C25]" />
                <span>Hanya pengguna dan admin terdaftar yang dapat masuk</span>
              </div>
            </div>

          </div>

          {/* Footer note */}
          <div className="px-6 py-3 bg-[#F4F1EC] border-t border-[#D9D1C2] text-center text-[11px] text-[#8D8271]">
            Yayasan Thoriqul Jannah Sinjai • Jl. KH. Ahmad Dahlan, Sinjai Utara
          </div>

        </div>
      </div>

      {/* Page Footer */}
      <div className="max-w-4xl mx-auto w-full text-center py-2 text-xs text-[#8D8271] no-print">
        &copy; {new Date().getFullYear()} SIKEU App • Sistem Keuangan Terpadu TK, KB, RQ, SD, SMP & SMA IT Thoriqul Jannah Sinjai | by Integral for ERP
      </div>

      {/* Otorisasi Akses Pengguna Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#FDFBF7] rounded-3xl border border-[#D9D1C2] shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-[#2D2821] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#059669]">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Daftar Akun Otorisasi Akses Pengguna SIKEU</h3>
                  <p className="text-xs text-slate-300">Pilih akun unit atau super admin untuk masuk dan mengelola modul aplikasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: List of Accounts */}
            <div className="p-5 overflow-y-auto space-y-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2 font-medium">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Klik <strong>"Gunakan Akun Ini"</strong> pada unit yang diinginkan untuk mengisi form login secara otomatis.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* SD IT */}
                <div className="p-3.5 bg-white border border-[#D9D1C2] hover:border-rose-400 rounded-2xl transition-all shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        SD
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#2D2821]">SD IT Thoriqul Jannah Sinjai</div>
                        <div className="text-[11px] text-[#6B5E4C] font-mono">User: <strong>sdthojan</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#8D8271] mt-2 mb-3 bg-[#F4F1EC] p-2 rounded-xl">
                    Akses: Modul BKU, SPP/DSP Murid SD, RAPBS SD & Laporan Keuangan SD
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPreAuthorizedAccount('sdthojan', 'SD')}
                    className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Gunakan Akun SD IT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SMP IT */}
                <div className="p-3.5 bg-white border border-[#D9D1C2] hover:border-blue-400 rounded-2xl transition-all shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        SMP
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#2D2821]">SMP IT Thoriqul Jannah Sinjai</div>
                        <div className="text-[11px] text-[#6B5E4C] font-mono">User: <strong>smpthojan</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#8D8271] mt-2 mb-3 bg-[#F4F1EC] p-2 rounded-xl">
                    Akses: Modul BKU, SPP/DSP Siswa SMP, RAPBS SMP & Laporan Keuangan SMP
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPreAuthorizedAccount('smpthojan', 'SMP')}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Gunakan Akun SMP IT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SMA IT */}
                <div className="p-3.5 bg-white border border-[#D9D1C2] hover:border-slate-400 rounded-2xl transition-all shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        SMA
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#2D2821]">SMA IT Thoriqul Jannah Sinjai</div>
                        <div className="text-[11px] text-[#6B5E4C] font-mono">User: <strong>smathojan</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#8D8271] mt-2 mb-3 bg-[#F4F1EC] p-2 rounded-xl">
                    Akses: Modul BKU, SPP/DSP Siswa SMA, RAPBS SMA & Laporan Keuangan SMA
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPreAuthorizedAccount('smathojan', 'SMA')}
                    className="w-full py-1.5 px-3 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Gunakan Akun SMA IT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* TK IT */}
                <div className="p-3.5 bg-white border border-[#D9D1C2] hover:border-emerald-400 rounded-2xl transition-all shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        TK
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#2D2821]">TK Islam Thoriqul Jannah Sinjai</div>
                        <div className="text-[11px] text-[#6B5E4C] font-mono">User: <strong>tkthojan</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#8D8271] mt-2 mb-3 bg-[#F4F1EC] p-2 rounded-xl">
                    Akses: Modul BKU, SPP/DSP Murid TK, RAPBS TK & Laporan Keuangan TK
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPreAuthorizedAccount('tkthojan', 'TK')}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Gunakan Akun TK IT</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* KB */}
                <div className="p-3.5 bg-white border border-[#D9D1C2] hover:border-sky-400 rounded-2xl transition-all shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        KB
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#2D2821]">KB Thoriqul Jannah Sinjai</div>
                        <div className="text-[11px] text-[#6B5E4C] font-mono">User: <strong>kbthojan</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#8D8271] mt-2 mb-3 bg-[#F4F1EC] p-2 rounded-xl">
                    Akses: Modul BKU, Iuran Santri KB, RAPBS KB & Laporan Keuangan KB
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPreAuthorizedAccount('kbthojan', 'KB')}
                    className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Gunakan Akun KB</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* RQ */}
                <div className="p-3.5 bg-white border border-[#D9D1C2] hover:border-purple-400 rounded-2xl transition-all shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        RQ
                      </div>
                      <div>
                        <div className="font-bold text-xs text-[#2D2821]">RQ Aulady Thoriqul Jannah</div>
                        <div className="text-[11px] text-[#6B5E4C] font-mono">User: <strong>rqthojan</strong></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#8D8271] mt-2 mb-3 bg-[#F4F1EC] p-2 rounded-xl">
                    Akses: Modul BKU, Syahriah RQ, RAPBS RQ & Laporan Keuangan RQ
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPreAuthorizedAccount('rqthojan', 'RQ')}
                    className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Gunakan Akun RQ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Super Admin */}
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl transition-all shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      <Crown className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-amber-950">Super Admin Yayasan Thoriqul Jannah Sinjai</div>
                      <div className="text-[11px] text-amber-800 font-mono">User: <strong>admin_yayasan</strong> (Otoritas Penuh Semua Unit)</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPreAuthorizedAccount('admin_yayasan', 'SUPER')}
                    className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
                  >
                    <span>Gunakan Akun Super Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F4F1EC] border-t border-[#D9D1C2] flex items-center justify-between">
              <div className="text-[11px] text-[#8D8271]">
                Sandi Default Semua Akun: <span className="font-mono font-bold text-[#2D2821]">4Rmag3don01cr#6</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="px-4 py-2 border border-[#D9D1C2] bg-white rounded-xl text-xs font-bold text-[#6B5E4C] hover:bg-[#E9E3D8]"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
