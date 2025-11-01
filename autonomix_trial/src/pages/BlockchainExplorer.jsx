import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

const BlockchainExplorer = () => {
  const [latestBlock, setLatestBlock] = useState(null);
  const [recentBlocks, setRecentBlocks] = useState([]);

  useEffect(() => {
    const fetchBlockData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545/');
        const block = await provider.getBlock('latest');
        setLatestBlock(block);

        const blockHistory = [];
        for (let i = 0; i < 5; i++) { // Fetch last 5 blocks
          const historicalBlock = await provider.getBlock(block.number - i);
          if (historicalBlock) {
            blockHistory.push(historicalBlock);
          }
        }
        setRecentBlocks(blockHistory);

      } catch (error) {
        console.error("Error fetching block data:", error);
      }
    };

    fetchBlockData();
    const interval = setInterval(fetchBlockData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Blockchain Visualizer</h1>
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Latest Block</h2>
          {latestBlock ? (
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Block Number:</strong> {latestBlock.number}</div>
              <div><strong>Timestamp:</strong> {new Date(Number(latestBlock.timestamp) * 1000).toLocaleString()}</div>
              <div><strong>Transactions:</strong> {latestBlock.transactions.length}</div>
              <div><strong>Miner:</strong> {latestBlock.miner}</div>
              <div><strong>Hash:</strong> {latestBlock.hash}</div>
              <div><strong>Parent Hash:</strong> {latestBlock.parentHash}</div>
              <div><strong>Gas Used:</strong> {latestBlock.gasUsed.toString()}</div>
              <div><strong>Gas Limit:</strong> {latestBlock.gasLimit.toString()}</div>
              {latestBlock.baseFeePerGas && <div><strong>Base Fee Per Gas:</strong> {ethers.formatUnits(latestBlock.baseFeePerGas, "gwei")} Gwei</div>}
            </div>
          ) : (
            <p>Loading latest block data...</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Blocks</h2>
          {recentBlocks.length > 0 ? (
            <div className="space-y-4">
              {recentBlocks.map((block, index) => (
                <div key={index} className="border-b pb-4 last:border-b-0">
                  <div className="grid grid-cols-2 gap-2">
                    <div><strong>Block Number:</strong> {block.number}</div>
                    <div><strong>Timestamp:</strong> {new Date(Number(block.timestamp) * 1000).toLocaleString()}</div>
                    <div><strong>Transactions:</strong> {block.transactions.length}</div>
                    <div><strong>Miner:</strong> {block.miner}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Loading recent blocks...</p>
          )}
        </div>
      </div>
  );
};

export default BlockchainExplorer;