import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({
  children,
  className = '',
  hoverEffect = true,
  glow = false,
  glowColor = 'indigo',
  ...props
}) => {
  const glowClasses = {
    indigo: 'after:absolute after:-inset-px after:-z-10 after:rounded-2xl after:bg-gradient-to-r after:from-brand-tech/20 after:to-brand-lavender/20 after:blur-xl after:opacity-0 after:transition-opacity after:duration-500 hover:after:opacity-100',
    teal: 'after:absolute after:-inset-px after:-z-10 after:rounded-2xl after:bg-gradient-to-r after:from-brand-accent/20 after:to-brand-sage/20 after:blur-xl after:opacity-0 after:transition-opacity after:duration-500 hover:after:opacity-100',
  };

  return (
    <div
      className={`relative glass-card rounded-2xl p-6 md:p-8 ${
        hoverEffect ? 'glass-card-hover' : ''
      } ${glow ? glowClasses[glowColor] : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
