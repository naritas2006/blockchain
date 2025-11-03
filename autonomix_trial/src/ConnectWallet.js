import { ethers } from "ethers";
import AutonomixDPoSABI from "./contracts/AutonomixDPoS.json";

// Sepolia Testnet
const SEPOLIA_CHAIN_ID = "0xAA36A7"; // 11155111 in hex
const AUTONOMIX_DPOS_CONTRACT_ADDRESS = "0xAf37Db6F64C2E663149771b8EcFE00cCeE17a01B";

export async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      // 🔹 Ensure MetaMask is on Sepolia testnet
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      }).catch(async (switchError) => {
        // If the chain hasn’t been added yet, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: SEPOLIA_CHAIN_ID,
                chainName: "Sepolia Testnet",
                rpcUrls: ["https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID"], // Replace with your Infura Project ID
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
              },
            ],
          });
        }
      });

      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Provider
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Contract instance
      const dposContract = new ethers.Contract(AUTONOMIX_DPOS_CONTRACT_ADDRESS, AutonomixDPoSABI.abi, signer);

      console.log("✅ Connected account:", await signer.getAddress());
      console.log("✅ Connected to AutonomixDPoS contract at:", AUTONOMIX_DPOS_CONTRACT_ADDRESS);

      return { provider, signer, dposContract };
    } catch (error) {
      console.error("❌ Connection failed:", error);
    }
  } else {
    alert("MetaMask not found! Please install MetaMask extension.");
  }
}
