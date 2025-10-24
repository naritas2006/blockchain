import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import AutonomixDPoS_ABI from '../contracts/AutonomixDPoS.json';
import AUTOXToken_ABI from '../contracts/AUTOXToken.json';

const DPOS_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const AUTOX_TOKEN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

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
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed!");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dposContract = new ethers.Contract(DPOS_CONTRACT_ADDRESS, AutonomixDPoS_ABI, provider);

      const fetchedValidators = [];
      let i = 0;
      while (true) {
        try {
          const validatorAddress = await dposContract.electedValidators(i);
          const stake = await dposContract.delegateStake(validatorAddress);
          fetchedValidators.push({
            address: validatorAddress,
            stake: ethers.formatEther(stake),
            votes: ethers.formatEther(stake),
          });
          i++;
        } catch (error) {
          // Break the loop if an error (e.g., out of bounds) occurs
          if (error.code === 'CALL_EXCEPTION' || error.message.includes('invalid arrayify value')) {
            break;
          }
          console.error("Error fetching elected validator at index", i, error);
          break; // Break on unexpected errors too
        }
      }
      setValidators(fetchedValidators);

    } catch (err) {
      console.error("Error fetching validators:", err);
      setError(err.message);
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

      const amount = ethers.parseEther(stakeAmount);

      // Approve the DPoS contract to spend AUTOXToken
      const approveTx = await autoxTokenContract.approve(DPOS_CONTRACT_ADDRESS, amount);
      await approveTx.wait();
      alert('Approval successful! Now proceeding with staking.');

      const stakeTx = await dposContract.stake(amount);
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
                <p>Stake: {validator.stake}</p>
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