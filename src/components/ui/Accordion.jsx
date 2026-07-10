import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export const AccordionItem = ({
  title,
  children,
  isOpen,
  onToggle,
  id,
}) => {
  return (
    <div className="border-b border-purple-50 last:border-0 py-2">
      <h3>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={`accordion-content-${id}`}
          id={`accordion-btn-${id}`}
          onClick={onToggle}
          className="flex justify-between items-center w-full text-left py-4 text-gray-900 hover:text-[#7C5CFC] transition-colors font-semibold md:text-lg gap-4"
        >
          <span>{title}</span>
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="text-gray-400 shrink-0"
          >
            <ChevronDown className="w-5 h-5" />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-content-${id}`}
            role="region"
            aria-labelledby={`accordion-btn-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: 'auto', 
              opacity: 1,
              transition: { height: { duration: 0.3, ease: 'easeOut' }, opacity: { duration: 0.2, delay: 0.05 } }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: { height: { duration: 0.25, ease: 'easeIn' }, opacity: { duration: 0.15 } }
            }}
            className="overflow-hidden"
          >
            <div className="pb-6 pr-6 text-gray-600 text-sm md:text-base leading-relaxed">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Accordion = ({ items, className = '' }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm ${className}`}>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          id={index}
          title={item.question}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        >
          {item.answer}
        </AccordionItem>
      ))}
    </div>
  );
};
