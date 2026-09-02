import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BudgetPlanItem } from '../../types';
import { 
  PieChart as PieIcon, Plus, Edit3, Trash2, Printer, 
  TrendingUp, TrendingDown, CheckCircle2, AlertCircle, X, Check, FileSpreadsheet
} from 'lucide-react';
import { formatRupiah, formatRupiahShort, formatDateIndo, formatReportSignatureDate } from '../../utils/formatters';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { PrintHeaderKop } from '../common/PrintHeaderKop';

export const RapbsModule: React.FC = () => {
  const { 
    state, 
    activeUnit, 
    activeProfile, 
    activeAcademicYear, 
    currentUser,
    addBudgetPlan,
    updateBudgetPlan,
    deleteBudgetPlan 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDAPATAN' | 'BELANJA'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetPlanItem | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    category: 'PENDAPATAN' as 'PENDAPATAN' | 'BELANJA',
    subCategory: 'Penerimaan SPP',
    title: '',
    plannedAmount: '',
    notes: ''
  });

  // Current Unit & Year Budget items
  const budgetItems = useMemo(() => {
    return state.budgetPlans.filter(
      b => b.unit === activeUnit && b.academicYear === activeAcademicYear
    );
  }, [state.budgetPlans, activeUnit, activeAcademicYear]);

  // Actual Transactions from BKU to calculate realization
  const unitTransactions = useMemo(() => {
    return state.cashTransactions.filter(
      tx => tx.unit === activeUnit && tx.academicYear === activeAcademicYear
    );
  }, [state.cashTransactions, activeUnit, activeAcademicYear]);

  // Map realization to each budget item by category or title matching
  const budgetWithRealization = useMemo(() => {
    return budgetItems.map(item => {
      let realized = 0;
      if (item.category === 'PENDAPATAN') {
        const matchingTxs = unitTransactions.filter(tx => 
          tx.type === 'MASUK' && (
            tx.category.toLowerCase().includes(item.subCategory.toLowerCase()) ||
            item.subCategory.toLowerCase().includes(tx.category.toLowerCase()) ||
            item.title.toLowerCase().includes(tx.category.toLowerCase()) ||
            tx.description.toLowerCase().includes(item.title.toLowerCase()) ||
            tx.description.toLowerCase().includes(item.subCategory.toLowerCase()) ||
            (item.subCategory.toLowerCase().includes('spp') && (tx.category.toLowerCase().includes('spp') || tx.category.toLowerCase().includes('penerimaan') || tx.description.toLowerCase().includes('spp'))) ||
            (item.subCategory.toLowerCase().includes('dsp') && (tx.category.toLowerCase().includes('dsp') || tx.category.toLowerCase().includes('pangkal') || tx.category.toLowerCase().includes('sarpras'))) ||
            (item.subCategory.toLowerCase().includes('bop') && (tx.category.toLowerCase().includes('bop') || tx.category.toLowerCase().includes('bos') || tx.category.toLowerCase().includes('pemerintah'))) ||
            (item.subCategory.toLowerCase().includes('infaq') && (tx.category.toLowerCase().includes('infaq') || tx.category.toLowerCase().includes('santri') || tx.category.toLowerCase().includes('donasi') || tx.category.toLowerCase().includes('wakaf')))
          )
        );
        realized = matchingTxs.reduce((sum, tx) => sum + tx.amount, 0);
      } else {
        const matchingTxs = unitTransactions.filter(tx => 
          tx.type === 'KELUAR' && (
            tx.category.toLowerCase().includes(item.subCategory.toLowerCase()) ||
            item.subCategory.toLowerCase().includes(tx.category.toLowerCase()) ||
            item.title.toLowerCase().includes(tx.category.toLowerCase()) ||
            tx.description.toLowerCase().includes(item.title.toLowerCase()) ||
            tx.description.toLowerCase().includes(item.subCategory.toLowerCase()) ||
            (item.subCategory.toLowerCase().includes('gaji') && (tx.category.toLowerCase().includes('gaji') || tx.category.toLowerCase().includes('honor') || tx.category.toLowerCase().includes('bisyarah') || tx.category.toLowerCase().includes('mukafaah'))) ||
            (item.subCategory.toLowerCase().includes('bahan') && (tx.category.toLowerCase().includes('bahan') || tx.category.toLowerCase().includes('atk') || tx.category.toLowerCase().includes('media') || tx.category.toLowerCase().includes('modul') || tx.category.toLowerCase().includes('buku'))) ||
            (item.subCategory.toLowerCase().includes('operasional') && (tx.category.toLowerCase().includes('operasional') || tx.category.toLowerCase().includes('listrik') || tx.category.toLowerCase().includes('air') || tx.category.toLowerCase().includes('internet') || tx.category.toLowerCase().includes('wifi') || tx.category.toLowerCase().includes('pdam') || tx.category.toLowerCase().includes('pln'))) ||
            (item.subCategory.toLowerCase().includes('kegiatan') && (tx.category.toLowerCase().includes('kegiatan') || tx.category.toLowerCase().includes('tema') || tx.category.toLowerCase().includes('wisuda') || tx.category.toLowerCase().includes('outing') || tx.category.toLowerCase().includes('manasik'))) ||
            (item.subCategory.toLowerCase().includes('pemeliharaan') && (tx.category.toLowerCase().includes('pemeliharaan') || tx.category.toLowerCase().includes('sarana') || tx.category.toLowerCase().includes('prasarana') || tx.category.toLowerCase().includes('perawatan'))) ||
            (item.subCategory.toLowerCase().includes('snack') && (tx.category.toLowerCase().includes('snack') || tx.category.toLowerCase().includes('nutrisi') || tx.category.toLowerCase().includes('pmt')))
          )
        );
        realized = matchingTxs.reduce((sum, tx) => sum + tx.amount, 0);
      }

      const percent = item.plannedAmount > 0 ? Math.round((realized / item.plannedAmount) * 100) : 0;
      const remaining = item.plannedAmount - realized;

      return {
        ...item,
        realizedAmount: realized,
        percentage: percent,
        remainingAmount: remaining
      };
    });
  }, [budgetItems, unitTransactions]);

  // Totals
  const totalPlannedIncome = budgetWithRealization
    .filter(b => b.category === 'PENDAPATAN')
    .reduce((sum, b) => sum + b.plannedAmount, 0);

  const totalRealizedIncome = budgetWithRealization
    .filter(b => b.category === 'PENDAPATAN')
    .reduce((sum, b) => sum + b.realizedAmount, 0);

  const totalPlannedExpense = budgetWithRealization
    .filter(b => b.category === 'BELANJA')
    .reduce((sum, b) => sum + b.plannedAmount, 0);

  const totalRealizedExpense = budgetWithRealization
    .filter(b => b.category === 'BELANJA')
    .reduce((sum, b) => sum + b.realizedAmount, 0);

  const netProjectedBalance = totalPlannedIncome - totalPlannedExpense;

  // Filtered view
  const displayedItems = useMemo(() => {
    if (activeTab === 'ALL') return budgetWithRealization;
    return budgetWithRealization.filter(b => b.category === activeTab);
  }, [budgetWithRealization, activeTab]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      code: `${activeTab === 'BELANJA' ? '2.' : '1.'}${budgetItems.length + 1}`,
      category: activeTab === 'BELANJA' ? 'BELANJA' : 'PENDAPATAN',
      subCategory: 'Penerimaan SPP',
      title: '',
      plannedAmount: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BudgetPlanItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      category: item.category,
      subCategory: item.subCategory,
      title: item.title,
      plannedAmount: String(item.plannedAmount),
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const plannedNum = parseFloat(formData.plannedAmount);
    if (!plannedNum || plannedNum <= 0) {
      alert('Mohon masukkan target anggaran yang valid.');
      return;
    }

    if (editingItem) {
      updateBudgetPlan({
        ...editingItem,
        code: formData.code,
        category: formData.category,
        subCategory: formData.subCategory,
        title: formData.title,
        plannedAmount: plannedNum,
        notes: formData.notes
      });
      alert('Pos Anggaran RAPBS berhasil diperbarui!');
    } else {
      addBudgetPlan({
        unit: activeUnit,
        academicYear: activeAcademicYear,
        code: formData.code,
        category: formData.category,
        subCategory: formData.subCategory,
        title: formData.title,
        plannedAmount: plannedNum,
        notes: formData.notes
      });
      alert('Pos Anggaran RAPBS baru berhasil ditambahkan!');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (itemId: string, title: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pos anggaran "${title}"?`)) {
      deleteBudgetPlan(itemId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold text-white bg-sky-600">
              Modul RAPBS / RAKS
            </span>
            <span className="text-xs font-semibold text-slate-500">Unit {activeUnit} • TA {activeAcademicYear}</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Rancangan Anggaran Pendapatan & Belanja Sekolah</h2>
          <p className="text-xs text-slate-500">Perencanaan target penerimaan, pos belanja operasional & komparasi realisasi real-time</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak RAPBS</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>+ Pos Anggaran Baru</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Income Card */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-xs text-emerald-800 font-semibold mb-1">
            <span>Target Pendapatan (RAPBS)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-900">{formatRupiah(totalPlannedIncome)}</div>
          <div className="flex items-center justify-between text-[11px] text-emerald-700 mt-2 font-medium">
            <span>Realisasi: {formatRupiah(totalRealizedIncome)}</span>
            <span>{totalPlannedIncome > 0 ? Math.round((totalRealizedIncome / totalPlannedIncome) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className="bg-emerald-600 h-full transition-all"
              style={{ width: `${Math.min(100, (totalRealizedIncome / (totalPlannedIncome || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-xs text-rose-800 font-semibold mb-1">
            <span>Rencana Belanja (RAPBS)</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-900">{formatRupiah(totalPlannedExpense)}</div>
          <div className="flex items-center justify-between text-[11px] text-rose-700 mt-2 font-medium">
            <span>Realisasi: {formatRupiah(totalRealizedExpense)}</span>
            <span>{totalPlannedExpense > 0 ? Math.round((totalRealizedExpense / totalPlannedExpense) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-rose-200 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div 
              className="bg-rose-600 h-full transition-all"
              style={{ width: `${Math.min(100, (totalRealizedExpense / (totalPlannedExpense || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Balance Projection Card */}
        <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl">
          <div className="text-xs text-sky-800 font-semibold mb-1">Proyeksi Surplus / (Defisit)</div>
          <div className={`text-xl font-black mt-1 ${netProjectedBalance >= 0 ? 'text-sky-950' : 'text-rose-700'}`}>
            {formatRupiah(netProjectedBalance)}
          </div>
          <div className="text-[11px] text-sky-700 mt-2">
            Status: {netProjectedBalance >= 0 ? 'Anggaran Berimbang (Surplus)' : 'Defisit Anggaran Butuh Subsidi'}
          </div>
        </div>

      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 shadow-xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'ALL'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Semua Pos ({budgetItems.length})
        </button>
        <button
          onClick={() => setActiveTab('PENDAPATAN')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'PENDAPATAN'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          1. Pos Pendapatan ({budgetItems.filter(b => b.category === 'PENDAPATAN').length})
        </button>
        <button
          onClick={() => setActiveTab('BELANJA')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'BELANJA'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          2. Pos Belanja ({budgetItems.filter(b => b.category === 'BELANJA').length})
        </button>
      </div>

      {/* RAPBS Table */}
      <div className="bg-white rounded-b-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Kode</th>
                <th className="py-3 px-3 w-28">Kategori</th>
                <th className="py-3 px-3">Uraian Program & Pos Anggaran</th>
                <th className="py-3 px-3 text-right w-32">Target RAPBS (Rp)</th>
                <th className="py-3 px-3 text-right w-32">Realisasi (Rp)</th>
                <th className="py-3 px-3 text-right w-24">Capaian %</th>
                <th className="py-3 px-3 text-right w-32">Sisa Anggaran (Rp)</th>
                <th className="py-3 px-3 w-20 text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {displayedItems.length > 0 ? (
                displayedItems.map((item) => {
                  const isIncome = item.category === 'PENDAPATAN';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-600">
                        {item.code}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {item.subCategory} {item.notes ? `• ${item.notes}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(item.plannedAmount)}
                      </td>
                      <td className={`py-3 px-3 text-right font-semibold whitespace-nowrap ${
                        isIncome ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {formatRupiah(item.realizedAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold whitespace-nowrap">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          item.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                          item.percentage >= 40 ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-600 whitespace-nowrap">
                        {formatRupiah(item.remainingAmount)}
                      </td>
                      <td className="py-3 px-3 text-center no-print">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded"
                            title="Edit Pos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus Pos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Belum ada pos anggaran yang dimasukkan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit RAPBS Item */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editingItem ? 'Edit Pos Anggaran RAPBS' : 'Tambah Pos Anggaran RAPBS Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Pos *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: 1.1 atau 2.1"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Anggaran *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="PENDAPATAN">Pendapatan (Penerimaan)</option>
                    <option value="BELANJA">Belanja (Pengeluaran)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sub Kategori *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Gaji & Honor Guru / Penerimaan SPP"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Uraian / Judul Program Anggaran *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Gaji Pokok & Tunjangan Dewan Guru & Karyawan"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Anggaran 1 Tahun (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="misal: 120000000"
                  value={formData.plannedAmount}
                  onChange={(e) => setFormData({ ...formData, plannedAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Keterangan / Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="misal: Estimasi 5 orang guru tetap"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pos Anggaran</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Print Preview Modal for RAPBS */}
      {showPrintModal && (
        <PrintPreviewModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          title={`Cetak Rancangan Anggaran (RAPBS) Unit ${activeUnit}`}
          subtitle={`Tahun Ajaran ${activeAcademicYear} • Total Anggaran: ${formatRupiah(totalPlannedIncome)}`}
          badgeText="1-Page Auto Fit"
          defaultPreset="A4"
          defaultOrientation="portrait"
          defaultFitOnePage={true}
        >
          <div className="space-y-4 text-slate-900 text-xs">
            <PrintHeaderKop 
              profile={activeProfile}
              documentTitle={`RANCANGAN ANGGARAN PENDAPATAN & BELANJA SEKOLAH (RAPBS) - TA ${activeAcademicYear}`}
              documentNumber={`RAPBS/${activeUnit}/${new Date().getFullYear()}`}
            />

            {/* Summary KPI Header */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-300 text-xs text-center font-bold">
              <div>Target Pendapatan: <span className="text-emerald-700">{formatRupiah(totalPlannedIncome)}</span></div>
              <div>Rencana Belanja: <span className="text-rose-700">{formatRupiah(totalPlannedExpense)}</span></div>
              <div>Surplus/Defisit: <span className={netProjectedBalance >= 0 ? 'text-slate-900' : 'text-rose-700'}>{formatRupiah(netProjectedBalance)}</span></div>
            </div>

            {/* 1. BAGIAN PENDAPATAN */}
            <div className="space-y-1.5">
              <div className="font-bold text-xs bg-slate-200 px-2 py-1 rounded text-slate-900 uppercase">
                A. Rencana Penerimaan & Pendapatan Sekolah
              </div>
              <table className="w-full text-left text-[11px] border-2 border-slate-800">
                <thead className="bg-slate-100 font-bold border-b-2 border-slate-800 text-slate-900">
                  <tr>
                    <th className="p-1.5 w-12 text-center border-r border-slate-400">Kode</th>
                    <th className="p-1.5 border-r border-slate-400">Uraian Sumber Pendapatan</th>
                    <th className="p-1.5 w-24 border-r border-slate-400">Kategori</th>
                    <th className="p-1.5 w-28 text-right border-r border-slate-400">Target (Rp)</th>
                    <th className="p-1.5 w-28 text-right border-r border-slate-400">Realisasi (Rp)</th>
                    <th className="p-1.5 w-16 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {budgetWithRealization.filter(b => b.category === 'PENDAPATAN').map(b => (
                    <tr key={b.id}>
                      <td className="p-1 text-center font-mono font-bold border-r border-slate-300">{b.code}</td>
                      <td className="p-1 font-semibold border-r border-slate-300">{b.title}</td>
                      <td className="p-1 text-slate-600 border-r border-slate-300">{b.subCategory}</td>
                      <td className="p-1 text-right font-bold border-r border-slate-300">{formatRupiah(b.plannedAmount)}</td>
                      <td className="p-1 text-right font-bold text-emerald-700 border-r border-slate-300">{formatRupiah(b.realizedAmount)}</td>
                      <td className="p-1 text-right font-mono text-[10px]">{Math.round(b.percentage)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                    <td colSpan={3} className="p-1.5 text-right uppercase border-r border-slate-400">JUMLAH PENDAPATAN:</td>
                    <td className="p-1.5 text-right text-emerald-800 border-r border-slate-400">{formatRupiah(totalPlannedIncome)}</td>
                    <td className="p-1.5 text-right text-emerald-800 border-r border-slate-400">{formatRupiah(totalRealizedIncome)}</td>
                    <td className="p-1.5 text-right">{totalPlannedIncome > 0 ? Math.round((totalRealizedIncome / totalPlannedIncome) * 100) : 0}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 2. BAGIAN BELANJA */}
            <div className="space-y-1.5">
              <div className="font-bold text-xs bg-slate-200 px-2 py-1 rounded text-slate-900 uppercase">
                B. Rencana Pengeluaran & Belanja Sekolah
              </div>
              <table className="w-full text-left text-[11px] border-2 border-slate-800">
                <thead className="bg-slate-100 font-bold border-b-2 border-slate-800 text-slate-900">
                  <tr>
                    <th className="p-1.5 w-12 text-center border-r border-slate-400">Kode</th>
                    <th className="p-1.5 border-r border-slate-400">Uraian Pos Belanja & Pengeluaran</th>
                    <th className="p-1.5 w-24 border-r border-slate-400">Kategori</th>
                    <th className="p-1.5 w-28 text-right border-r border-slate-400">Alokasi (Rp)</th>
                    <th className="p-1.5 w-28 text-right border-r border-slate-400">Realisasi (Rp)</th>
                    <th className="p-1.5 w-16 text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {budgetWithRealization.filter(b => b.category === 'BELANJA').map(b => (
                    <tr key={b.id}>
                      <td className="p-1 text-center font-mono font-bold border-r border-slate-300">{b.code}</td>
                      <td className="p-1 font-semibold border-r border-slate-300">{b.title}</td>
                      <td className="p-1 text-slate-600 border-r border-slate-300">{b.subCategory}</td>
                      <td className="p-1 text-right font-bold border-r border-slate-300">{formatRupiah(b.plannedAmount)}</td>
                      <td className="p-1 text-right font-bold text-rose-600 border-r border-slate-300">{formatRupiah(b.realizedAmount)}</td>
                      <td className="p-1 text-right font-mono text-[10px]">{Math.round(b.percentage)}%</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black border-t-2 border-slate-800">
                    <td colSpan={3} className="p-1.5 text-right uppercase border-r border-slate-400">JUMLAH BELANJA:</td>
                    <td className="p-1.5 text-right text-rose-800 border-r border-slate-400">{formatRupiah(totalPlannedExpense)}</td>
                    <td className="p-1.5 text-right text-rose-800 border-r border-slate-400">{formatRupiah(totalRealizedExpense)}</td>
                    <td className="p-1.5 text-right">{totalPlannedExpense > 0 ? Math.round((totalRealizedExpense / totalPlannedExpense) * 100) : 0}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 pt-4 text-center text-xs print-signature-block">
              <div>
                <div className="text-slate-600 mb-12">Mengetahui,<br />Kepala Sekolah {activeProfile.name}</div>
                <div className="font-bold underline text-slate-900">{activeProfile.headmasterName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeProfile.headmasterNip || 'NIP. -'}</div>
              </div>
              <div>
                <div className="text-slate-600 mb-12">
                  {formatReportSignatureDate(activeProfile)}<br />
                  Bendahara RAPBS,
                </div>
                <div className="font-bold underline text-slate-900">{activeProfile.treasurerName}</div>
                <div className="text-[10px] text-slate-500 font-mono">{activeProfile.treasurerNip || 'NIP. -'}</div>
              </div>
            </div>

          </div>
        </PrintPreviewModal>
      )}

    </div>
  );
};
