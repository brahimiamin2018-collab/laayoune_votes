import React from 'react';

// Official Moroccan Political Parties Emblems Map
const partySymbolImages = {
  'PI': '/symbols/PI.png',
  'RNI': '/symbols/RNI.jpg',
  'PAM': '/symbols/PAM.webp',
  'USFP': '/symbols/FJSA.jpg',
  'FJSA': '/symbols/FJSA.jpg',
  'MP': '/symbols/MP.webp',
  'PPS': '/symbols/PPS.png',
  'UC': '/symbols/UC.png',
  'PJD': '/symbols/PJD.png',
  'FGD': '/symbols/PND.jpg',
  'PND': '/symbols/PND.jpg',
  'MDS': '/symbols/MDS.jpg',
  'UMD': '/symbols/UMD.jpg',
  'PE': '/symbols/PE.png'
};

export default function PartySymbol({ code, couleurHex, logoIcon, size = "md" }) {
  const partyCode = (code || '').toUpperCase();
  const imageSrc = (logoIcon && logoIcon !== 'Vote' && logoIcon.length > 5) ? logoIcon : partySymbolImages[partyCode];

  const dimensionClass = size === 'lg' 
    ? 'w-10 h-10 p-0.5' 
    : size === 'sm' 
    ? 'w-6 h-6 p-0.5' 
    : 'w-8 h-8 p-0.5';

  if (imageSrc) {
    return (
      <div 
        className={`relative flex-shrink-0 flex items-center justify-center rounded-xl border border-sky-400/50 bg-slate-900/90 shadow-md overflow-hidden ring-1 ring-white/10 ${dimensionClass}`}
        style={{ boxShadow: `0 0 10px ${couleurHex || '#38bdf8'}44` }}
        title={partyCode}
      >
        <img 
          src={imageSrc} 
          alt={partyCode} 
          className="w-full h-full object-contain filter drop-shadow" 
          onError={(e) => {
            // Hide image and show text fallback if loading fails
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Fallback colored badge if image is not present
  return (
    <div 
      className={`relative flex-shrink-0 flex items-center justify-center rounded-full border border-white/30 shadow-md ${dimensionClass}`}
      style={{ backgroundColor: couleurHex || '#38bdf8' }}
      title={partyCode}
    >
      <span className="text-[10px] font-black text-white">{partyCode}</span>
    </div>
  );
}
