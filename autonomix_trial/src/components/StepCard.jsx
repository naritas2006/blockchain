import { motion } from "framer-motion";

export default function StepCard({ icon, tag, title, desc, bgColor }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className={`relative group cursor-pointer w-56 h-72 rounded-2xl overflow-hidden ${bgColor} text-gray-900 shadow-xl transition-all duration-500`}
    >
      {/* Top part */}
      <div className="w-full h-full p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-3xl">{icon}</span>
          <span className="bg-white text-black text-xs font-bold px-2 py-1 rounded-full">{tag}</span>
        </div>
      </div>

      {/* Slide-up box */}
      <div className="absolute bottom-0 w-full bg-white text-gray-800 p-4 rounded-t-2xl transform translate-y-full group-hover:translate-y-0 transition-all duration-500">
        <h4 className="text-blush font-bold text-lg mb-1">{title}</h4>
        <p className="text-sm">{desc}</p>
      </div>
    </motion.div>
  );
}
