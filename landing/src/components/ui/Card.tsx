import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glassmorphism' | 'elevated';
}

export default function Card({ 
  children, 
  className, 
  variant = 'default' 
}: CardProps) {
  const baseClasses = "rounded-xl transition-all duration-300";
  
  const variantClasses = {
    default: "bg-gray-100 border border-gray-102/30",
    glassmorphism: "glassmorphism bg-gray-100/80 backdrop-blur-xl border border-gray-102/30",
    elevated: "bg-gray-100 border border-gray-102/30 shadow-2xl shadow-black/20"
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
