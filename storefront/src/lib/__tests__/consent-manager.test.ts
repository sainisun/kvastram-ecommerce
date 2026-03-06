import { describe, it, expect, beforeEach } from 'vitest';
import { ConsentManager } from '@/lib/consent-manager';

describe('ConsentManager', () => {
    beforeEach(() => {
        ConsentManager.clear();
    });

    it('defaults to no consent', () => {
        expect(ConsentManager.hasConsentFor('analytics')).toBe(false);
    });

    it('stores and reports consent', () => {
        ConsentManager.setConsent({ analytics: true });
        expect(ConsentManager.hasConsentFor('analytics')).toBe(true);
        expect(ConsentManager.getConsent()).toMatchObject({ analytics: true });
    });
});
