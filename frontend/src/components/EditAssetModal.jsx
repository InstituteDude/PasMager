import React, { useState, useEffect } from 'react';
import { X, Edit3, Plus, Trash2, CheckCircle, Wallet } from 'lucide-react';
import { api } from '../utils/api';

export default function EditAssetModal({ isOpen, onClose, editingAsset, onSaveSuccess, showToast }) {
  const [categoryType, setCategoryType] = useState('LIQUID');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingAsset) {
      setCategoryType(editingAsset.category_type || 'LIQUID');
      setName(editingAsset.name || '');
      setAmount(editingAsset.amount !== undefined ? editingAsset.amount : '');
      setSubCategory(editingAsset.category || editingAsset.sub_category || '');
      setNote(editingAsset.note || '');
    } else {
      setCategoryType('LIQUID');
      setName('');
      setAmount('');
      setSubCategory('Bank');
      setNote('');
    }
  }, [editingAsset, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || amount === '') {
      showToast('Nama pos dan nominal wajib diisi.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (editingAsset && editingAsset.id) {
        // Update existing
        const res = await api.updateFinancialAsset(editingAsset.id, {
          name,
          amount: parseFloat(amount),
          sub_category: subCategory,
          note
        });
        if (res.success) {
          showToast('Nilai aset berhasil terupdate!', 'success');
          onSaveSuccess();
          onClose();
        } else {
          showToast(res.message || 'Gagal update aset.', 'error');
        }
      } else {
        // Create new asset pos
        const res = await api.addFinancialAsset({
          category_type: categoryType,
          name,
          amount: parseFloat(amount),
          sub_category: subCategory,
          note
        });
        if (res.success) {
          showToast('Pos aset baru berhasil ditambahkan!', 'success');
          onSaveSuccess();
          onClose();
        } else {
          showToast(res.message || 'Gagal menambah pos aset.', 'error');
        }
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat menyimpan pos aset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingAsset || !editingAsset.id) return;
    if (!window.confirm(`Yakin ingin menghapus pos asset "${name}"?`)) return;

    setLoading(true);
    try {
      const res = await api.deleteFinancialAsset(editingAsset.id);
      if (res.success) {
        showToast('Pos aset berhasil dihapus.', 'info');
        onSaveSuccess();
        onClose();
      } else {
        showToast(res.message || 'Gagal menghapus aset.', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat menghapus pos aset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet className="text-cyan-400" size={22} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              {editingAsset ? 'Edit Nilai Pos Aset' : 'Tambah Pos Aset / Tabungan Baru'}
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!editingAsset && (
            <div className="form-group">
              <label className="form-label">Kategori Pos Aset</label>
              <select
                className="form-select"
                value={categoryType}
                onChange={(e) => setCategoryType(e.target.value)}
              >
                <option value="LIQUID">Uang Likuid Operasional (BNI, Cash, E-Wallet)</option>
                <option value="LOCKED">Aset & Tabungan Terkunci (Bibit, Jago, Deposito)</option>
                <option value="PHYSICAL_RECEIVABLE">Aset Fisik & Piutang Keluarga (Motor, Laptop, Piutang)</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nama Pos / Sumber Dana</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: BNI Operasional, Rekening Jago, Bibit RDPU, Piutang Bapak"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nominal Saldo / Nilai (Rupiah)</label>
            <input
              type="number"
              className="form-input form-input-mono"
              placeholder="Masukkan nominal dalam Rupiah (tanpa titik/koma)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Tipe Kategori Label</label>
              <input
                type="text"
                className="form-input"
                placeholder="Bank, Cash, E-Wallet, Agunan, Dana Darurat"
                value={subCategory}
                onChange={(e) => setSubCategory(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Catatan Singkat</label>
              <input
                type="text"
                className="form-input"
                placeholder="Catatan tambahan (opsional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
            {editingAsset && editingAsset.id ? (
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
                style={{ padding: '8px 12px' }}
                disabled={loading}
              >
                <Trash2 size={16} />
                Hapus Pos
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <CheckCircle size={16} />
                {loading ? 'Menyimpan...' : 'Simpan & Update Net Worth'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
