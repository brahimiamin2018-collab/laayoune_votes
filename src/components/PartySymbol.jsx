import React from 'react';

// Official Moroccan Political Parties Symbols SVG Component
export default function PartySymbol({ code, couleurHex, logoIcon, className = "w-6 h-6", size = "md" }) {
  const partyCode = (code || '').toUpperCase();

  // If custom logo image is provided (e.g. pi.png for PI)
  if (logoIcon || partyCode === 'PI') {
    const src = logoIcon || '/pi.png';
    return (
      <div className={`relative flex-shrink-0 flex items-center justify-center p-0.5 rounded-xl border border-sky-400/50 bg-slate-900/90 shadow-md ${
        size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-5 h-5' : 'w-7 h-7'
      }`}>
        <img src={src} alt={partyCode} className="w-full h-full object-contain filter drop-shadow" />
      </div>
    );
  }

  // Symbol SVGs for official Moroccan Political Parties
  const renderSymbolSvg = () => {
    const fill = couleurHex || '#38bdf8';

    switch (partyCode) {
      case 'RNI': // Dove (الحمامة)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-sky-400">
            {/* Dove shape */}
            <path d="M21 5c-3.5 0-6 2.5-8 5.5-2.5-3-5.5-4-8.5-3 0 0 1.5 4 4.5 6.5C6.5 15.5 5 18 5 20c2.5 0 5-1.5 7-4 2 2.5 4.5 4 7 4 0-2-1.5-4.5-4-6 3-2.5 6-6.5 6-9s-1.5 0-1.5 0z" fill={fill} fillOpacity="0.25" stroke={fill} />
            <circle cx="17.5" cy="7.5" r="1" fill={fill} />
          </svg>
        );

      case 'PAM': // Tractor (الجرار)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            {/* Tractor */}
            <circle cx="7" cy="17" r="3.5" fill={fill} fillOpacity="0.3" />
            <circle cx="18" cy="17" r="2" fill={fill} fillOpacity="0.3" />
            <path d="M7 17h9M10 17V8h6l2 4v5M4 17H2v-5l4-2M13 8V5h3" />
          </svg>
        );

      case 'USFP': // Rose (الوردة)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            {/* Rose Blossom */}
            <path d="M12 2a4 4 0 0 1 4 4c0 3-4 7-4 7s-4-4-4-7a4 4 0 0 1 4-4z" fill={fill} fillOpacity="0.3" />
            <path d="M12 13v9M12 17c-2 0-4-1-5-3M12 19c2 0 4-1 5-3" />
            <path d="M12 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill={fill} />
          </svg>
        );

      case 'MP': // Ear of Corn / Wheat (السنبلة)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            {/* Wheat Ear */}
            <path d="M12 2v20M12 4c-2 1-3 3-3 5s1 3 3 3M12 4c2 1 3 3 3 5s-1 3-3 3M12 10c-2 1-3 3-3 5s1 3 3 3M12 10c2 1 3 3 3 5s-1 3-3 3" fill={fill} fillOpacity="0.25" />
          </svg>
        );

      case 'PPS': // Book (الكتاب)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            {/* Open Book */}
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" fill={fill} fillOpacity="0.25" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" fill={fill} fillOpacity="0.25" />
          </svg>
        );

      case 'UC': // Horse (الحصان)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            {/* Horse Silhouette */}
            <path d="M20 7l-3 1-2-3-4 1-2 4-4 1-2 4v6h3v-4h2v4h3v-6l2-3 4-1 3-4z" fill={fill} fillOpacity="0.3" />
            <circle cx="17" cy="6" r="1.5" fill={fill} />
          </svg>
        );

      case 'PJD': // Lamp / Lantern (المصباح)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            {/* Lantern Lamp */}
            <path d="M12 2v3M9 5h6l1 4H8l1-4zM7 9l2 9h6l2-9H7z" fill={fill} fillOpacity="0.25" />
            <path d="M10 22h4M12 12v4" strokeWidth="2" />
            <circle cx="12" cy="14" r="1.5" fill={fill} />
          </svg>
        );

      case 'FGD': // Torch / Flame (المشعل)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            {/* Torch */}
            <path d="M12 2c1.5 2 3 3.5 3 6a3 3 0 1 1-6 0c0-2.5 1.5-4 3-6z" fill={fill} fillOpacity="0.4" />
            <path d="M9 11h6l-1.5 11h-3L9 11z" fill={fill} fillOpacity="0.2" />
          </svg>
        );

      case 'MDS': // Palm Tree (النخلة)
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
            {/* Palm Tree */}
            <path d="M12 10v12M12 10c-3-3-7-3-9-1 3 3 7 1 9 1M12 10c3-3 7-3 9-1-3 3-7 1-9 1M12 10c-2-5-6-7-8-6 2 4 6 5 8 6M12 10c2-5 6-7 8-6-2 4-6 5-8 6" fill={fill} fillOpacity="0.3" />
          </svg>
        );

      default:
        // Generic party badge fallback
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={fill} strokeWidth="2" className="w-full h-full">
            <circle cx="12" cy="12" r="8" fill={fill} fillOpacity="0.4" />
          </svg>
        );
    }
  };

  const dimensionClass = size === 'lg' 
    ? 'w-9 h-9 p-1.5' 
    : size === 'sm' 
    ? 'w-5 h-5 p-0.5' 
    : 'w-7 h-7 p-1';

  return (
    <div 
      className={`relative flex-shrink-0 flex items-center justify-center rounded-xl border border-white/20 bg-slate-900/90 shadow-md ${dimensionClass}`}
      style={{ boxShadow: `0 0 10px ${couleurHex || '#38bdf8'}33` }}
      title={partyCode}
    >
      {renderSymbolSvg()}
    </div>
  );
}
