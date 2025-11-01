import React from 'react';
import { motion } from 'framer-motion';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

export default function About() {
  return (
    <div className="min-h-screen bg-soft-gradient text-violet font-sans px-6 py-12">
      <motion.h1
        className="text-4xl font-bold text-center text-blush font-heading mb-10"
        {...fadeIn}
      >
        About Autonomix
      </motion.h1>

      <motion.div
        {...fadeIn}
        className="max-w-5xl mx-auto bg-white/70 backdrop-blur-lg p-6 rounded-xl space-y-10"
      >
        <section>
          <h2 className="text-2xl font-semibold text-blush mb-2">Project Overview</h2>
          <p className="text-lg">
            <strong>Autonomix</strong> is a decentralized platform that simulates real-time road event sharing
            between autonomous vehicles and authorities. It uses Ethereum blockchain and IPFS to ensure
            transparency, reliability, and tamper-proof data exchange — without centralized control.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blush mb-2">How It Works</h2>
          <ul className="list-disc pl-6 text-lg space-y-2">
            <li>Each vehicle is simulated via a MetaMask wallet</li>
            <li>Events like potholes, fog, or accidents are submitted via a form</li>
            <li>Optional images or sensor data are uploaded to IPFS</li>
            <li>Smart contracts log the event on-chain</li>
            <li>All users can see live updates, event history, and a simulated map</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blush mb-4">Tech Stack</h2>

          {/* Glowing multi-icon card */}
          <div className="max-w-md mx-auto p-8 rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-gray-100 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset]">
            <div className="h-[18rem] rounded-xl bg-neutral-300 dark:bg-[rgba(40,40,40,0.70)] [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)] relative flex items-center justify-center">
              <div className="flex flex-wrap gap-4 items-center justify-center">
                <div className="h-12 w-12 rounded-full flex items-center justify-center shadow-[0px_0px_8px_rgba(248,248,248,0.25)_inset] bg-white/10">
                  <img src="https://images.ctfassets.net/clixtyxoaeas/1ezuBGezqfIeifWdVtwU4c/d970d4cdf13b163efddddd5709164d2e/MetaMask-icon-Fox.svg" alt="MetaMask" className="h-6" />
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center shadow-[0px_0px_8px_rgba(248,248,248,0.25)_inset] bg-white/10">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6f/Ethereum-icon-purple.svg" alt="Ethereum" className="h-6" />
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center shadow-[0px_0px_8px_rgba(248,248,248,0.25)_inset] bg-white/10">
                  <img src="https://www.svgrepo.com/show/330716/ipfs.svg" alt="IPFS" className="h-6" />
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center shadow-[0px_0px_8px_rgba(248,248,248,0.25)_inset] bg-white/10">
                  <img src="https://cdn.worldvectorlogo.com/logos/react-2.svg" alt="React" className="h-6" />
                </div>
                <div className="h-12 w-12 rounded-full flex items-center justify-center shadow-[0px_0px_8px_rgba(248,248,248,0.25)_inset] bg-white/10">
                  <img src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" alt="Tailwind CSS" className="h-6" />
                </div>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-lg font-semibold text-gray-800 dark:text-white">Core Technologies</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                The power stack behind Autonomix.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blush mb-2">Key Features</h2>
          <ul className="list-disc pl-6 text-lg space-y-2">
            <li>Vehicle dashboard for reporting and tracking own events</li>
            <li>Live alerts feed from all cars in the network</li>
            <li>Admin panel for reviewing suspicious reports</li>
            <li>Simulated map view with pins and icons per event type</li>
            <li>Trust score and TX hashes for event transparency</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blush mb-2">Project Goals</h2>
          <p className="text-lg">
            Autonomix demonstrates how decentralized systems can support safer, transparent road networks.
            While it's a simulation, it lays the foundation for how future autonomous fleets could interact
            securely, without relying on centralized authorities.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-blush mb-2">Team & GitHub</h2>
          <p className="text-lg">
            Built with ❤️ by Team Autonomix.
            <br />
            Explore the code on{' '}
            <a
              href="https://github.com"
              className="text-blush underline hover:opacity-80"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
