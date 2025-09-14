const crypto = require('crypto');

// Generate RSA keypair for Token Issuer
function generateRSAKeypair() {
  return crypto.generateKeyPairSync('rsa', {
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
}

// Hash function for token hashing
function sha256Hex(data) {
  return crypto.createHash('sha256').update(data, 'hex').digest('hex');
}

// Generate random token
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  generateRSAKeypair,
  sha256Hex,
  generateRandomToken
};