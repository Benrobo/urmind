import React from 'react';
import { cn } from '../../lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = "font-inter font-medium rounded-lg transition-all duration-200 enableBounceEffect focus:outline-none focus:ring-2 focus:ring-purple-100/50";
  
  const variantClasses = {
    primary: "bg-purple-100 text-white hover:bg-purple-102 shadow-lg hover:shadow-xl",
    secondary: "bg-gray-100 text-white hover:bg-gray-101 shadow-lg hover:shadow-xl",
    outline: "border-2 border-white/20 text-white hover:border-white/40 hover:bg-white/10"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
