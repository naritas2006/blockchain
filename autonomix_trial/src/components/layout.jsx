import { Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Layout() {
  const navigate = useNavigate();

  return (
    <div className="bg-soft-gradient bg-cover text-violet min-h-screen font-sans">

      <nav className="flex items-center justify-between px-8 py-4 bg-white bg-opacity-70 backdrop-blur-md border-b border-borderLight sticky top-0 z-10 shadow-md">
        <div
          className="text-2xl font-bold text-blush font-heading cursor-pointer flex items-center gap-2"
          onClick={() => navigate("/")}
        >
           Autonomix
        </div>

        <div className="hidden md:flex space-x-6 text-sm font-medium items-center">
          <a href="/" className="hover:text-blush transition">Home</a>
          <a href="/car" className="hover:text-blush transition">Dashboard</a>
          <a href="/map" className="hover:text-blush transition">Map</a>
          <a href="/alerts" className="hover:text-blush transition">Alerts</a>
          <a href="/admin" className="hover:text-blush transition">Admin</a>
          <a href="/explorer" className="hover:text-blush transition">Explorer</a>
          <a href="/validators" className="hover:text-blush transition">Validators</a>
          <a href="/about" className="hover:text-blush transition">About</a>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/signup")}
          className="ml-4 bg-blush text-white px-4 py-2 rounded-xl text-sm font-semibold hover:brightness-110 transition"
        >
          Sign Up
        </motion.button>
      </nav>

      <main className="pt-6">
        <Outlet />
      </main>
    </div>
  );
}
