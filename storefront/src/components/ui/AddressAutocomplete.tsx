'use client';

import { useEffect, useRef, useState } from 'react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: {
    address_1: string;
    city: string;
    postal_code: string;
    country: string;
  }) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  autoComplete?: string;
}

declare global {
  interface Window {
    google: any;
    initAddressAutocomplete: () => void;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Start typing your address...',
  id = 'address_1',
  name = 'address_1',
  required = true,
  className = '',
  autoComplete = 'street-address',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!API_KEY) {
      console.warn('Google Maps API key not configured');
      return;
    }

    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=initAddressAutocomplete`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      window.initAddressAutocomplete = () => {
        setIsLoaded(true);
      };
    } else {
      const timer = setTimeout(() => setIsLoaded(true), 0);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google) return;

    if (autocompleteRef.current) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'],
          fields: ['address_components', 'formatted_address'],
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();

        if (!place) return;

        const addressData = {
          address_1: '',
          city: '',
          postal_code: '',
          country: '',
        };

        place.address_components?.forEach((component: any) => {
          const types = component.types;

          if (types.includes('street_number')) {
            addressData.address_1 =
              component.long_name + ' ' + addressData.address_1;
          }
          if (types.includes('route')) {
            addressData.address_1 += component.long_name;
          }
          if (types.includes('locality')) {
            addressData.city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            if (!addressData.city) {
              addressData.city = component.long_name;
            }
          }
          if (types.includes('postal_code')) {
            addressData.postal_code = component.long_name;
          }
          if (types.includes('country')) {
            addressData.country = component.short_name;
          }
        });

        onChange(
          addressData.address_1 || place.formatted_address?.split(',')[0] || ''
        );
        onAddressSelect(addressData);
      });
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
    }
  }, [isLoaded, onChange, onAddressSelect]);

  return (
    <input
      ref={inputRef}
      id={id}
      name={name}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={className}
      autoComplete={autoComplete}
    />
  );
}
