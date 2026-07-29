import React from "react";
import { useLocation, Outlet } from "react-router-dom";

/**
 * Signature SentinelX page transition: a glowing "security scan" line
 * sweeps top-to-bottom over the incoming page, and the content reveals
 * itself just behind it — on-brand for a monitoring/scanning product,
 * rather than a generic fade.
 *
 * Re-triggers automatically on every route change because the wrapper's
 * `key` changes with the pathname, forcing a remount (and therefore a
 * fresh animation) with zero animation-library dependency.
 */
export default function PageTransition() {
  const location = useLocation();

  return (
    <div key={location.pathname} className="sx-scan-wrap">
      <div className="sx-scan-line" />
      <div className="sx-scan-content">
        <Outlet />
      </div>
    </div>
  );
}
