import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Key, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

export default function SecurityAuditModal({ isOpen, onClose }) {
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await api.getSecurityAudit();
      if (res.success) {
        setAudit(res.audit);
      }
    } catch (err) {
      console.error('Failed to fetch security audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const score = audit?.healthScore || 100;
  const getScoreColor = (s) => {
    if (s >= 85) return '#10b981';
    if (s >= 60) return '#f59e0b';
    return '#f43f5e';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldAlert className="text-purple-400" size={24} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
              Vault Security Audit & Health
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
            Menganalisis kekuatan enkripsi vault...
          </div>
        ) : (
          <>
            {/* Score Ring Display */}
            <div style={{
              background: 'rgba(15, 21, 35, 0.8)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '24px',
              border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 800,
                color: getScoreColor(score),
                marginBottom: '4px',
                lineHeight: 1
              }}>
                {score}%
              </div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                {score >= 85 ? 'Vault Sangat Aman & Kebal' : score >= 60 ? 'Keamanan Cukup Baik (Perlu Perbaikan)' : 'Peringatan Risiko Tinggi!'}
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Total Item Vault</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  {audit?.totalItems || 0}
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Rekening / Kartu Bank</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#06b6d4', marginTop: '4px' }}>
                  {audit?.bankItems || 0}
                </p>
              </div>

              <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(244,63,94,0.2)' }}>
                <span style={{ fontSize: '12px', color: '#f43f5e' }}>Password Lemah</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#f43f5e', marginTop: '4px' }}>
                  {audit?.weakPasswords || 0}
                </p>
              </div>

              <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>
                <span style={{ fontSize: '12px', color: '#f59e0b' }}>Password Reused</span>
                <p style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>
                  {audit?.reusedPasswords || 0}
                </p>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#94a3b8', background: 'rgba(255,255,255,0.04)', padding: '12px', borderRadius: '10px' }}>
              💡 <strong>Saran Keamanan:</strong> Gunakan Generator Password untuk mengganti password yang lemah atau digunakan berulang kali di beberapa akun.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
