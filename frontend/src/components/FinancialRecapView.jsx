import React, { useState, useEffect } from 'react';
import { Wallet, ShieldAlert, PiggyBank, Briefcase, Plus, Edit2, Check, X, TrendingUp, Calendar, Trash2, Camera, Eye, ArrowUpRight, History, Layers, Zap } from 'lucide-react';
import { api } from '../utils/api';
import QuickMoneyInputModal from './QuickMoneyInputModal';
import FinancialDateReminder from './FinancialDateReminder';

export default function FinancialRecapView({ showToast }) {
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', amount: '', sub_category: '', note: '' });

  // Add Asset Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssetCategory, setNewAssetCategory] = useState('LIQUID');
  const [newAssetForm, setNewAssetForm] = useState({ name: '', amount: '', sub_category: '', note: '' });

  // Historical Snapshots State
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [snapshotDetailItems, setSnapshotDetailItems] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Quick Money Input Modal State
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);

  // Journal / Transaction History
  const [journalEntries, setJournalEntries] = useState([]);

  // Create New Snapshot Modal State
  const [isCreateSnapModalOpen, setIsCreateSnapModalOpen] = useState(false);
  const [snapForm, setSnapForm] = useState({
    snapshot_date: new Date().toISOString().split('T')[0],
    title: `Snapshot Net Worth (${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`,
    notes: 'Pencatatan rincian posisi keuangan terbaru.'
  });

  const fetchRecap = async () => {
    try {
      const res = await api.getFinancialRecap();
      if (res.success) {
        setRecap(res.recap);
      }
    } catch (err) {
      showToast('Gagal memuat rekapitulasi keuangan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshots = async () => {
    try {
      const res = await api.getFinancialSnapshots();
      if (res.success) {
        setSnapshots(res.snapshots);
      }
    } catch (err) {
      console.error('Error loading snapshots:', err);
    }
  };

  const fetchJournal = async () => {
    try {
      const res = await api.getJournalEntries();
      if (res.success) setJournalEntries(res.entries);
    } catch (err) {
      console.error('Error loading journal:', err);
    }
  };

  useEffect(() => {
    fetchRecap();
    fetchSnapshots();
    fetchJournal();
  }, []);

  const handleOpenDetailModal = async (snap) => {
    setSelectedSnapshot(snap);
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await api.getSnapshotDetail(snap.id);
      if (res.success) {
        setSnapshotDetailItems(res.items);
      }
    } catch (err) {
      showToast('Gagal memuat rincian detail snapshot.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateSnapshot = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createFinancialSnapshot({
        snapshot_date: snapForm.snapshot_date,
        title: snapForm.title,
        notes: snapForm.notes
      });
      if (res.success) {
        showToast('Snapshot harian baru berhasil dibuat dengan template aset!', 'success');
        setIsCreateSnapModalOpen(false);
        fetchSnapshots();
      }
    } catch (err) {
      showToast(err.message || 'Gagal membuat snapshot harian.', 'error');
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      amount: item.amount,
      sub_category: item.category || 'Umum',
      note: item.note || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async (id) => {
    try {
      const res = await api.updateFinancialAsset(id, {
        name: editForm.name,
        amount: parseFloat(editForm.amount) || 0,
        sub_category: editForm.sub_category,
        note: editForm.note
      });
      if (res.success) {
        showToast(res.message, 'success');
        setEditingId(null);
        fetchRecap();
        fetchSnapshots();
      }
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui pos aset.', 'error');
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pos aset ini dari rekapitulasi?')) return;
    try {
      const res = await api.deleteFinancialAsset(id);
      if (res.success) {
        showToast(res.message, 'success');
        fetchRecap();
        fetchSnapshots();
      }
    } catch (err) {
      showToast('Gagal menghapus pos aset.', 'error');
    }
  };

  const handleAddAsset = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addFinancialAsset({
        category_type: newAssetCategory,
        name: newAssetForm.name,
        amount: parseFloat(newAssetForm.amount) || 0,
        sub_category: newAssetForm.sub_category,
        note: newAssetForm.note
      });
      if (res.success) {
        showToast(res.message, 'success');
        setIsAddModalOpen(false);
        setNewAssetForm({ name: '', amount: '', sub_category: '', note: '' });
        fetchRecap();
        fetchSnapshots();
      }
    } catch (err) {
      showToast(err.message || 'Gagal menambah pos aset baru.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#06b6d4' }}>
        Memuat Rekapitulasi & Snapshot Keuangan Real-Time...
      </div>
    );
  }

  if (!recap) return null;

  const formatIDR = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Profile & Header Banner */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.1))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '20px',
              fontWeight: 800
            }}>
              {(recap.profile.name || 'V').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                {recap.profile.name}
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                {recap.profile.role}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsQuickInputOpen(true)}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(168, 85, 247, 0.25))',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                color: '#06b6d4',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontWeight: 700,
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)'
              }}
            >
              <Zap size={16} /> Input Uang Masuk
            </button>
            <button
              onClick={() => setIsCreateSnapModalOpen(true)}
              className="btn btn-cyan"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
            >
              <Camera size={16} /> Buat Snapshot Tanggal Baru
            </button>
            <button
              onClick={() => { setNewAssetCategory('LIQUID'); setIsAddModalOpen(true); }}
              className="btn"
              style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
            >
              <Plus size={16} /> Tambah Pos Aset
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 Net Worth Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #06b6d4' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            NET WORTH (EXCL. PIUTANG)
          </span>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#06b6d4', margin: '8px 0' }}>
            {formatIDR(recap.netWorth.exclReceivables)}
          </h3>
          <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
            🌟 Status Net Worth Terupdate Real-Time
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #a855f7' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            NET WORTH (INCL. PIUTANG)
          </span>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#a855f7', margin: '8px 0' }}>
            {formatIDR(recap.netWorth.inclReceivables)}
          </h3>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Termasuk piutang keluarga terutang
          </span>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
            TOTAL UANG LIKUID (OPERASIONAL)
          </span>
          <h3 style={{ fontSize: '26px', fontWeight: 800, color: '#3b82f6', margin: '8px 0' }}>
            {formatIDR(recap.liquidAssets.reduce((sum, a) => sum + a.amount, 0))}
          </h3>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            BNI, Cash, GoPay, DANA, eMAS
          </span>
        </div>
      </div>

      {/* 📅 Financial Date Reminder & Snapshot Cards */}
      <FinancialDateReminder
        snapshots={snapshots}
        journalEntries={journalEntries}
        onOpenSnapshotDetail={handleOpenDetailModal}
        formatIDR={formatIDR}
      />

      {/* 3 Categories Asset Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        
        {/* Category 1: Uang Likuid Operasional */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet className="text-cyan-400" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>Uang Likuid Operasional</h3>
            </div>
            <button
              onClick={() => { setNewAssetCategory('LIQUID'); setIsAddModalOpen(true); }}
              style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            >
              + Tambah
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recap.liquidAssets.map(item => renderAssetRow(item, editingId, editForm, setEditForm, handleStartEdit, handleSaveEdit, handleCancelEdit, handleDeleteAsset, formatIDR))}
          </div>
        </div>

        {/* Category 2: Aset Terkunci (Bibit & Jago) */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PiggyBank className="text-purple-400" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>Aset Terkunci (Bibit & Jago)</h3>
            </div>
            <button
              onClick={() => { setNewAssetCategory('LOCKED'); setIsAddModalOpen(true); }}
              style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            >
              + Tambah
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recap.lockedAssets.map(item => renderAssetRow(item, editingId, editForm, setEditForm, handleStartEdit, handleSaveEdit, handleCancelEdit, handleDeleteAsset, formatIDR))}
          </div>
        </div>

        {/* Category 3: Aset Fisik & Piutang */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase className="text-rose-400" size={20} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>Aset Fisik & Piutang Keluarga</h3>
            </div>
            <button
              onClick={() => { setNewAssetCategory('PHYSICAL_RECEIVABLE'); setIsAddModalOpen(true); }}
              style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
            >
              + Tambah
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recap.physicalAndReceivables.map(item => renderAssetRow(item, editingId, editForm, setEditForm, handleStartEdit, handleSaveEdit, handleCancelEdit, handleDeleteAsset, formatIDR))}
          </div>
        </div>

      </div>

      {/* 🔍 Child Snapshot Detail Modal */}
      {isDetailModalOpen && selectedSnapshot && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '640px', padding: '24px', background: 'rgba(15, 21, 35, 0.95)', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                  {selectedSnapshot.snapshot_date}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {selectedSnapshot.title}
                </h3>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Net Worth Excl</span>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{formatIDR(parseFloat(selectedSnapshot.total_net_worth_excl))}</p>
              </div>
              <div style={{ background: 'rgba(30, 41, 59, 0.6)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Net Worth Incl</span>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#a855f7' }}>{formatIDR(parseFloat(selectedSnapshot.total_net_worth_incl))}</p>
              </div>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#cbd5e1', marginBottom: '10px' }}>
              Rincian Pos Aset pada Tanggal Ini:
            </h4>

            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#06b6d4' }}>Memuat rincian child snapshot...</div>
            ) : (
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {snapshotDetailItems.map(it => (
                  <div key={it.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px' }}>
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{it.name}</span>
                      <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '8px' }}>[{it.sub_category}]</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#06b6d4' }}>{formatIDR(parseFloat(it.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📸 Create New Snapshot Modal (Template-based) */}
      {isCreateSnapModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '24px', background: 'rgba(15, 21, 35, 0.95)', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Buat Snapshot Net Worth (Pilih Tanggal)
              </h3>
              <button onClick={() => setIsCreateSnapModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tanggal Snapshot</label>
                <input
                  type="date"
                  className="form-input"
                  value={snapForm.snapshot_date}
                  onChange={e => setSnapForm({ ...snapForm, snapshot_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Judul Snapshot</label>
                <input
                  type="text"
                  className="form-input"
                  value={snapForm.title}
                  onChange={e => setSnapForm({ ...snapForm, title: e.target.value })}
                  placeholder="Cth: Snapshot Tanggal Kemarin / Gajian Mei"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Catatan / Keterangan</label>
                <textarea
                  className="form-input"
                  rows="2"
                  value={snapForm.notes}
                  onChange={e => setSnapForm({ ...snapForm, notes: e.target.value })}
                  placeholder="Catatan peristiwa penting pada tanggal ini..."
                />
              </div>

              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px 14px', borderRadius: '10px', fontSize: '11px', color: '#06b6d4' }}>
                💡 Template pos aset aktif (BNI, Cash, Jago, Bibit, Piutang) akan otomatis dimasukkan ke snapshot tanggal ini.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsCreateSnapModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-cyan">Simpan Snapshot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '24px', background: 'rgba(15, 21, 35, 0.95)', border: '1px solid rgba(168, 85, 247, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                Tambah Pos Aset Baru
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Kategori Aset</label>
                <select
                  className="form-input"
                  value={newAssetCategory}
                  onChange={e => setNewAssetCategory(e.target.value)}
                >
                  <option value="LIQUID">Uang Likuid Operasional (BNI/Cash/Wallet)</option>
                  <option value="LOCKED">Aset Terkunci (Bibit/Jago/Investasi)</option>
                  <option value="PHYSICAL_RECEIVABLE">Aset Fisik & Piutang Keluarga</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nama Pos Aset</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cth: Bank Mandiri / Emas Antam"
                  value={newAssetForm.name}
                  onChange={e => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Nominal (Rp)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={newAssetForm.amount}
                  onChange={e => setNewAssetForm({ ...newAssetForm, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Sub Kategori</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Cth: Bank / E-Wallet / Agunan"
                  value={newAssetForm.sub_category}
                  onChange={e => setNewAssetForm({ ...newAssetForm, sub_category: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Catatan</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Keterangan singkat..."
                  value={newAssetForm.note}
                  onChange={e => setNewAssetForm({ ...newAssetForm, note: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-cyan">Simpan Aset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 💰 Quick Money Input Modal */}
      <QuickMoneyInputModal
        isOpen={isQuickInputOpen}
        onClose={() => setIsQuickInputOpen(false)}
        assets={[
          ...(recap?.liquidAssets || []),
          ...(recap?.lockedAssets || []),
          ...(recap?.physicalAndReceivables || [])
        ]}
        onSuccess={() => {
          fetchRecap();
          fetchSnapshots();
          fetchJournal();
        }}
        showToast={showToast}
      />

    </div>
  );
}

function renderAssetRow(item, editingId, editForm, setEditForm, handleStartEdit, handleSaveEdit, handleCancelEdit, handleDeleteAsset, formatIDR) {
  const isEditing = editingId === item.id;

  if (isEditing) {
    return (
      <div key={item.id} style={{ background: 'rgba(30, 41, 59, 0.9)', padding: '12px', borderRadius: '12px', border: '1px solid #06b6d4' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="text"
            className="form-input"
            value={editForm.name}
            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
            placeholder="Nama aset"
          />
          <input
            type="number"
            className="form-input"
            value={editForm.amount}
            onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
            placeholder="Nominal"
          />
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button onClick={handleCancelEdit} style={{ padding: '4px 10px', borderRadius: '6px', background: '#64748b', color: '#fff', border: 'none', fontSize: '12px' }}>Batal</button>
            <button onClick={() => handleSaveEdit(item.id)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#06b6d4', color: '#fff', border: 'none', fontSize: '12px', fontWeight: 600 }}>Simpan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <div>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>{item.name}</h4>
        <span style={{ fontSize: '11px', color: '#64748b' }}>{item.category} {item.note ? `• ${item.note}` : ''}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#06b6d4' }}>{formatIDR(item.amount)}</span>
        <button onClick={() => handleStartEdit(item)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} title="Edit">
          <Edit2 size={14} />
        </button>
        <button onClick={() => handleDeleteAsset(item.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }} title="Hapus">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
