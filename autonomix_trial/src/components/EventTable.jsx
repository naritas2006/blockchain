import React from 'react';

const sampleEvents = [
  { type: 'Pothole', zone: 'Zone A', ipfs: '#', tx: '0xabc...' },
  { type: 'Fog', zone: 'Zone B', ipfs: '#', tx: '0xdef...' },
];

export default function EventTable() {
  return (
    <div className="mt-8 bg-white/70 backdrop-blur p-6 rounded-xl">
      <h3 className="text-lg font-semibold text-blush mb-4">🕓 Event History</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b border-borderLight">
            <th className="p-2">Type</th>
            <th className="p-2">Zone</th>
            <th className="p-2">IPFS</th>
            <th className="p-2">TX Hash</th>
          </tr>
        </thead>
        <tbody>
          {sampleEvents.map((e, i) => (
            <tr key={i} className="border-b border-gray-300 hover:bg-white/60">
              <td className="p-2">{e.type}</td>
              <td className="p-2">{e.zone}</td>
              <td className="p-2"><a href={e.ipfs} className="text-blue-500">View</a></td>
              <td className="p-2">{e.tx.slice(0, 6)}...</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
