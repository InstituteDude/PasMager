const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const LEGACY_ALGORITHM = 'aes-256-cbc';
// Server-side pepper: must stay only in the environment, never stored in the
// database or returned to any client (a previous version leaked this value
// into a seeded vault note, which defeated the encryption entirely).
const SERVER_PEPPER = process.env.ENCRYPTION_MASTER_SALT || 'default_secure_vault_pepper_change_me';
const PBKDF2_ITERATIONS = 100000;
const LEGACY_PBKDF2_ITERATIONS = 10000;

// Derives the per-item key from the user's own random, unpredictable
// encryption_salt (stored in the users table) plus the server pepper.
// This replaces the old scheme where the key depended only on the user's
// sequential numeric id, which any authenticated user could guess/enumerate.
function getKey(userId, userSalt) {
  return crypto.pbkdf2Sync(`${userId}:${userSalt}`, SERVER_PEPPER, PBKDF2_ITERATIONS, 32, 'sha256');
}

function getLegacyKey(userSecret) {
  return crypto.pbkdf2Sync(userSecret || 'vault_default_pass', SERVER_PEPPER, LEGACY_PBKDF2_ITERATIONS, 32, 'sha256');
}

/**
 * Encrypt any object or string using AES-256-GCM (authenticated encryption).
 * userSalt must be the caller's unique, random per-user encryption_salt.
 */
function encrypt(data, userId, userSalt) {
  try {
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const iv = crypto.randomBytes(16);
    const key = getKey(userId, userSalt);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `v2:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption error:', err);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt string back to original object/string.
 * Understands the new v2 (AES-256-GCM, per-user salt) format and falls back
 * to the legacy (AES-256-CBC, key derived from bare userId) format so
 * existing rows keep working until they are rewritten.
 */
function decrypt(encryptedText, userId, userSalt) {
  try {
    if (!encryptedText) return encryptedText;

    if (encryptedText.startsWith('v2:')) {
      const [, ivHex, authTagHex, encryptedHex] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = getKey(userId, userSalt);
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    }

    if (encryptedText.includes(':')) {
      const [ivHex, encryptedHex] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const key = getLegacyKey(String(userId));
      const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, key, iv);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    }

    return encryptedText;
  } catch (err) {
    console.error('Decryption error:', err);
    return null;
  }
}

const isLegacyFormat = (encryptedText) => !!encryptedText && !encryptedText.startsWith('v2:') && encryptedText.includes(':');

module.exports = {
  encrypt,
  decrypt,
  isLegacyFormat,
};
