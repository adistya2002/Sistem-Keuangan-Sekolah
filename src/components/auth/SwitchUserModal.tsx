import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, SchoolUnitType, UserAccount } from '../../types';
import { Shield, Key, UserCheck, X, CheckCircle2, Lock, UserPlus, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';

interface SwitchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchUserModal: React.FC<SwitchUserModalProps> = ({ isOpen, onClose }) => {
  const { state, currentUser, switchUser, addUserAccount } = useApp();
  const [activeTab, setActiveTab] = useState<'SELECT' | 'CREATE'>('SELECT');

  // Password verification state
  const [selectedUserForLogin, setSelectedUserForLogin] = useState<UserAccount | null>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Form state for creating new user
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('4Rmag3don01cr#6');
  const [newRole, setNewRole] = useState<UserRole>('ADMIN_KEUANGAN');
  const [newUnitAccess, setNewUnitAccess] = useState<SchoolUnitType | 'ALL'>('TK');
  const [newAssignedClass, setNewAssignedClass] = useState('');

  if (!isOpen) return null;

  const handleSelectUser = (user: UserAccount) => {
    // Prompt for user password
    setSelectedUserForLogin(user);
    setInputPassword('');
    setLoginError(null);
  };

  const handleConfirmLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUserForLogin) return;

    // Check password if set
    if (selectedUserForLogin.passwordHash && inputPassword !== selectedUserForLogin.passwordHash) {
      setLoginError('Password tidak sesuai. Silakan gunakan password yang valid (default: 4Rmag3don01cr#6).');
      return;
    }

    switchUser(selectedUserForLogin.id);
    setSelectedUserForLogin(null);
    setInputPassword('');
    onClose();
  };

  const handleQuickSwitch = (userId: string) => {
    switchUser(userId);
    onClose();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) {
      alert('Mohon isi username dan nama lengkap.');
      return;
    }

    const finalUnit = newRole === 'SUPER_ADMIN' ? 'ALL' : (newUnitAccess === 'ALL' ? 'TK' : newUnitAccess);

    addUserAccount({
      username: newUsername.toLowerCase().trim(),
      fullName: newFullName.trim(),
      role: newRole,
      unitAccess: finalUnit,
      passwordHash: newPassword.trim() || '4Rmag3don01cr#6',
      assignedClass: newRole === 'GURU_WALI_KELAS' ? newAssignedClass : undefined,
      avatarColor: finalUnit === 'TK' ? '#059669' : finalUnit === 'KB' ? '#0284c7' : finalUnit === 'SD' ? '#dc2626' : finalUnit === 'SMP' ? '#2563eb' : finalUnit === 'SMA' ? '#475569' : finalUnit === 'RQ' ? '#7c3aed' : '#d97706'
    });

    alert(`Akun pengguna ${newFullName} berhasil dibuat dengan hak akses ${newRole}!`);
    setActiveTab('SELECT');
    setNewUsername('');
    setNewFullName('');
    setNewPassword('4Rmag3don01cr#6');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D2821]/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#FDFBF7] rounded-2xl shadow-2xl border border-[#D9D1C2] w-full max-w-xl overflow-hidden text-[#4A4238]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#2D2821] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8B9D83] flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Otoritas & Hak Akses Unit Thoriqul Jannah</h3>
              <p className="text-[11px] text-[#D9D1C2]">Manajemen Akun Terpadu Seluruh Unit (TK, KB, SD IT, SMP IT, SMA IT, RQ)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#D9D1C2] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#D9D1C2] bg-[#F4F1EC] px-6 pt-2">
          <button
            onClick={() => { setActiveTab('SELECT'); setSelectedUserForLogin(null); }}
            className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'SELECT'
                ? 'border-[#8B9D83] text-[#55694E] bg-[#FDFBF7] rounded-t-lg font-bold'
                : 'border-transparent text-[#6B5E4C] hover:text-[#2D2821]'
            }`}
          >
            Pilih Akun Terdaftar ({state.users.length})
          </button>

          {currentUser.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => { setActiveTab('CREATE'); setSelectedUserForLogin(null); }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'CREATE'
                  ? 'border-[#8B9D83] text-[#55694E] bg-[#FDFBF7] rounded-t-lg font-bold'
                  : 'border-transparent text-[#6B5E4C] hover:text-[#2D2821]'
              }`}
            >
              + Tambah Akun / Guru Baru (Super Admin)
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {selectedUserForLogin ? (
            /* Password Authentication Modal State */
            <form onSubmit={handleConfirmLogin} className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl bg-white border border-[#D9D1C2] flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-xs"
                  style={{ backgroundColor: selectedUserForLogin.avatarColor || '#059669' }}
                >
                  {selectedUserForLogin.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-[#2D2821]">{selectedUserForLogin.fullName}</div>
                  <div className="text-xs text-[#6B5E4C] font-mono">@{selectedUserForLogin.username}</div>
                  <div className="text-[11px] text-[#8D8271] mt-0.5">
                    Otoritas: <strong className="text-[#2D2821]">{selectedUserForLogin.unitAccess === 'ALL' ? 'Semua Unit (Yayasan)' : `Unit ${selectedUserForLogin.unitAccess}`}</strong>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2821] mb-1.5 flex items-center justify-between">
                  <span>Masukkan Password untuk Otentikasi:</span>
                  <span className="text-[11px] text-[#8D8271] font-normal">Sandi Akun</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={inputPassword}
                    onChange={(e) => { setInputPassword(e.target.value); setLoginError(null); }}
                    placeholder="Masukkan password akun..."
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D9D1C2] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#8B9D83] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#8D8271] hover:text-[#2D2821]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginError && (
                  <div className="text-xs text-[#BC6C25] font-semibold mt-1.5">
                    {loginError}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedUserForLogin(null)}
                  className="px-4 py-2 border border-[#D9D1C2] bg-white rounded-xl text-xs font-bold text-[#6B5E4C] hover:bg-[#E9E3D8]"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B9D83] hover:bg-[#7A8C72] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Masuk Sebagai {selectedUserForLogin.username}
                </button>
              </div>
            </form>
          ) : activeTab === 'SELECT' ? (
            <div className="space-y-2.5">
              <div className="text-xs text-[#6B5E4C] mb-3">
                Pilih profil akun admin atau guru di bawah ini untuk beralih sesi dengan otoritas dan hak akses terpisah:
              </div>

              {state.users.map((user) => {
                const isCurrent = user.id === currentUser.id;
                return (
                  <div
                    key={user.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-[#E9E3D8] border-[#8B9D83] ring-2 ring-[#8B9D83]/20'
                        : 'bg-white border-[#D9D1C2] hover:border-[#8B9D83]/60 hover:bg-[#F4F1EC]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-xs"
                        style={{ backgroundColor: user.avatarColor || '#8B9D83' }}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#2D2821]">{user.fullName}</span>
                          {isCurrent && (
                            <span className="bg-[#8B9D83] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Sedang Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#6B5E4C] flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="font-mono bg-[#E9E3D8] text-[#2D2821] px-1.5 py-0.2 rounded font-bold">
                            @{user.username}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-[#2D2821]">
                            Unit: <strong className={user.unitAccess === 'TK' ? 'text-[#059669]' : user.unitAccess === 'KB' ? 'text-[#0284c7]' : user.unitAccess === 'SD' ? 'text-[#dc2626]' : user.unitAccess === 'SMP' ? 'text-[#2563eb]' : user.unitAccess === 'SMA' ? 'text-[#475569]' : user.unitAccess === 'RQ' ? 'text-[#7c3aed]' : 'text-[#BC6C25]'}>
                              {user.unitAccess === 'ALL' ? 'Semua Unit (Yayasan)' : user.unitAccess}
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="text-[#6B5E4C] font-medium">
                            {user.role.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {user.assignedClass && (
                          <div className="text-[10px] text-[#BC6C25] font-semibold mt-0.5">
                            Wali Kelas: {user.assignedClass}
                          </div>
                        )}
                      </div>
                    </div>

                    {!isCurrent && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickSwitch(user.id)}
                          className="px-3 py-1.5 bg-[#8B9D83] hover:bg-[#7A8C72] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                          title="Langsung Masuk"
                        >
                          Login
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#2D2821] mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: guruthk1 / bendahara_tk"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D9D1C2] rounded-xl focus:ring-2 focus:ring-[#8B9D83] focus:outline-none text-[#2D2821]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2821] mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Ustadzah Rahmi, S.Pd"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D9D1C2] rounded-xl focus:ring-2 focus:ring-[#8B9D83] focus:outline-none text-[#2D2821]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#2D2821] mb-1">Password Akun *</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#D9D1C2] rounded-xl focus:ring-2 focus:ring-[#8B9D83] focus:outline-none text-[#2D2821] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D2821] mb-1">Peran / Otoritas *</label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const roleVal = e.target.value as UserRole;
                      setNewRole(roleVal);
                      if (roleVal === 'SUPER_ADMIN') {
                        setNewUnitAccess('ALL');
                      } else if (newUnitAccess === 'ALL') {
                        setNewUnitAccess('TK');
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-[#D9D1C2] rounded-xl focus:ring-2 focus:ring-[#8B9D83] focus:outline-none text-[#2D2821]"
                  >
                    <option value="ADMIN_KEUANGAN">Admin Keuangan / Bendahara</option>
                    <option value="KEPALA_SEKOLAH">Kepala Sekolah / Mudir</option>
                    <option value="GURU_WALI_KELAS">Guru / Wali Kelas / Musyrif</option>
                    <option value="SUPER_ADMIN">Super Admin Yayasan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2D2821] mb-1">Izin Akses Unit Sekolah *</label>
                  {newRole === 'SUPER_ADMIN' ? (
                    <div className="px-3 py-2 bg-[#F4F1EC] border border-[#D9D1C2] rounded-xl text-xs font-bold text-[#55694E]">
                      Semua Unit (Otoritas Penuh)
                    </div>
                  ) : (
                    <select
                      value={newUnitAccess}
                      onChange={(e) => setNewUnitAccess(e.target.value as SchoolUnitType | 'ALL')}
                      className="w-full px-3 py-2 bg-white border border-[#D9D1C2] rounded-xl focus:ring-2 focus:ring-[#8B9D83] focus:outline-none text-[#2D2821]"
                    >
                      <option value="TK">Hanya Unit TK (Taman Kanak-Kanak)</option>
                      <option value="KB">Hanya Unit KB (Kelompok Bermain)</option>
                      <option value="SD">Hanya Unit SD (Sekolah Dasar)</option>
                      <option value="SMP">Hanya Unit SMP (Sekolah Menengah Pertama)</option>
                      <option value="SMA">Hanya Unit SMA (Sekolah Menengah Atas)</option>
                      <option value="RQ">Hanya Unit RQ (Rumah Quran)</option>
                    </select>
                  )}
                </div>
              </div>

              {newRole === 'GURU_WALI_KELAS' && (
                <div>
                  <label className="block font-bold text-[#2D2821] mb-1">Tugas Kelas / Halaqoh</label>
                  <input
                    type="text"
                    placeholder="misal: TK A1 (Thoriq) atau RQ Level 1"
                    value={newAssignedClass}
                    onChange={(e) => setNewAssignedClass(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D9D1C2] rounded-xl focus:ring-2 focus:ring-[#8B9D83] focus:outline-none text-[#2D2821]"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('SELECT')}
                  className="px-4 py-2 border border-[#D9D1C2] bg-white rounded-xl text-[#6B5E4C] hover:bg-[#E9E3D8] font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8B9D83] hover:bg-[#7A8C72] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Simpan Akun Pengguna
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
