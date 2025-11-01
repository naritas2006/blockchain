import React from 'react';
import { motion } from 'framer-motion';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function AdminPanel() {
  return (
    <div className="min-h-screen bg-soft-gradient text-violet font-sans px-6 py-12">
      <motion.h1 className="text-4xl font-bold text-center text-blush font-heading mb-10" {...fadeIn}>
        🛠 Admin Panel
      </motion.h1>
      <motion.div {...fadeIn} className="bg-white bg-opacity-70 backdrop-blur-lg p-6 rounded-xl">
        <p className="text-lg">Analytics and event verification tools will appear here.</p>
      </motion.div>
    </div>
  );
}
