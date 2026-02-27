// Order status display utilities

export type OrderStatus = 'pending' | 'completed' | 'canceled' | 'refunded' | 'processing';
export type PaymentStatus = 'not_paid' | 'paid' | 'refunded' | 'failed';
export type FulfillmentStatus = 'not_fulfilled' | 'fulfilled' | 'partial' | 'returned';

export interface StatusConfig {
  label: string;
  className: string;
  bgClass: string;
  borderClass: string;
}

const orderStatusConfig: Partial<Record<OrderStatus, StatusConfig>> = {
  pending: {
    label: 'Pending',
    className: 'text-yellow-700',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
  },
  completed: {
    label: 'Completed',
    className: 'text-green-700',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
  },
  canceled: {
    label: 'Canceled',
    className: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
  },
  refunded: {
    label: 'Refunded',
    className: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  processing: {
    label: 'Processing',
    className: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
};

const paymentStatusConfig: Partial<Record<PaymentStatus, StatusConfig>> = {
  not_paid: {
    label: 'Not Paid',
    className: 'text-yellow-700',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
  },
  paid: {
    label: 'Paid',
    className: 'text-green-700',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
  },
  refunded: {
    label: 'Refunded',
    className: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  failed: {
    label: 'Failed',
    className: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
  },
};

const fulfillmentStatusConfig: Partial<Record<FulfillmentStatus, StatusConfig>> = {
  not_fulfilled: {
    label: 'Not Fulfilled',
    className: 'text-yellow-700',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
  },
  fulfilled: {
    label: 'Fulfilled',
    className: 'text-green-700',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
  },
  partial: {
    label: 'Partially Fulfilled',
    className: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
  },
  returned: {
    label: 'Returned',
    className: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
  },
};

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: 'Unknown',
  className: 'text-stone-700',
  bgClass: 'bg-stone-50',
  borderClass: 'border-stone-200',
};

export function getOrderStatusConfig(status: string): StatusConfig {
  const normalizedStatus = (status || '').toLowerCase();
  const config = orderStatusConfig[normalizedStatus as keyof typeof orderStatusConfig];
  return config ?? { ...DEFAULT_STATUS_CONFIG, label: status || 'Unknown' };
}

export function getPaymentStatusConfig(status: string): StatusConfig {
  const normalizedStatus = (status || '').toLowerCase();
  const config = paymentStatusConfig[normalizedStatus as keyof typeof paymentStatusConfig];
  return config ?? { ...DEFAULT_STATUS_CONFIG, label: status || 'Unknown' };
}

export function getFulfillmentStatusConfig(status: string): StatusConfig {
  const normalizedStatus = (status || '').toLowerCase();
  const config = fulfillmentStatusConfig[normalizedStatus as keyof typeof fulfillmentStatusConfig];
  return config ?? { ...DEFAULT_STATUS_CONFIG, label: status || 'Unknown' };
}

export function getOrderStatusBadgeClass(status: string): string {
  const config = getOrderStatusConfig(status);
  return `${config.bgClass} ${config.className} border ${config.borderClass}`;
}
