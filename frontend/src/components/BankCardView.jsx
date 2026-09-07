import React, { useState } from 'react';
import { Building2, Copy, Eye, EyeOff, Star, Trash2, Edit3, Shield, Check } from 'lucide-react';

export default function BankCardView({ item, onEdit, onDelete, onToggleFavorite, onCopy }) {
  const [showSecret, setShowSecret] = useState(false);
  const details = item.details || {};

  // Bank theme gradient styles
  const getBankGradient = (bankName = '') => {
    const name = bankName.toLowerCase();
    if (name.includes('bca')) return 'linear-gradient(135deg, #00529c 0%, #002e5b 100%)';
    if (name.includes('mandiri')) return 'linear-gradient(135deg, #003366 0%, #ff9900 100%)';
    if (name.includes('bri')) return 'linear-gradient(135deg, #00529c 0%, #0088ff 100%)';
    if (name.includes('bni')) return 'linear-gradient(135deg, #f26522 0%, #005e63 100%)';
    if (name.includes('jago')) return 'linear-gradient(135deg, #ff6b00 0%, #8b00ff 100%)';
    if (name.includes('visa')) return 'linear-gradient(135deg, #1a1f71 0%, #00579f 100%)';
    if (name.includes('master') || item.type === 'CARD') return 'linear-gradient(135deg, #222222 0%, #3a3d40 100%)';
    return 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)';
  };

  const bankName = details.bankName || details.cardIssuer || item.title || 'Bank Account';
  const accountNumber = details.accountNumber || details.cardNumber || '•••• •••• ••••';
  const holderName = details.accountHolder || details.cardHolder || item.username || 'VAULT HOLDER';

  return (
    <div style={{
      background: getBankGradient(bankName),
      borderRadius: '20px',
      padding: '24px',
      color: '#fff',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      minHeight: '210px',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
    }}>
      {/* Background Chip Glow Lines */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '160px',
        height: '160px',
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.06)',
        pointerEvents: 'none'
      }} />

      {/* Top Row: Bank Brand Logo & Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={22} className="text-cyan-300" />
          <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '0.5px' }}>{bankName.toUpperCase()}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => onToggleFavorite(item)}
            style={{ background: 'none', border: 'none', color: item.isFavorite ? '#facc15' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
          >
            <Star size={18} fill={item.isFavorite ? '#facc15' : 'none'} />
          </button>
          <button onClick={() => onEdit(item)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
            <Edit3 size={16} />
          </button>
          <button onClick={() => onDelete(item.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Middle Row: Gold Smart Chip Visual */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '14px 0', zIndex: 2 }}>
        <div style={{
          width: '38px',
          height: '28px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #ffe066 0%, #d4af37 100%)',
          border: '1px solid #b8860b',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#b8860b' }} />
        </div>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', letterSpacing: '1px' }}>REKENING VAULT</span>
      </div>

      {/* Bottom Row: Account Number & Owner Name */}
      <div style={{ zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, letterSpacing: '2px' }}>
            {showSecret ? accountNumber : (accountNumber.replace(/.(?=.{4})/g, '•'))}
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setShowSecret(!showSecret)}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
              title="Tampilkan / Sembunyikan Nomor"
            >
              {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => onCopy(accountNumber, 'Nomor Rekening')}
              style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}
              title="Salin Nomor Rekening"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '12px' }}>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>PEMILIK REKENING</span>
            <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>{holderName.toUpperCase()}</span>
          </div>
          {details.pin && (
            <button
              onClick={() => onCopy(details.pin, 'PIN Bank')}
              style={{
                fontSize: '11px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Copy PIN
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
