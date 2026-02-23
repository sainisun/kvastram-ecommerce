'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { countries, commonCountries, getCountryName } from '@/config/countries';

interface CountrySelectProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

export default function CountrySelect({
  name,
  value,
  onChange,
  required = false,
  className = '',
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter countries based on search
  const filteredCountries = search
    ? countries.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : countries;

  // Separate common and other countries
  const common = filteredCountries.filter((c) =>
    commonCountries.includes(c.code)
  );
  const others = filteredCountries.filter(
    (c) => !commonCountries.includes(c.code)
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  const displayValue = value ? getCountryName(value) : '';

  return (
    <div ref={inputRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-transparent border-b border-stone-200 py-3 text-left text-stone-900 focus:outline-none focus:border-stone-900 transition-colors font-light flex items-center justify-between"
        aria-label={required ? `${name}, required` : name}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={displayValue ? 'text-stone-900' : 'text-stone-400'}>
          {displayValue || `Select ${name}`}
        </span>
        <ChevronDown
          size={18}
          className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-stone-200 shadow-xl max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-stone-100">
            <input
              ref={searchRef}
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-stone-200 focus:outline-none focus:border-stone-400"
            />
          </div>

          {/* Countries List */}
          <div className="overflow-y-auto max-h-60">
            {/* Common Countries */}
            {common.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 bg-stone-50">
                  Popular
                </div>
                {common.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-stone-50 ${
                      value === country.code
                        ? 'bg-stone-100 text-stone-900 font-medium'
                        : 'text-stone-700'
                    }`}
                  >
                    <span>{country.name}</span>
                    {value === country.code && (
                      <Check size={16} className="text-stone-900" />
                    )}
                  </button>
                ))}
              </>
            )}

            {/* All Countries */}
            {others.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-stone-400 bg-stone-50">
                  {common.length > 0 ? 'All Countries' : 'Countries'}
                </div>
                {others.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country.code)}
                    className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-stone-50 ${
                      value === country.code
                        ? 'bg-stone-100 text-stone-900 font-medium'
                        : 'text-stone-700'
                    }`}
                  >
                    <span>{country.name}</span>
                    {value === country.code && (
                      <Check size={16} className="text-stone-900" />
                    )}
                  </button>
                ))}
              </>
            )}

            {filteredCountries.length === 0 && (
              <div className="px-4 py-6 text-center text-stone-400 text-sm">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
