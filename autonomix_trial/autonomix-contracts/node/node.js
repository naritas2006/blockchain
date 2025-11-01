const { addTransaction, getTransactions } = require('./mempool');
const { addBlock } = require('./ledger');
const { selectValidator } = require('./validators');

// Simulate incoming transaction from frontend
const express = require('express');
const app = express();
app.use(express.json());

app.post('/submit-tx', (req, res) => {
  const tx = req.body;
  addTransaction(tx);
  res.json({ status: 'Transaction received', tx });
});

// Block forging loop
function forgeBlock() {
  const validator = selectValidator();
  const txs = getTransactions();
  if (txs.length === 0) return;

  const block = {
    validator,
    txs,
    timestamp: Date.now()
  };

  addBlock(block);
}

setInterval(forgeBlock, 5000); // forge a block every 5s

app.listen(4000, () => {
  console.log('Local DPoS node running on http://localhost:4000');
});
