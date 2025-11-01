import { useWallet } from '../context/WalletContext';
import { motion } from 'framer-motion';

export default function Signup() {
  const { wallet, connectWallet } = useWallet();

  return (
    <div className="min-h-screen bg-soft-gradient text-violet flex items-center justify-center px-4">
      <motion.div
        className="bg-white bg-opacity-80 p-8 rounded-2xl shadow-xl backdrop-blur max-w-md w-full text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl font-bold text-blush mb-4 font-heading">🚀 Sign Up</h2>
        <p className="mb-6 text-violet">Connect your wallet to participate in the simulation.</p>

        {wallet ? (
          <p className="text-green-600 font-semibold">
            ✅ Connected: {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </p>
        ) : (
          <button
            onClick={connectWallet}
            className="px-6 py-2 bg-blush text-white rounded-lg hover:brightness-110 transition"
          >
            🔗 Connect Wallet
          </button>
        )}
      </motion.div>
    </div>
  );
}
