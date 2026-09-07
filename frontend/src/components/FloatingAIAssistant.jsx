import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, Minimize2, Maximize2, Move, Cpu, MessageSquare } from 'lucide-react';
import { api } from '../utils/api';

/**
 * Parses markdown text into clean, humanized JSX without raw tags like **, ####, ---
 */
function renderFormattedMessage(text = '') {
  if (!text) return null;

  // Split lines
  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    let cleanLine = line.trim();
    if (!cleanLine) return <div key={lineIdx} style={{ height: '8px' }} />;

    // Remove horizontal rule lines
    if (cleanLine === '---' || cleanLine === '***' || cleanLine === '___') {
      return <div key={lineIdx} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '8px 0' }} />;
    }

    // Handle header lines (####, ###, ##, #)
    let isHeader = false;
    if (cleanLine.startsWith('#')) {
      isHeader = true;
      cleanLine = cleanLine.replace(/^#+\s*/, '');
    }

    // Process bold tags **text**
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
        <div key={lineIdx} style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', margin: '8px 0 4px 0', borderLeft: '3px solid #06b6d4', paddingLeft: '8px' }}>
          {renderedParts}
        </div>
      );
    }

    // Bullet point line
    if (cleanLine.startsWith('* ') || cleanLine.startsWith('- ')) {
      return (
        <div key={lineIdx} style={{ display: 'flex', gap: '6px', margin: '4px 0', paddingLeft: '4px' }}>
          <span style={{ color: '#06b6d4', fontWeight: 700 }}>•</span>
          <div style={{ flex: 1 }}>{renderedParts}</div>
        </div>
      );
    }

    return (
      <p key={lineIdx} style={{ margin: '4px 0', color: '#e2e8f0', lineHeight: '1.5' }}>
        {renderedParts}
      </p>
    );
  });
}

export default function FloatingAIAssistant({ showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Dragging position state
  const [position, setPosition] = useState({ x: window.innerWidth - 390, y: window.innerHeight - 570 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Chat conversation state
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Halo Haekal! Saya AI Financial Guide yang terhubung langsung ke database keuangan kamu. Ada yang ingin dikonsultasikan hari ini?',
      provider: 'Google Gemini 3.6 Flash'
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Adjust default position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (position.x > window.innerWidth - 100) {
        setPosition(prev => ({ ...prev, x: window.innerWidth - 390 }));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Mouse Drag Handlers
  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
    setIsDragging(true);
    offsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      let newX = e.clientX - offsetRef.current.x;
      let newY = e.clientY - offsetRef.current.y;

      newX = Math.max(10, Math.min(window.innerWidth - 380, newX));
      newY = Math.max(10, Math.min(window.innerHeight - 100, newY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleSendQuestion = async (e, textOverride) => {
    if (e) e.preventDefault();
    const query = textOverride || inputQuestion;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    if (!textOverride) setInputQuestion('');
    setLoading(true);

    try {
      const res = await api.getAIFinancialAdvice(query);
      if (res.success) {
        setMessages(prev => [
          ...prev,
          { sender: 'ai', text: res.advice, provider: res.provider || 'Google Gemini' }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'ai', text: 'Maaf, terjadi kesalahan saat menghubungi AI Advisor.' }
        ]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: 'Gagal terhubung ke koneksi AI Gemini.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Berapa Net Worth saya dari database terbaru?",
    "Bagaimana alokasi gajian Rp 3 juta?",
    "Cek analisis risiko piutang Bapak",
    "Berapa jatah hemat harian aman?"
  ];

  return (
    <>
      {/* 🔴 Collapsed Floating Bubble */}
      {!isOpen && (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
            boxShadow: '0 8px 32px rgba(6, 182, 212, 0.4), 0 0 20px rgba(168, 85, 247, 0.3)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          className="hover:scale-105"
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Bot size={24} />
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }} />
          </div>
          <span>AI Financial Assistant</span>
          <Sparkles size={16} className="text-amber-300" />
        </div>
      )}

      {/* 🟢 Expanded Floating Draggable Window */}
      {isOpen && (
        <div
          ref={dragRef}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '370px',
            height: isMinimized ? '56px' : '540px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'rgba(15, 21, 35, 0.95)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.25)',
            transition: isDragging ? 'none' : 'height 0.25s ease'
          }}
        >
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(168, 85, 247, 0.25))',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                  AI Financial Guide
                </h4>
                <span style={{ fontSize: '10px', color: '#06b6d4', fontWeight: 600 }}>
                  ⚡ Google Gemini 3.6 Flash (Real-Time RAG)
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 size={15} /> : <Minimize2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                title="Tutup AI"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Content Body */}
          {!isMinimized && (
            <>
              {/* Message Log */}
              <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '88%',
                      background: msg.sender === 'user'
                        ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                        : 'rgba(30, 41, 59, 0.85)',
                      padding: '12px 16px',
                      borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      border: msg.sender === 'ai' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                      color: '#f8fafc',
                      fontSize: '13px'
                    }}
                  >
                    <div>{renderFormattedMessage(msg.text)}</div>
                    {msg.provider && (
                      <span style={{ fontSize: '9px', color: '#06b6d4', display: 'block', marginTop: '6px', textAlign: 'right', fontWeight: 600 }}>
                        {msg.provider}
                      </span>
                    )}
                  </div>
                ))}

                {loading && (
                  <div style={{ alignSelf: 'flex-start', background: 'rgba(30, 41, 59, 0.85)', padding: '10px 14px', borderRadius: '12px', color: '#06b6d4', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} className="animate-spin" /> Gemini AI sedang membaca data database...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Prompts Chips */}
              <div style={{ padding: '0 12px 8px 12px', display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {quickPrompts.map((qp, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendQuestion(null, qp)}
                    style={{
                      whiteSpace: 'nowrap',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '5px 11px',
                      borderRadius: '12px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      cursor: 'pointer'
                    }}
                  >
                    {qp}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <form onSubmit={handleSendQuestion} style={{ padding: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', gap: '8px', background: 'rgba(15, 21, 35, 0.95)' }}>
                <input
                  type="text"
                  placeholder="Tanya AI Advisor tentang keuanganmu..."
                  value={inputQuestion}
                  onChange={e => setInputQuestion(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
                    border: 'none',
                    borderRadius: '12px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
