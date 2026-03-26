/**
 * Illustrated dashboard pictograms — colourful SVG icons
 * inspired by the "3D-flat" style shown in the reference image.
 * Each icon renders at the given `size` (default 64).
 */

const S = 64; // default viewport

/* ───────── 1. Total Cereri — blue inbox + documents ───────── */
export function IconTotalCereri({ size = S }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* inbox tray */}
      <rect x="10" y="28" width="44" height="28" rx="4" fill="#1e40af"/>
      <rect x="10" y="28" width="44" height="12" rx="4" fill="#2563eb"/>
      {/* documents stack */}
      <rect x="18" y="8" width="24" height="30" rx="3" fill="#e0e7ff" stroke="#93a3d0" strokeWidth="1"/>
      <rect x="22" y="14" width="14" height="2" rx="1" fill="#93a3d0"/>
      <rect x="22" y="19" width="10" height="2" rx="1" fill="#93a3d0"/>
      <rect x="22" y="24" width="12" height="2" rx="1" fill="#93a3d0"/>
      {/* badge */}
      <circle cx="46" cy="14" r="10" fill="#3b82f6"/>
      <text x="46" y="18" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">✦</text>
    </svg>
  );
}

/* ───────── 2. Cereri în așteptare — golden hourglass ───────── */
export function IconInAsteptare({ size = S }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* outer circle */}
      <circle cx="32" cy="32" r="28" fill="#fbbf24"/>
      <circle cx="32" cy="32" r="24" fill="#f59e0b"/>
      {/* hourglass */}
      <path d="M22 16 h20 l-8 12 l8 12 h-20 l8-12z" fill="#fffbeb" opacity=".9"/>
      <rect x="22" y="14" width="20" height="3" rx="1.5" fill="#92400e"/>
      <rect x="22" y="47" width="20" height="3" rx="1.5" fill="#92400e"/>
      {/* sand grains */}
      <circle cx="32" cy="38" r="2" fill="#d97706" opacity=".6"/>
      <circle cx="30" cy="42" r="1.5" fill="#d97706" opacity=".4"/>
      <circle cx="34" cy="41" r="1" fill="#d97706" opacity=".5"/>
    </svg>
  );
}

/* ───────── 3. Cereri în lucru — gears + wrench ───────── */
export function IconInLucru({ size = S }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* background circle */}
      <circle cx="32" cy="32" r="28" fill="#dbeafe" opacity=".5"/>
      {/* big gear */}
      <circle cx="26" cy="28" r="12" fill="#60a5fa" stroke="#2563eb" strokeWidth="2"/>
      <circle cx="26" cy="28" r="5" fill="#dbeafe"/>
      {/* gear teeth (big) */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <rect key={a} x="24" y="15" width="4" height="5" rx="1" fill="#2563eb"
          transform={`rotate(${a} 26 28)`}/>
      ))}
      {/* small gear */}
      <circle cx="42" cy="38" r="8" fill="#93c5fd" stroke="#3b82f6" strokeWidth="1.5"/>
      <circle cx="42" cy="38" r="3" fill="#dbeafe"/>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <rect key={a} x="41" y="29" width="3" height="4" rx="1" fill="#3b82f6"
          transform={`rotate(${a} 42 38)`}/>
      ))}
      {/* wrench */}
      <line x1="38" y1="48" x2="52" y2="56" stroke="#475569" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="38" cy="48" r="4" fill="#64748b" stroke="#475569" strokeWidth="1"/>
    </svg>
  );
}

/* ───────── 4. Cereri finalizate — green checkmark circle ───────── */
export function IconFinalizate({ size = S }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* outer glow */}
      <circle cx="32" cy="32" r="28" fill="#22c55e" opacity=".15"/>
      {/* circle */}
      <circle cx="32" cy="32" r="24" fill="#16a34a"/>
      <circle cx="32" cy="32" r="20" fill="#22c55e"/>
      {/* checkmark */}
      <polyline points="20,32 28,40 44,24" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
      {/* sparkle */}
      <circle cx="50" cy="12" r="2" fill="#86efac"/>
      <circle cx="54" cy="18" r="1.2" fill="#86efac"/>
    </svg>
  );
}

/* ───────── 5. Contracte — document + handshake ───────── */
export function IconContracte({ size = S }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* bg circle */}
      <circle cx="32" cy="30" r="26" fill="#dbeafe" opacity=".4"/>
      {/* document */}
      <rect x="14" y="6" width="28" height="36" rx="3" fill="#e0e7ff" stroke="#93a3d0" strokeWidth="1"/>
      <rect x="19" y="12" width="16" height="2" rx="1" fill="#93a3d0"/>
      <rect x="19" y="17" width="12" height="2" rx="1" fill="#93a3d0"/>
      <rect x="19" y="22" width="14" height="2" rx="1" fill="#93a3d0"/>
      {/* signature squiggle */}
      <path d="M20 30 Q24 26 28 30 Q32 34 36 30" stroke="#2563eb" strokeWidth="1.5" fill="none"/>
      {/* handshake */}
      <ellipse cx="38" cy="52" rx="16" ry="8" fill="#bfdbfe" opacity=".5"/>
      <path d="M22 50 l6-4 l4 3 l4-3 l6 4" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M28 49 l4 3 l4-3" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* ───────── 6. Firme — buildings + briefcases ───────── */
export function IconFirme({ size = S }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* bg circle */}
      <circle cx="32" cy="30" r="26" fill="#e2e8f0" opacity=".4"/>
      {/* tall building */}
      <rect x="20" y="8" width="14" height="38" rx="2" fill="#334155"/>
      <rect x="22" y="12" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="27" y="12" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="22" y="18" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="27" y="18" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="22" y="24" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="27" y="24" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="22" y="30" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="27" y="30" width="3" height="3" rx=".5" fill="#94a3b8"/>
      {/* shorter building */}
      <rect x="36" y="18" width="12" height="28" rx="2" fill="#475569"/>
      <rect x="38" y="22" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="43" y="22" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="38" y="28" width="3" height="3" rx=".5" fill="#94a3b8"/>
      <rect x="43" y="28" width="3" height="3" rx=".5" fill="#94a3b8"/>
      {/* ground */}
      <rect x="8" y="46" width="48" height="4" rx="2" fill="#cbd5e1"/>
      {/* briefcase left */}
      <rect x="12" y="50" width="10" height="7" rx="2" fill="#1e293b"/>
      <rect x="15" y="48" width="4" height="3" rx="1" fill="none" stroke="#1e293b" strokeWidth="1.5"/>
      {/* briefcase right */}
      <rect x="42" y="50" width="10" height="7" rx="2" fill="#1e293b"/>
      <rect x="45" y="48" width="4" height="3" rx="1" fill="none" stroke="#1e293b" strokeWidth="1.5"/>
    </svg>
  );
}

/* ───────── 7. Facturi — documents + stamp ───────── */
export function IconFacturi({ size = S }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* bg circle */}
      <circle cx="30" cy="32" r="26" fill="#dbeafe" opacity=".35"/>
      {/* back doc */}
      <rect x="16" y="10" width="26" height="34" rx="3" fill="#bfdbfe" stroke="#7da8d4" strokeWidth=".5"/>
      {/* front doc */}
      <rect x="20" y="14" width="26" height="34" rx="3" fill="#e0e7ff" stroke="#93a3d0" strokeWidth="1"/>
      <rect x="25" y="20" width="14" height="2" rx="1" fill="#93a3d0"/>
      <rect x="25" y="25" width="10" height="2" rx="1" fill="#93a3d0"/>
      <rect x="25" y="30" width="12" height="2" rx="1" fill="#93a3d0"/>
      <rect x="25" y="35" width="8" height="2" rx="1" fill="#93a3d0"/>
      {/* $ badge */}
      <circle cx="46" cy="44" r="10" fill="#475569"/>
      <circle cx="46" cy="44" r="8" fill="#64748b"/>
      <text x="46" y="48" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700" fontFamily="Inter,sans-serif">$</text>
    </svg>
  );
}

/* ───────── 8. Facturi neplătite — orange receipt + clock ───────── */
export function IconFacturiNeplatite({ size = S }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* bg glow */}
      <circle cx="30" cy="32" r="26" fill="#fed7aa" opacity=".35"/>
      {/* receipt body (wavy bottom) */}
      <path d="M14 10 h28 a3 3 0 0 1 3 3 v34 l-4-3 l-4 3 l-4-3 l-4 3 l-4-3 l-4 3 l-4-3 l-4 3 V13 a3 3 0 0 1 3-3z"
        fill="#fdba74" stroke="#ea580c" strokeWidth="1"/>
      {/* lines */}
      <rect x="20" y="18" width="16" height="2" rx="1" fill="#ea580c" opacity=".5"/>
      <rect x="20" y="23" width="12" height="2" rx="1" fill="#ea580c" opacity=".5"/>
      <rect x="20" y="28" width="14" height="2" rx="1" fill="#ea580c" opacity=".5"/>
      <rect x="20" y="33" width="10" height="2" rx="1" fill="#ea580c" opacity=".5"/>
      {/* clock */}
      <circle cx="48" cy="16" r="10" fill="#ef4444"/>
      <circle cx="48" cy="16" r="8" fill="#fef2f2"/>
      <line x1="48" y1="16" x2="48" y2="11" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="48" y1="16" x2="52" y2="16" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="48" cy="16" r="1" fill="#dc2626"/>
    </svg>
  );
}
