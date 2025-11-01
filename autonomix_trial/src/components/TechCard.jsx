// src/components/TechCard.js
export default function TechCard() {
  return (
    <div className="max-w-sm w-full mx-auto p-8 rounded-xl border border-[rgba(255,255,255,0.10)] dark:bg-[rgba(40,40,40,0.70)] bg-white/60 shadow-[2px_4px_16px_0px_rgba(248,248,248,0.06)_inset] group">
      <div className="h-[15rem] md:h-[20rem] rounded-xl bg-neutral-300 dark:bg-[rgba(40,40,40,0.70)] [mask-image:radial-gradient(50%_50%_at_50%_50%,white_0%,transparent_100%)] flex items-center justify-center">
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-white/10 shadow-inner flex items-center justify-center">
            <div className="h-4 w-4 bg-[#CC9B7A] rounded-full"></div>
          </div>
          <div className="h-12 w-12 rounded-full bg-white/10 shadow-inner flex items-center justify-center">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9.75 14a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75Zm4.5 0a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75Z" />
              <path d="M12 2c2.214 0 4.248.657 5.747 1.756..." />
            </svg>
          </div>
          <div className="h-16 w-16 rounded-full bg-white/10 shadow-inner flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 28 28">
              <path d="..." />
            </svg>
          </div>
        </div>
      </div>
      <p className="text-lg font-semibold text-violet py-2">🚀 Tech Stack Card</p>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        A showcase of technologies used in Autonomix: Blockchain, IPFS, MetaMask, and more.
      </p>
    </div>
  );
}
