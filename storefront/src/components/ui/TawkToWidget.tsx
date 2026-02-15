'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
    interface Window {
        Tawk_API?: any;
        Tawk_LoadStart?: Date;
    }
}

interface TawkToProps {
    propertyId?: string;
}

const TAWK_PROPERTY_ID_REGEX = /^[a-zA-Z0-9_-]+$/;

export function TawkToWidget({ propertyId }: TawkToProps) {
    const scriptRef = useRef<HTMLScriptElement | null>(null);

    useEffect(() => {
        if (!propertyId) {
            console.warn('Tawk.to property ID not configured');
            return;
        }

        if (!TAWK_PROPERTY_ID_REGEX.test(propertyId)) {
            console.error('Invalid Tawk.to property ID format');
            return;
        }

        const script = document.createElement('script');
        script.src = `https://embed.tawk.to/${propertyId}`;
        script.async = true;
        script.charset = 'utf-8';
        script.setAttribute('crossorigin', '*');
        document.head.appendChild(script);
        scriptRef.current = script;

        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_API.embedded = 'chat-container';

        return () => {
            if (scriptRef.current && document.head.contains(scriptRef.current)) {
                document.head.removeChild(scriptRef.current);
            }
            scriptRef.current = null;

            if (window.Tawk_API) {
                delete window.Tawk_API;
            }
            if (window.Tawk_LoadStart) {
                delete window.Tawk_LoadStart;
            }
        };
    }, [propertyId]);

    return null;
}

export function TawkToDirect({ propertyId }: TawkToProps) {
    if (!propertyId) return null;

    if (!TAWK_PROPERTY_ID_REGEX.test(propertyId)) {
        console.error('Invalid Tawk.to property ID format');
        return null;
    }

    return (
        <Script
            id="tawk-direct-script"
            src={`https://embed.tawk.to/${propertyId}`}
            strategy="afterInteractive"
            onError={() => {
                console.error('Failed to load Tawk.to script');
            }}
        />
    );
}
