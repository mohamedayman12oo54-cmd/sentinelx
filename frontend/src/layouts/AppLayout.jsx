import React, { useState } from "react";
import Sidebar from "../components/ui/Sidebar.jsx";
import AmbientField from "../components/ui/AmbientField.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import Logo from "../components/ui/Logo.jsx";
import { Menu } from "lucide-react";

export default function AppLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#07080f]">
      <AmbientField />
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.06] bg-[#07080f]/90 px-4 py-3 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-white/70 transition hover:bg-white/[0.05]"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <Logo size={22} glow={false} />
          <span className="text-sm font-semibold text-white">SentinelX</span>
        </div>
      </div>

      <main className="relative min-h-screen px-5 py-6 sm:px-6 lg:ml-60 lg:px-8 lg:py-8">
        <PageTransition />
      </main>
    </div>
  );
}
