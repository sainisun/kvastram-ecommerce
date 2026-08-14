import { adminAnalyticsApi } from './api-analytics';
import { adminAuthApi } from './api-auth';
import { adminCatalogApi } from './api-catalog';
import { adminContentMediaApi } from './api-content-media';
import { adminCustomersApi } from './api-customers';
import { adminMarketingEngagementApi } from './api-marketing-engagement';
import { adminOrdersApi } from './api-orders';
import { adminProductVariantsApi } from './api-product-variants';
import { adminProductsApi } from './api-products';
import { adminRegionsApi } from './api-regions';
import { adminSettingsApi } from './api-settings';
import { adminUtilitiesApi } from './api-utilities';
import { adminWholesaleCustomersApi } from './api-wholesale-customers';
import { adminWholesaleInquiriesApi } from './api-wholesale-inquiries';
import { adminWholesaleOrdersApi } from './api-wholesale-orders';
import { adminWholesaleTiersApi } from './api-wholesale-tiers';

export type { ApiError, AuthResponse, User } from './api-client-core';

/**
 * Stable compatibility facade for the modular administrative API client.
 * Domain modules own endpoint behavior; consumers continue to import `api`.
 */
export const api = {
  ...adminAuthApi,
  ...adminProductsApi,
  ...adminProductVariantsApi,
  ...adminCustomersApi,
  ...adminOrdersApi,
  ...adminCatalogApi,
  ...adminRegionsApi,
  ...adminContentMediaApi,
  ...adminMarketingEngagementApi,
  ...adminSettingsApi,
  ...adminAnalyticsApi,
  ...adminWholesaleInquiriesApi,
  ...adminWholesaleCustomersApi,
  ...adminWholesaleOrdersApi,
  ...adminWholesaleTiersApi,
  ...adminUtilitiesApi,
};
