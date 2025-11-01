import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function AdminPanel() {
  const { wallet, contracts, connectWallet } = useWallet();
  const [dataBlocks, setDataBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEvents, setTotalEvents] = useState(0);
  const [verifiedEvents, setVerifiedEvents] = useState(0);
  const [unverifiedEvents, setUnverifiedEvents] = useState(0);
  const [eventTypeData, setEventTypeData] = useState([]);
  const [carAddressData, setCarAddressData] = useState([]);

  // 🧠 Fetch all data blocks from the contract
  const fetchEvents = useCallback(async () => {
    if (!contracts || !contracts.dataShare) {
      console.warn("⛔ DataShare contract not available yet.");
      return;
    }

    try {
      setLoading(true);
      const allData = await contracts.dataShare.getAllData();
      console.log("📦 All Data Blocks for Admin Panel:", allData);

      const formatted = allData.map((d) => {
        let parsedMetadata = {};
        try {
          parsedMetadata = JSON.parse(d.metadata);
        } catch {
          parsedMetadata = { eventType: 'N/A', vehicleId: d.metadata };
        }

        return {
          carAddress: d.carAddress,
          eventType: parsedMetadata.eventType || 'N/A',
          vehicleId: parsedMetadata.vehicleId || 'N/A',
          dataHash: d.dataHash,
          timestamp: new Date(Number(d.timestamp) * 1000),
          verified: d.verified,
          ipfsHash: d.ipfsHash,
        };
      });

      setDataBlocks(formatted);
      setError(null);
    } catch (err) {
      console.error("❌ Failed to fetch data blocks for admin panel:", err);
      setError("Failed to load events for admin panel.");
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  // 🚀 Fetch events when wallet & contract are ready
  useEffect(() => {
    if (wallet && contracts?.dataShare?.getAllData) {
      fetchEvents();
    }
  }, [wallet, contracts?.dataShare?.address, fetchEvents]);

  // 🔄 Listen to real-time blockchain events
  useEffect(() => {
    if (!contracts?.dataShare) return;
    const contract = contracts.dataShare;

    const handleNewEvent = () => {
      console.log("📡 New event detected → refreshing analytics...");
      fetchEvents();
    };

    contract.on("DataUploaded", handleNewEvent);
    return () => {
      contract.off("DataUploaded", handleNewEvent);
    };
  }, [contracts, fetchEvents]);

  // 📊 Calculate analytics
  useEffect(() => {
    setTotalEvents(dataBlocks.length);
    setVerifiedEvents(dataBlocks.filter(block => block.verified).length);
    setUnverifiedEvents(dataBlocks.filter(block => !block.verified).length);

    // Aggregate data for event types
    const eventTypeCounts = dataBlocks.reduce((acc, block) => {
      acc[block.eventType] = (acc[block.eventType] || 0) + 1;
      return acc;
    }, {});
    setEventTypeData(Object.entries(eventTypeCounts).map(([name, value]) => ({ name, value })));

    // Aggregate data for car addresses
    const carAddressCounts = dataBlocks.reduce((acc, block) => {
      acc[block.carAddress] = (acc[block.carAddress] || 0) + 1;
      return acc;
    }, {});
    setCarAddressData(Object.entries(carAddressCounts).map(([name, value]) => ({ name, value })));

  }, [dataBlocks]);

  // 💬 Handle loading & error states
  if (loading) return <div className="text-center text-blush">Loading analytics...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  if (!wallet)
    return (
      <div className="text-center mt-10">
        <p className="text-blush mb-4">🔗 Please connect your wallet to view admin analytics.</p>
        <button
          onClick={connectWallet}
          className="px-6 py-2 bg-blush text-white rounded-lg hover:brightness-110 transition"
        >
          Connect Wallet
        </button>
      </div>
    );

  // ✅ UI
  return (
    <div className="min-h-screen bg-soft-gradient text-violet font-sans px-6 py-12">
      <motion.h1 className="text-4xl font-bold text-center text-blush font-heading mb-10" {...fadeIn}>
        🛠 Admin Panel
      </motion.h1>

      {/* Basic Analytics */}
      <motion.div {...fadeIn} className="bg-white bg-opacity-70 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-2xl font-semibold text-blush mb-4">Event Analytics</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-light-violet rounded-lg shadow-md">
            <p className="text-lg font-medium">Total Events</p>
            <p className="text-3xl font-bold text-blush">{totalEvents}</p>
          </div>

          <div className="p-4 bg-light-violet rounded-lg shadow-md">
            <p className="text-lg font-medium">Verified Events</p>
            <p className="text-3xl font-bold text-green-500">{verifiedEvents}</p>
          </div>

          <div className="p-4 bg-light-violet rounded-lg shadow-md">
            <p className="text-lg font-medium">Unverified Events</p>
            <p className="text-3xl font-bold text-red-500">{unverifiedEvents}</p>
          </div>
        </div>
      </motion.div>

      {/* Event Type Distribution Pie Chart */}
      {eventTypeData.length > 0 && (
        <motion.div {...fadeIn} className="bg-white bg-opacity-70 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-blush mb-4">Event Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {eventTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE'][index % 5]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Events by Car Address Bar Chart */}
      {carAddressData.length > 0 && (
        <motion.div {...fadeIn} className="bg-white bg-opacity-70 backdrop-blur-lg p-6 rounded-xl shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-blush mb-4">Events by Car Address</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={carAddressData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {loading && <div className="text-center text-blush">Loading analytics...</div>}
      {error && <div className="text-center text-red-500">Error: {error}</div>}

      {!wallet && (
        <div className="text-center mt-10">
          <p className="text-blush mb-4">🔗 Please connect your wallet to view admin analytics.</p>
          <button
            onClick={connectWallet}
            className="px-6 py-2 bg-blush text-white rounded-lg hover:brightness-110 transition"
          >
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}
