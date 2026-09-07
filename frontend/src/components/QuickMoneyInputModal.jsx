import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, ArrowRight, CheckCircle, Loader, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { api } from '../utils/api';

export default function QuickMoneyInputModal({ isOpen, onClose, assets, onSuccess, showToast }) {
  const [mode, setMode] = useState('IN'); // 'IN' | 'OUT'
  const [totalAmount, setTotalAmount] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [distributions, setDistributions] = useState([]);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);
  const inputRef = useRef(null);

  const isIn = mode === 'IN';
  const accent = isIn ? '#10b981' : '#f43f5e';
  const accentBg = isIn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)';
  const accentBorder = isIn ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)';
  const gradientBtn = isIn
    ? 'linear-gradient(135deg, #10b981, #06b6d4)'
    : 'linear-gradient(135deg, #f43f5e, #f97316)';

  const allAssets = assets || [];

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setTotalAmount('');
      setTxDate(new Date().toISOString().split('T')[0]);
      setDistributions([]);
      setSavedAnim(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // reset step when mode changes
  useEffect(() => {
    setStep(1);
    setTotalAmount('');
    setDistributions([]);
    setSavedAnim(false);
  }, [mode]);

  const parsedTotal = parseFloat(totalAmount) || 0;
  const totalDistributed = distributions.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
  const remaining = parsedTotal - totalDistributed;
  const isFullyDistributed = Math.abs(remaining) < 1;

  const formatIDR = (val) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setTotalAmount(raw);
  };

  const handleNextStep = () => {
    if (parsedTotal <= 0) { showToast('Masukkan nominal yang valid.', 'error'); return; }
    const init = allAssets.map((a) => ({
      id: a.id, name: a.name, currentAmount: a.amount, amount: '', checked: false,
    }));
    setDistributions(init);
    setStep(2);
  };

  const toggleAsset = (id) =>
    setDistributions((prev) => prev.map((d) => d.id !== id ? d : { ...d, checked: !d.checked, amount: '' }));

  const setDistAmount = (id, val) =>
    setDistributions((prev) => prev.map((d) => d.id === id ? { ...d, amount: val } : d));

  const handleAutoDistribute = () => {
    const checked = distributions.filter((d) => d.checked);
    if (!checked.length) { showToast('Pilih minimal 1 aset.', 'error'); return; }
    const per = Math.floor(parsedTotal / checked.length);
    const rem = parsedTotal - per * checked.length;
    setDistributions((prev) =>
      prev.map((d) => {
        if (!d.checked) return d;
        const idx = checked.findIndex((c) => c.id === d.id);
        return { ...d, amount: String(per + (idx === 0 ? rem : 0)) };
      })
    );
  };

  const handleSubmit = async () => {
    const selected = distributions.filter((d) => d.checked && parseFloat(d.amount) > 0);
    if (!selected.length) { showToast('Pilih aset dan masukkan nominal.', 'error'); return; }
    if (!isFullyDistributed) {
      if (!window.confirm(`Masih ada sisa ${formatIDR(remaining)} yang belum dialokasikan. Lanjutkan?`)) return;
    }
    setIsSubmitting(true);
    try {
      // 1. Update each asset balance
      for (const dist of selected) {
        const delta = parseFloat(dist.amount);
        const newAmount = isIn
          ? dist.currentAmount + delta
          : Math.max(0, dist.currentAmount - delta);
        await api.updateFinancialAsset(dist.id, { name: dist.name, amount: newAmount });
      }

      // 2. Record to journal for calendar history
      const assetLabels = selected
        .map((d) => `${d.name} (${isIn ? '+' : '-'}${formatIDR(parseFloat(d.amount))})`)
        .join(', ');
      try {
        await api.createJournalEntry({
          entryDate: txDate,
          title: `${isIn ? '💰 Uang Masuk' : '📤 Uang Keluar'} — ${formatIDR(parsedTotal)}`,
          type: isIn ? 'INCOME' : 'EXPENSE',
          amount: parsedTotal,
          description: `Distribusi ke: ${assetLabels}`,
        });
      } catch (journalErr) {
        console.warn('Journal entry failed (non-critical):', journalErr);
      }

      setSavedAnim(true);
      const label = isIn ? 'ditambahkan ke' : 'dikurangi dari';
      showToast(`${isIn ? '💰' : '📤'} ${formatIDR(parsedTotal)} berhasil ${label} ${selected.length} aset!`, 'success');
      setTimeout(() => { onSuccess(); onClose(); }, 1200);
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const shortcuts = isIn
    ? [100000, 500000, 1000000, 2000000, 3000000, 3356000]
    : [10000, 30000, 50000, 100000, 200000, 500000];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(14px)', animation: 'qFadeIn 0.2s ease' }} />

      {/* Card */}
      <div style={{
        position: 'relative', width: '100%',
        maxWidth: step === 1 ? '440px' : '560px',
        background: 'linear-gradient(145deg, rgba(8,14,28,0.99), rgba(12,20,45,0.99))',
        border: `1px solid ${accentBorder}`,
        borderRadius: '24px', overflow: 'hidden',
        boxShadow: `0 0 60px ${accentBg}, 0 30px 60px rgba(0,0,0,0.7)`,
        animation: 'qSlideUp 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transition: 'max-width 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }}>
        {/* Top bar */}
        <div style={{ height: '3px', background: isIn ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'linear-gradient(90deg,#f43f5e,#f97316)', transition: 'background 0.3s' }} />

        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: accentBg, border: `1px solid ${accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
              {isIn ? <TrendingUp size={18} color={accent} /> : <TrendingDown size={18} color={accent} />}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {isIn ? 'Uang Masuk' : 'Uang Keluar'}
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                {step === 1 ? (isIn ? 'Nominal uang yang diterima' : 'Nominal pengeluaran') : 'Pilih aset yang terpengaruh'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', cursor: 'pointer', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Mode toggle */}
        <div style={{ padding: '14px 24px 0', display: 'flex', gap: '8px' }}>
          {['IN', 'OUT'].map((m) => {
            const active = mode === m;
            const mColor = m === 'IN' ? '#10b981' : '#f43f5e';
            const mBg = m === 'IN' ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)';
            const mBorder = m === 'IN' ? 'rgba(16,185,129,0.4)' : 'rgba(244,63,94,0.4)';
            return (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: '10px',
                background: active ? mBg : 'rgba(255,255,255,0.03)',
                border: active ? `1px solid ${mBorder}` : '1px solid rgba(255,255,255,0.06)',
                color: active ? mColor : '#475569',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s',
              }}>
                {m === 'IN' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {m === 'IN' ? 'Uang Masuk' : 'Uang Keluar'}
              </button>
            );
          })}
        </div>

        {/* Step dots */}
        <div style={{ padding: '12px 24px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: step >= s ? gradientBtn : 'rgba(255,255,255,0.05)',
                border: step >= s ? 'none' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: step >= s ? '#fff' : '#475569',
                transition: 'all 0.3s',
              }}>
                {step > s ? <CheckCircle size={12} /> : s}
              </div>
              {s < 2 && <div style={{ flex: 1, height: '2px', background: step > s ? gradientBtn : 'rgba(255,255,255,0.06)', borderRadius: '2px', transition: 'all 0.3s' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={{ padding: '18px 24px 24px' }}>
            <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              {isIn ? 'NOMINAL MASUK' : 'NOMINAL KELUAR'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: '14px', overflow: 'hidden', marginBottom: '10px', transition: 'all 0.3s' }}>
              <span style={{ padding: '0 14px', fontSize: '14px', fontWeight: 700, color: accent, borderRight: `1px solid ${accentBorder}`, height: '100%', display: 'flex', alignItems: 'center' }}>Rp</span>
              <input
                ref={inputRef}
                type="text" inputMode="numeric" placeholder="0"
                value={totalAmount ? parseInt(totalAmount).toLocaleString('id-ID') : ''}
                onChange={handleAmountChange}
                onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '30px', fontWeight: 800, padding: '14px', letterSpacing: '-0.5px' }}
              />
            </div>
            {parsedTotal > 0 && (
              <p style={{ fontSize: '12px', color: accent, marginBottom: '16px', fontWeight: 600 }}>
                {isIn ? '↑' : '↓'} {formatIDR(parsedTotal)}
              </p>
            )}

            {/* Shortcuts */}
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>Shortcut cepat:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                {shortcuts.map((val) => (
                  <button key={val} onClick={() => setTotalAmount(String(val))} style={{
                    background: totalAmount === String(val) ? accentBg : 'rgba(255,255,255,0.04)',
                    border: totalAmount === String(val) ? `1px solid ${accentBorder}` : '1px solid rgba(255,255,255,0.07)',
                    color: totalAmount === String(val) ? accent : '#64748b',
                    padding: '5px 11px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                    {val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                  </button>
                ))}
              </div>
            </div>

            {/* Date picker */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '7px' }}>
                <Calendar size={12} /> TANGGAL TRANSAKSI
              </label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', color: '#f8fafc',
                  fontSize: '13px', fontWeight: 600,
                  padding: '9px 12px', outline: 'none',
                  cursor: 'pointer',
                }}
              />
            </div>

            <button onClick={handleNextStep} disabled={parsedTotal <= 0} style={{
              width: '100%', padding: '13px',
              background: parsedTotal > 0 ? gradientBtn : 'rgba(255,255,255,0.05)',
              border: 'none', borderRadius: '12px',
              color: parsedTotal > 0 ? '#fff' : '#475569',
              fontSize: '14px', fontWeight: 700,
              cursor: parsedTotal > 0 ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s',
            }}>
              Pilih Aset <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={{ padding: '14px 24px 24px' }}>
            {/* Summary */}
            <div style={{ background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: '12px', padding: '11px 16px', marginBottom: '12px', transition: 'all 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {[['TOTAL', parsedTotal, accent], ['DIALOKASIKAN', totalDistributed, '#06b6d4'], ['SISA', remaining, remaining < 0 ? '#f43f5e' : remaining === 0 ? '#10b981' : '#f59e0b']].map(([label, val, col]) => (
                  <div key={label}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{label}</span>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: col, margin: 0 }}>{formatIDR(val)}</p>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '7px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={11} color="#64748b" />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Tanggal: </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>
                  {new Date(txDate + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', marginBottom: '12px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (totalDistributed / parsedTotal) * 100)}%`, background: isFullyDistributed ? 'linear-gradient(90deg,#10b981,#06b6d4)' : gradientBtn, borderRadius: '4px', transition: 'width 0.3s ease' }} />
            </div>

            {/* Auto distribute */}
            <button onClick={handleAutoDistribute} style={{
              width: '100%', padding: '7px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
              borderRadius: '10px', color: '#a855f7', fontSize: '12px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
              <Zap size={13} /> Auto Rata ke Aset Terpilih
            </button>

            {/* Asset list */}
            <div style={{ maxHeight: '270px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '7px', paddingRight: '2px' }}>
              {distributions.map((dist) => {
                const previewAmt = parseFloat(dist.amount) || 0;
                const newBal = isIn ? dist.currentAmount + previewAmt : Math.max(0, dist.currentAmount - previewAmt);
                const insufficientFunds = !isIn && previewAmt > dist.currentAmount;
                return (
                  <div key={dist.id} style={{
                    background: dist.checked ? accentBg : 'rgba(12,18,35,0.6)',
                    border: `1px solid ${dist.checked ? accentBorder : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '12px', padding: '10px 12px', transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Checkbox */}
                      <button onClick={() => toggleAsset(dist.id)} style={{
                        width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                        border: dist.checked ? `2px solid ${accent}` : '2px solid rgba(255,255,255,0.12)',
                        background: dist.checked ? accentBg : 'transparent',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                      }}>
                        {dist.checked && <CheckCircle size={12} color={accent} />}
                      </button>

                      {/* Name + balance */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: dist.checked ? '#f8fafc' : '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.2s' }}>
                          {dist.name}
                        </p>
                        <p style={{ fontSize: '10px', color: '#475569', margin: 0 }}>Saldo: {formatIDR(dist.currentAmount)}</p>
                      </div>

                      {/* Amount input */}
                      {dist.checked && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: accent, fontWeight: 700 }}>{isIn ? '+' : '−'}Rp</span>
                          <input type="number" placeholder="0" value={dist.amount}
                            onChange={(e) => setDistAmount(dist.id, e.target.value)}
                            style={{ width: '88px', background: accentBg, border: `1px solid ${accentBorder}`, borderRadius: '8px', color: accent, fontSize: '13px', fontWeight: 700, padding: '4px 8px', outline: 'none', textAlign: 'right' }} />
                        </div>
                      )}
                    </div>

                    {/* Preview */}
                    {dist.checked && previewAmt > 0 && (
                      <p style={{ marginTop: '5px', marginLeft: '30px', fontSize: '11px', fontWeight: 600, color: insufficientFunds ? '#f43f5e' : '#10b981' }}>
                        {insufficientFunds ? '⚠ Saldo tidak cukup!' : `→ Saldo baru: ${formatIDR(newBal)}`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button onClick={() => setStep(1)} style={{ padding: '11px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                ← Kembali
              </button>
              <button onClick={handleSubmit}
                disabled={isSubmitting || distributions.filter((d) => d.checked).length === 0}
                style={{
                  flex: 1, padding: '11px', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '14px', fontWeight: 700,
                  background: (isSubmitting || !distributions.some((d) => d.checked)) ? 'rgba(255,255,255,0.05)' : savedAnim ? 'linear-gradient(135deg,#10b981,#06b6d4)' : gradientBtn,
                  cursor: (isSubmitting || !distributions.some((d) => d.checked)) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s',
                }}>
                {isSubmitting ? <><Loader size={15} style={{ animation: 'qSpin 1s linear infinite' }} /> Menyimpan...</>
                  : savedAnim ? <><CheckCircle size={15} /> Tersimpan!</>
                  : <><Zap size={15} /> {isIn ? 'Tambah ke Aset' : 'Kurangi dari Aset'}</>}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes qFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes qSlideUp { from { opacity: 0; transform: translateY(28px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes qSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
