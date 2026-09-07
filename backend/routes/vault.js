const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');
const { encrypt, decrypt, isLegacyFormat } = require('../utils/crypto');

// Apply JWT Auth Middleware to all vault endpoints
router.use(authenticateToken);

// Fetches the user's encryption salt, self-healing by atomically assigning
// one if it's somehow still missing (e.g. an account created before this
// column existed, ahead of the startup backfill in config/db.js).
async function getUserSalt(userId) {
  const result = await pool.query('SELECT encryption_salt FROM users WHERE id = $1', [userId]);
  let salt = result.rows[0]?.encryption_salt;
  if (!salt) {
    const candidate = crypto.randomBytes(16).toString('hex');
    const assigned = await pool.query(
      'UPDATE users SET encryption_salt = $1 WHERE id = $2 AND encryption_salt IS NULL RETURNING encryption_salt',
      [candidate, userId]
    );
    salt = assigned.rows[0]?.encryption_salt;
    if (!salt) {
      // Lost the race to another concurrent request; read back the value it wrote.
      const refetch = await pool.query('SELECT encryption_salt FROM users WHERE id = $1', [userId]);
      salt = refetch.rows[0]?.encryption_salt;
    }
  }
  return salt;
}

/**
 * GET /api/vault
 * Fetch all items belonging to logged-in user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userSalt = await getUserSalt(userId);

    const result = await pool.query(
      'SELECT id, user_id, type, title, username, website_url, encrypted_data, category, is_favorite, created_at, updated_at FROM vault_items WHERE user_id = $1 ORDER BY updated_at DESC',
      [userId]
    );

    const items = await Promise.all(result.rows.map(async item => {
      let decryptedData = {};
      try {
        decryptedData = decrypt(item.encrypted_data, userId, userSalt);

        // Opportunistically upgrade rows still on the legacy CBC/userId-derived scheme
        if (isLegacyFormat(item.encrypted_data) && decryptedData) {
          const upgraded = encrypt(decryptedData, userId, userSalt);
          await pool.query('UPDATE vault_items SET encrypted_data = $1 WHERE id = $2', [upgraded, item.id]);
        }
      } catch (err) {
        console.error('Decryption failed for item', item.id);
      }

      return {
        id: item.id,
        type: item.type,
        title: item.title,
        username: item.username,
        websiteUrl: item.website_url,
        category: item.category,
        isFavorite: item.is_favorite,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        details: decryptedData || {}
      };
    }));

    return res.json({ success: true, items });
  } catch (err) {
    console.error('Fetch vault items error:', err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data vault.' });
  }
});

/**
 * POST /api/vault
 * Add a new item to the vault
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'PASSWORD', title, username, websiteUrl, category = 'Personal', details = {}, isFavorite = false } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul item wajib diisi.' });
    }

    // Encrypt sensitive details object
    const userSalt = await getUserSalt(userId);
    const encryptedData = encrypt(details, userId, userSalt);

    const result = await pool.query(
      `INSERT INTO vault_items (user_id, type, title, username, website_url, encrypted_data, category, is_favorite) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, type, title, username, website_url, category, is_favorite, created_at, updated_at`,
      [userId, type.toUpperCase(), title, username || null, websiteUrl || null, encryptedData, category, isFavorite]
    );

    const newItem = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Item berhasil disimpan ke Vault!',
      item: {
        id: newItem.id,
        type: newItem.type,
        title: newItem.title,
        username: newItem.username,
        websiteUrl: newItem.website_url,
        category: newItem.category,
        isFavorite: newItem.is_favorite,
        createdAt: newItem.created_at,
        updatedAt: newItem.updated_at,
        details: details
      }
    });
  } catch (err) {
    console.error('Create vault item error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menambahkan item ke vault.' });
  }
});

/**
 * PUT /api/vault/:id
 * Update an existing vault item
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { type, title, username, websiteUrl, category, details, isFavorite } = req.body;

    // Check ownership
    const check = await pool.query('SELECT * FROM vault_items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (check.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item tidak ditemukan atau akses ditolak.' });
    }

    const currentItem = check.rows[0];
    const updatedType = type ? type.toUpperCase() : currentItem.type;
    const updatedTitle = title || currentItem.title;
    const updatedUsername = username !== undefined ? username : currentItem.username;
    const updatedWebsiteUrl = websiteUrl !== undefined ? websiteUrl : currentItem.website_url;
    const updatedCategory = category || currentItem.category;
    const updatedFavorite = isFavorite !== undefined ? isFavorite : currentItem.is_favorite;

    const userSalt = await getUserSalt(userId);
    let updatedEncryptedData = currentItem.encrypted_data;
    if (details) {
      // Re-encrypt updated details
      updatedEncryptedData = encrypt(details, userId, userSalt);
    }

    const result = await pool.query(
      `UPDATE vault_items 
       SET type = $1, title = $2, username = $3, website_url = $4, encrypted_data = $5, category = $6, is_favorite = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9
       RETURNING id, type, title, username, website_url, category, is_favorite, created_at, updated_at`,
      [updatedType, updatedTitle, updatedUsername, updatedWebsiteUrl, updatedEncryptedData, updatedCategory, updatedFavorite, itemId, userId]
    );

    const updated = result.rows[0];
    const decryptedData = details ? details : decrypt(updatedEncryptedData, userId, userSalt);

    return res.json({
      success: true,
      message: 'Item vault berhasil diperbarui!',
      item: {
        id: updated.id,
        type: updated.type,
        title: updated.title,
        username: updated.username,
        websiteUrl: updated.website_url,
        category: updated.category,
        isFavorite: updated.is_favorite,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        details: decryptedData
      }
    });
  } catch (err) {
    console.error('Update vault item error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui item vault.' });
  }
});

/**
 * DELETE /api/vault/:id
 * Delete a vault item
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const result = await pool.query('DELETE FROM vault_items WHERE id = $1 AND user_id = $2 RETURNING id', [itemId, userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Item tidak ditemukan atau akses ditolak.' });
    }

    return res.json({ success: true, message: 'Item berhasil dihapus dari vault.' });
  } catch (err) {
    console.error('Delete vault item error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menghapus item.' });
  }
});

/**
 * GET /api/vault/audit
 * Health and Security Audit Analysis
 */
router.get('/audit/health', async (req, res) => {
  try {
    const userId = req.user.id;
    const userSalt = await getUserSalt(userId);

    const result = await pool.query('SELECT * FROM vault_items WHERE user_id = $1', [userId]);

    let totalItems = result.rows.length;
    let passwordItems = 0;
    let bankItems = 0;
    let weakPasswords = 0;
    let reusedPasswords = 0;
    const passwordMap = {};

    result.rows.forEach(item => {
      if (item.type === 'BANK_ACCOUNT' || item.type === 'CARD') {
        bankItems++;
      }
      if (item.type === 'PASSWORD') {
        passwordItems++;
        const decrypted = decrypt(item.encrypted_data, userId, userSalt) || {};
        const pass = decrypted.password || '';
        
        if (pass) {
          if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass)) {
            weakPasswords++;
          }
          passwordMap[pass] = (passwordMap[pass] || 0) + 1;
        }
      }
    });

    Object.values(passwordMap).forEach(count => {
      if (count > 1) {
        reusedPasswords += (count - 1);
      }
    });

    let healthScore = 100;
    if (passwordItems > 0) {
      healthScore -= (weakPasswords * 15);
      healthScore -= (reusedPasswords * 10);
      if (healthScore < 20) healthScore = 20;
    }

    return res.json({
      success: true,
      audit: {
        totalItems,
        passwordItems,
        bankItems,
        weakPasswords,
        reusedPasswords,
        healthScore
      }
    });
  } catch (err) {
    console.error('Security audit error:', err);
    return res.status(500).json({ success: false, message: 'Gagal menganalisis audit keamanan.' });
  }
});

module.exports = router;
