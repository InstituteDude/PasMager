import React, { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, Lock, Zap, CheckCircle2, Target, ArrowRight, Lightbulb, Bot, Send, Sparkles, Cpu } from 'lucide-react';
import { api } from '../utils/api';

function renderFormattedMessage(text = '') {
  if (!text) return null;
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={lineIdx} style={{ height: '8px' }} />;

    if (cleanLine === '---' || cleanLine === '***' || cleanLine === '___') {
      return <div key={lineIdx} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '12px 0' }} />;
    }

    let isHeader = false;
    if (cleanLine.startsWith('#')) {
      isHeader = true;
      cleanLine = cleanLine.replace(/^#+\s*/, '');
    }

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={partIdx} style={{ color: '#67e8f9', fontWeight: 700 }}>{boldText}</strong>;
      }
      return part;
    });

    if (isHeader) {
      return (
        <div key={lineIdx} style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: '12px 0 6px 0', borderLeft: '4px solid #06b6d4', paddingLeft: '10px' }}>
          {renderedParts}
        </div>
      );
    }

    if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
      return (
        <div key={lineIdx} style={{ display: 'flex', gap: '8px', margin: '6px 0', paddingLeft: '6px' }}>
          <span style={{ color: '#06b6d4', fontWeight: 700 }}>•</span>
          <div style={{ flex: 1 }}>{renderedParts}</div>
        </div>
      );
    }

    return (
      <p key={lineIdx} style={{ margin: '6px 0', color: '#e2e8f0', lineHeight: '1.6' }}>
        {renderedParts}
      </p>
    );
  });
}

export default function FinancialAdvisoryView({ showToast }) {
  const [advisoryData, setAdvisoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // AI Live Advisor state
  const [userQuestion, setUserQuestion] = useState('');
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiProvider, setAiProvider] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    const fetchAdvisory = async () => {
      try {
        const res = await api.getFinancialAdvisory();
        if (res.success) {
          setAdvisoryData(res.advisory);
        }
      } catch (err) {
        showToast('Gagal memuat saran keuangan.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAdvisory();
  }, []);

  const handleAskAI = async (e) => {
    if (e) e.preventDefault();
    setLoadingAI(true);
    try {
      const res = await api.getAIFinancialAdvice(userQuestion);
      if (res.success) {
        setAiAdvice(res.advice);
        setAiProvider(res.provider);
        showToast(`Analisis RAG AI berhasil diperbarui dari ${res.provider}!`, 'success');
      } else {
        showToast(res.message || 'Gagal meminta saran AI.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke AI Advisor.', 'error');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: '#a855f7' }}>
        Menganalisis Strategi & Jurnal Keuangan...
      </div>
    );
  }

  if (!advisoryData) return null;

  return (
    <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* 🤖 Live AI Consultation Header Box */}
      <div className="glass-card" style={{
        padding: '28px',
        marginBottom: '28px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(168, 85, 247, 0.15))',
        border: '1px solid rgba(6, 182, 212, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              <Bot size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                CyberVault AI Financial Advisor <Sparkles size={18} className="text-amber-400" />
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                Terhubung langsung ke database PostgreSQL keuangan Anda (Real-Time RAG)
              </p>
            </div>
          </div>

          {aiProvider && (
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.2)',
              color: '#06b6d4',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Cpu size={14} /> Engine: {aiProvider}
            </span>
          )}
        </div>

        {/* AI Query Form */}
        <form onSubmit={handleAskAI} style={{ display: 'flex', gap: '10px', marginBottom: aiAdvice ? '20px' : '0' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Tanyakan sesuatu ke AI... (cth: Gimana cara alokasi gaji bulan ini? atau Berapa jataan jajan aman?)"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            style={{ flex: 1, background: 'rgba(15, 21, 35, 0.8)' }}
          />
          <button
            type="submit"
            className="btn btn-cyan"
            disabled={loadingAI}
            style={{ padding: '10px 20px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {loadingAI ? (
              <>Menganalisis...</>
            ) : (
              <>
                <Send size={16} /> Minta Saran AI
              </>
            )}
          </button>
        </form>

        {/* AI Response Output Display */}
        {aiAdvice && (
          <div style={{
            background: 'rgba(15, 21, 35, 0.9)',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            marginTop: '16px'
          }}>
            {renderFormattedMessage(aiAdvice)}
          </div>
        )}
      </div>

      {/* Financial Health Header Banner */}
      <div className="glass-card" style={{ padding: '28px', marginBottom: '28px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.1))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <Lightbulb className="text-purple-400" size={24} />
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#f8fafc' }}>
                Prinsip Strategis & Rekomendasi Terjadwal
              </h2>
            </div>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
              Rekomendasi berdasarkan jurnal historis dan kesepakatan pengelolaan keuangan Muhamad Haekal Rizky
            </p>
          </div>

          <div style={{
            background: 'rgba(15, 21, 35, 0.8)',
            padding: '14px 24px',
            borderRadius: '16px',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Skor Kesehatan Keuangan</span>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#10b981' }}>{advisoryData.healthStatus}</p>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#a855f7', lineHeight: 1 }}>
              {advisoryData.overallHealthScore}<span style={{ fontSize: '16px', color: '#64748b' }}>/100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {advisoryData.advisories.map((adv) => {
          const isDanger = adv.type === 'DANGER_ALERT';
          const isInvest = adv.type === 'INVESTMENT_STRATEGY';

          const cardBorder = isDanger
            ? 'rgba(244, 63, 94, 0.4)'
            : isInvest
            ? 'rgba(6, 182, 212, 0.4)'
            : 'rgba(99, 102, 241, 0.4)';

          const cardBg = isDanger
            ? 'rgba(244, 63, 94, 0.05)'
            : isInvest
            ? 'rgba(6, 182, 212, 0.05)'
            : 'rgba(99, 102, 241, 0.05)';

          return (
            <div
              key={adv.id}
              className="glass-card"
              style={{
                padding: '24px',
                borderLeft: `4px solid ${isDanger ? '#f43f5e' : isInvest ? '#06b6d4' : '#6366f1'}`,
                borderColor: cardBorder,
                background: cardBg
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  background: isDanger ? 'rgba(244, 63, 94, 0.2)' : isInvest ? 'rgba(6, 182, 212, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                  color: isDanger ? '#f43f5e' : isInvest ? '#06b6d4' : '#6366f1',
                  letterSpacing: '0.5px'
                }}>
                  {adv.badge}
                </span>

                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Dampak: <strong style={{ color: isDanger ? '#f43f5e' : '#10b981' }}>{adv.impact}</strong>
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
                {adv.title}
              </h3>

              <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '14px', lineHeight: '1.5' }}>
                {adv.summary}
              </p>

              <div style={{
                background: 'rgba(15, 21, 35, 0.8)',
                padding: '14px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <CheckCircle2 size={18} className={isDanger ? 'text-rose-400' : 'text-emerald-400'} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase' }}>Rekomendasi Langkah Nyata:</span>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', marginTop: '2px', lineHeight: '1.5' }}>
                    {adv.recommendation}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
