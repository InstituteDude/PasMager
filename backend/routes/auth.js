const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register Master Password
 */
router.post('/register', async (req, res) => {
  try {
    const { email, masterPassword } = req.body;

    if (!email || !masterPassword) {
      return res.status(400).json({ success: false, message: 'Email dan Master Password wajib diisi.' });
    }

    if (masterPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Master Password minimal 6 karakter.' });
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar. Silakan login.' });
    }

    // Hash Master Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(masterPassword, salt);

    // Unique, unpredictable salt used to derive this user's vault encryption key
    const encryptionSalt = crypto.randomBytes(16).toString('hex');

    // Insert into DB
    const result = await pool.query(
      'INSERT INTO users (email, master_password_hash, encryption_salt) VALUES ($1, $2, $3) RETURNING id, email, created_at',
      [email.toLowerCase().trim(), passwordHash, encryptionSalt]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Registrasi Vault berhasil!',
      token,
      user: { id: newUser.id, email: newUser.email }
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat registrasi.' });
  }
});

/**
 * POST /api/auth/login
 * Login with Master Password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, masterPassword } = req.body;

    if (!email || !masterPassword) {
      return res.status(400).json({ success: false, message: 'Email dan Master Password wajib diisi.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau Master Password salah.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(masterPassword, user.master_password_hash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau Master Password salah.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Vault unlocked!',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat login.' });
  }
});

/**
 * GET /api/auth/me
 * Get active user session info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
