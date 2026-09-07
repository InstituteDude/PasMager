import React from 'react';
import { LayoutGrid, Key, Building2, CreditCard, FileText, Star, ShieldCheck, LineChart, Lightbulb } from 'lucide-react';

export default function Sidebar({ activeCategory, setActiveCategory, itemCountMap }) {
  const categories = [
    { id: 'ALL', label: 'Semua Item Vault', icon: <LayoutGrid size={18} />, count: itemCountMap.ALL || 0 },
    { id: 'BANK_ACCOUNT', label: 'Rekening Bank', icon: <Building2 size={18} className="text-cyan-400" />, count: itemCountMap.BANK_ACCOUNT || 0 },
    { id: 'CARD', label: 'Kartu Kredit / Debit', icon: <CreditCard size={18} className="text-emerald-400" />, count: itemCountMap.CARD || 0 },
    { id: 'PASSWORD', label: 'Passwords & Logins', icon: <Key size={18} className="text-indigo-400" />, count: itemCountMap.PASSWORD || 0 },
    { id: 'NOTE', label: 'Catatan Rahasia', icon: <FileText size={18} className="text-amber-400" />, count: itemCountMap.NOTE || 0 },
    { id: 'FAVORITE', label: 'Item Favorit', icon: <Star size={18} className="text-yellow-400" />, count: itemCountMap.FAVORITE || 0 },
  ];

  const financialModules = [
    { id: 'FINANCIAL_RECAP', label: 'Rekap Net Worth', icon: <LineChart size={18} className="text-emerald-400" /> },
    { id: 'FINANCIAL_ADVISORY', label: 'Saran & Strategi', icon: <Lightbulb size={18} className="text-purple-400" /> },
  ];

  return (
    <aside style={{
      width: '260px',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      minHeight: 'calc(100vh - 73px)'
    }}>
      {/* Vault Category Group */}
      <div>
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '12px',
          paddingLeft: '12px'
        }}>
          Kategori Vault
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {cat.icon}
                  <span>{cat.label}</span>
                </div>
                <span style={{
                  fontSize: '12px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isActive ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#fff' : '#64748b',
                  fontWeight: 600
                }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Financial Analytics Group */}
      <div>
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '12px',
          paddingLeft: '12px'
        }}>
          Keuangan & Jurnal
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {financialModules.map((mod) => {
            const isActive = activeCategory === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveCategory(mod.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid #a855f7' : '3px solid transparent'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {mod.icon}
                  <span>{mod.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 'auto' }} className="glass-card" style={{ padding: '16px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10b981' }}>
          <ShieldCheck size={18} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>Keamanan Aktif</span>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>
          Semua password dan rekening di-encrypt dengan AES-256 sebelum disimpan ke database.
        </p>
      </div>
    </aside>
  );
}
