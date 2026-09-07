import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown,
  Bell, Plus, Trash2, Clock, Layers, Eye, Wallet, PiggyBank, Briefcase
} from 'lucide-react';

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function toLocalDateStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function generateDates(centerDate, totalDays = 90) {
  const dates = [];
  const center = new Date(centerDate);
  const half = Math.floor(totalDays / 2);
  for (let i = -half; i <= half; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    dates.push(toLocalDateStr(d));
  }
  return dates;
}

export default function FinancialDateReminder({ snapshots, journalEntries, onOpenSnapshotDetail, formatIDR }) {
  const today = toLocalDateStr(new Date());
  const stripRef = useRef(null);
  const todayRef = useRef(null);

  const [dates] = useState(() => generateDates(today, 120));
  const [selectedDate, setSelectedDate] = useState(today);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newRem, setNewRem] = useState({ label: '', type: 'REMINDER', notes: '' });

  const [reminders, setReminders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fin_reminders_v2') || '[]'); }
    catch { return []; }
  });

  const saveReminders = (list) => {
    setReminders(list);
    localStorage.setItem('fin_reminders_v2', JSON.stringify(list));
  };

  // Index snapshots and reminders by date
  const snapshotMap = {};
  (snapshots || []).forEach((s) => { snapshotMap[s.snapshot_date] = s; });

  const reminderMap = {};
  reminders.forEach((r) => {
    if (!reminderMap[r.date]) reminderMap[r.date] = [];
    reminderMap[r.date].push(r);
  });

  // Index journal entries by date
  const journalMap = {};
  (journalEntries || []).forEach((e) => {
    const d = e.entry_date ? e.entry_date.split('T')[0] : null;
    if (!d) return;
    if (!journalMap[d]) journalMap[d] = [];
    journalMap[d].push(e);
  });

  // Scroll to today on mount
  useEffect(() => {
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 200);
  }, []);

  const scroll = (dir) => {
    if (!stripRef.current) return;
    stripRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const handleSelectDate = (date) => {
    setSelectedDate(date);
    setDetailOpen(true);
    setShowAddReminder(false);
  };

  const addReminder = () => {
    if (!newRem.label) return;
    const updated = [...reminders, { ...newRem, date: selectedDate, id: Date.now() }];
    saveReminders(updated);
    setNewRem({ label: '', type: 'REMINDER', notes: '' });
    setShowAddReminder(false);
  };

  const deleteReminder = (id) => saveReminders(reminders.filter((r) => r.id !== id));

  // Selected date data
  const selectedSnap = snapshotMap[selectedDate];
  const selectedReminders = reminderMap[selectedDate] || [];
  const selectedJournal = journalMap[selectedDate] || [];
  const hasData = selectedSnap || selectedReminders.length > 0 || selectedJournal.length > 0;

  const formatFullDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const typeConfig = {
    REMINDER: { color: '#a855f7', icon: '📌', label: 'Reminder' },
    GAJIAN:   { color: '#10b981', icon: '💰', label: 'Gajian' },
    TAGIHAN:  { color: '#f43f5e', icon: '📤', label: 'Tagihan' },
  };

  return (
    <div className="glass-card" style={{ padding: '0', marginBottom: '28px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} color="#a855f7" />
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Kalender Keuangan
            </h3>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
              Scroll untuk pilih tanggal • Klik untuk lihat detail
            </p>
          </div>
        </div>
        <button
          onClick={() => { setSelectedDate(today); setDetailOpen(false); todayRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center' }); }}
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
        >
          Hari Ini
        </button>
      </div>

      {/* Calendar strip */}
      <div style={{ position: 'relative', padding: '16px 0 0' }}>
        {/* Left arrow */}
        <button onClick={() => scroll(-1)} style={{
          position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
          background: 'rgba(15,21,35,0.9)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8', width: '32px', height: '32px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}>
          <ChevronLeft size={16} />
        </button>

        {/* Scrollable date strip */}
        <div
          ref={stripRef}
          style={{
            display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 48px 16px',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}
        >
          <style>{`div::-webkit-scrollbar { display: none; }`}</style>

          {dates.map((dateStr) => {
            const d = new Date(dateStr + 'T00:00:00');
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const hasSnap = !!snapshotMap[dateStr];
            const hasRem = !!(reminderMap[dateStr]?.length);
            const hasTx = !!(journalMap[dateStr]?.length);
            const isFuture = dateStr > today;
            const snap = snapshotMap[dateStr];

            return (
              <div
                key={dateStr}
                ref={isToday ? todayRef : null}
                onClick={() => handleSelectDate(dateStr)}
                style={{
                  flexShrink: 0, width: '72px',
                  background: isSelected
                    ? 'linear-gradient(160deg, rgba(168,85,247,0.25), rgba(99,102,241,0.2))'
                    : isToday
                    ? 'rgba(16,185,129,0.08)'
                    : 'rgba(255,255,255,0.03)',
                  border: isSelected
                    ? '1.5px solid rgba(168,85,247,0.6)'
                    : isToday
                    ? '1.5px solid rgba(16,185,129,0.4)'
                    : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px', padding: '10px 6px',
                  cursor: 'pointer', transition: 'all 0.18s ease',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                  opacity: isFuture && !hasSnap && !hasRem ? 0.55 : 1,
                }}
              >
                {/* Day abbrev */}
                <span style={{ fontSize: '10px', fontWeight: 600, color: isSelected ? '#a855f7' : isToday ? '#10b981' : '#64748b', textTransform: 'uppercase' }}>
                  {DAYS_ID[d.getDay()]}
                </span>

                {/* Date number */}
                <span style={{
                  fontSize: '20px', fontWeight: 800, lineHeight: 1,
                  color: isSelected ? '#fff' : isToday ? '#10b981' : '#94a3b8',
                }}>
                  {d.getDate()}
                </span>

                {/* Month label if 1st */}
                <span style={{ fontSize: '9px', color: '#475569', fontWeight: 600 }}>
                  {d.getDate() === 1 ? MONTHS_ID[d.getMonth()] : MONTHS_ID[d.getMonth()]}
                </span>

                {/* Indicator dots */}
                <div style={{ display: 'flex', gap: '3px', minHeight: '7px' }}>
                  {hasSnap && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }} />}
                  {hasTx && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />}
                  {hasRem && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7' }} />}
                </div>

                {/* Mini net worth if snapshot */}
                {hasSnap && snap && (
                  <span style={{ fontSize: '8px', fontWeight: 700, color: '#10b981', textAlign: 'center', lineHeight: 1.2 }}>
                    {(parseFloat(snap.total_net_worth_excl) / 1000000).toFixed(1)}jt
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Right arrow */}
        <button onClick={() => scroll(1)} style={{
          position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
          background: 'rgba(15,21,35,0.9)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8', width: '32px', height: '32px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          backdropFilter: 'blur(8px)',
        }}>
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Detail panel - slides in when a date is selected */}
      {detailOpen && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          background: 'rgba(8,13,26,0.6)',
          animation: 'detailSlide 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Detail header */}
          <div style={{ padding: '18px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 2px', fontWeight: 600 }}>
                {formatFullDate(selectedDate)}
                {selectedDate === today && <span style={{ marginLeft: '8px', fontSize: '10px', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '1px 7px', borderRadius: '5px', fontWeight: 700 }}>Hari Ini</span>}
              </p>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                {selectedSnap ? selectedSnap.title : hasData ? 'Detail Keuangan' : 'Tidak ada data'}
              </h4>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowAddReminder((v) => !v)} style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7', padding: '5px 11px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={12} /> Reminder
              </button>
              <button onClick={() => setDetailOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Add reminder inline form */}
          {showAddReminder && (
            <div style={{ margin: '12px 24px 0', background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '12px', padding: '14px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7', margin: '0 0 10px' }}>Tambah Reminder — {selectedDate}</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input type="text" placeholder="Keterangan..." value={newRem.label}
                  onChange={(e) => setNewRem({ ...newRem, label: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addReminder()}
                  style={{ flex: 1, minWidth: '140px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px', padding: '7px 10px', outline: 'none' }} />
                <select value={newRem.type} onChange={(e) => setNewRem({ ...newRem, type: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f8fafc', fontSize: '12px', padding: '7px 10px', outline: 'none', cursor: 'pointer' }}>
                  <option value="REMINDER">📌 Reminder</option>
                  <option value="GAJIAN">💰 Gajian</option>
                  <option value="TAGIHAN">📤 Tagihan</option>
                </select>
                <button onClick={addReminder} style={{ background: 'linear-gradient(135deg,#a855f7,#6366f1)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 700, padding: '7px 14px', cursor: 'pointer' }}>Simpan</button>
              </div>
            </div>
          )}

          {/* Content */}
          <div style={{ padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Snapshot detail */}
            {selectedSnap ? (
              <div>
                {/* Net worth cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  {[
                    { label: 'Net Worth (Excl.)', val: parseFloat(selectedSnap.total_net_worth_excl), color: '#10b981' },
                    { label: 'Net Worth (Incl.)', val: parseFloat(selectedSnap.total_net_worth_incl), color: '#a855f7' },
                    { label: 'Total Likuid', val: parseFloat(selectedSnap.total_liquid), color: '#06b6d4' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 12px' }}>
                      <p style={{ fontSize: '9px', color: '#64748b', fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>{label}</p>
                      <p style={{ fontSize: '15px', fontWeight: 800, color, margin: 0 }}>{formatIDR(val)}</p>
                    </div>
                  ))}
                </div>

                {selectedSnap.notes && (
                  <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: '0 0 12px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid rgba(168,85,247,0.4)' }}>
                    {selectedSnap.notes}
                  </p>
                )}

                <button
                  onClick={() => onOpenSnapshotDetail(selectedSnap)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                >
                  <Eye size={14} /> Lihat Rincian Pos Aset Lengkap
                </button>
              </div>
            ) : !hasData ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#475569' }}>
                <Calendar size={24} style={{ opacity: 0.3, marginBottom: '8px', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '13px', margin: '0 0 4px' }}>Belum ada data keuangan untuk tanggal ini.</p>
                <p style={{ fontSize: '11px', color: '#334155' }}>Tambahkan reminder atau buat snapshot baru.</p>
              </div>
            ) : null}

            {/* Reminders for this date */}
            {selectedReminders.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>REMINDER & JADWAL</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {selectedReminders.map((rem) => {
                    const cfg = typeConfig[rem.type] || typeConfig.REMINDER;
                    return (
                      <div key={rem.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '16px' }}>{cfg.icon}</span>
                          <div>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>{rem.label}</p>
                            <span style={{ fontSize: '10px', color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                          </div>
                        </div>
                        <button onClick={() => deleteReminder(rem.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.5, padding: '2px' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transaction history (journal entries) for this date */}
            {selectedJournal.length > 0 && (
              <div>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>
                  RIWAYAT TRANSAKSI
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {selectedJournal.map((entry) => {
                    const isIncome = entry.type === 'INCOME';
                    const entryColor = isIncome ? '#10b981' : '#f43f5e';
                    const entryBg = isIncome ? 'rgba(16,185,129,0.06)' : 'rgba(244,63,94,0.06)';
                    const entryBorder = isIncome ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)';
                    return (
                      <div key={entry.id} style={{ padding: '10px 14px', background: entryBg, border: `1px solid ${entryBorder}`, borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <span style={{ fontSize: '14px' }}>{isIncome ? '💰' : '📤'}</span>
                            <p style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{entry.title}</p>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: entryColor }}>
                            {isIncome ? '+' : '-'}{formatIDR(parseFloat(entry.amount || 0))}
                          </span>
                        </div>
                        {entry.description && (
                          <p style={{ fontSize: '10px', color: '#475569', margin: 0, paddingLeft: '21px' }}>
                            {entry.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Total for the day */}
                {selectedJournal.length > 1 && (() => {
                  const totalIn = selectedJournal.filter(e => e.type === 'INCOME').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                  const totalOut = selectedJournal.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
                  return (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      {totalIn > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '3px 10px', borderRadius: '6px' }}>+{formatIDR(totalIn)}</span>}
                      {totalOut > 0 && <span style={{ fontSize: '11px', fontWeight: 700, color: '#f43f5e', background: 'rgba(244,63,94,0.08)', padding: '3px 10px', borderRadius: '6px' }}>-{formatIDR(totalOut)}</span>}
                      <span style={{ fontSize: '11px', color: '#64748b' }}>total hari ini</span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes detailSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
