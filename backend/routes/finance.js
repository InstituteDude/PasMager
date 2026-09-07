const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

/**
 * GET /api/finance/recap
 */
router.get('/recap', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, category_type, name, amount, sub_category, note, updated_at FROM financial_assets WHERE user_id = $1 ORDER BY id ASC',
      [userId]
    );

    const liquidAssets = [];
    const lockedAssets = [];
    const physicalAndReceivables = [];

    let totalLiquid = 0;
    let totalLocked = 0;
    let totalPiutang = 0;

    result.rows.forEach(row => {
      const amt = parseFloat(row.amount) || 0;
      const item = {
        id: row.id,
        name: row.name,
        amount: amt,
        category: row.sub_category || 'Umum',
        note: row.note || ''
      };

      if (row.category_type === 'LIQUID') {
        liquidAssets.push(item);
        totalLiquid += amt;
      } else if (row.category_type === 'LOCKED') {
        lockedAssets.push(item);
        totalLocked += amt;
      } else if (row.category_type === 'PHYSICAL_RECEIVABLE') {
        physicalAndReceivables.push(item);
        if (row.name.toLowerCase().includes('piutang')) {
          totalPiutang += amt;
        }
      }
    });

    const netWorthExcl = totalLiquid + totalLocked;
    const netWorthIncl = netWorthExcl + totalPiutang;

    const userRes = await pool.query('SELECT email, created_at FROM users WHERE id = $1', [userId]);
    const userRow = userRes.rows[0] || {};
    const displayName = (userRow.email || '').split('@')[0];

    const recapData = {
      profile: {
        name: displayName ? displayName.charAt(0).toUpperCase() + displayName.slice(1) : 'Vault User',
        role: 'Vault User',
        memberSince: userRow.created_at || null
      },
      netWorth: {
        exclReceivables: netWorthExcl,
        inclReceivables: netWorthIncl,
        highestPointNote: "Status Net Worth Terupdate Real-Time"
      },
      liquidAssets,
      lockedAssets,
      physicalAndReceivables
    };

    return res.json({ success: true, recap: recapData });
  } catch (err) {
    console.error('Error fetching recap:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil rekapitulasi keuangan.' });
  }
});

/**
 * GET /api/finance/snapshots
 */
router.get('/snapshots', async (req, res) => {
  try {
    const userId = req.user.id;

    const snapshotsRes = await pool.query(
      'SELECT * FROM financial_snapshots WHERE user_id = $1 ORDER BY snapshot_date DESC, id DESC',
      [userId]
    );

    return res.json({ success: true, snapshots: snapshotsRes.rows });
  } catch (err) {
    console.error('Error fetching snapshots:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data snapshot harian.' });
  }
});

/**
 * GET /api/finance/snapshots/:id
 * Child detail view of a snapshot
 */
router.get('/snapshots/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const snapId = req.params.id;

    const snapRes = await pool.query('SELECT * FROM financial_snapshots WHERE id = $1 AND user_id = $2', [snapId, userId]);
    if (snapRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Snapshot tidak ditemukan.' });
    }

    const itemsRes = await pool.query('SELECT * FROM financial_snapshot_items WHERE snapshot_id = $1 ORDER BY id ASC', [snapId]);

    return res.json({
      success: true,
      snapshot: snapRes.rows[0],
      items: itemsRes.rows
    });
  } catch (err) {
    console.error('Error fetching snapshot detail:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil rincian detail snapshot.' });
  }
});

/**
 * POST /api/finance/snapshots
 * Create new snapshot populated with current template assets or custom date items
 */
router.post('/snapshots', async (req, res) => {
  try {
    const userId = req.user.id;
    const { snapshot_date, title, notes, items = [] } = req.body;

    if (!snapshot_date || !title) {
      return res.status(400).json({ success: false, message: 'Tanggal snapshot dan judul wajib diisi.' });
    }

    let itemsToSave = items;

    // If no custom items passed, pull current active assets as template
    if (itemsToSave.length === 0) {
      const curAssets = await pool.query('SELECT * FROM financial_assets WHERE user_id = $1', [userId]);
      itemsToSave = curAssets.rows;
    }

    let totalLiquid = 0;
    let totalLocked = 0;
    let totalPiutang = 0;

    itemsToSave.forEach(it => {
      const amt = parseFloat(it.amount) || 0;
      if (it.category_type === 'LIQUID') totalLiquid += amt;
      else if (it.category_type === 'LOCKED') totalLocked += amt;
      else if (it.category_type === 'PHYSICAL_RECEIVABLE' && (it.name || '').toLowerCase().includes('piutang')) totalPiutang += amt;
    });

    const netWorthExcl = totalLiquid + totalLocked;
    const netWorthIncl = netWorthExcl + totalPiutang;

    const snapRes = await pool.query(
      `INSERT INTO financial_snapshots (user_id, snapshot_date, title, total_net_worth_excl, total_net_worth_incl, total_liquid, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, snapshot_date, title, netWorthExcl, netWorthIncl, totalLiquid, notes || '']
    );

    const snapId = snapRes.rows[0].id;

    for (const item of itemsToSave) {
      await pool.query(
        `INSERT INTO financial_snapshot_items (snapshot_id, category_type, name, amount, sub_category, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [snapId, item.category_type || 'LIQUID', item.name, parseFloat(item.amount) || 0, item.sub_category || item.category || 'Umum', item.note || '']
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Snapshot harian baru berhasil dibuat!',
      snapshot: snapRes.rows[0]
    });
  } catch (err) {
    console.error('Error creating snapshot:', err);
    return res.status(500).json({ success: false, message: 'Gagal membuat snapshot harian.' });
  }
});

/**
 * PUT /api/finance/assets/:id
 */
router.put('/assets/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = req.params.id;
    const { name, amount, sub_category, note } = req.body;

    const result = await pool.query(
      `UPDATE financial_assets
       SET name = COALESCE($1, name),
           amount = COALESCE($2, amount),
           sub_category = COALESCE($3, sub_category),
           note = COALESCE($4, note),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [name, amount, sub_category, note, assetId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pos aset tidak ditemukan.' });
    }

    return res.json({ success: true, message: 'Nilai pos aset berhasil diperbarui!', asset: result.rows[0] });
  } catch (err) {
    console.error('Error updating asset:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui nilai aset.' });
  }
});

/**
 * POST /api/finance/assets
 */
router.post('/assets', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category_type = 'LIQUID', name, amount = 0, sub_category, note } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Nama pos aset wajib diisi.' });
    }

    const result = await pool.query(
      `INSERT INTO financial_assets (user_id, category_type, name, amount, sub_category, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, category_type, name, amount, sub_category || 'Umum', note || '']
    );

    return res.status(201).json({ success: true, message: 'Pos aset baru berhasil ditambahkan!', asset: result.rows[0] });
  } catch (err) {
    console.error('Error adding asset:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambah pos aset baru.' });
  }
});

/**
 * DELETE /api/finance/assets/:id
 */
router.delete('/assets/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const assetId = req.params.id;

    const result = await pool.query('DELETE FROM financial_assets WHERE id = $1 AND user_id = $2 RETURNING id', [assetId, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Pos aset tidak ditemukan.' });
    }

    return res.json({ success: true, message: 'Pos aset berhasil dihapus.' });
  } catch (err) {
    console.error('Error deleting asset:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus pos aset.' });
  }
});

/**
 * POST /api/finance/ai-advisor
 * Dynamic RAG Engine with Senior PhD Economist Persona & Academic/Warren Buffett Citation Grounding
 */
router.post('/ai-advisor', async (req, res) => {
  try {
    const userId = req.user.id;
    const { question = '' } = req.body;

    // 1. RAG RETRIEVAL: Fetch latest live assets & entries from PostgreSQL
    const assetsResult = await pool.query('SELECT * FROM financial_assets WHERE user_id = $1 ORDER BY id ASC', [userId]);
    const journalsResult = await pool.query('SELECT * FROM financial_entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5', [userId]);
    
    let totalLiquid = 0;
    let totalLocked = 0;
    let totalPiutang = 0;
    const assetSummaryLines = [];

    assetsResult.rows.forEach(a => {
      const amt = parseFloat(a.amount) || 0;
      assetSummaryLines.push(`- ${a.name} (${a.category_type}): Rp ${amt.toLocaleString('id-ID')} ${a.note ? '['+a.note+']' : ''}`);
      if (a.category_type === 'LIQUID') totalLiquid += amt;
      else if (a.category_type === 'LOCKED') totalLocked += amt;
      else if (a.category_type === 'PHYSICAL_RECEIVABLE' && a.name.toLowerCase().includes('piutang')) totalPiutang += amt;
    });

    const journalLines = journalsResult.rows.map(j => `- ${j.entry_date}: ${j.title} (Rp ${parseFloat(j.amount || 0).toLocaleString('id-ID')})`);

    const netWorthExcl = totalLiquid + totalLocked;
    const netWorthIncl = netWorthExcl + totalPiutang;

    const geminiApiKey = process.env.GEMINI_API_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    // 2. ENRICHED SENIOR PHD ECONOMIST PERSONA & CITATION GROUNDING
    const systemPrompt = `Kamu adalah seorang Ekonom Senior bergelar Doktor / S3 Financial Economics dengan pengalaman 50 tahun di bidang Wealth Management & Financial Planning. Kamu sangat mendalami prinsip investasi Warren Buffett, Charlie Munger, Ray Dalio, Benjamin Graham, dan Howard Marks.

TUGAS DAN IDENTITAS KAMU:
1. Bertindak sebagai mentor keuangan senior untuk pengguna aplikasi ini berdasarkan data pos aset yang tercatat di bawah.
2. Memberikan analisis keuangan yang sangat tajam, valid, tidak halu, dan berdasar pada prinsip ekonomi yang teruji secara empiris.
3. Selalu cantumkan referensi prinsip/jurnal ekonomi yang valid pada setiap rekomendasi utama (contoh: Modern Portfolio Theory - Markowitz 1952, Emergency Cash Buffer Standard - CFPB & Vanguard, Rule of 50/30/20, Margins of Safety - Graham & Buffett).

PERATURAN GUARDRAILS & FORMATTING (WAJIB):
1. HANYA JAWAB PERTANYAAN TERKAIT KEUANGAN PRIBADI, INVESTASI, ALOKASI ANGGARAN, DAN POS ASET.
2. Jika pengguna bertanya hal di luar keuangan (politik, presiden, sejarah, cuaca, dll), tolak dengan sopan bahwa Anda fokus mendampingi keuangan beliau.
3. JANGAN MENGGUNAKAN SIMBOL MARKDOWN MENTAH seperti '####', '---', atau simbol bintang berlebihan '**'. Gunakan kalimat mengalir yang ramah, santai, dan berbobot akademis praktis.

SNAPSHOT DATABASE TERBARU SAAT INI (REAL-TIME POSTGRESQL):
- Net Worth Bersih (excl. piutang): Rp ${netWorthExcl.toLocaleString('id-ID')}
- Net Worth Kotor (incl. piutang): Rp ${netWorthIncl.toLocaleString('id-ID')}
- Total Uang Operasional Likuid: Rp ${totalLiquid.toLocaleString('id-ID')} (BNI, Cash, GoPay, DANA)
- Dana Darurat & Investasi Terkunci: Rp ${totalLocked.toLocaleString('id-ID')} (Bank Jago & Bibit)
- Total Piutang Bapak/Keluarga: Rp ${totalPiutang.toLocaleString('id-ID')}

DAFTAR POS ASET DATABASE:
${assetSummaryLines.join('\n')}

MUTASI TERAKHIR:
${journalLines.length > 0 ? journalLines.join('\n') : 'Belum ada mutasi baru.'}

PERTANYAAN PENGGUNA: "${question || 'Berikan analisis portofolio dan saran alokasi strategis dari kacamata pakar investasi.'}"`;

    if (geminiApiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }]
          })
        });
        const geminiData = await geminiRes.json();
        const aiText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (aiText) {
          return res.json({
            success: true,
            advice: aiText,
            provider: 'Google Gemini 3.6 Flash (PhD Senior Advisor)'
          });
        }
      } catch (geminiErr) {
        console.error('Gemini API call failed, fallback to smart rule engine:', geminiErr);
      }
    }

    if (openaiApiKey) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiApiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'Kamu adalah Ekonom PhD Senior Advisor.' },
              { role: 'user', content: systemPrompt }
            ]
          })
        });
        const openaiData = await openaiRes.json();
        const aiText = openaiData?.choices?.[0]?.message?.content;
        if (aiText) {
          return res.json({
            success: true,
            advice: aiText,
            provider: 'OpenAI GPT-4o-mini (PhD Senior Advisor)'
          });
        }
      } catch (openaiErr) {
        console.error('OpenAI API call failed, fallback to smart rule engine:', openaiErr);
      }
    }

    // Fallback Engine with PhD Persona & Journal Citations
    const smartAdviceText = `Halo, dari sudut pandang analisis keuangan profesional 50 tahun dan prinsip investasi Warren Buffett:

Net Worth bersih kamu berada di angka Rp ${netWorthExcl.toLocaleString('id-ID')}. Berikut analisis empiris untuk portofolionya:

1. Proteksi Likuiditas Operasional
Saldo likuid kamu tercatat Rp ${totalLiquid.toLocaleString('id-ID')}. Menurut studi Vanguard Financial Planning Research, menjaga alokasi cashflow minimal 1.5 - 2 bulan biaya hidup sangat krusial untuk mencegah liquidation risk pada portofolio investasi saat terjadi kebutuhan mendadak.

2. Evaluasi Risiko Piutang${totalPiutang > 0 ? ` (Rp ${totalPiutang.toLocaleString('id-ID')})` : ''}
Sesuai prinsip "Margin of Safety" dari Benjamin Graham & Warren Buffett, piutang tanpa jadwal pelunasan mengikat kekayaan kamu pada aset berisiko tinggi. Sepakati plafon pinjaman maksimal agar modal kerja tidak terganggu.

3. Alokasi Investasi Berkala (DCA)
Strategi Dollar-Cost Averaging (DCA) terbukti secara akademis (Journal of Financial Planning, 2018) menurunkan volatilitas emosional investor dan memaksimalkan hasil compounding jangka panjang pada instrumen investasi terkuncimu.`;

    return res.json({
      success: true,
      advice: smartAdviceText,
      provider: 'CyberVault PhD Financial Engine'
    });
  } catch (err) {
    console.error('Error generating AI advice:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghasilkan saran AI.' });
  }
});

/**
 * GET /api/finance/advisory
 */
router.get('/advisory', async (req, res) => {
  try {
    const userId = req.user.id;
    const assetsRes = await pool.query('SELECT * FROM financial_assets WHERE user_id = $1', [userId]);

    let totalLiquid = 0;
    let totalLocked = 0;
    let totalPiutang = 0;
    assetsRes.rows.forEach(a => {
      const amt = parseFloat(a.amount) || 0;
      if (a.category_type === 'LIQUID') totalLiquid += amt;
      else if (a.category_type === 'LOCKED') totalLocked += amt;
      else if (a.category_type === 'PHYSICAL_RECEIVABLE' && a.name.toLowerCase().includes('piutang')) totalPiutang += amt;
    });

    const netWorth = totalLiquid + totalLocked;
    const advisories = [];
    let healthScore = 100;

    if (assetsRes.rows.length === 0) {
      advisories.push({
        id: 1,
        type: 'GETTING_STARTED',
        title: '🚀 Mulai Catat Pos Aset Kamu',
        impact: 'MEDIUM',
        summary: 'Belum ada pos aset tercatat di akun ini.',
        recommendation: 'Tambahkan pos aset likuid, investasi terkunci, dan aset fisik agar sistem bisa menghitung net worth dan memberi rekomendasi yang akurat.',
        badge: 'Langkah Awal'
      });
      healthScore = 60;
    } else {
      if (totalPiutang > 0) {
        advisories.push({
          id: advisories.length + 1,
          type: 'DANGER_ALERT',
          title: `⚠️ Perhatikan Risiko Piutang (Rp ${totalPiutang.toLocaleString('id-ID')})`,
          impact: 'HIGH',
          summary: 'Sebagian kekayaanmu terikat pada piutang tanpa jadwal pelunasan yang pasti.',
          recommendation: 'Sepakati batas nominal & jadwal pelunasan agar piutang tidak terus menggerus cashflow operasional dan investasi pribadi.',
          badge: 'Prioritas'
        });
        healthScore -= 15;
      }

      if (totalLocked > 0) {
        advisories.push({
          id: advisories.length + 1,
          type: 'EMERGENCY_FUND',
          title: `🔒 Dana Darurat & Investasi Terkunci (Rp ${totalLocked.toLocaleString('id-ID')})`,
          impact: 'MEDIUM',
          summary: 'Kamu memiliki dana yang dialokasikan sebagai dana darurat/investasi jangka panjang.',
          recommendation: "Pertahankan prinsip 'jangan disentuh untuk kebutuhan harian' agar dana ini tetap efektif sebagai bantalan risiko.",
          badge: 'Proteksi Liquidity'
        });
      }

      if (totalLiquid < totalLocked * 0.2) {
        advisories.push({
          id: advisories.length + 1,
          type: 'DAILY_BUDGET',
          title: '💵 Likuiditas Operasional Menipis',
          impact: 'MEDIUM',
          summary: `Saldo likuid (Rp ${totalLiquid.toLocaleString('id-ID')}) relatif kecil dibanding dana terkunci.`,
          recommendation: 'Jaga jatah harian ketat sampai siklus pemasukan berikutnya agar tidak perlu menarik dana terkunci.',
          badge: 'Disiplin Operasional'
        });
        healthScore -= 10;
      }

      advisories.push({
        id: advisories.length + 1,
        type: 'INVESTMENT_STRATEGY',
        title: '📈 Pertimbangkan Dollar-Cost Averaging (DCA)',
        impact: 'LOW',
        summary: `Net worth saat ini Rp ${netWorth.toLocaleString('id-ID')}.`,
        recommendation: 'Alokasikan investasi secara berkala (DCA) untuk menurunkan volatilitas emosional dan memaksimalkan hasil compounding jangka panjang.',
        badge: 'Investasi Terjadwal'
      });
    }

    if (healthScore < 20) healthScore = 20;

    const advisory = {
      overallHealthScore: healthScore,
      healthStatus: healthScore >= 80 ? 'Sehat & Disiplin' : healthScore >= 50 ? 'Cukup Sehat, Perlu Perhatian' : 'Berisiko, Perlu Tindakan',
      advisories
    };

    return res.json({ success: true, advisory });
  } catch (err) {
    console.error('Error fetching advisory:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil saran keuangan.' });
  }
});

/**
 * GET /api/finance/journal
 */
router.get('/journal', async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM financial_entries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.json({ success: true, entries: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * POST /api/finance/journal
 */
router.post('/journal', async (req, res) => {
  try {
    const userId = req.user.id;
    const { entryDate, title, type = 'NOTE', amount = 0, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul catatan jurnal wajib diisi.' });
    }

    const result = await pool.query(
      `INSERT INTO financial_entries (user_id, entry_date, title, type, amount, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, entryDate || new Date().toISOString().split('T')[0], title, type, amount, description]
    );

    return res.status(201).json({ success: true, message: 'Catatan jurnal berhasil ditambahkan!', entry: result.rows[0] });
  } catch (err) {
    console.error('Create journal entry error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambah catatan jurnal.' });
  }
});

module.exports = router;
