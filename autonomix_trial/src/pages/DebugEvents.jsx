import { useEffect } from 'react';
import { useWallet } from '../context/WalletContext';

export default function DebugEvents() {
  const { contract } = useWallet();

  useEffect(() => {
    if (!contract) return;

    const fetchAllEvents = async () => {
      try {
        const total = Number(await contract.totalEvents()); // convert BigNumber to number
        console.log('Total events in contract:', total);

        for (let i = 0; i < total; i++) {
          const e = await contract.getEvent(i);
          console.log(`Event ${i}:`, {
            vehicleId: e.vehicleId?.toString(),
            eventType: e.eventType,
            ipfsHash: e.ipfsHash,
            timestamp: e.timestamp ? new Date(Number(e.timestamp) * 1000).toLocaleString() : ''
          });
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };

    fetchAllEvents();
  }, [contract]);

  return null; // Nothing to render
}
