/**
 * API Integration Layer - Task 2 Standardization
 * 
 * This file provides centralized API communication with:
 * ✅ Type-safe request/response handling (api-contracts.ts)
 * ✅ Response validation guards (api-guards.ts)
 * ✅ Unified request wrapper (api-fetch.ts)
 * ✅ Adapter patterns for response transformation
 * 
 * Pattern for adding new endpoints:
 * 1. Define types in /types/api-contracts.ts
 * 2. Use adaptProduct/adaptProducts for transformations
 * 3. Add validation guards to ensure type safety
 * 4. Use try/catch with proper error handling
 * 5. Return standardized response format
 */

import { authAccountApi } from './api-auth-account';
import { catalogApi } from './api-catalog';
import { checkoutPaymentApi } from './api-checkout-payment';
import { API_URL, fetchWithTrace } from './api-client-core';
import { contentMediaApi } from './api-content-media';
import { engagementApi } from './api-engagement';
import { sessionCartApi } from './api-session-cart';
import { wholesaleApi } from './api-wholesale';
import type { HomepagePayload } from '@/types/homepage';

export type { StudioInquiryData } from './api-engagement';

export const api = {
  async getHomepage(): Promise<HomepagePayload> {
    const res = await fetchWithTrace(`${API_URL}/homepage`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error(`Homepage API failed with ${res.status}`);
    }
    return res.json();
  },
  ...checkoutPaymentApi,

  ...sessionCartApi,
  ...contentMediaApi,

  ...catalogApi,

  ...authAccountApi,

  ...wholesaleApi,

  ...engagementApi,

};
