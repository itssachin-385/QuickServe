import React from 'react';
import brandIconImg from '../assets/quickserve_brand_icon.png';
import brandLogoImg from '../assets/quickserve_brand_logo.png';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
  variant?: 'emblem' | 'full';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  theme = 'light',
  className = '',
  variant = 'emblem'
}) => {
  const iconSizes = {
    xs: 'w-7 h-7',
    sm: 'w-8 h-8',
    md: 'w-9 h-9 sm:w-10 sm:h-10',
    lg: 'w-12 h-12',
    xl: 'w-24 h-24 sm:w-28 sm:h-28'
  };

  const textSizes = {
    xs: 'text-sm',
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl sm:text-4xl'
  };

  if (variant === 'full') {
    return (
      <div className={`flex items-center ${className}`}>
        <img 
          src={brandLogoImg} 
          alt="QuickServe" 
          className={`${iconSizes[size]} h-auto object-contain drop-shadow-xs`}
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
      {/* Pink House + Speed Arrow Emblem */}
      <div 
        className={`${iconSizes[size]} ${
          theme === 'dark' 
            ? 'bg-white p-1 rounded-xl sm:rounded-2xl shadow-md border border-white/60' 
            : 'p-0.5'
        } flex items-center justify-center shrink-0 transition-transform hover:scale-105`}
      >
        <img 
          src={brandIconImg} 
          alt="QuickServe" 
          className="w-full h-full object-contain drop-shadow-xs"
        />
      </div>

      {showText && (
        <span className={`font-black tracking-tight font-heading leading-none ${textSizes[size]}`}>
          <span className={theme === 'dark' ? 'text-pink-300' : 'text-pink-600'}>Quick</span>
          <span className={theme === 'dark' ? 'text-white' : 'text-[#2B3A4A]'}>Serve</span>
        </span>
      )}
    </div>
  );
};
export default BrandLogo;
