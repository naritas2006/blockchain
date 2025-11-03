import React, { useState, useEffect, useCallback } from "react";
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
  const [dataSubmissions, setDataSubmissions] = useState([]); // New state for data submissions
  const [stakeAmount, setStakeAmount] = useState(""); // New state for stake amount
  const [approvedAmount, setApprovedAmount] = useState(""); // New state for approved amount
  const [autoxTokenContractInstance, setAutoxTokenContractInstance] = useState(null); // New state for autoxTokenContractInstance

  const { signer, provider, contracts, connectWallet } = useWallet();

  const autoxTokenAddress = contractAddress.AUTOXToken;

  useEffect(() => {
    if (signer && contracts && contracts.dpos) {
      setAutoxTokenContractInstance(new ethers.Contract(autoxTokenAddress, AUTOXTokenABI, signer));
    } else {
      connectWallet();
    }
  }, [signer, contracts, connectWallet]);

  const loadValidators = useCallback(async () => {
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
  }, [signer, contracts?.dpos]);

  const addTestValidator = async () => {
    try {
      if (!window.ethereum) {
        setMessage("MetaMask not detected");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

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

  const handleElectValidators = async () => {
    try {
      if (!contracts?.dpos) {
        setMessage("DPoS contract not available.");
        return;
      }
      setLoading(true);
      setMessage("Electing validators...");

      const tx = await contracts.dpos.electValidators();
      await tx.wait();

      setMessage("Validators elected successfully!");
      loadValidators(); // Refresh the list after election
    } catch (err) {
      console.error("Error electing validators:", err);
      setMessage("Error electing validators (check console).");
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeRewards = async () => {
    try {
      if (!contracts?.dpos) {
        setMessage("DPoS contract not available.");
        return;
      }
      setLoading(true);
      setMessage("Distributing rewards...");

      const tx = await contracts.dpos.distributeRewards();
      await tx.wait();

      setMessage("Rewards distributed successfully!");
      // Optionally refresh validator data or balances here if needed
    } catch (err) {
      console.error("Error distributing rewards:", err);
      setMessage("Error distributing rewards (check console).");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyData = async (dataHash, valid) => {
    try {
      if (!contracts?.dpos) {
        setMessage("DPoS contract not available.");
        return;
      }
      setLoading(true);
      setMessage("Verifying data...");

      const tx = await contracts.dpos.verifyData(dataHash, valid);
      await tx.wait();

      setMessage(`Data verified successfully! Hash: ${dataHash}, Valid: ${valid}`);
      loadDataSubmissions(); // Refresh data submissions after verification
    } catch (err) {
      console.error("Error verifying data:", err);
      setMessage("Error verifying data (check console).");
    } finally {
      setLoading(false);
    }
  };

  // New function to load data submissions
  const loadDataSubmissions = useCallback(async () => {
    if (!contracts?.dataShare) {
      console.log("DataShare contract not available.");
      return;
    }
    try {
      const allData = await contracts.dataShare.getAllData();
      const unverifiedData = allData.filter(data => !data.verified);
      setDataSubmissions(unverifiedData);
    } catch (err) {
      console.error("Error loading data submissions:", err);
    }
  }, [contracts?.dataShare]);

  useEffect(() => {
    if (contracts) {
      loadValidators();
      loadDataSubmissions(); // Load data submissions when contracts are available
    }
  }, [contracts, loadValidators, loadDataSubmissions]);

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

        <button
          onClick={handleElectValidators}
          className="px-6 py-3 bg-green-500 text-white rounded-2xl font-semibold hover:brightness-110 transition"
          disabled={loading}
        >
          Elect Validators
        </button>

        <button
          onClick={handleDistributeRewards}
          className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-semibold hover:brightness-110 transition"
          disabled={loading}
        >
          Distribute Rewards
        </button>
      </div>

      {/* Unverified Data Submissions Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Unverified Data Submissions</h2>
        {dataSubmissions.length === 0 ? (
          <p>No unverified data submissions found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSubmissions.map((data, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-md">
                <p className="font-semibold">Car Address: {data.carAddress}</p>
                <p>Metadata: {data.metadata}</p>
                <p className="break-all">Data Hash: {data.dataHash}</p>
                <p>Timestamp: {new Date(Number(data.timestamp) * 1000).toLocaleString()}</p>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleVerifyData(data.dataHash, true)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:brightness-110 transition"
                    disabled={loading}
                  >
                    Verify (True)
                  </button>
                  <button
                    onClick={() => handleVerifyData(data.dataHash, false)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:brightness-110 transition"
                    disabled={loading}
                  >
                    Verify (False)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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