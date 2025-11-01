import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ethers } from 'ethers';
import { useWallet } from '../context/WalletContext';
import AutonomixDataSharing_ABI from '../contracts/AutonomixDataShare.json';

const DATASHARING_CONTRACT_ADDRESS = "0xaa1AbEa9ADdfa8FC58e38afD704EAd0C972CEf9B";

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Generate consistent random coordinates for each car address
const getSimulatedCoordinates = (carAddress) => {
  if (!carAddress) return [37.7749, -122.4194]; // fallback (San Francisco)
  const hash = [...carAddress].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const lat = 37.0 + ((hash % 50) / 10) - 2.5;  // Range ~34.5–39.5
  const lng = -122.0 + ((hash % 50) / 10) - 2.5; // Range ~ -124.5–-119.5
  return [lat, lng];
};

const MapView = () => {
  const { contracts } = useWallet();
  const [dataBlocks, setDataBlocks] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch all past uploaded data
  const fetchEvents = useCallback(async () => {
    console.log("🛰 Fetching on-chain data for MapView...");
    if (!contracts || !contracts.dataShare) {
      console.warn("⚠️ DataShare contract not loaded yet!");
      return;
    }

    setLoading(true);
    try {
      const dataSharing = contracts.dataShare;
      const allData = await dataSharing.getAllData();
      console.log("📦 All data blocks fetched:", allData);

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
      console.log("✅ DataBlocks set for map:", formatted);
    } catch (error) {
      console.error("❌ Error fetching map data:", error);
      alert("Error fetching data for MapView!");
    } finally {
      setLoading(false);
    }
  }, [contracts]);

  // 🔹 Listen for new events live
  useEffect(() => {
    if (!contracts || !contracts.dataShare) return;
    fetchEvents();

    const dataShareContract = contracts.dataShare;

    const onDataUploaded = (carAddress, metadata, dataHash, verified, timestamp, ipfsHash) => {
      console.log("⚡ New DataUploaded event detected:", { carAddress, metadata, dataHash, verified, timestamp, ipfsHash });

      let parsedMetadata = {};
      try {
        parsedMetadata = JSON.parse(metadata);
      } catch {
        parsedMetadata = { eventType: 'N/A', vehicleId: metadata };
      }

      const newBlock = {
        carAddress,
        eventType: parsedMetadata.eventType || 'N/A',
        vehicleId: parsedMetadata.vehicleId || 'N/A',
        dataHash,
        timestamp: new Date(Number(timestamp) * 1000),
        verified,
        ipfsHash,
      };

      setDataBlocks((prev) => [newBlock, ...prev]);
    };

    dataShareContract.on('DataUploaded', onDataUploaded);

    return () => {
      dataShareContract.off('DataUploaded', onDataUploaded);
    };
  }, [contracts, fetchEvents]);

  return (
    <div className="min-h-screen bg-soft-gradient text-violet font-sans px-6 py-12">
      <h1 className="text-4xl font-bold text-center text-blush mb-10">🗺️ Vehicle Event Map</h1>

      {loading ? (
        <p className="text-center text-white">Loading map data...</p>
      ) : (
        <div className="w-full h-96 mt-8">
          <MapContainer
            center={[37.7749, -122.4194]}
            zoom={10}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {dataBlocks.map((block, index) => {
              const coords = getSimulatedCoordinates(block.carAddress);
              return (
                <Marker key={index} position={coords}>
                  <Popup>
                    <div className="text-left">
                      <p><strong>Event Type:</strong> {block.eventType}</p>
                      <p><strong>Vehicle ID:</strong> {block.vehicleId}</p>
                      <p><strong>Car Address:</strong> {block.carAddress.slice(0, 10)}...</p>
                      <p><strong>Timestamp:</strong> {block.timestamp.toLocaleString()}</p>
                      <p><strong>Verified:</strong> {block.verified ? '✅ Yes' : '❌ No'}</p>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      )}
    </div>
  );
};

export default MapView;
