import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolUnitType } from '../../types';
import { INITIAL_PROFILES } from '../../data/initialData';
import { 
  Cloud, RefreshCw, DownloadCloud, Database, ShieldCheck, CheckCircle2, 
  AlertTriangle, ArrowRight, Download, Wifi, Activity, Check, X, Server, Layers
} from 'lucide-react';
import { 
  calculateUnitDatabaseStats, 
  testCloudConnection, 
  UnitSyncStats 
} from '../../services/firebaseSync';

interface DatabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseSyncModal: React.FC<DatabaseSyncModalProps> = ({ isOpen, onClose }) => {
  const { 
    state, 
    activeUnit, 
    syncStatus, 
    syncError, 
    lastSyncMeta, 
    lastSyncedAt, 
    forceSyncToCloud, 
    forceFetchFromCloud,
    setActiveUnit
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingLatency, setIsTestingLatency] = useState(false);
  const [latencyResult, setLatencyResult] = useState<{ success: boolean; latencyMs: number; message: string } | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'ALL' | SchoolUnitType>('ALL');
  const [integrityMessage, setIntegrityMessage] = useState<string | null>(null);

  const unitStats = calculateUnitDatabaseStats(state);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await forceSyncToCloud();
      setIntegrityMessage('Database seluruh unit berhasil disinkronkan dan disimpan ke Cloud Firestore.');
      setTimeout(() => setIntegrityMessage(null), 4000);
    } catch (e: any) {
      alert(`Gagal sinkronisasi: ${e?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualFetch = async () => {
    if (!confirm('Apakah Anda ingin memuat ulang data terbaru dari Cloud Firestore?')) return;
    setIsSyncing(true);
    try {
      await forceFetchFromCloud();
      setIntegrityMessage('Data terbaru dari Cloud Firestore berhasil dimuat ke aplikasi.');
      setTimeout(() => setIntegrityMessage(null), 4000);
    } catch (e: any) {
      alert(`Gagal mengambil data dari Cloud: ${e?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestLatency = async () => {
    setIsTestingLatency(true);
    const result = await testCloudConnection();
    setLatencyResult(result);
    setIsTestingLatency(false);
  };

  // Export specific unit data as standalone JSON
  const handleExportUnitJson = (unitKey: SchoolUnitType) => {
    const unitStudents = state.students.filter(s => s.unit === unitKey);
    const unitPayments = state.studentPayments.filter(p => p.unit === unitKey);
    const unitBku = state.cashTransactions.filter(t => t.unit === unitKey);
    const unitBudgets = state.budgetPlans.filter(b => b.unit === unitKey);
    const unitFees = state.masterFees.filter(f => f.unit === unitKey);
    const unitProfile = state.profiles?.[unitKey] || INITIAL_PROFILES[unitKey];

    const exportData = {
      unit: unitKey,
      exportedAt: new Date().toISOString(),
      profile: unitProfile,
      students: unitStudents,
      payments: unitPayments,
      cashTransactions: unitBku,
      budgetPlans: unitBudgets,
      masterFees: unitFees
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SIKEU_Database_Unit_${unitKey}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-[#FDFBF7] rounded-3xl border border-[#D9D1C2] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 bg-[#2D2821] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#059669] flex items-center justify-center text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Sinkronisasi & Integrasi Database Unit</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Cloud Firestore Realtime
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Pemantauan status database terpadu untuk Unit TK, KB, RQ, SD, SMP, dan SMA IT Thoriqul Jannah Sinjai
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-[#2D2821]">

          {/* Alert Message if Any */}
          {integrityMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{integrityMessage}</span>
            </div>
          )}

          {/* Cloud Connection Bar */}
          <div className="bg-white p-5 rounded-2xl border border-[#D9D1C2] shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' :
                  syncStatus === 'syncing' ? 'bg-amber-500 animate-spin' :
                  syncStatus === 'connecting' ? 'bg-sky-500 animate-spin' : 'bg-rose-500'
                }`} />
                <div>
                  <div className="text-xs font-bold text-[#6B5E4C]">Status Cloud Database:</div>
                  <div className="text-sm font-extrabold flex items-center gap-2">
                    {syncStatus === 'connected' ? (
                      <span className="text-emerald-700">Terhubung & Tersinkronisasi Otomatis</span>
                    ) : syncStatus === 'syncing' ? (
                      <span className="text-amber-700">Sedang Mengunggah Pembaruan...</span>
                    ) : syncStatus === 'connecting' ? (
                      <span className="text-sky-700">Menghubungkan ke Server...</span>
                    ) : (
                      <span className="text-rose-700">Offline / Terputus</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ping / Latency Test */}
              <div className="flex items-center gap-2">
                {latencyResult && (
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                    latencyResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {latencyResult.latencyMs} ms
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleTestLatency}
                  disabled={isTestingLatency}
                  className="px-3 py-1.5 bg-[#F4F1EC] hover:bg-[#E9E3D8] text-[#2D2821] rounded-xl text-xs font-semibold border border-[#D9D1C2] flex items-center gap-1.5 transition-colors"
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingLatency ? 'animate-spin text-emerald-600' : 'text-[#8D8271]'}`} />
                  <span>{isTestingLatency ? 'Menguji...' : 'Tes Latensi'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F4F1EC] text-xs">
              <div className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#D9D1C2]/60">
                <span className="text-[#8D8271] block text-[11px]">Waktu Sinkronisasi Terakhir:</span>
                <span className="font-mono font-bold text-[#2D2821]">
                  {lastSyncedAt ? lastSyncedAt.toLocaleTimeString('id-ID') : 'Baru Saja'}
                </span>
              </div>
              <div className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#D9D1C2]/60">
                <span className="text-[#8D8271] block text-[11px]">Akun Terakhir Memperbarui:</span>
                <span className="font-semibold text-[#2D2821]">
                  {lastSyncMeta ? `${lastSyncMeta.updatedBy} (${lastSyncMeta.unit})` : state.currentUser.fullName}
                </span>
              </div>
              <div className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#D9D1C2]/60">
                <span className="text-[#8D8271] block text-[11px]">Koneksi Terintegrasi:</span>
                <span className="font-semibold text-[#059669]">
                  6 Unit Aktif (TK, KB, RQ, SD, SMP, SMA)
                </span>
              </div>
            </div>
          </div>

          {/* Unit Filter Navigation */}
          <div className="flex items-center justify-between border-b border-[#D9D1C2] pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-[#E9E3D8]/50 p-1 rounded-xl flex-wrap">
              <button
                type="button"
                onClick={() => setActiveViewTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeViewTab === 'ALL'
                    ? 'bg-[#2D2821] text-white shadow-xs'
                    : 'text-[#6B5E4C] hover:text-[#2D2821]'
                }`}
              >
                Semua Unit (6 Unit)
              </button>
              {(['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[]).map((uKey) => (
                <button
                  key={uKey}
                  type="button"
                  onClick={() => setActiveViewTab(uKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeViewTab === uKey
                      ? 'bg-[#2D2821] text-white shadow-xs'
                      : 'text-[#6B5E4C] hover:text-[#2D2821]'
                  }`}
                >
                  Unit {uKey}
                </button>
              ))}
            </div>

            <div className="text-xs text-[#8D8271]">
              Unit Aktif Kerja: <strong className="text-[#2D2821]">{activeUnit}</strong>
            </div>
          </div>

          {/* Unit Database Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['TK', 'KB', 'RQ', 'SD', 'SMP', 'SMA'] as SchoolUnitType[])
              .filter(u => activeViewTab === 'ALL' || activeViewTab === u)
              .map((u) => {
                const s = unitStats[u];
                if (!s) return null;
                const isSelectedUnit = activeUnit === u;

                return (
                  <div 
                    key={u}
                    className={`bg-white rounded-2xl border transition-all p-4.5 flex flex-col justify-between space-y-4 shadow-xs ${
                      isSelectedUnit 
                        ? 'border-[#059669] ring-2 ring-[#059669]/20' 
                        : 'border-[#D9D1C2]'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#F4F1EC]">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-[#F4F1EC] text-[#2D2821]">
                              {u}
                            </span>
                            <span className="text-xs font-bold text-[#2D2821]">{s.unitName}</span>
                          </div>
                          <span className="text-[11px] text-[#8D8271] block mt-0.5">Database Terintegrasi</span>
                        </div>

                        {s.integrityStatus === 'EXCELLENT' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Siap
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Periksa
                          </span>
                        )}
                      </div>

                      {/* Metrics List */}
                      <div className="space-y-2.5 py-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B5E4C]">Siswa / Santri:</span>
                          <span className="font-bold text-[#2D2821]">
                            {s.studentCount} anak ({s.activeStudentCount} aktif)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B5E4C]">Kwitansi Pembayaran:</span>
                          <span className="font-bold text-[#2D2821]">
                            {s.paymentCount} berkas
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B5E4C]">Total SPP / DSP Masuk:</span>
                          <span className="font-bold text-[#059669]">
                            {formatRupiah(s.totalPaymentAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B5E4C]">Transaksi BKU (Kas):</span>
                          <span className="font-bold text-[#2D2821]">
                            {s.bkuCount} transaksi
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B5E4C]">Saldo Kas Riil:</span>
                          <span className={`font-extrabold ${s.currentCashBalance >= 0 ? 'text-[#059669]' : 'text-rose-600'}`}>
                            {formatRupiah(s.currentCashBalance)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B5E4C]">Pos Anggaran (RAPBS):</span>
                          <span className="font-bold text-[#2D2821]">
                            {s.budgetCount} pos anggaran
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#6B5E4C]">Master Tarif Biaya:</span>
                          <span className="font-bold text-[#2D2821]">
                            {s.feeCount} tarif standar
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-[#F4F1EC] space-y-2">
                      <div className="flex items-center gap-2">
                        {activeUnit !== u ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveUnit(u);
                              setIntegrityMessage(`Unit kerja aktif beralih ke: ${s.unitName}`);
                              setTimeout(() => setIntegrityMessage(null), 3000);
                            }}
                            className="flex-1 py-1.5 px-2.5 bg-[#F4F1EC] hover:bg-[#E9E3D8] text-[#2D2821] rounded-xl text-xs font-bold border border-[#D9D1C2] transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Buka Unit Ini</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="flex-1 py-1.5 px-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 text-center flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Unit Sedang Aktif</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleExportUnitJson(u)}
                          title={`Unduh Salinan JSON Database Unit ${u}`}
                          className="p-1.5 rounded-xl border border-[#D9D1C2] bg-white hover:bg-[#F4F1EC] text-[#2D2821] transition-colors"
                        >
                          <Download className="w-4 h-4 text-[#8D8271]" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Multi-Device Architecture Information */}
          <div className="bg-[#F4F1EC] p-4.5 rounded-2xl border border-[#D9D1C2] space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-[#2D2821]">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              <span>Arsitektur Sinkronisasi Multi-Unit & Multi-Perangkat</span>
            </div>
            <p className="text-[#6B5E4C] leading-relaxed">
              Setiap kali Admin Keuangan, Bendahara, atau Guru mencatat transaksi SPP, mutasi kas BKU, atau memperbarui profil di unit manapun (<strong>TK Islam, KB, Rumah Qur'an, SD, SMP, atau SMA</strong>), perubahan tersebut secara otomatis disinkronkan ke Firestore Cloud. Komputer lain di jaringan akan menerima data baru secara real-time tanpa perlu me-refresh browser.
            </p>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-white border-t border-[#D9D1C2] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#8D8271]">
            ID Database: <span className="font-mono text-[#2D2821]">ai-studio-sikeutkkbrq-...</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualFetch}
              disabled={isSyncing}
              className="px-4 py-2 bg-[#E9E3D8] hover:bg-[#DFD8CC] text-[#2D2821] rounded-xl text-xs font-bold border border-[#D9D1C2] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Tarik Data Terbaru</span>
            </button>

            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Semua Unit Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
