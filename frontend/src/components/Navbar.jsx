import React from 'react';
import { ShieldCheck, Plus, Key, Lock, Search, ShieldAlert, Cpu } from 'lucide-react';

export default function Navbar({
  searchTerm,
  setSearchTerm,
  onOpenAddModal,
  onOpenGeneratorModal,
  onOpenAuditModal,
  onLockVault,
  user
}) {
  return (
    <header className="glass-card" style={{
      borderRadius: 0,
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      padding: '16px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '20px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
        }}>
          <ShieldCheck size={24} color="#fff" />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.5px' }}>
            CYBER<span style={{ color: '#06b6d4' }}>VAULT</span>
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            PostgreSQL AES-256 Vault Active
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
        <Search style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: '42px', height: '42px', borderRadius: '24px' }}
          placeholder="Cari password, rekening bank, atau kartu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onOpenGeneratorModal} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
          <Key size={16} className="text-cyan-400" />
          Generator
        </button>

        <button onClick={onOpenAuditModal} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '13px' }}>
          <ShieldAlert size={16} className="text-purple-400" />
          Audit
        </button>

        <button onClick={onOpenAddModal} className="btn btn-cyan" style={{ padding: '8px 16px', fontSize: '13px' }}>
          <Plus size={18} />
          Tambah Item
        </button>

        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }} />

        <button onClick={onLockVault} className="btn btn-danger" title="Kunci Vault & Logout" style={{ padding: '8px 12px' }}>
          <Lock size={16} />
          <span style={{ fontSize: '13px' }}>Lock Vault</span>
        </button>
      </div>
    </header>
  );
}
