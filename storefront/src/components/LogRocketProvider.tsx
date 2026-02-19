'use client';

import { useEffect, useRef } from 'react';
import LogRocket from 'logrocket';
import { useAuth } from '@/context/auth-context';

const LOGROCKET_APP_ID = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID;

export function LogRocketProvider({ children }: { children: React.ReactNode }) {
    const { customer } = useAuth();
    const initialized = useRef(false);
    const consentGranted = useRef(false);

    // Check for user consent (GDPR/CCPA)
    useEffect(() => {
        const consent = localStorage.getItem('logrocket_consent');
        consentGranted.current = consent === 'true';
    }, []);

    const requestConsent = () => {
        localStorage.setItem('logrocket_consent', 'true');
        consentGranted.current = true;
    };

    useEffect(() => {
        // Only initialize once, if app ID is provided, and user has consented
        if (!LOGROCKET_APP_ID || initialized.current || !consentGranted.current) return;
        
        // Don't initialize in development unless explicitly enabled
        if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_LOGROCKET_DEV) {
            return;
        }

        try {
            LogRocket.init(LOGROCKET_APP_ID, {
                // Sanitize sensitive data
                dom: {
                    // Don't record sensitive input fields
                    inputSanitizer: true,
                    // Hide password fields and other PII
                    privateAttributeBlocklist: ['password', 'credit-card', 'cvv', 'ssn', 'email', 'name', 'address'],
                },
                // Network request/response sanitization
                network: {
                    // Sanitize request bodies that might contain sensitive data
                    requestSanitizer: (request) => {
                        // Remove authorization headers
                        if (request.headers) {
                            delete request.headers['authorization'];
                            delete request.headers['Authorization'];
                        }
                        
                        // Mask sensitive fields in request body
                        if (request.body) {
                            try {
                                const body = JSON.parse(request.body);
                                const piiKeys = ['email', 'name', 'address', 'card_number', 'cvv', 'ssn', 'password', 'creditCard'];
                                piiKeys.forEach(key => {
                                    if (body[key]) body[key] = '[REDACTED]';
                                });
                                // Also check for keys matching PII patterns
                                Object.keys(body).forEach(key => {
                                    if (/(email|name|address|card|cc|cvv|ssn)/i.test(key)) {
                                        body[key] = '[REDACTED]';
                                    }
                                });
                                request.body = JSON.stringify(body);
                            } catch {
                                // Not JSON, leave as is
                            }
                        }
                        return request;
                    },
                    // Sanitize response bodies
                    responseSanitizer: (response) => {
                        // Remove sensitive data from responses
                        if (response.body) {
                            try {
                                const body = JSON.parse(response.body);
                                // Redact tokens
                                if (body.token) body.token = '[REDACTED]';
                                if (body.accessToken) body.accessToken = '[REDACTED]';
                                if (body.refreshToken) body.refreshToken = '[REDACTED]';
                                // Redact PII in response
                                const piiKeys = ['email', 'name', 'address', 'card_number', 'cvv', 'ssn'];
                                piiKeys.forEach(key => {
                                    if (body[key]) body[key] = '[REDACTED]';
                                });
                                response.body = JSON.stringify(body);
                            } catch {
                                // Not JSON, leave as is
                            }
                        }
                        return response;
                    },
                },
                // Console logging options
                console: {
                    // Include all console methods except debug in production
                    isEnabled: {
                        log: true,
                        info: true,
                        warn: true,
                        error: true,
                        debug: process.env.NODE_ENV === 'development',
                    },
                },
                // Release tracking
                release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
            });

            initialized.current = true;
            console.log('[LogRocket] Initialized successfully');
        } catch (error) {
            console.error('[LogRocket] Failed to initialize:', error);
        }
    }, []);

    // Identify user when they log in
    useEffect(() => {
        if (!LOGROCKET_APP_ID || !initialized.current) return;

        if (customer) {
            // User logged in - identify them
            const traits: Record<string, string | number | boolean> = {
                name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
                email: customer.email,
            };
            
            // Only add registration date if it exists
            if (customer.created_at) {
                traits.registrationDate = customer.created_at;
            }
            
            LogRocket.identify(customer.id, traits);
            console.log('[LogRocket] User identified:', customer.id);
        } else {
            // User logged out - anonymize
            LogRocket.identify('anonymous');
        }
    }, [customer]);

    return <>{children}</>;
}

// Export function to request LogRocket consent (to be called from consent banner)
export const requestLogRocketConsent = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('logrocket_consent', 'true');
        window.location.reload(); // Reload to initialize LogRocket
    }
};

// Export LogRocket instance for manual logging
export { LogRocket };
