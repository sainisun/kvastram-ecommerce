// Order status display utilities

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'canceled'
  | 'cancelled'
  | 'refunded';
export type PaymentStatus =
  | 'not_paid'
  | 'paid'
  | 'awaiting'
  | 'captured'
  | 'refunded'
  | 'failed';
export type FulfillmentStatus =
  | 'not_fulfilled'
  | 'processing'
  | 'fulfilled'
  | 'shipped'
  | 'partial'
  | 'returned';

export interface StatusConfig {
  label: string;
  className: string;
  bgClass: string;
  borderClass: string;
}

const orderStatusConfig: Partial<Record<OrderStatus, StatusConfig>> = {
  pending: {
    label: 'Pending',
    className: 'text-[var(--ds-warning-text)]',
    bgClass: 'bg-[var(--ds-warning-bg)]',
    borderClass: 'border-[var(--ds-warning)]',
  },
  completed: {
    label: 'Completed',
    className: 'text-success',
    bgClass: 'bg-[var(--ds-success-bg)]',
    borderClass: 'border-[var(--ds-success)]',
  },
  canceled: {
    label: 'Canceled',
    className: 'text-error',
    bgClass: 'bg-[var(--ds-danger-bg)]',
    borderClass: 'border-[var(--ds-danger)]',
  },
  refunded: {
    label: 'Refunded',
    className: 'text-[var(--ds-info-text)]',
    bgClass: 'bg-[var(--ds-info-bg)]',
    borderClass: 'border-[var(--ds-info)]',
  },
  processing: {
    label: 'Processing',
    className: 'text-[var(--ds-warning-text)]',
    bgClass: 'bg-[var(--ds-warning-bg)]',
    borderClass: 'border-[var(--ds-warning)]',
  },
  shipped: {
    label: 'Shipped',
    className: 'text-[var(--ds-info-text)]',
    bgClass: 'bg-[var(--ds-info-bg)]',
    borderClass: 'border-[var(--ds-info)]',
  },
  delivered: {
    label: 'Delivered',
    className: 'text-success',
    bgClass: 'bg-[var(--ds-success-bg)]',
    borderClass: 'border-[var(--ds-success)]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'text-error',
    bgClass: 'bg-[var(--ds-danger-bg)]',
    borderClass: 'border-[var(--ds-danger)]',
  },
};

const paymentStatusConfig: Partial<Record<PaymentStatus, StatusConfig>> = {
  not_paid: {
    label: 'Not Paid',
    className: 'text-[var(--ds-warning-text)]',
    bgClass: 'bg-[var(--ds-warning-bg)]',
    borderClass: 'border-[var(--ds-warning)]',
  },
  paid: {
    label: 'Paid',
    className: 'text-success',
    bgClass: 'bg-[var(--ds-success-bg)]',
    borderClass: 'border-[var(--ds-success)]',
  },
  awaiting: {
    label: 'Awaiting Payment',
    className: 'text-[var(--ds-warning-text)]',
    bgClass: 'bg-[var(--ds-warning-bg)]',
    borderClass: 'border-[var(--ds-warning)]',
  },
  captured: {
    label: 'Paid',
    className: 'text-success',
    bgClass: 'bg-[var(--ds-success-bg)]',
    borderClass: 'border-[var(--ds-success)]',
  },
  refunded: {
    label: 'Refunded',
    className: 'text-[var(--ds-info-text)]',
    bgClass: 'bg-[var(--ds-info-bg)]',
    borderClass: 'border-[var(--ds-info)]',
  },
  failed: {
    label: 'Failed',
    className: 'text-error',
    bgClass: 'bg-[var(--ds-danger-bg)]',
    borderClass: 'border-[var(--ds-danger)]',
  },
};

const fulfillmentStatusConfig: Partial<Record<FulfillmentStatus, StatusConfig>> = {
  not_fulfilled: {
    label: 'Not Fulfilled',
    className: 'text-[var(--ds-warning-text)]',
    bgClass: 'bg-[var(--ds-warning-bg)]',
    borderClass: 'border-[var(--ds-warning)]',
  },
  fulfilled: {
    label: 'Fulfilled',
    className: 'text-success',
    bgClass: 'bg-[var(--ds-success-bg)]',
    borderClass: 'border-[var(--ds-success)]',
  },
  processing: {
    label: 'Processing',
    className: 'text-[var(--ds-warning-text)]',
    bgClass: 'bg-[var(--ds-warning-bg)]',
    borderClass: 'border-[var(--ds-warning)]',
  },
  shipped: {
    label: 'Shipped',
    className: 'text-[var(--ds-info-text)]',
    bgClass: 'bg-[var(--ds-info-bg)]',
    borderClass: 'border-[var(--ds-info)]',
  },
  partial: {
    label: 'Partially Fulfilled',
    className: 'text-[var(--ds-info-text)]',
    bgClass: 'bg-[var(--ds-info-bg)]',
    borderClass: 'border-[var(--ds-info)]',
  },
  returned: {
    label: 'Returned',
    className: 'text-error',
    bgClass: 'bg-[var(--ds-danger-bg)]',
    borderClass: 'border-[var(--ds-danger)]',
  },
};

const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: 'Unknown',
  className: 'text-secondary',
  bgClass: 'bg-parchment',
  borderClass: 'border-border-subtle',
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
