import React, { useState } from 'react';
import { Key, Copy, Eye, EyeOff, Star, Trash2, Edit3, ExternalLink, Globe, FileText, Shield, Check, Lock, Building2 } from 'lucide-react';
import BankCardView from './BankCardView';

export default function VaultList({
  items,
  activeCategory,
  searchTerm,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopy
}) {
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter items based on active category & search string
  const filteredItems = items.filter(item => {
    // Category match
    if (activeCategory === 'FAVORITE' && !item.isFavorite) return false;
    if (activeCategory !== 'ALL' && activeCategory !== 'FAVORITE' && item.type !== activeCategory) return false;

    // Search match
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = item.title?.toLowerCase().includes(term);
    const userMatch = item.username?.toLowerCase().includes(term);
    const urlMatch = item.websiteUrl?.toLowerCase().includes(term);
    const bankNameMatch = item.details?.bankName?.toLowerCase().includes(term);

    return titleMatch || userMatch || urlMatch || bankNameMatch;
  });

  if (filteredItems.length === 0) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        background: 'rgba(18, 26, 43, 0.3)',
        borderRadius: '20px',
        border: '1px border-dashed rgba(255, 255, 255, 0.1)',
        margin: '20px'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6366f1',
          marginBottom: '16px'
        }}>
          <Lock size={32} />
        </div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
          Tidak Ada Data Vault
        </h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '380px', margin: '0 auto' }}>
          {searchTerm
            ? `Pencarian "${searchTerm}" tidak ditemukan di vault.`
            : 'Belum ada item yang tersimpan dalam kategori ini. Klik "Tambah Item" untuk menyimpan password atau rekening baru.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px',
      padding: '24px'
    }}>
      {filteredItems.map(item => {
        // Special rendering for Bank Accounts & Credit Cards
        if (item.type === 'BANK_ACCOUNT' || item.type === 'CARD') {
          return (
            <BankCardView
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleFavorite={onToggleFavorite}
              onCopy={onCopy}
            />
          );
        }

        // Standard Login Credential & Note Cards
        const isShowPass = visiblePasswords[item.id];
        const passValue = item.details?.password || '';

        return (
          <div key={item.id} className="glass-card glass-card-hover" style={{ padding: '20px', position: 'relative' }}>
            {/* Header: Title, Category badge, Actions */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: item.type === 'NOTE' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  border: item.type === 'NOTE' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.type === 'NOTE' ? '#f59e0b' : '#6366f1'
                }}>
                  {item.type === 'NOTE' ? <FileText size={20} /> : <Key size={20} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '2px' }}>
                    {item.title}
                  </h4>
                  {item.websiteUrl && (
                    <a
                      href={item.websiteUrl.startsWith('http') ? item.websiteUrl : `https://${item.websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: '12px', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Globe size={12} />
                      {item.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => onToggleFavorite(item)}
                  style={{ background: 'none', border: 'none', color: item.isFavorite ? '#facc15' : '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <Star size={16} fill={item.isFavorite ? '#facc15' : 'none'} />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Username Section */}
            {item.username && (
              <div style={{
                background: 'rgba(15, 21, 35, 0.6)',
                padding: '8px 12px',
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '13px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.username}
                </span>
                <button
                  onClick={() => onCopy(item.username, 'Username')}
                  style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Salin Username"
                >
                  <Copy size={14} />
                </button>
              </div>
            )}

            {/* Password Section */}
            {passValue && (
              <div style={{
                background: 'rgba(15, 21, 35, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '8px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  color: isShowPass ? '#10b981' : '#f8fafc',
                  letterSpacing: isShowPass ? '0' : '2px'
                }}>
                  {isShowPass ? passValue : '••••••••••••'}
                </span>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => togglePasswordVisibility(item.id)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    {isShowPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => onCopy(passValue, 'Password')}
                    style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer' }}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Secure Note Section */}
            {item.type === 'NOTE' && item.details?.notes && (
              <div style={{
                background: 'rgba(15, 21, 35, 0.6)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#cbd5e1',
                whiteSpace: 'pre-wrap',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                {item.details.notes}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
