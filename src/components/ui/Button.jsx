import React from 'react';
import { motion } from 'framer-motion';

export const Button = React.forwardRef(({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent focus:ring-offset-brand-dark disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary: 'bg-gradient-to-r from-brand-accent to-brand-tech text-brand-dark font-semibold hover:shadow-lg hover:shadow-brand-accent/20 focus:ring-brand-accent',
    secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700/80 focus:ring-slate-600',
    outline: 'bg-transparent text-slate-200 border border-slate-700 hover:border-slate-500 hover:bg-slate-900 focus:ring-slate-600',
    ghost: 'bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 focus:ring-slate-800',
    lavender: 'bg-gradient-to-r from-brand-tech to-brand-lavender text-slate-900 font-semibold hover:shadow-lg hover:shadow-brand-tech/20 focus:ring-brand-tech',
  };

  const sizes = {
    sm: 'text-xs px-4 py-2 gap-1.5',
    md: 'text-sm px-6 py-3 gap-2',
    lg: 'text-base px-8 py-4 gap-2.5',
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';
