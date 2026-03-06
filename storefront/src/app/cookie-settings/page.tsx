'use client';

import { useState, useEffect } from 'react';
import { ConsentManager } from '@/lib/consent-manager';

export default function CookieSettingsPage() {
  const [consent, setConsent] = useState(() =>
    ConsentManager.getConsent() ?? {
      timestamp: 0,
      version: '1.0',
      categories: {
        essential: true,
        analytics: false,
        marketing: false,
        session_recording: false,
      },
    }
  );

  const handleToggle = (category: keyof typeof consent.categories) => {
    // essential cannot be toggled
    if (category === 'essential') return;
    setConsent((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category],
      },
    }));
  };

  const handleSave = () => {
    ConsentManager.setConsent(consent.categories);
    // reload so scripts pick up new settings
    window.location.reload();
  };

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-2xl font-bold mb-6">Cookie & Privacy Settings</h1>
      <p className="mb-8">
        Adjust which categories of cookies and tracking technologies you allow.
      </p>
      <div className="space-y-4">
        {(
          Object.keys(consent.categories) as Array<keyof typeof consent.categories>
        ).map((cat) => (
          <div key={cat} className="flex items-center justify-between">
            <label className="capitalize">
              {cat.replace('_', ' ')}{' '}
              {cat === 'essential' && '(required)'}
            </label>
            {cat === 'essential' ? (
              <input type="checkbox" checked readOnly />
            ) : (
              <input
                type="checkbox"
                checked={consent.categories[cat]}
                onChange={() => handleToggle(cat)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-stone-900 text-white rounded"
        >
          Save Preferences
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 border rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
