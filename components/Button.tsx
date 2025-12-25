
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'tonal' | 'text' | 'icon-only';
  icon?: React.ReactNode;
  animateIcon?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'filled', 
  className = '', 
  icon,
  animateIcon = false,
  ...props 
}) => {
  // Base: Liquid feel with bouncy transition and no selection
  const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-400 cubic-bezier(0.175, 0.885, 0.32, 1.275) disabled:opacity-50 disabled:cursor-not-allowed active:scale-90 tracking-wide select-none icon-hover-trigger";
  
  const variants = {
    // Filled: "Solid Liquid" - High contrast, deep shadow
    filled: "bg-[#1d1b20] dark:bg-[#e6e1e5] text-white dark:text-[#1d1b20] hover:bg-[#1d1b20]/90 dark:hover:bg-white shadow-lg hover:shadow-2xl hover:-translate-y-1 px-6 py-3.5 rounded-full text-[15px]", 
    
    // Tonal: "Frosted Glass" - See-through with blur
    tonal: "bg-white/40 dark:bg-white/10 backdrop-blur-xl text-gray-900 dark:text-gray-100 hover:bg-white/60 dark:hover:bg-white/20 px-6 py-3.5 rounded-full text-[15px] border border-white/20 dark:border-white/5 shadow-sm hover:shadow-lg", 
    
    // Outlined: Thin border, glass background on hover
    outlined: "border border-gray-300 dark:border-gray-600 text-purple-600 dark:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 backdrop-blur-sm px-6 py-3.5 rounded-full text-[15px]", 
    
    // Text: Minimal interaction
    text: "text-purple-600 dark:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/20 px-5 py-3 rounded-full text-sm", 
    
    // Icon Only: Circle or Squircle, very glassy
    "icon-only": "w-12 h-12 rounded-full text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/20 hover:text-black dark:hover:text-white transition-all shadow-sm hover:shadow-md border border-white/20 dark:border-white/5",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {icon && (
        <span className={`${children ? "w-5 h-5" : ""} ${animateIcon ? 'icon-animate' : ''}`}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};
