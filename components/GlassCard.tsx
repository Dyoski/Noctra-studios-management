import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, title, className = "", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`glass rounded-2xl p-6 transition-all duration-300 ${onClick ? 'cursor-pointer hover:bg-white/5 active:scale-[0.98]' : ''} ${className}`}
    >
      {title && <h3 className="text-lg font-bold text-white mb-6 tracking-tight text-center">{title}</h3>}
      {children}
    </div>
  );
};

export default GlassCard;