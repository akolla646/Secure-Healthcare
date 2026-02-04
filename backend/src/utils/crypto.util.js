const crypto = require("crypto");

// Algorithm & key
const algorithm = "aes-256-cbc";

// 🔑 32-byte key from .env
const key = Buffer.from(process.env.PII_ENCRYPTION_KEY, "utf8");

/**
 * Encrypt plaintext (PII → encrypted)
 */
function encrypt(text) {
  if (!text) return null;

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Store as iv:ciphertext
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt encrypted text (encrypted → PII)
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;

  const parts = encryptedText.split(":");
  if (parts.length !== 2) return encryptedText; // safety

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
