/**
 * RSA Key Pair Generation Utility
 * 
 * This module provides functionality to generate RSA key pairs for digital
 * signatures. Each user (lab technician, doctor) can have their own key pair
 * for signing documents.
 * 
 * Key Specifications:
 * - Algorithm: RSA
 * - Key Size: 2048 bits (industry standard for security)
 * - Format: PKCS#1 PEM
 * 
 * The public key is stored in the database (user_public_keys table) and used
 * to verify signatures. The private key is shown once to the user and must
 * be stored securely (typically in environment variables for system keys).
 * 
 * @module utils/keypair
 */

// Node.js built-in cryptography module
const crypto = require("crypto");

/**
 * Generate RSA Key Pair
 * 
 * Creates a new 2048-bit RSA key pair in PEM format. This function is called
 * when setting up new users who need signing capabilities (lab techs, doctors).
 * 
 * @returns {Object} Key pair object containing:
 * @returns {string} returns.publicKey - The RSA public key in PEM format
 * @returns {string} returns.privateKey - The RSA private key in PEM format
 * 
 * @example
 * const { publicKey, privateKey } = generateRSAKeyPair();
 * // Store publicKey in database
 * // Return privateKey to user (shown only once)
 */
exports.generateRSAKeyPair = () => {
  return crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,            // 2048-bit key size for strong security
    publicKeyEncoding: {
      type: "pkcs1",                // PKCS#1 format for RSA keys
      format: "pem"                 // PEM format for easy storage/transport
    },
    privateKeyEncoding: {
      type: "pkcs1",                // PKCS#1 format for RSA keys
      format: "pem"                 // PEM format for easy storage/transport
    }
  });
};
