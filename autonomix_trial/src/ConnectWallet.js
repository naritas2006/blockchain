import { ethers } from "ethers";
import AutonomixDataShareABI from "../../autonomix-contracts/artifacts/contracts/AutonomixDataShare.sol/AutonomixDataShare.json";

// Local Hardhat network
const HARDHAT_CHAIN_ID = "0x7A69"; // 31337 in hex
const CONTRACT_ADDRESS = "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097";

export async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      // 🔹 Ensure MetaMask is on Hardhat local network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_CHAIN_ID }],
      }).catch(async (switchError) => {
        // If the chain hasn’t been added yet, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: HARDHAT_CHAIN_ID,
                chainName: "Hardhat Local",
                rpcUrls: ["http://127.0.0.1:8545"],
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
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AutonomixDataShareABI.abi, signer);

      console.log("✅ Connected account:", await signer.getAddress());
      console.log("✅ Connected to contract at:", CONTRACT_ADDRESS);

      return { provider, signer, contract };
    } catch (error) {
      console.error("❌ Connection failed:", error);
    }
  } else {
    alert("MetaMask not found! Please install MetaMask extension.");
  }
}
