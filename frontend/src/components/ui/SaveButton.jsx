import React from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

/**
 * A save button with real, visible feedback states instead of a bare
 * click-and-hope button: idle -> saving (spinner) -> saved (checkmark,
 * auto-clears) or error (message, stays until the next attempt).
 */
export default function SaveButton({ status = "idle", onClick, label = "Save changes", errorMessage }) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={status === "saving"}
        className="flex min-w-[140px] items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#07080f] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "saving" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          label
        )}
      </button>

      {status === "saved" && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> Saved
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400">
          <AlertCircle className="h-3.5 w-3.5" /> {errorMessage || "Couldn't save — try again"}
        </span>
      )}
    </div>
  );
}
