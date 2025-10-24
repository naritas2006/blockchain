import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import EventForm from '../components/EventForm';
import DebugEvents from '../pages/DebugEvents';
import AutonomixDPoS_ABI from '../contracts/AutonomixDPoS.json';

const DPOS_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";


const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function CarDashboard() {
  const { wallet, connectWallet, disconnectWallet, contract } = useWallet();
  const [events, setEvents] = useState([]);
  const [dposTransactions, setDposTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- FETCH EVENTS SAFELY ---
  const fetchEvents = async () => {
    if (!contract) return;
    setLoading(true);

    try {
      const totalBN = await contract.totalEvents(); // ethers.BigNumber
      const total = Number(totalBN); // convert BigNumber to JS number

      const loadedEvents = [];

      for (let i = 0; i < total; i++) {
        const e = await contract.getEvent(i);

        // SAFELY extract fields from ethers v6 Typed object
        loadedEvents.push({
          vehicleId: e.vehicleId?.toString() || '',
          eventType: e.eventType || '',
          ipfsHash: e.ipfsHash || '',
          timestamp: e.timestamp
            ? new Date(Number(e.timestamp) * 1000).toLocaleString()
            : ''
        });
      }

      console.log('Loaded events:', loadedEvents); // DEBUG
      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error fetching contract data:', error);
    }

    setLoading(false);
  };

  // --- TEST EVENT (optional, just logs first event) ---
  const testEvent = async () => {
    if (!contract) return;
    try {
      const e = await contract.getEvent(0);
      console.log('Test event raw:', e);
    } catch (error) {
      console.error('Test event error:', error);
    }
  };

  const fetchDposTransactions = async () => {
    if (!wallet || !window.ethereum) return;
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dposContract = new ethers.Contract(DPOS_CONTRACT_ADDRESS, AutonomixDPoS_ABI, provider);

      // For now, we'll fetch all registered delegates and assume they are DPoS transactions.
      // In a real scenario, you'd likely have events emitted for stake/unstake operations.
      const registeredDelegates = await dposContract.registeredDelegates();
      const fetchedTransactions = [];

      for (const delegateAddress of registeredDelegates) {
        const stake = await dposContract.delegateStake(delegateAddress);
        fetchedTransactions.push({
          type: 'Stake',
          address: delegateAddress,
          amount: ethers.formatEther(stake),
          timestamp: 'N/A' // Placeholder, as we don't have event timestamps here
        });
      }
      setDposTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Error fetching DPoS transactions:', error);
    }
    setLoading(false);
  };

  // --- EFFECTS ---
  useEffect(() => {
    testEvent();
  }, [contract]);

  useEffect(() => {
    if (wallet && contract) {
      fetchEvents();
      fetchDposTransactions();
    }
  }, [wallet, contract]);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-soft-gradient text-violet font-sans px-6 py-12">
      <motion.h1 className="text-4xl font-bold text-center text-blush mb-10" {...fadeIn}>
        🚗 Vehicle Dashboard
      </motion.h1>

      <div className="mb-6 text-center space-x-4">
        {!wallet ? (
          <button
            onClick={connectWallet}
            className="px-6 py-2 bg-blush text-white rounded-lg hover:brightness-110 transition"
          >
            🔗 Connect Wallet
          </button>
        ) : (
          <>
            <button
              onClick={disconnectWallet}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:brightness-110 transition"
            >
              ❌ Disconnect Wallet
            </button>
            <button
              onClick={fetchEvents}
              className="px-4 py-2 bg-violet text-white rounded-lg hover:brightness-110 transition"
            >
              🔄 Refresh Events
            </button>
          </>
        )}
      </div>

      {wallet && (
        <>
          <EventForm onEventSubmitted={fetchEvents} />
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-center text-blush mb-4">🕓 Event History</h2>

            {loading ? (
              <p className="text-center text-white">Loading events...</p>
            ) : (
              <table className="w-full table-auto border-collapse border border-violet">
                <thead>
                  <tr>
                    <th className="border border-violet px-2 py-1">Type</th>
                    <th className="border border-violet px-2 py-1">Vehicle ID / Zone</th>
                    <th className="border border-violet px-2 py-1">IPFS</th>
                    <th className="border border-violet px-2 py-1">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length ? (
                    events.map((e, idx) => (
                      <tr key={idx}>
                        <td className="border border-violet px-2 py-1">{e.eventType}</td>
                        <td className="border border-violet px-2 py-1">{e.vehicleId}</td>
                        <td className="border border-violet px-2 py-1">{e.ipfsHash}</td>
                        <td className="border border-violet px-2 py-1">{e.timestamp}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="border border-violet text-center py-2">
                        No events yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-center text-blush mb-4">🗳️ DPoS Transactions</h2>
            {loading ? (
              <p className="text-center text-white">Loading DPoS transactions...</p>
            ) : (
              <table className="w-full table-auto border-collapse border border-violet">
                <thead>
                  <tr>
                    <th className="border border-violet px-2 py-1">Type</th>
                    <th className="border border-violet px-2 py-1">Address</th>
                    <th className="border border-violet px-2 py-1">Amount</th>
                    <th className="border border-violet px-2 py-1">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {dposTransactions.length ? (
                    dposTransactions.map((tx, idx) => (
                      <tr key={idx}>
                        <td className="border border-violet px-2 py-1">{tx.type}</td>
                        <td className="border border-violet px-2 py-1">{tx.address}</td>
                        <td className="border border-violet px-2 py-1">{tx.amount}</td>
                        <td className="border border-violet px-2 py-1">{tx.timestamp}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="border border-violet text-center py-2">
                        No DPoS transactions yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
