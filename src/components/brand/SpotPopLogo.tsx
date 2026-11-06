import React from 'react';

interface SpotPopLogoProps {
  variant?: 'icon' | 'full';
  size?: number | string;
  className?: string;
  showText?: boolean;
}

export const SpotPopLogo: React.FC<SpotPopLogoProps> = ({
  variant = 'icon',
  size = 36,
  className = '',
  showText = false,
}) => {
  const isFull = variant === 'full' || showText;

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* SP Sticky Note Icon */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: size }}
        className="shrink-0 drop-shadow-[0_3px_10px_rgba(255,18,130,0.35)]"
      >
        <defs>
          {/* Vibrant Magenta Gradient */}
          <linearGradient id="spPinkGrad" x1="14" y1="18" x2="86" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF1493" />
            <stop offset="100%" stopColor="#FF0077" />
          </linearGradient>

          {/* Curled Fold Gradient */}
          <linearGradient id="spFoldGrad" x1="64" y1="64" x2="86" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFB3D4" />
            <stop offset="100%" stopColor="#FF8FBE" />
          </linearGradient>

          {/* Under-fold shadow */}
          <filter id="foldShadow" x="-20%" y="-20%" width="150%" height="150%">
            <feDropShadow dx="-2" dy="-2" stdDeviation="2.5" floodColor="#8B0045" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Rotated Container for Natural Sticky Angle (-5.5 deg) */}
        <g transform="rotate(-5.5 50 54)">
          {/* Main Pink Sticky Note Body with Cut Corner */}
          <path
            d="M 32 18 
               L 68 18 
               A 14 14 0 0 1 82 32 
               L 82 66 
               L 66 86 
               L 32 86 
               A 14 14 0 0 1 18 72 
               L 18 32 
               A 14 14 0 0 1 32 18 Z"
            fill="url(#spPinkGrad)"
          />

          {/* Folded Ear Shadow */}
          <path
            d="M 82 66 L 66 86 L 64 68 Z"
            fill="#B30054"
            opacity="0.35"
          />

          {/* Curled / Folded Bottom-Right Ear */}
          <path
            d="M 82 66 
               Q 70 68 66 86 
               C 69 76 76 69 82 66 Z"
            fill="url(#spFoldGrad)"
            filter="url(#foldShadow)"
          />

          {/* Translucent Paper Tape at Top */}
          <rect
            x="36"
            y="9"
            width="28"
            height="13"
            rx="2.5"
            transform="rotate(2 50 15)"
            fill="#FFE0ED"
            fillOpacity="0.82"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="0.8"
          />

          {/* White Bold Rounded Letters "SP" */}
          <text
            x="48"
            y="61"
            fill="#FFFFFF"
            fontFamily="'Outfit', 'Fredoka', 'Quicksand', 'Arial Rounded MT Bold', sans-serif"
            fontWeight="900"
            fontSize="34"
            letterSpacing="-1.5"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            SP
          </text>
        </g>
      </svg>

      {/* Brand Text (When Full Variant) */}
      {isFull && (
        <div className="flex items-center tracking-tight font-outfit text-2xl font-black leading-none select-none">
          <span className="text-white">Spot</span>
          <span className="text-[#FF1493] bg-gradient-to-r from-[#FF1493] to-[#FF0077] bg-clip-text text-transparent">
            Pop
          </span>
        </div>
      )}
    </div>
  );
};

export default SpotPopLogo;

