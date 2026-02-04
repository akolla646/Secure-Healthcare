const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log('Public Key:');
console.log(publicKey);
console.log('\nPrivate Key (for .env):');
// Replace newlines with \n for single-line .env storage
console.log(privateKey.replace(/\n/g, '\\n'));
