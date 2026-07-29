import React from "react";
import { useOnScreen } from "../../hooks/useOnScreen.js";

export default function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useOnScreen();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms, transform 0.7s cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
