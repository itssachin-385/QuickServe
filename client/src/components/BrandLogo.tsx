import React from 'react';
import brandIconImg from '../assets/quickserve_brand_icon.jpg';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  variant?: 'vector' | '3d';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'light',
  className = '',
  variant = 'vector'
}) => {
  const iconSizes = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl'
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl sm:text-4xl'
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Premium Stylized Emblem */}
      <div 
        className={`${iconSizes[size]} bg-gradient-to-br from-pink-500 via-rose-500 to-rose-600 p-1 flex items-center justify-center shadow-md shadow-pink-500/25 border border-pink-400/40 shrink-0 transition-transform hover:scale-105 overflow-hidden`}
      >
        {variant === '3d' ? (
          <img 
            src={brandIconImg} 
            alt="QuickServe" 
            className="w-full h-full object-cover rounded-[inherit]"
          />
        ) : (
          <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
            <defs>
              <linearGradient id="qsGoldRoof" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
              <linearGradient id="qsBolt" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
              <filter id="qsGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Golden House Roof Canopy */}
            <path
              d="M22 5.5L7.5 17L10 19L22 9.5L34 19L36.5 17L22 5.5Z"
              fill="url(#qsGoldRoof)"
              filter="url(#qsGlow)"
            />

            {/* Stylized White 'Q' Ring */}
            <path
              d="M22 12C16.48 12 12 16.48 12 22C12 27.52 16.48 32 22 32C24.35 32 26.5 31.18 28.2 29.8L25.8 27.4C24.7 28.1 23.4 28.5 22 28.5C18.4 28.5 15.5 25.6 15.5 22C15.5 18.4 18.4 15.5 22 15.5C25.6 15.5 28.5 18.4 28.5 22C28.5 23.2 28.1 24.3 27.5 25.2L29.9 27.6C31.2 26 32 24.1 32 22C32 16.48 27.52 12 22 12Z"
              fill="white"
            />

            {/* Dynamic Golden Speed Bolt ⚡ (Tail of the Q) */}
            <path
              d="M23 20.5L18.5 28H23.5L20.5 37.5L31.5 25.5H25.5L28.5 20.5H23Z"
              fill="url(#qsBolt)"
              stroke="#7C2D12"
              strokeWidth="0.5"
              filter="url(#qsGlow)"
            />

            {/* 4-Point Golden Quality Sparkle Star ✨ */}
            <path
              d="M32 7.5L33 9.5L35 10.5L33 11.5L32 13.5L31 11.5L29 10.5L31 9.5L32 7.5Z"
              fill="#FEF08A"
            />
          </svg>
        )}
      </div>

      {showText && (
        <span className={`font-black tracking-tight font-heading leading-none ${textSizes[size]} ${theme === 'dark' ? 'text-white' : 'text-[#1F121C]'}`}>
          Quick<span className={theme === 'dark' ? 'text-yellow-300' : 'text-pink-600'}>Serve</span>
        </span>
      )}
    </div>
  );
};
export default BrandLogo;
