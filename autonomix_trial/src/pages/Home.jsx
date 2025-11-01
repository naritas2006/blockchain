import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import StepCard from "../components/StepCard";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8 } },
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-soft-gradient bg-cover text-violet font-sans">
      {/* Hero Section */}
      <section className="text-center mt-6 space-y-6 px-4">


        <motion.h2
          className="text-4xl md:text-5xl font-bold text-blush font-heading shimmer"
          {...fadeIn}
        >
          Decentralized Road Event Sharing
        </motion.h2>
        <motion.p
          className="text-violet max-w-xl mx-auto text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Real-time simulation of autonomous vehicles detecting and sharing road events on-chain.
        </motion.p>

        <motion.div
          className="flex flex-wrap justify-center gap-4 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <button
            onClick={() => navigate("/car")}
            className="px-6 py-3 bg-blush text-white rounded-2xl font-semibold hover:brightness-110 transition"
          >
             Launch Vehicle Simulation
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-3 border border-blush text-blush rounded-2xl font-semibold hover:bg-blush hover:text-white transition"
          >
             Sign Up as Admin
          </button>
        </motion.div>
      </section>

      {/* Stats */}
      <motion.section
        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-6"
        {...fadeIn}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <StatCard label="Total Cars Connected" value="38" />
        <StatCard label="Total Events Logged" value="112" />
        <StatCard label="Top Zone" value="Zone B" />
      </motion.section>

      {/* How It Works (Uiverse Cards) */}
      <motion.section
        className="mt-28 max-w-6xl mx-auto text-center px-4"
        {...fadeIn}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-2xl font-semibold text-blush mb-8 font-heading">How It Works</h3>
        <div className="flex flex-wrap justify-center gap-8">
          <StepCard
            tag="DETECT"
            title="Hazard Detection"
            icon="🌸"
            desc="Vehicles use onboard sensors to detect real-time road issues like potholes, fog, or collisions."
            bgColor="bg-violet-300"
          />
          <StepCard
            tag="SUBMIT"
            title="On-Chain Logging"
            icon="🌸"
            desc="Events are signed and submitted via MetaMask to smart contracts, ensuring transparency."
            bgColor="bg-blush"
          />
          <StepCard
            tag="VISUALIZE"
            title="Global Visualization"
            icon="🌸"
            desc="Authorities and other vehicles view live data via dashboard, alert feeds, and map."
            bgColor="bg-thistle"
          />
        </div>
      </motion.section>

      {/* Ecosystem Tool Grid */}
      <motion.section
        className="mt-24 max-w-6xl mx-auto px-6"
        {...fadeIn}
      >
        <h3 className="text-2xl font-semibold text-blush font-heading mb-8">🔗 Ecosystem Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <ToolCard label="Car Dashboard" onClick={() => navigate('/car')} />
          <ToolCard label="Alerts Feed" onClick={() => navigate('/alerts')} />
          <ToolCard label="Live Map View" onClick={() => navigate('/map')} />
          <ToolCard label="Admin Panel" onClick={() => navigate('/admin')} />
        </div>
      </motion.section>

      {/* Latest Snapshot */}
      <motion.section className="mt-24 max-w-5xl mx-auto px-6" {...fadeIn}>
        <h3 className="text-2xl font-semibold text-blush font-heading mb-6">📊 Latest Events</h3>
        <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-xl p-4 space-y-3 text-sm">
          <p>• 🚧 Pothole reported in Zone C – <span className="text-thistle">0xE4...92F1</span></p>
          <p>• 🌫️ Fog alert near Zone A highway – <span className="text-thistle">0xA2...1D99</span></p>
          <p>• 🚘 Collision detected in Zone B – <span className="text-thistle">0x9C...3B45</span></p>
          <button
            onClick={() => navigate('/alerts')}
            className="text-blush mt-2 hover:underline"
          >
            View All Alerts →
          </button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="mt-24 py-12 text-center text-violet border-t border-borderLight text-sm bg-white bg-opacity-60 backdrop-blur-md">
        Built with ❤️ by Team Autonomix ·{" "}
        <button
          onClick={() => navigate('/about')}
          className="text-blush hover:underline"
        >
          Docs
        </button>
      </footer>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white bg-opacity-80 backdrop-blur-lg border border-borderLight p-6 rounded-2xl shadow-md text-center"
    >
      <p className="text-sm text-thistle">{label}</p>
      <p className="text-3xl font-bold text-blush">{value}</p>
    </motion.div>
  );
}

function ToolCard({ label, onClick }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className="cursor-pointer bg-white bg-opacity-80 backdrop-blur-lg border border-borderLight p-6 rounded-xl text-center hover:shadow-xl transition"
    >
      <p className="text-lg font-semibold text-blush font-heading">{label}</p>
    </motion.div>
  );
}
