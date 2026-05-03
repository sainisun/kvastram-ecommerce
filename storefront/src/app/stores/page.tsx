'use client';

import { useState } from 'react';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  hours: string;
  coordinates: { lat: number; lng: number };
}

const stores: Store[] = [
  {
    id: '1',
    name: 'Kvastram Flagship Store',
    address: '123 Fashion Avenue',
    city: 'New York, NY 10001',
    country: 'USA',
    phone: '+1 (212) 555-0123',
    hours: 'Mon-Sat: 10AM-8PM, Sun: 11AM-6PM',
    coordinates: { lat: 40.7484, lng: -73.9967 },
  },
  {
    id: '2',
    name: 'Kvastram SoHo',
    address: '456 Mercer Street',
    city: 'New York, NY 10012',
    country: 'USA',
    phone: '+1 (212) 555-0456',
    hours: 'Mon-Sat: 10AM-7PM, Sun: 12PM-6PM',
    coordinates: { lat: 40.7243, lng: -73.9985 },
  },
  {
    id: '3',
    name: 'Kvastram Los Angeles',
    address: '789 Melrose Avenue',
    city: 'Los Angeles, CA 90046',
    country: 'USA',
    phone: '+1 (310) 555-0789',
    hours: 'Mon-Sat: 10AM-7PM, Sun: 11AM-6PM',
    coordinates: { lat: 34.0839, lng: -118.3695 },
  },
  {
    id: '4',
    name: 'Kvastram London',
    address: '123 New Bond Street',
    city: 'London W1S 2UD',
    country: 'UK',
    phone: '+44 20 7123 4567',
    hours: 'Mon-Sat: 10AM-7PM, Sun: 12PM-6PM',
    coordinates: { lat: 51.5129, lng: -0.1441 },
  },
  {
    id: '5',
    name: 'Kvastram Dubai',
    address: 'Dubai Mall, Fashion Avenue',
    city: 'Dubai, UAE',
    country: 'UAE',
    phone: '+971 4 123 4567',
    hours: 'Sun-Thu: 10AM-10PM, Fri-Sat: 10AM-12AM',
    coordinates: { lat: 25.1972, lng: 55.2744 },
  },
  {
    id: '6',
    name: 'Kvastram Mumbai',
    address: 'Kochi, Kerala',
    city: 'Kochi 682001',
    country: 'India',
    phone: '+91 484 123 4567',
    hours: 'Daily: 10AM-9PM',
    coordinates: { lat: 9.9312, lng: 76.2673 },
  },
];

export default function StoreLocatorPage() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(stores[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStores = stores.filter(
    (store) =>
      store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDirections = (store: Store) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.lat},${store.coordinates.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-stone-100 bg-stone-50 px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <div className="mx-auto max-w-[1440px] space-y-4 text-center">
          <h1 className="text-display-xl md:text-display-xl font-serif text-stone-900">
            Store Locator
          </h1>
          <p className="text-stone-600 type-light max-w-2xl mx-auto">
            Visit our flagship stores to experience our collection in person.
            Our concierge team is ready to assist you.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by city or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 border-b border-stone-200 py-3 focus:outline-none focus:border-stone-900 text-body-xl"
          />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:gap-16">
          {/* Store List */}
          <div className="space-y-4">
            {filteredStores.map((store) => (
              <div
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className={`p-6 border cursor-pointer transition-all ${
                  selectedStore?.id === store.id
                    ? 'border-stone-900 bg-stone-50'
                    : 'border-stone-100 hover:border-stone-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-body-xl text-stone-900">
                      {store.name}
                    </h3>
                    <p className="text-stone-600 mt-1">{store.address}</p>
                    <p className="text-stone-600">{store.city}</p>
                    <p className="text-stone-500 text-body-sm mt-2">
                      {store.country}
                    </p>
                  </div>
                  <MapPin size={20} className="text-stone-400" />
                </div>

                <div className="mt-4 pt-4 border-t border-stone-100 flex gap-4 text-body-sm text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {store.hours}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Map Placeholder */}
          <div className="bg-stone-100 rounded-lg min-h-[400px] relative overflow-hidden">
            {selectedStore ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <MapPin size={64} className="text-stone-300 mb-4" />
                <p className="text-stone-500 text-center px-8">
                  Map view requires Google Maps API integration.
                  <br />
                  <span className="text-body-sm">
                    Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable.
                  </span>
                </p>
                <div className="mt-6 bg-white p-6 shadow-lg max-w-sm">
                  <h4 className="font-serif text-body-xl text-stone-900">
                    {selectedStore.name}
                  </h4>
                  <p className="text-stone-600 text-body-sm mt-2">
                    {selectedStore.address}
                  </p>
                  <p className="text-stone-600 text-body-sm">{selectedStore.city}</p>
                  <p className="text-stone-500 text-body-sm mt-2">
                    {selectedStore.phone}
                  </p>

                  <button
                    onClick={() => handleDirections(selectedStore)}
                    className="mt-4 w-full bg-stone-900 text-white py-3 text-body-xs type-bold uppercase tracking-token-wider hover:bg-stone-800 flex items-center justify-center gap-2"
                  >
                    Get Directions <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-stone-400">
                Select a store to view on map
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

