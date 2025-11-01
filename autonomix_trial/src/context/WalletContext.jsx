import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import AutonomixABI from '../contracts/AutonomixDataShare.json';
import contractAddress from '../contracts/contractAddress.json';
import DPOS from '../contracts/AutonomixDPoS.json';

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(null);
  const [contracts, setContracts] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111 in hex

  // --- Switch to Sepolia Network ---
  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        // Add Sepolia if not found
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: 'Sepolia Test Network',
              nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia.infura.io/v3/'], // replace with your Infura/Alchemy URL
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            },
          ],
        });
      } else {
        console.error('Failed to switch network:', switchError);
      }
    }
  }, []);

  // --- Connect Wallet ---
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not found! Install MetaMask extension.');
      return;
    }

    try {
      await switchToSepolia(); // ensure Sepolia network

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _wallet = accounts[0];

      // ✅ Initialize both contracts
      const dataShareContract = new ethers.Contract(
        contractAddress.AutonomixDataShare,
        AutonomixABI.abi,
        _signer
      );

      const dposContract = new ethers.Contract(
        contractAddress.AutonomixDPoS,
        DPOS,
        _signer
      );

      setProvider(_provider);
      setSigner(_signer);
      setWallet(_wallet);
      setContracts({ dataShare: dataShareContract, dpos: dposContract });

      console.log('✅ Connected account:', _wallet);
    } catch (error) {
      console.error('User rejected request or error:', error);
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      }
    }
  }, [switchToSepolia]);

  // --- Disconnect Wallet ---
  const disconnectWallet = useCallback(async () => {
    setWallet(null);
    setContracts(null);
    setSigner(null);
    setProvider(null);
    if (window.ethereum?.request) {
      try {
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (err) {
        console.error('Failed to reset MetaMask connection:', err);
      }
    }
  }, []);

  // --- Detect Account or Network Change ---
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = (chainId) => {
        if (chainId !== SEPOLIA_CHAIN_ID) {
          console.warn('⚠️ Wrong network detected. Switching to Sepolia...');
          switchToSepolia();
        }
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [connectWallet, disconnectWallet, switchToSepolia]);

  // --- Provide Context ---
  return (
    <WalletContext.Provider
      value={{
        wallet,
        provider,
        signer,
        contracts,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// --- Custom Hook for Easy Access ---
export function useWallet() {
  return useContext(WalletContext);
}
