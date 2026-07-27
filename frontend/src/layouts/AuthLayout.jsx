import React from "react";
import AmbientField from "../components/ui/AmbientField.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import Logo from "../components/ui/Logo.jsx";

export default function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07080f] px-6">
      <AmbientField />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <Logo size={36} />
          <span className="text-lg font-semibold tracking-tight text-white">
            Sentinel<span className="text-indigo-400">X</span>
          </span>
        </div>
        <PageTransition />
      </div>
    </div>
  );
}
