import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';

export default function LiveAlertsFeed() {
  const { wallet, contracts, connectWallet } = useWallet();
  const [dataBlocks, setDataBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [vehicleIdFilter, setVehicleIdFilter] = useState('');
  const [timeRangeFilter, setTimeRangeFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all'); // New state for verified filter
  const [filteredDataBlocks, setFilteredDataBlocks] = useState([]);

  const fetchEvents = useCallback(async () => {
    if (!contracts || !contracts.dataShare) {
      console.warn("⛔ DataShare contract not available yet.");
      return;
    }

    try {
      setLoading(true);
      const allData = await contracts.dataShare.getAllData();
      console.log("📦 All Data Blocks for Live Alerts Feed:", allData);

      const verifiedItems = JSON.parse(localStorage.getItem('verifiedDataHashes') || '[]');

      const formatted = allData.map((d) => {
        let parsedMetadata = {};
        try {
          parsedMetadata = JSON.parse(d.metadata);
        } catch {
          // Fallback if metadata isn't JSON, though it should be now.
          parsedMetadata = { eventType: 'N/A', vehicleId: d.metadata };
        }

        const verifiedItem = verifiedItems.find(item => item.dataHash === d.dataHash);
        const isVerified = !!verifiedItem;
        const verificationTimestamp = verifiedItem ? verifiedItem.timestamp : undefined;

        return {
          carAddress: d.carAddress,
          eventType: parsedMetadata.eventType || 'N/A',
          vehicleId: parsedMetadata.vehicleId || 'N/A',
          dataHash: d.dataHash,
          timestamp: new Date(Number(d.timestamp) * 1000),
          verified: isVerified, // Set verified status based on localStorage
          verificationTimestamp: verificationTimestamp, // Assign verification timestamp
          ipfsHash: d.ipfsHash, // ipfsHash is now the hash of the eventData
        };
      });
      setDataBlocks(formatted);
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch data blocks:", err);
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  // ✅ Fetch events when wallet & contracts are ready
  useEffect(() => {
    if (wallet && contracts && contracts.dataShare) {
      fetchEvents();
    }
  }, [wallet, contracts, fetchEvents]);

  // ✅ Apply filters
  useEffect(() => {
    const now = Date.now();
    let filtered = [...dataBlocks];

    if (eventTypeFilter) {
      filtered = filtered.filter((b) =>
        b.eventType?.toLowerCase().includes(eventTypeFilter.toLowerCase())
      );
    }

    if (vehicleIdFilter) {
      filtered = filtered.filter((b) =>
        b.vehicleId?.toLowerCase().includes(vehicleIdFilter.toLowerCase())
      );
    }

    if (timeRangeFilter === '1h') {
      filtered = filtered.filter((b) => now - b.timestamp.getTime() < 3600000);
    } else if (timeRangeFilter === '24h') {
      filtered = filtered.filter((b) => now - b.timestamp.getTime() < 86400000);
    } else if (timeRangeFilter === '7d') {
      filtered = filtered.filter((b) => now - b.timestamp.getTime() < 604800000);
    }

    // Apply verified filter and then sort
    if (verifiedFilter === 'verified') {
      filtered = filtered.filter((b) => b.verified);
    } else if (verifiedFilter === 'unverified') {
      filtered = filtered.filter((b) => !b.verified);
    }

    // Sort by verification timestamp (verified first, then by timestamp)
    filtered.sort((a, b) => {
      if (a.verified && !b.verified) return -1; // a is verified, b is not, a comes first
      if (!a.verified && b.verified) return 1;  // b is verified, a is not, b comes first

      // If both are verified or both are unverified, sort by timestamp
      if (a.verified && b.verified) {
        // Both verified, sort by verificationTimestamp (newest first)
        return new Date(b.verificationTimestamp).getTime() - new Date(a.verificationTimestamp).getTime();
      } else {
        // Both unverified, sort by original timestamp (newest first)
        return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });

    setFilteredDataBlocks(filtered);
  }, [dataBlocks, eventTypeFilter, vehicleIdFilter, timeRangeFilter, verifiedFilter]); // Add verifiedFilter to dependencies

  // --- UI ---
  if (!wallet)
    return (
      <div className="text-center mt-10">
        <p className="text-blush mb-4">🔗 Please connect your wallet to view live alerts.</p>
        <button
          onClick={connectWallet}
          className="px-6 py-2 bg-blush text-white rounded-lg hover:brightness-110 transition"
        >
          Connect Wallet
        </button>
      </div>
    );

  if (loading) return <div className="text-center text-blush">Loading live alerts...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-blush mb-6 text-center">Live Alerts Feed</h1>

      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Filter by Event Type"
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="p-2 border border-violet rounded"
        />
        <input
          type="text"
          placeholder="Filter by Vehicle ID"
          value={vehicleIdFilter}
          onChange={(e) => setVehicleIdFilter(e.target.value)}
          className="p-2 border border-violet rounded"
        />
        <select
          value={timeRangeFilter}
          onChange={(e) => setTimeRangeFilter(e.target.value)}
          className="p-2 border border-violet rounded"
        >
          <option value="all">All Time</option>
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
        </select>
        {/* New filter for Verified status */}
        <select
          value={verifiedFilter}
          onChange={(e) => setVerifiedFilter(e.target.value)}
          className="p-2 border border-violet rounded"
        >
          <option value="all">All Status</option>
          <option value="verified">Verified</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDataBlocks.length > 0 ? (
          filteredDataBlocks.map((block, index) => (
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
              {block.ipfsHash && <p>IPFS Hash: {block.ipfsHash}</p>}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">No live alerts to display.</p>
        )}
      </div>
    </div>
  );
}
