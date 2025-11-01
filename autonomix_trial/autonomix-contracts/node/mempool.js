let mempool = [];

function addTransaction(tx) {
  mempool.push(tx);
  console.log('Transaction added to mempool:', tx);
}

function getTransactions(maxCount = 10) {
  return mempool.splice(0, maxCount); // returns & removes
}

module.exports = { addTransaction, getTransactions };
