import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";

import DPoSABI from "../contracts/AutonomixDPoS.json";
import AUTOXTokenABI from "../contracts/AUTOXToken.json";
import contractAddress from "../contracts/contractAddress.json";

const Validators = () => {
  const [validators, setValidators] = useState([]);
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stakeAmount, setStakeAmount] = useState(""); // New state for stake amount
  const [approvedAmount, setApprovedAmount] = useState(""); // New state for approved amount
  const [autoxTokenContractInstance, setAutoxTokenContractInstance] = useState(null); // New state for autoxTokenContractInstance

  const { signer, provider, contracts, connectWallet } = useWallet();

  // const contractAddressDPoS = "0xACA9492685809C431995e9591364165001A59583"; // replace with your deployed AutonomixDPoS address
  const autoxTokenAddress = contractAddress.AUTOXToken;

  useEffect(() => {
    if (signer && contracts && contracts.dpos) {
      setAutoxTokenContractInstance(new ethers.Contract(autoxTokenAddress, AUTOXTokenABI, signer));
    } else {
      // If signer or dposContract is not available, try to connect wallet
      connectWallet();
    }
  }, [signer, contracts, connectWallet]);

  useEffect(() => {
    if (contracts?.dpos) {
      loadValidators();
    }
  }, [contracts?.dpos]);

  useEffect(() => {
    console.log("Debug - signer:", signer);
    console.log("Debug - autoxTokenContractInstance:", autoxTokenContractInstance);
    console.log("Debug - approvedAmount:", approvedAmount);
    console.log("Debug - contracts:", contracts);
    console.log("Debug - contracts?.dpos:", contracts?.dpos);
    console.log("Debug - Button disabled status:", !autoxTokenContractInstance || !signer || !approvedAmount);
  }, [signer, autoxTokenContractInstance, approvedAmount, contracts]);

  const loadValidators = async () => {
    try {
      if (!signer) {
        setMessage("Wallet not connected or signer not available.");
        return;
      }
      if (!contracts?.dpos) {
        setMessage("DPoS contract not available.");
        console.log("Debug - loadValidators: contracts?.dpos is null or undefined");
        return;
      }

      setLoading(true);
      const userAddr = await signer.getAddress();
      setAccount(userAddr);

      // ✅ correct function call (case sensitive)
      const validatorAddresses = await contracts.dpos.getCurrentValidators();

      console.log("Fetched validators:", validatorAddresses);
      setValidators(validatorAddresses);
      setMessage(`Fetched ${validatorAddresses.length} validators.`);
    } catch (err) {
      console.error("Error fetching validators:", err);
      setMessage("Error fetching validators (check console).");
    } finally {
      setLoading(false);
    }
  };

  const addTestValidator = async () => {
    try {
      if (!window.ethereum) {
        setMessage("MetaMask not detected");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      // const dposContract = new ethers.Contract(contractAddressDPoS, DPoSABI.abi, signer);

      // ✅ this function exists in your contract
      const tx = await contracts.dpos.addTestValidator(account);
      await tx.wait();

      setMessage("Test validator added successfully!");
      loadValidators();
    } catch (err) {
      console.error("Error adding validator:", err);
      setMessage("Error adding validator (check console).");
    }
  };

  // New function to handle staking
  const handleStake = async () => {
    try {
      if (!signer) {
        setMessage("Wallet not connected or signer not available.");
        return;
      }
      if (!contracts?.dpos) {
        setMessage("DPoS contract not available.");
        console.log("Debug - handleStake: contracts?.dpos is null or undefined");
        return;
      }
      if (!stakeAmount || isNaN(stakeAmount) || parseFloat(stakeAmount) <= 0) {
        setMessage("Please enter a valid stake amount.");
        return;
      }

      // Convert stakeAmount to Wei
      const amountInWei = ethers.parseUnits(stakeAmount, "ether");

      // Check current allowance
      const currentAllowance = await autoxTokenContractInstance.allowance(await signer.getAddress(), contracts.dpos.target);
      if (currentAllowance < amountInWei) {
        setMessage("Insufficient allowance. Please approve more tokens.");
        return;
      }

      // The stake function in AutonomixDPoS.sol takes _delegate and _amount
      // We'll use the connected account as the delegate for simplicity here.
      const tx = await contracts.dpos.stake(await signer.getAddress(), amountInWei);
      await tx.wait();

      setMessage(`Successfully staked ${stakeAmount} tokens!`);
      setStakeAmount(""); // Clear input after staking
      loadValidators(); // Refresh validator list
    } catch (err) {
      console.error("Error staking tokens:", err);
      setMessage("Error staking tokens (check console).");
    }
  };

  const handleApprove = async () => {
    if (!autoxTokenContractInstance || !signer || !approvedAmount) {
      console.error("AutoxToken contract, signer, or approved amount not available.");
      return;
    }

    try {
      const amountToApprove = ethers.parseUnits(approvedAmount, 18); // Assuming 18 decimals
      console.log("Approving DPoS contract at address:", contracts.dpos.target);
      const tx = await autoxTokenContractInstance.connect(signer).approve(contracts.dpos.target, amountToApprove);
      await tx.wait();
      console.log("Tokens approved successfully!");
      alert("Tokens approved successfully!");
    } catch (error) {
      console.error("Error approving tokens:", error);
      alert(`Error approving tokens: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-soft-gradient bg-cover text-violet font-sans p-8">
      <h2 className="text-4xl md:text-5xl font-bold text-blush font-heading mb-6">Validators Dashboard</h2>
      <p className="mb-4 text-violet text-lg">Connected Account: {account}</p>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <button
          onClick={loadValidators}
          className="px-6 py-3 bg-blush text-white rounded-2xl font-semibold hover:brightness-110 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Validators"}
        </button>

        <button
          onClick={addTestValidator}
          className="px-6 py-3 border border-blush text-blush rounded-2xl font-semibold hover:bg-blush hover:text-white transition"
        >
          Add Test Validator
        </button>
      </div>

      {/* Approve Tokens Section */}
      <div className="mt-8 max-w-5xl mx-auto bg-white bg-opacity-80 backdrop-blur-lg border border-borderLight p-6 rounded-2xl shadow-md">
        <h3 className="text-2xl font-semibold text-blush font-heading mb-4">Approve Tokens for Staking</h3>
        <p className="text-violet mb-4">
          Before staking, you need to approve the DPoS contract to spend your AUTOX tokens.
        </p>
        <input
          type="number"
          value={approvedAmount}
          onChange={(e) => setApprovedAmount(e.target.value)}
          placeholder="Amount to approve (e.g., 100)"
          className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blush"
        />
        <button
          onClick={handleApprove}
          className="px-6 py-3 bg-violet-500 text-white rounded-2xl font-semibold hover:brightness-110 transition w-full"
          disabled={!autoxTokenContractInstance || !signer || !approvedAmount}
        >
          Approve Tokens
        </button>
      </div>

      {/* New Staking Section */}
      <div className="mt-8 max-w-5xl mx-auto bg-white bg-opacity-80 backdrop-blur-lg border border-borderLight p-6 rounded-2xl shadow-md">
        <h3 className="text-2xl font-semibold text-blush font-heading mb-4">Stake Tokens</h3>
        <input
          type="number"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="Amount to stake (e.g., 100)"
          className="w-full p-3 rounded-lg border border-gray-300 bg-white text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blush"
        />
        <button
          onClick={handleStake}
          className="px-6 py-3 bg-blush text-white rounded-2xl font-semibold hover:brightness-110 transition w-full"
          disabled={!contracts?.dpos || !signer || !stakeAmount}
        >
          Stake Tokens
        </button>
      </div>

      <p className="mt-4 text-lg text-violet">{message}</p>

      <div className="mt-8 max-w-5xl mx-auto bg-white bg-opacity-80 backdrop-blur-lg border border-borderLight p-6 rounded-2xl shadow-md">
        <h3 className="text-2xl font-semibold text-blush font-heading mb-4">Current Validators</h3>
        {validators.length > 0 ? (
          <ul className="list-disc list-inside space-y-2">
            {validators.map((addr, i) => (
              <li key={i} className="text-violet text-lg">
                {addr}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-violet mt-2 text-lg">No validators found.</p>
        )}
      </div>
    </div>
  );
};

export default Validators;