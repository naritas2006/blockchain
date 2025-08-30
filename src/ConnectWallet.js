// connectWallet.js
import { ethers } from "ethers";

export async function connectWallet() {
  if (typeof window.ethereum !== "undefined") {
    try {
      // Request account access if needed
      await window.ethereum.request({ method: "eth_requestAccounts" });

      // Create provider
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Get signer (your account that signs transactions)
      const signer = await provider.getSigner();

      console.log("Connected account:", await signer.getAddress());

      return { provider, signer };
    } catch (error) {
      console.error("User rejected request:", error);
    }
  } else {
    alert("MetaMask not found! Install MetaMask extension.");
  }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      