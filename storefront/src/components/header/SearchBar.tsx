'use client';

import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim();
    if (q) {
      router.push(`/products?search=${encodeURIComponent(q)}`);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 44 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}
          className="overflow-hidden border-t border-[#d8d2c8] bg-[#f7f4ef]"
        >
          <form onSubmit={handleSubmit} className="h-[44px] flex items-center px-8 gap-3 max-w-screen-xl mx-auto">
            <Search size={16} className="text-[#b5b0a8] shrink-0" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Search — sarees, kantha jackets, tote bags..."
              className="flex-1 max-w-[400px] bg-transparent border-none outline-none font-[family-name:var(--font-ui)] text-[13px] text-[#1a1714] placeholder:text-[#b5b0a8]"
            />
            <button
              type="button"
              onClick={onClose}
              className="text-[#7a7570] hover:text-[#1a1714] transition-colors"
              aria-label="Close search"
            >
              <X size={16} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
