import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, KeyRound, ArrowRight, ShieldAlert, Fingerprint } from 'lucide-react';
import { api } from '../utils/api';

export default function AuthView({ onAuthSuccess, showToast }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !masterPassword) {
      showToast('Mohon lengkapi email dan master password.', 'error');
      return;
    }

    if (isRegister && masterPassword !== confirmPassword) {
      showToast('Konfirmasi Master Password tidak cocok.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await api.register(email, masterPassword);
        if (res.success) {
          localStorage.setItem('vault_token', res.token);
          showToast('Master Vault berhasil dibuat!', 'success');
          onAuthSuccess(res.user);
        } else {
          showToast(res.message || 'Registrasi gagal.', 'error');
        }
      } else {
        const res = await api.login(email, masterPassword);
        if (res.success) {
          localStorage.setItem('vault_token', res.token);
          showToast('Vault unlocked. Selamat datang!', 'success');
          onAuthSuccess(res.user);
        } else {
          showToast(res.message || 'Email atau Master Password salah.', 'error');
        }
      }
    } catch (err) {
      showToast('Gagal terhubung ke server backend.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px 32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Cyber Neon Glow Header Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #6366f1, #06b6d4, #a855f7)'
        }} />

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#6366f1'
          }} className="animate-pulse-glow">
            <Fingerprint size={36} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
            CYBER<span style={{ color: '#06b6d4' }}>VAULT</span>
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            {isRegister ? 'Buat Master Password Vault Baru' : 'Buka Enkripsi Vault dengan Master Password'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Vault Owner</label>
            <div style={{ position: 'relative' }}>
              <Mail style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Master Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="••••••••••••"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="form-label">Konfirmasi Master Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={18} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', marginTop: '12px', fontSize: '15px' }}
          >
            {loading ? 'Mengenkripsi & Membuka Vault...' : (
              <>
                {isRegister ? 'Buat Encrypted Vault' : 'Unlock Vault'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setMasterPassword('');
              setConfirmPassword('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#06b6d4',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Sudah punya Vault? Login di sini' : 'Belum punya Vault? Buat Vault Baru'}
          </button>
        </div>

        <div style={{
          marginTop: '28px',
          padding: '12px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '12px',
          color: '#64748b'
        }}>
          <ShieldCheck size={20} style={{ color: '#10b981', flexShrink: 0 }} />
          <span>Data terenkripsi AES-256 & bcrypt hashing pada server PostgreSQL.</span>
        </div>
      </div>
    </div>
  );
}
