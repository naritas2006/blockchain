import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import EventForm from '../components/EventForm';
import DebugEvents from '../pages/DebugEvents';
import AutonomixDPoS_ABI from '../contracts/AutonomixDPoS.json';
import AutonomixDataSharing_ABI from '../contracts/AutonomixDataShare.json';


const DPOS_CONTRACT_ADDRESS = "0xACA9492685809C431995e9591364165001A59583"; // DPoS
const AUTOX_TOKEN_ADDRESS = "0x693cf8cb08d57C19139C96D59e7DbC28460FD2A6"; // Token
const DATASHARING_CONTRACT_ADDRESS = "0xaa1AbEa9ADdfa8FC58e38afD704EAd0C972CEf9B"; //AutonomixDataSharing contract


const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function CarDashboard() {
  const { wallet, connectWallet, disconnectWallet, contracts } = useWallet();
  const [events, setEvents] = useState([]);
  const [dposTransactions, setDposTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataBlocks, setDataBlocks] = useState([]);


  // --- FETCH EVENTS SAFELY ---
  const fetchEvents = useCallback(async () => {
    console.log("Attempting to fetch events...");
    if (!window.ethereum) return alert("Please connect your wallet");
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const dataSharing = contracts.dataShare;

      const allData = await dataSharing.getAllData();
      console.log("📦 All Data Blocks:", allData);

      // Remove localStorage and fetch on-chain verifications
      // Get DataVerified events from the chain
      const dposContract = contracts.dpos;
      // Get all on-chain DataVerified events
      const dataVerifiedEvents = await dposContract.queryFilter(dposContract.filters.DataVerified());

      // Map: dataHash => { txHash, blockNumber, timestamp }
      const dataHashToVerification = {};
      for (const ev of dataVerifiedEvents) {
        if (ev.args && ev.args.dataHash && ev.args.success) { // success==true means verified
          dataHashToVerification[ev.args.dataHash] = {
            txHash: ev.transactionHash,
            blockNumber: ev.blockNumber,
            // timestamp will be filled in after block fetch
          };
        }
      }
      // Fetch block timestamps for relevant verifications
      for (const key in dataHashToVerification) {
        const block = await provider.getBlock(dataHashToVerification[key].blockNumber);
        dataHashToVerification[key].timestamp = block.timestamp * 1000;
      }

      // Convert into readable format
      let formatted = allData.map((d) => {
        let parsedMetadata = {};
        try {
          parsedMetadata = JSON.parse(d.metadata);
        } catch {
          parsedMetadata = { eventType: 'N/A', vehicleId: d.metadata };
        }

        // Check if this dataHash was verified on-chain
        const verification = dataHashToVerification[d.dataHash];
        const isVerified = !!verification;
        const verificationTimestamp = verification ? verification.timestamp : undefined;
        const verificationTx = verification ? verification.txHash : undefined;

        return {
          carAddress: d.carAddress,
          eventType: parsedMetadata.eventType || 'N/A',
          vehicleId: parsedMetadata.vehicleId || 'N/A',
          dataHash: d.dataHash,
          timestamp: new Date(Number(d.timestamp) * 1000),
          verified: isVerified,
          verificationTimestamp: verificationTimestamp,
          verificationTx: verificationTx,
          ipfsHash: d.ipfsHash,
        };
      });

      // Sort submissions by verificationTimestamp, putting verified items first and then by their verification time
      const sortedEvents = formatted.sort((a, b) => {
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        if (a.verified && b.verified) {
          return new Date(a.verificationTimestamp) - new Date(b.verificationTimestamp); // Oldest first
        }
        return new Date(a.timestamp) - new Date(b.timestamp); // Oldest first for unverified items
      });

      setDataBlocks(sortedEvents);
    } catch (error) {
      console.error("❌ Error fetching data:", error);
      alert("Error fetching data records!");
    }
    setLoading(false);
  }, [contracts]);

  const fetchDposTransactions = useCallback(async () => {
    if (!wallet || !window.ethereum) return;
    setLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();
      const dposContract = contracts.dpos;

      const fetchedTransactions = [];
      let i = 0;
      while (true) {
        try {
          let delegateAddress;
          try {
            delegateAddress = await dposContract.electedValidators(i);
          } catch (error) {
            console.warn(`electedValidators(${i}) reverted:`, error.message);
            break;
          }

          const delegatorStake = await dposContract.getDelegatorStake(delegateAddress, signerAddress);
          if (delegatorStake > 0) {
            fetchedTransactions.push({
              type: 'Delegated Stake',
              address: delegateAddress,
              amount: ethers.formatEther(delegatorStake),
              timestamp: 'N/A'
            });
          }
          i++;
        } catch (error) {
          console.error("Error fetching elected validators or delegator stake:", error);
          break;
        }
      }

      // Check if the connected user is an elected validator themselves
      try {
        const userIsElected = await dposContract.isValidator(signerAddress);
        if (userIsElected) {
          const userDelegateStake = await dposContract.delegateStake(signerAddress);
          if (userDelegateStake > 0) {
            fetchedTransactions.push({
              type: 'Self Stake',
              address: signerAddress,
              amount: ethers.formatEther(userDelegateStake),
              timestamp: 'N/A'
            });
          }
        }
      } catch (error) {
        console.warn("Checking if user is an elected validator failed:", error.message);
      }

      setDposTransactions(fetchedTransactions);
    } catch (error) {
      console.error('Error fetching DPoS transactions:', error);
    }
    setLoading(false);
  }, [wallet, contracts]);
const uploadData = async (metadata, ipfsHash) => {
  if (!wallet || !window.ethereum) return alert("Connect wallet first");
  setLoading(true);
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const dataSharing = contracts.dataShare;

    const dataHash = ethers.keccak256(ethers.toUtf8Bytes(ipfsHash));
    const tx = await dataSharing.uploadData(metadata, dataHash);
    console.log("Transaction hash:", tx.hash);
    await tx.wait();

    alert("✅ Data uploaded successfully!");
  } catch (error) {
    console.error("Upload error:", error);
    alert("❌ Upload failed: " + error.message);
  }
  setLoading(false);
};




  // --- EFFECTS ---
  useEffect(() => {
    if (wallet && contracts) {
      fetchEvents();
      fetchDposTransactions();

      const dposContract = contracts.dpos;
      // Real-time listener for on-chain verifications
      const onDataVerified = async (dataHash, success, event) => {
        if (!success) return;
        // Fetch block for human timestamp
        const provider = new ethers.BrowserProvider(window.ethereum);
        const block = await provider.getBlock(event.blockNumber);
        setDataBlocks((prevBlocks) => prevBlocks.map(b =>
          b.dataHash === dataHash
            ? { ...b, verified: true, verificationTimestamp: block.timestamp * 1000, verificationTx: event.transactionHash }
            : b
        ))
      };
      dposContract.on('DataVerified', onDataVerified);

      return () => {
        dposContract.off('DataVerified', onDataVerified);
      };
    }
  }, [wallet, contracts, fetchEvents, fetchDposTransactions]);

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
          {/* <MapSimulation dataBlocks={dataBlocks} /> */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-center text-blush mb-4">📦 Uploaded Data Records</h2>
            <p className="text-center text-violet mb-4">Verified Blocks: {dataBlocks.filter(block => block.verified).length}</p>

            {loading ? (
              <p className="text-center text-white">Loading data records...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dataBlocks.length > 0 ? (
                  dataBlocks.map((block, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-violet">
                      <p className="text-lg font-semibold text-blush">
                        Event Type: {block.eventType}
                      </p>
                      <p>Vehicle ID: {block.vehicleId}</p>
                      <p>Car Address: {block.carAddress}</p>
                      <p>Timestamp: {block.timestamp.toLocaleString()}</p>
                      <p>Verified: {block.verified ? '✅ Yes' : '❌ No'}</p>
                      {block.verified && block.verificationTimestamp && (
                        <p>Verification Time: {new Date(block.verificationTimestamp).toLocaleString()}</p>
                      )}
                      {block.verified && block.verificationTx && (
                        <p>
                          Tx: <a href={`https://sepolia.etherscan.io/tx/${block.verificationTx}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{block.verificationTx.slice(0,10)}...</a>
                        </p>
                      )}
                      {block.ipfsHash && <p>IPFS Hash: {block.ipfsHash}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 col-span-full">No data uploaded yet.</p>
                )}
              </div>
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
