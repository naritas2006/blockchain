const fs = require('fs');
const path = require('path');

let blocks = [];
let balances = require('./accounts.json');

function addBlock(block) {
  blocks.push(block);

  // Update balances
  block.txs.forEach(tx => {
    if (!balances[tx.from] || balances[tx.from].balance < tx.amount) {
      console.log('Insufficient balance for tx:', tx);
      return;
    }
    balances[tx.from].balance -= tx.amount;
    if (!balances[tx.to]) balances[tx.to] = { balance: 0 };
    balances[tx.to].balance += tx.amount;
  });

  console.log('Block added:', block);
}

function getBalance(address) {
  return balances[address]?.balance || 0;
}

module.exports = { addBlock, getBalance, blocks, balances };
