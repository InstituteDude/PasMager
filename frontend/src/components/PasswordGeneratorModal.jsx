import React, { useState, useEffect } from 'react';
import { X, Copy, RefreshCw, Check, ShieldCheck, Zap } from 'lucide-react';

export default function PasswordGeneratorModal({ isOpen, onClose, onCopy }) {
  const [length, setLength] = useState(16);
  const [includeUpper, setIncludeUpper] = useState(true);
  const [includeLower, setIncludeLower] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generatePassword = () => {
    let chars = '';
    if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      setGeneratedPassword('');
      return;
    }

    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(result);
  };

  useEffect(() => {
    if (isOpen) {
      generatePassword();
    }
  }, [isOpen, length, includeUpper, includeLower, includeNumbers, includeSymbols]);

  if (!isOpen) return null;

  // Strength score
  let strengthScore = 0;
  if (length >= 12) strengthScore += 1;
  if (length >= 16) strengthScore += 1;
  if (includeUpper && includeLower) strengthScore += 1;
  if (includeNumbers) strengthScore += 1;
  if (includeSymbols) strengthScore += 1;

  const strengthLabels = ['Sangat Lemah', 'Cukup', 'Kuat', 'Sangat Kuat', 'CYBER BULLETPROOF'];
  const strengthColors = ['#f43f5e', '#f59e0b', '#06b6d4', '#10b981', '#a855f7'];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap className="text-cyan-400" size={22} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              Generator Password Acak
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Generated Password Box */}
        <div style={{
          background: 'rgba(15, 21, 35, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '16px',
            fontWeight: 700,
            color: '#10b981',
            letterSpacing: '1px',
            wordBreak: 'break-all'
          }}>
            {generatedPassword || 'Pilih opsi di bawah'}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={generatePassword} className="btn-icon" title="Generate Ulang">
              <RefreshCw size={16} />
            </button>
            <button
              onClick={() => onCopy(generatedPassword, 'Password Acak')}
              className="btn btn-primary"
              style={{ padding: '8px 12px' }}
            >
              <Copy size={16} />
              Salin
            </button>
          </div>
        </div>

        {/* Strength Rating Meter */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Tingkat Kekuatan:</span>
            <span style={{ fontWeight: 700, color: strengthColors[Math.min(strengthScore, 4)] }}>
              {strengthLabels[Math.min(strengthScore, 4)]}
            </span>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(Math.min(strengthScore, 5) / 5) * 100}%`,
              background: strengthColors[Math.min(strengthScore, 4)],
              transition: 'all 0.3s ease'
            }} />
          </div>
        </div>

        {/* Customization Options */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
            <span style={{ color: '#cbd5e1' }}>Panjang Password:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#06b6d4' }}>{length} Karakter</span>
          </div>
          <input
            type="range"
            min="8"
            max="48"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: '#6366f1', cursor: 'pointer' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
          {[
            { state: includeUpper, setState: setIncludeUpper, label: 'Huruf Kapital (A-Z)' },
            { state: includeLower, setState: setIncludeLower, label: 'Huruf Kecil (a-z)' },
            { state: includeNumbers, setState: setIncludeNumbers, label: 'Angka (0-9)' },
            { state: includeSymbols, setState: setIncludeSymbols, label: 'Simbol (@#$%)' },
          ].map((opt, i) => (
            <label key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.04)',
              fontSize: '13px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={opt.state}
                onChange={(e) => opt.setState(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
