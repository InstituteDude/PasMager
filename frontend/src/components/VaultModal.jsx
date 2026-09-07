import React, { useState, useEffect } from 'react';
import { X, Key, Building2, CreditCard, FileText, Lock, RefreshCw } from 'lucide-react';

export default function VaultModal({ isOpen, onClose, onSave, editingItem }) {
  const [type, setType] = useState('PASSWORD');
  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [category, setCategory] = useState('Personal');

  // Specific details based on item type
  const [password, setPassword] = useState('');
  const [bankName, setBankName] = useState('Bank BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [pin, setPin] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiry, setExpiry] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingItem) {
      setType(editingItem.type || 'PASSWORD');
      setTitle(editingItem.title || '');
      setUsername(editingItem.username || '');
      setWebsiteUrl(editingItem.websiteUrl || '');
      setCategory(editingItem.category || 'Personal');

      const d = editingItem.details || {};
      setPassword(d.password || '');
      setBankName(d.bankName || 'Bank BCA');
      setAccountNumber(d.accountNumber || '');
      setAccountHolder(d.accountHolder || '');
      setPin(d.pin || '');
      setCardNumber(d.cardNumber || '');
      setCvv(d.cvv || '');
      setExpiry(d.expiry || '');
      setNotes(d.notes || '');
    } else {
      // Reset form
      setType('PASSWORD');
      setTitle('');
      setUsername('');
      setWebsiteUrl('');
      setCategory('Personal');
      setPassword('');
      setBankName('Bank BCA');
      setAccountNumber('');
      setAccountHolder('');
      setPin('');
      setCardNumber('');
      setCvv('');
      setExpiry('');
      setNotes('');
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleGenerateRandomPass = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let res = '';
    for (let i = 0; i < 16; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let detailsPayload = {};
    if (type === 'PASSWORD') {
      detailsPayload = { password, notes };
    } else if (type === 'BANK_ACCOUNT') {
      detailsPayload = { bankName, accountNumber, accountHolder, pin, notes };
    } else if (type === 'CARD') {
      detailsPayload = { bankName, cardNumber, accountHolder, expiry, cvv, pin, notes };
    } else if (type === 'NOTE') {
      detailsPayload = { notes };
    }

    onSave({
      id: editingItem ? editingItem.id : undefined,
      type,
      title: title || (type === 'BANK_ACCOUNT' ? bankName : 'Vault Item'),
      username,
      websiteUrl,
      category,
      details: detailsPayload
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
            {editingItem ? 'Edit Item Vault' : 'Tambah Item Vault Baru'}
          </h3>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Item Type Selector Tabs */}
        {!editingItem && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {[
              { id: 'PASSWORD', label: 'Password', icon: <Key size={16} /> },
              { id: 'BANK_ACCOUNT', label: 'Bank', icon: <Building2 size={16} /> },
              { id: 'CARD', label: 'Kartu', icon: <CreditCard size={16} /> },
              { id: 'NOTE', label: 'Catatan', icon: <FileText size={16} /> }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 6px',
                  borderRadius: '10px',
                  border: type === t.id ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  background: type === t.id ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 21, 35, 0.6)',
                  color: type === t.id ? '#fff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* General Fields */}
          {type !== 'BANK_ACCOUNT' && (
            <div className="form-group">
              <label className="form-label">Judul / Nama Aplikasi</label>
              <input
                type="text"
                className="form-input"
                placeholder={type === 'NOTE' ? 'Judul Catatan Rahasia' : 'Contoh: Google, Netflix, Tokopedia'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required={type !== 'BANK_ACCOUNT'}
              />
            </div>
          )}

          {/* PASSWORD specific fields */}
          {type === 'PASSWORD' && (
            <>
              <div className="form-group">
                <label className="form-label">Username / Email Login</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="user@example.com atau username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input form-input-mono"
                    placeholder="Masukkan atau generate password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleGenerateRandomPass}
                    className="btn btn-secondary"
                    title="Generate Password Acak"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Website URL (Opsional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
            </>
          )}

          {/* BANK ACCOUNT specific fields */}
          {type === 'BANK_ACCOUNT' && (
            <>
              <div className="form-group">
                <label className="form-label">Pilih Bank</label>
                <select
                  className="form-select"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                >
                  <option value="Bank BCA">Bank BCA</option>
                  <option value="Bank Mandiri">Bank Mandiri</option>
                  <option value="Bank BRI">Bank BRI</option>
                  <option value="Bank BNI">Bank BNI</option>
                  <option value="Bank Jago">Bank Jago</option>
                  <option value="Bank Permata">Bank Permata</option>
                  <option value="Bank CIMB Niaga">Bank CIMB Niaga</option>
                  <option value="Bank Lainnya">Bank Lainnya</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Rekening</label>
                <input
                  type="text"
                  className="form-input form-input-mono"
                  placeholder="Contoh: 1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nama Pemilik sesuai KTP / Buku Tabungan"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">PIN / Passcode Mobile Banking (Terenkripsi)</label>
                <input
                  type="password"
                  className="form-input form-input-mono"
                  placeholder="••••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </div>
            </>
          )}

          {/* CARD specific fields */}
          {type === 'CARD' && (
            <>
              <div className="form-group">
                <label className="form-label">Penerbit Kartu (Visa / Mastercard)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="BCA Visa Signature, Mandiri Platinum, dll"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Kartu (16 Digit)</label>
                <input
                  type="text"
                  className="form-input form-input-mono"
                  placeholder="4532 •••• •••• ••••"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    className="form-input form-input-mono"
                    placeholder="12/28"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input
                    type="password"
                    className="form-input form-input-mono"
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* NOTE specific field */}
          {type === 'NOTE' && (
            <div className="form-group">
              <label className="form-label">Isi Catatan Rahasia</label>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="Tuliskan catatan rahasia, pemulihan 2FA, seed phrase, dll..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
              />
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary">
              <Lock size={16} />
              {editingItem ? 'Simpan Perubahan' : 'Simpan ke Vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
