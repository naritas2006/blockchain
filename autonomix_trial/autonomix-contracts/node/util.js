const crypto = require('crypto');

function hashTransaction(tx) {
  return crypto.createHash('sha256').update(JSON.stringify(tx)).digest('hex');
}

function verifySignature(tx, signature) {
  // For now, we just simulate verification
  return tx.from && signature;
}

module.exports = { hashTransaction, verifySignature };
