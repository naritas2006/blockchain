import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AutonomixDPoS_ABI from '../contracts/AutonomixDPoS.json';
import AUTOXToken_ABI from '../contracts/AUTOXToken.json';

const DPOS_CONTRACT_ADDRESS = "0xa13C5DA69C3f2ef9bF6C78A2595fc30BEb839820"; // DPoS
const AUTOX_TOKEN_ADDRESS = "0xf4bB7BB8552fF902F846d5D89869EC13c8A0b86F"; // Token

const Validators = () => {
  const [validators, setValidators] = useState([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchValidators();
  }, []);

  const fetchValidators = async () => {
    setLoading(true);
    setError(null);
    let noDelegatesFound = false; // Declare here to make it accessible to the outer catch block
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed!");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dposContract = new ethers.Contract(DPOS_CONTRACT_ADDRESS, AutonomixDPoS_ABI, provider);

      // Check if user is connected to get their address
      let signerAddress = null;
      try {
        const signer = await provider.getSigner();
        signerAddress = await signer.getAddress();
      } catch (err) {
        console.log("User not connected or no signer available:", err);
      }

      const fetchedValidators = [];
      let i = 0;
      while (true) {
        try {
          // ... existing code ...
        } catch (error) {
          console.warn(`electedValidators(${i}) reverted:`, error.message);
          break;
        }
          let delegateAddress;
          try {
            delegateAddress = await dposContract.electedValidators(i);
            console.log(`Checking elected validator at index ${i}: ${delegateAddress}`);
          } catch (electedValidatorsError) {
            console.warn(`electedValidators(${i}) reverted:`, electedValidatorsError.message);
            console.log("Reached end of elected validators or no validators elected.");
            break; // Exit the loop if electedValidators reverts
          }

          // Skip if the address is a zero address
          if (delegateAddress === ethers.ZeroAddress) {
            console.log(`Skipping zero address at index ${i}`);
            i++;
            continue;
          }

          let totalDelegateStake = ethers.toBigInt(0);
          try {
            totalDelegateStake = await dposContract.delegateStake(delegateAddress);
          } catch (e) {
            console.warn(`delegateStake(${delegateAddress}) reverted:`, e.message);
          }

          let userDelegatorStake = ethers.toBigInt(0);
          if (signerAddress) {
            try {
              userDelegatorStake = await dposContract.getDelegatorStake(delegateAddress, signerAddress);
            } catch (e) {
              console.warn(`getDelegatorStake(${delegateAddress}, ${signerAddress}) reverted:`, e.message);
            }
          }

          if (totalDelegateStake > 0 || userDelegatorStake > 0) {
            fetchedValidators.push({
              address: delegateAddress,
              stake: ethers.formatEther(totalDelegateStake), // Total stake of the delegate
              userStake: ethers.formatEther(userDelegatorStake), // Stake of the connected user with this delegate
              votes: ethers.formatEther(totalDelegateStake), // Assuming votes are equal to total stake for now
            });
          }
          i++;
        }

        // After the loop, check if the signerAddress is an elected validator and not already added
        if (signerAddress) {
          const userAlreadyListed = fetchedValidators.some(validator => validator.address === signerAddress);
          if (!userAlreadyListed) {
            let signerTotalStake = ethers.toBigInt(0);
            try {
              signerTotalStake = await dposContract.delegateStake(signerAddress);
            } catch (e) {
              console.warn(`delegateStake(${signerAddress}) for signer itself reverted:`, e.message);
            }

            if (signerTotalStake > 0) {
              fetchedValidators.push({
                address: signerAddress,
                stake: ethers.formatEther(signerTotalStake),
                userStake: ethers.formatEther(signerTotalStake), // If signer is a validator, their userStake is their total stake
                votes: ethers.formatEther(signerTotalStake),
              });
            }
          }
        }
      console.log("Final fetched validators:", fetchedValidators);
      setValidators(fetchedValidators);

    } catch (err) {
      if (noDelegatesFound) {
        // If no delegates were found, it's an expected scenario, don't set an error
        console.log("No delegates registered, gracefully handled.");
      } else {
        console.error("Error fetching validators:", err);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed!");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const dposContract = new ethers.Contract(DPOS_CONTRACT_ADDRESS, AutonomixDPoS_ABI, signer);
      const autoxTokenContract = new ethers.Contract(AUTOX_TOKEN_ADDRESS, AUTOXToken_ABI, signer);

      const signerAddress = await signer.getAddress();

      const userBalance = await autoxTokenContract.balanceOf(signerAddress);
      console.log("User AUTOX Token Balance:", ethers.formatEther(userBalance));

      const currentAllowance = await autoxTokenContract.allowance(signerAddress, DPOS_CONTRACT_ADDRESS);
      console.log("Current Allowance for DPoS Contract:", ethers.formatEther(currentAllowance));

      const amount = ethers.parseEther(stakeAmount);

      if (userBalance < amount) {
        alert("Error: Insufficient AUTOX Token balance.");
        setLoading(false);
        return;
      }

      if (currentAllowance < amount) {
        // Approve the DPoS contract to spend AUTOXToken
        const approveTx = await autoxTokenContract.approve(DPOS_CONTRACT_ADDRESS, amount);
        await approveTx.wait();
        alert('Approval successful! Now please confirm the staking transaction.');
      }

      const stakeTx = await dposContract.stake(signer.address, amount);
      await stakeTx.wait();
      alert('Stake successful!');
      setStakeAmount('');
      fetchValidators(); // Refresh validator list
    } catch (err) {
      console.error("Error staking:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Validators</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Stake Tokens</h2>
        <input
          type="number"
          className="border p-2 rounded mr-2"
          placeholder="Amount to stake"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={handleStake}
          disabled={loading}
        >
          Stake
        </button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Current Validators</h2>
        {validators.length === 0 ? (
          <p>No validators found.</p>
        ) : (
          <ul>
            {validators.map((validator, index) => (
              <li key={index} className="border p-4 mb-2 rounded">
                <p>Address: {validator.address}</p>
                <p>Total Stake: {validator.stake}</p>
                {validator.userStake && parseFloat(validator.userStake) > 0 && (
                  <p>Your Stake: {validator.userStake}</p>
                )}
                <p>Votes: {validator.votes}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Validators;