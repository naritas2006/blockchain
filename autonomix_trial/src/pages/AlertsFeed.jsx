import React from 'react';
import { motion } from 'framer-motion';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function AlertsFeed() {
  const alerts = [
    { type: 'Pothole', location: 'Zone A', wallet: '0xabc...', time: '12:30 PM', ipfs: '#' },
    { type: 'Fog', location: 'Zone B', wallet: '0xdef...', time: '12:45 PM', ipfs: '#' },
  ];

  return (
    <div className="min-h-screen bg-soft-gradient text-violet font-sans px-6 py-12">
      <motion.h1 className="text-4xl font-bold text-center text-blush font-heading mb-10" {...fadeIn}>
         Live Alerts Feed
      </motion.h1>
      <motion.div {...fadeIn} className="overflow-x-auto">
        <table className="w-full bg-white bg-opacity-70 backdrop-blur-lg rounded-xl text-sm text-left">
          <thead className="text-blush border-b border-borderLight">
            <tr>
              <th className="p-4">Type</th>
              <th className="p-4">Location</th>
              <th className="p-4">Wallet</th>
              <th className="p-4">Time</th>
              <th className="p-4">IPFS</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, idx) => (
              <tr key={idx} className="hover:bg-white/60 transition">
                <td className="p-4">{alert.type}</td>
                <td className="p-4">{alert.location}</td>
                <td className="p-4">{alert.wallet}</td>
                <td className="p-4">{alert.time}</td>
                <td className="p-4"><a href={alert.ipfs} className="text-blue-500 hover:underline">View</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
