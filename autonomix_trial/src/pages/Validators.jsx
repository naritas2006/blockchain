import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";

import DPoSABI from "../contracts/AutonomixDPoS.json";
import AUTOXTokenABI from "../contracts/AUTOXToken.json";
import contractAddress from "../contracts/contractAddress.json";

export default function Validators() {
  const [validators, setValidators] = useState([]);
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [dataSubmissions, setDataSubmissions] = useState([]); // New state for data submissions
  const [stakeAmount, setStakeAmount] = useState(""); // New state for stake amount
  const [approvedAmount, setApprovedAmount] = useState(""); // New state for approved amount
  const [autoxTokenContractInstance, setAutoxTokenContractInstance] = useState(null); // New state for autoxTokenContractInstance
  const [loadingValidators, setLoadingValidators] = useState(false); // New state for loading validators

  const { signer, provider, contracts, connectWallet, wallet } = useWallet();

  const autoxTokenAddress = contractAddress.AUTOXToken;

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" },
  };

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

      setLoadingValidators(true);
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
      setLoadingValidators(false);
    }
  }, [signer, contracts?.dpos]);

  const handleAddTestValidator = async () => {
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

  const handleApproveTokens = async () => {
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

  // --- REPLACE LOCAL VERIFICATION WITH ON-CHAIN EVENTS ---
  // Listen for on-chain verifications and fetch past events for status
  const loadDataSubmissions = useCallback(async () => {
    if (!contracts?.dataShare || !contracts?.dpos) {
      console.log("DataShare or DPoS contract not available.");
      return;
    }
    try {
      // Query all data blocks
      const allData = await contracts.dataShare.getAllData();
      // Query all DataVerified events
      const dataVerifiedEvents = await contracts.dpos.queryFilter(contracts.dpos.filters.DataVerified());
      // Map: dataHash => { txHash, blockNumber, timestamp }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dataHashToVerification = {};
      for (const ev of dataVerifiedEvents) {
        if (ev.args && ev.args.dataHash && ev.args.success) {
          const block = await provider.getBlock(ev.blockNumber);
          dataHashToVerification[ev.args.dataHash] = {
            txHash: ev.transactionHash,
            blockNumber: ev.blockNumber,
            timestamp: block.timestamp * 1000,
          };
        }
      }

      // Normalize allSubmissions array for grid
      const allSubmissions = allData.map((submission) => {
        const timestamp = submission[3];
        const dataHash = submission[2];
        const verification = dataHashToVerification[dataHash];
        return {
          ...submission,
          timestamp: timestamp ? new Date(Number(timestamp) * 1000) : undefined,
          verified: !!verification,
          verificationTimestamp: verification ? verification.timestamp : undefined,
          verificationTx: verification ? verification.txHash : undefined,
          dataHash: dataHash,
        };
      });

      // Sort so verified submissions are on top
      const sortedSubmissions = allSubmissions.sort((a, b) => {
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        if (a.verified && b.verified) {
          return new Date(a.verificationTimestamp) - new Date(b.verificationTimestamp);
        }
        return new Date(a.timestamp) - new Date(b.timestamp);
      });

      setDataSubmissions(sortedSubmissions);
    } catch (err) {
      console.error("Error loading data submissions:", err);
    }
  }, [contracts?.dataShare, contracts?.dpos]);

  // Listen for new DataVerified events in real time
  useEffect(() => {
    if (!contracts?.dpos) return;
    const contract = contracts.dpos;
    const onDataVerified = async (dataHash, success, event) => {
      if (!success) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const block = await provider.getBlock(event.blockNumber);
      setDataSubmissions((prev) => prev.map((s) =>
        s.dataHash === dataHash
          ? { ...s, verified: true, verificationTimestamp: block.timestamp * 1000, verificationTx: event.transactionHash }
          : s
      ));
    };
    contract.on('DataVerified', onDataVerified);
    return () => contract.off('DataVerified', onDataVerified);
  }, [contracts?.dpos]);

  // Remove localStorage from handleVerifyData:
  const handleVerifyData = async (dataHash, valid) => {
    try {
      setLoading(true);
      setMessage("Verifying on chain...");
      
      // Try to verify first
      try {
        const tx = await contracts.dpos.verifyData(dataHash, valid);
        await tx.wait(); // Will trigger onDataVerified via event
        setMessage(`✅ Data with hash ${dataHash} verified successfully!`);
        // UI will update via events
      } catch (verifyError) {
        // If verification fails with "Data not found", submit the data first
        if (verifyError.message && verifyError.message.includes("Data not found") || 
            verifyError.reason && verifyError.reason.includes("Data not found")) {
          console.log("Data not found in DPoS, submitting first...");
          setMessage("Submitting data to DPoS first...");
          try {
            const submitTx = await contracts.dpos.submitData(dataHash);
            await submitTx.wait();
            setMessage("Data submitted, now verifying...");
            
            // Retry verification after submission
            const tx = await contracts.dpos.verifyData(dataHash, valid);
            await tx.wait();
            setMessage(`✅ Data with hash ${dataHash} verified successfully!`);
          } catch (submitError) {
            console.error("Error submitting data:", submitError);
            throw submitError;
          }
        } else {
          // If it's a different error, throw it
          throw verifyError;
        }
      }
    } catch (error) {
      console.error("Error verifying data on-chain:", error);
      setMessage(`Error verifying data on-chain: ${error.message || error.reason || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contracts) {
      loadValidators();
      loadDataSubmissions(); // Load data submissions when contracts are available
    }
  }, [contracts, loadValidators, loadDataSubmissions]);

  return (
    <div className="min-h-screen bg-soft-gradient text-violet font-sans px-6 py-12">
      <h1 className="text-4xl font-bold text-center text-blush font-heading mb-10">
        🛡️ Validators Dashboard
      </h1>

      {/* Connect Wallet Section */}
      {!wallet ? (
        <div className="text-center mt-10">
          <p className="text-blush mb-4">🔗 Please connect your wallet to manage validators.</p>
          <button
            onClick={connectWallet}
            className="px-6 py-2 bg-blush text-white rounded-lg hover:brightness-110 transition"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Validator Actions */}
          <div className="bg-white bg-opacity-70 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-blush mb-4">Validator Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={handleAddTestValidator}
                className="px-6 py-3 bg-violet text-white rounded-lg hover:brightness-110 transition font-semibold"
              >
                ➕ Add Test Validator
              </button>
              <button
                onClick={handleStake}
                className="px-6 py-3 bg-blush text-white rounded-lg hover:brightness-110 transition font-semibold"
              >
                💰 Stake Tokens
              </button>
              <button
                onClick={handleApproveTokens}
                className="px-6 py-3 bg-thistle text-white rounded-lg hover:brightness-110 transition font-semibold"
              >
                ✅ Approve Tokens
              </button>
              <button
                onClick={handleElectValidators}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:brightness-110 transition font-semibold"
              >
                👑 Elect Validators
              </button>
              <button
                onClick={handleDistributeRewards}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:brightness-110 transition font-semibold"
              >
                🎁 Distribute Rewards
              </button>
            </div>
          </div>

          {/* Current Validators */}
          <div className="bg-white bg-opacity-70 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-blush mb-4">Current Validators</h2>
            {loadingValidators ? (
              <p className="text-center text-violet">Loading validators...</p>
            ) : (validators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {validators.map((validator, index) => (
                  <div key={index} className="bg-light-violet p-4 rounded-lg shadow-md">
                    <p className="font-semibold">Address: {validator.address}</p>
                    <p>Stake: {validator.stake} AUTOX</p>
                    <p>Is Elected: {validator.isElected ? '✅ Yes' : '❌ No'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-violet">No validators found.</p>
            ))}
          </div>

          {/* Data Submissions for Verification */}
          <div className="bg-white bg-opacity-70 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-2xl font-semibold text-blush mb-4">Data Submissions for Verification</h2>
            {loading ? (
              <p className="text-center text-violet">Loading data submissions...</p>
            ) : (dataSubmissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataSubmissions.map((submission, index) => (
                  <div key={index} className="bg-light-violet p-4 rounded-lg shadow-md">
                    <p className="font-semibold">Event Type: {submission.eventType}</p>
                    <p>Vehicle ID: {submission.vehicleId}</p>
                    <p>Car Address: {submission.carAddress}</p>
                    <p>Timestamp: {submission.timestamp.toLocaleString()}</p>
                    <p>Data Hash: {submission.dataHash}</p>
                    <p>IPFS Hash: {submission.ipfsHash}</p>
                    <p>Verified: {submission.verified ? '✅ Yes' : '❌ No'}</p>
                    {submission.verified && submission.verificationTimestamp && (
                      <p>Verification Time: {new Date(submission.verificationTimestamp).toLocaleString()}</p>
                    )}
                    {submission.verified && submission.verificationTx && (
                      <p>
                        Tx: <a href={`https://sepolia.etherscan.io/tx/${submission.verificationTx}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{submission.verificationTx.slice(0,10)}...</a>
                      </p>
                    )}
                    {!submission.verified && (
                      <div className="mt-4 space-x-2">
                        <button
                          onClick={() => handleVerifyData(submission.dataHash, true)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:brightness-110 transition"
                        >
                          Verify (True)
                        </button>
                        <button
                          onClick={() => handleVerifyData(submission.dataHash, false)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:brightness-110 transition"
                        >
                          Verify (False)
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-violet">No data submissions to verify.</p>
            ))}
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-center ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              {message}
            </div>
          )}
        </>
      )}
    </div>
  );
}