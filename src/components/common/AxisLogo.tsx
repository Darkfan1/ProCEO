import React from 'react';

interface AxisLogoProps {
  size?: number;
  showWordmark?: boolean;
  subtitle?: string;
  className?: string;
}

export const AxisLogo: React.FC<AxisLogoProps> = ({
  size = 40,
  showWordmark = false,
  subtitle = 'HỆ QUY CHIẾU ĐIỀU HÀNH',
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="relative shrink-0 rounded-[22%] shadow-[0_4px_14px_rgba(12,27,46,0.18)] overflow-hidden"
      >
        <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="axisBgGrad" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0B192C" />
              <stop offset="55%" stopColor="#122742" />
              <stop offset="100%" stopColor="#081322" />
            </linearGradient>
            <linearGradient id="axisGoldGrad" x1="18" y1="14" x2="102" y2="106" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F5DEA0" />
              <stop offset="48%" stopColor="#D5AF5E" />
              <stop offset="100%" stopColor="#B08633" />
            </linearGradient>
            <radialGradient id="axisCenterGlow" cx="60" cy="60" r="46" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#D9B462" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#D9B462" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="120" height="120" rx="26" fill="url(#axisBgGrad)" />
          <rect
            x="2.5"
            y="2.5"
            width="115"
            height="115"
            rx="23.5"
            stroke="url(#axisGoldGrad)"
            strokeOpacity="0.24"
            strokeWidth="1.2"
          />
          <circle cx="60" cy="60" r="46" fill="url(#axisCenterGlow)" />

          {/* Concentric Reference Circles */}
          <circle cx="60" cy="60" r="36" stroke="url(#axisGoldGrad)" strokeWidth="2.1" />
          <circle cx="60" cy="60" r="21.5" stroke="url(#axisGoldGrad)" strokeWidth="1.4" strokeOpacity="0.82" />

          {/* Orthogonal Axis Lines */}
          <line x1="13.5" y1="60" x2="106.5" y2="60" stroke="url(#axisGoldGrad)" strokeWidth="1.85" strokeLinecap="round" />
          <line x1="60" y1="13.5" x2="60" y2="106.5" stroke="url(#axisGoldGrad)" strokeWidth="1.85" strokeLinecap="round" />

          {/* North Strategic Arrowhead */}
          <path d="M60 19.2 L67.4 36.6 L60 31.8 L52.6 36.6 Z" fill="url(#axisGoldGrad)" />

          {/* CEO Pivot Core */}
          <circle cx="60" cy="60" r="6.5" fill="url(#axisGoldGrad)" />
          <circle cx="60" cy="60" r="9.6" stroke="url(#axisGoldGrad)" strokeOpacity="0.34" strokeWidth="0.9" />
        </svg>
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-extrabold tracking-[0.22em] text-[#0C1B2E] leading-none">
              AXIS
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#C69C47]" />
          </div>
          {subtitle && (
            <span className="text-[9.5px] font-semibold tracking-[0.16em] text-slate-400 uppercase mt-1 leading-none">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

