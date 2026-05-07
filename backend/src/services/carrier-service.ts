export type CarrierProvider =
  | 'shiprocket'
  | 'delhivery'
  | 'easypost'
  | 'shippo';

interface CarrierAddress {
  first_name?: string | null;
  last_name?: string | null;
  address_1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  province?: string | null;
  country_code?: string | null;
}

interface CarrierOrder {
  id?: string;
  email?: string | null;
  currency_code?: string | null;
  shipping_address?: CarrierAddress | null;
  workflow?: {
    label?: {
      package_weight_grams?: number | null;
      package_length_cm?: number | null;
      package_width_cm?: number | null;
      package_height_cm?: number | null;
      carrier_service?: string | null;
    };
  };
}

const PROVIDER_LABELS: Record<CarrierProvider, string> = {
  shiprocket: 'Shiprocket',
  delhivery: 'Delhivery',
  easypost: 'EasyPost',
  shippo: 'Shippo',
};

const PROVIDER_ENV_KEYS: Record<CarrierProvider, string[]> = {
  shiprocket: [
    'SHIPROCKET_API_TOKEN',
    'SHIPROCKET_EMAIL',
    'SHIPROCKET_PASSWORD',
  ],
  delhivery: ['DELHIVERY_API_TOKEN'],
  easypost: ['EASYPOST_API_KEY'],
  shippo: ['SHIPPO_API_TOKEN'],
};

function hasValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasProviderCredentials(provider: CarrierProvider): boolean {
  const keys = PROVIDER_ENV_KEYS[provider];

  if (provider === 'shiprocket') {
    return (
      hasValue(process.env.SHIPROCKET_API_TOKEN) ||
      (hasValue(process.env.SHIPROCKET_EMAIL) &&
        hasValue(process.env.SHIPROCKET_PASSWORD))
    );
  }

  return keys.some((key) => hasValue(process.env[key]));
}

function requiredAddressIssues(address?: CarrierAddress | null) {
  const issues: string[] = [];

  if (!address) {
    return ['Shipping address is missing'];
  }

  if (!hasValue(address.first_name) && !hasValue(address.last_name)) {
    issues.push('Recipient name is missing');
  }
  if (!hasValue(address.address_1)) issues.push('Address line 1 is missing');
  if (!hasValue(address.city)) issues.push('City is missing');
  if (!hasValue(address.postal_code)) issues.push('Postal code is missing');
  if (!hasValue(address.country_code)) issues.push('Country code is missing');

  return issues;
}

function requiredPackageIssues(order: CarrierOrder) {
  const label = order.workflow?.label;
  const issues: string[] = [];

  if (!label?.package_weight_grams || label.package_weight_grams <= 0) {
    issues.push('Package weight is missing');
  }
  if (!label?.package_length_cm || label.package_length_cm <= 0) {
    issues.push('Package length is missing');
  }
  if (!label?.package_width_cm || label.package_width_cm <= 0) {
    issues.push('Package width is missing');
  }
  if (!label?.package_height_cm || label.package_height_cm <= 0) {
    issues.push('Package height is missing');
  }

  return issues;
}

export const carrierService = {
  getProviderStatus() {
    return (Object.keys(PROVIDER_LABELS) as CarrierProvider[]).map(
      (provider) => ({
        provider,
        label: PROVIDER_LABELS[provider],
        configured: hasProviderCredentials(provider),
        required_env: PROVIDER_ENV_KEYS[provider],
      })
    );
  },

  getReadiness(order: CarrierOrder) {
    const providers = this.getProviderStatus();
    const configuredProviders = providers.filter((provider) => provider.configured);
    const address_issues = requiredAddressIssues(order.shipping_address);
    const package_issues = requiredPackageIssues(order);
    const can_fetch_live_rates =
      configuredProviders.length > 0 &&
      address_issues.length === 0 &&
      package_issues.length === 0;

    return {
      providers,
      configured_providers: configuredProviders.map(
        (provider) => provider.provider
      ),
      address_issues,
      package_issues,
      can_fetch_live_rates,
      manual_label_available: true,
      next_action: can_fetch_live_rates
        ? 'Fetch carrier rates'
        : configuredProviders.length === 0
          ? 'Connect a carrier provider'
          : 'Fix address and package details',
    };
  },

  async getRates(
    order: CarrierOrder,
    options: { provider?: CarrierProvider | null } = {}
  ) {
    const readiness = this.getReadiness(order);
    const selectedProvider = options.provider || readiness.configured_providers[0];

    if (!selectedProvider) {
      return {
        readiness,
        rates: [],
        message:
          'No carrier provider credentials are configured. Manual labels remain available.',
      };
    }

    if (!readiness.can_fetch_live_rates) {
      return {
        readiness,
        rates: [],
        message: 'Address and package details must be complete before rates.',
      };
    }

    return {
      readiness,
      rates: [],
      message: `${PROVIDER_LABELS[selectedProvider]} credentials are detected; live rate adapter can now be wired to the provider API.`,
    };
  },
};
