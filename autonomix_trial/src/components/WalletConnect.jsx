import React, { useState, useEffect } from 'react';

export default function WalletConnect() {
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
        }
      });
    }
  }, []);

  const connect = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWallet(accounts[0]);
    } else {
      alert('Install MetaMask first');
    }
  };

  return (
    <div className="text-center my-4">
      {wallet ? (
        <p className="text-green-500 font-medium">Connected: {wallet.slice(0, 6)}...{wallet.slice(-4)}</p>
      ) : (
        <button onClick={connect} className="px-6 py-2 bg-blush text-white rounded-lg">
          🔌 Connect Wallet
        </button>
      )}
    </div>
  );
}
