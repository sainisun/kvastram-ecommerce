'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  PackageCheck,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Printer,
  RadioTower,
  RefreshCw,
  Send,
  Truck,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useNotification } from '@/context/notification-context';
import {
  ActionButton,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Surface,
} from '@/components/ui/admin-ui';

const timelineSteps = ['pending', 'processing', 'shipped', 'delivered'];

type WorkflowStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

type LabelStatus = 'draft' | 'created' | 'printed' | 'voided' | 'refunded';
type BuyerUpdateTemplate =
  | 'processing_started'
  | 'packed_with_care'
  | 'delayed'
  | 'delivered_followup'
  | 'custom';

const STATUS_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const LABEL_STATUS_LABELS: Record<LabelStatus, string> = {
  draft: 'Draft',
  created: 'Label created',
  printed: 'Printed',
  voided: 'Voided',
  refunded: 'Refunded',
};

const LABEL_STATUS_OPTIONS: LabelStatus[] = [
  'draft',
  'created',
  'printed',
  'voided',
  'refunded',
];

const BUYER_UPDATE_TEMPLATES: Record<
  BuyerUpdateTemplate,
  { label: string; subject: string; message: string }
> = {
  processing_started: {
    label: 'Processing started',
    subject: 'Your Kvastram order is now being prepared',
    message:
      'Your order is now being prepared by our team. We will share the next update as soon as it is packed and ready to ship.',
  },
  packed_with_care: {
    label: 'Packed with care',
    subject: 'Your Kvastram order has been packed with care',
    message:
      'Your Kvastram piece has been checked, packed with care, and is moving into shipping. Thank you for giving us the time to prepare it properly.',
  },
  delayed: {
    label: 'Delayed',
    subject: 'A quick update on your Kvastram order',
    message:
      'We need a little more time with your order. We are keeping a close eye on it and will share the next update as soon as possible.',
  },
  delivered_followup: {
    label: 'Delivered follow-up',
    subject: 'Checking in on your Kvastram order',
    message:
      'We hope your Kvastram order reached you safely. If anything needs attention, reply to this email and our team will help.',
  },
  custom: {
    label: 'Custom',
    subject: 'Update on your Kvastram order',
    message: '',
  },
};

const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'cancelled', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

function normalizeStatus(status: string): WorkflowStatus {
  const normalized = status.toLowerCase() === 'canceled' ? 'cancelled' : status.toLowerCase();
  return Object.prototype.hasOwnProperty.call(STATUS_LABELS, normalized)
    ? (normalized as WorkflowStatus)
    : 'pending';
}

function getStatusOptions(status: string) {
  const current = normalizeStatus(status);
  return [current, ...VALID_TRANSITIONS[current]];
}

function normalizeWorkflowValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseOptionalInteger(value: string) {
  const normalized = normalizeWorkflowValue(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

function parseMoneyToMinorUnits(value: string) {
  const normalized = normalizeWorkflowValue(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : null;
}

function formatMinorUnitsForInput(value?: number | null) {
  if (typeof value !== 'number') return '';
  return String(value / 100);
}

interface OrderDetails {
  id: string;
  order_number?: string;
  display_id?: string;
  status: string;
  raw_status?: string;
  created_at?: string;
  email: string;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
  customer_phone?: string | null;
  subtotal: number;
  shipping_total: number;
  total: number;
  currency_code?: string;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    address_1?: string;
    address_2?: string | null;
    city?: string;
    postal_code?: string;
    province?: string | null;
    country_code?: string | null;
  } | null;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  tracking_link?: string | null;
  workflow?: {
    ship_by_date?: string | null;
    estimated_delivery_start?: string | null;
    estimated_delivery_end?: string | null;
    customer_note?: string | null;
    internal_note?: string | null;
    needs_attention?: boolean;
    overdue_ship_by?: boolean;
    overdue_tracking?: boolean;
    communication_events?: Array<{
      template?: string;
      subject?: string;
      message?: string;
      sent_at?: string | null;
      channel?: string;
      status?: string;
    }>;
    label?: {
      status?: LabelStatus;
      status_label?: string;
      url?: string | null;
      file_name?: string | null;
      cost?: number | null;
      currency?: string | null;
      package_weight_grams?: number | null;
      package_length_cm?: number | null;
      package_width_cm?: number | null;
      package_height_cm?: number | null;
      carrier_service?: string | null;
      created_at?: string | null;
      printed_at?: string | null;
    };
    timeline?: Array<{
      key: string;
      label: string;
      completed: boolean;
      current: boolean;
    }>;
  };
}

interface OrderItem {
  id: string;
  product_thumbnail?: string | null;
  product_title?: string | null;
  title?: string | null;
  variant_title?: string | null;
  total?: number;
  unit_price: number;
  quantity: number;
}

interface LabelFormState {
  label_status: LabelStatus;
  label_url: string;
  label_file_name: string;
  label_cost: string;
  label_currency: string;
  package_weight_grams: string;
  package_length_cm: string;
  package_width_cm: string;
  package_height_cm: string;
  carrier_service: string;
}

type CarrierProvider = 'shiprocket' | 'delhivery' | 'easypost' | 'shippo';

interface CarrierReadiness {
  providers: Array<{
    provider: CarrierProvider;
    label: string;
    configured: boolean;
    required_env: string[];
  }>;
  configured_providers: CarrierProvider[];
  address_issues: string[];
  package_issues: string[];
  can_fetch_live_rates: boolean;
  manual_label_available: boolean;
  next_action: string;
}

interface CarrierRatesResult {
  readiness: CarrierReadiness;
  rates: Array<{
    id: string;
    provider: CarrierProvider;
    service: string;
    amount: number;
    currency: string;
  }>;
  message?: string;
}

function buildLabelForm(orderData?: OrderDetails | null): LabelFormState {
  const label = orderData?.workflow?.label;
  const currency = label?.currency || orderData?.currency_code || 'INR';

  return {
    label_status: label?.status || 'draft',
    label_url: label?.url || '',
    label_file_name: label?.file_name || '',
    label_cost: formatMinorUnitsForInput(label?.cost),
    label_currency: currency,
    package_weight_grams:
      label?.package_weight_grams != null
        ? String(label.package_weight_grams)
        : '',
    package_length_cm:
      label?.package_length_cm != null ? String(label.package_length_cm) : '',
    package_width_cm:
      label?.package_width_cm != null ? String(label.package_width_cm) : '',
    package_height_cm:
      label?.package_height_cm != null ? String(label.package_height_cm) : '',
    carrier_service: label?.carrier_service || '',
  };
}

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { showNotification } = useNotification();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    ship_by_date: '',
    estimated_delivery_start: '',
    estimated_delivery_end: '',
    customer_note: '',
    internal_note: '',
  });
  const [completeForm, setCompleteForm] = useState({
    ship_date: new Date().toISOString().slice(0, 10),
    tracking_number: '',
    shipping_carrier: '',
    tracking_link: '',
    customer_note: '',
    internal_note: '',
    notify_buyer: true,
  });
  const [labelForm, setLabelForm] = useState<LabelFormState>(() =>
    buildLabelForm()
  );
  const [carrierReadiness, setCarrierReadiness] =
    useState<CarrierReadiness | null>(null);
  const [carrierRates, setCarrierRates] = useState<CarrierRatesResult | null>(
    null
  );
  const [carrierLoading, setCarrierLoading] = useState(false);
  const [buyerUpdateForm, setBuyerUpdateForm] = useState({
    template: 'processing_started' as BuyerUpdateTemplate,
    subject: BUYER_UPDATE_TEMPLATES.processing_started.subject,
    message: BUYER_UPDATE_TEMPLATES.processing_started.message,
    include_tracking: true,
  });

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const data = await api.getOrder(id);
        const orderData = data?.order || data;
        setOrder(orderData);
        setItems(data?.items || orderData?.items || []);
        setWorkflowForm({
          ship_by_date: orderData?.workflow?.ship_by_date || '',
          estimated_delivery_start:
            orderData?.workflow?.estimated_delivery_start || '',
          estimated_delivery_end:
            orderData?.workflow?.estimated_delivery_end || '',
          customer_note: orderData?.workflow?.customer_note || '',
          internal_note: orderData?.workflow?.internal_note || '',
        });
        setCompleteForm({
          ship_date: new Date().toISOString().slice(0, 10),
          tracking_number: orderData?.tracking_number || '',
          shipping_carrier: orderData?.shipping_carrier || '',
          tracking_link: orderData?.tracking_link || '',
          customer_note: orderData?.workflow?.customer_note || '',
          internal_note: orderData?.workflow?.internal_note || '',
          notify_buyer: true,
        });
        setLabelForm(buildLabelForm(orderData));
        try {
          const carrierData = await api.getOrderCarrierReadiness(id);
          setCarrierReadiness(carrierData?.readiness || null);
        } catch (carrierError) {
          console.error('Failed to load carrier readiness:', carrierError);
        }
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [id]);

  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount / 100);

  const workflowTimeline =
    order?.workflow?.timeline?.filter((step) =>
      timelineSteps.includes(step.key)
    ) ||
    timelineSteps.map((step, index) => ({
      key: step,
      label: step,
      completed: index === 0,
      current: index === 1,
    }));
  const communicationEvents = [
    ...(order?.workflow?.communication_events || []),
  ].reverse();

  const handleStatusChange = async (status: string) => {
    try {
      setUpdating(true);
      await api.updateOrderStatus(id, status);
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      showNotification('success', `Order updated to ${status}`);
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to update order'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleInvoiceDownload = async () => {
    try {
      const blob = await api.downloadInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order?.order_number || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Invoice download failed:', error);
    }
  };

  const handleCompleteOrder = async () => {
    if (!completeForm.tracking_number.trim()) {
      showNotification('error', 'Tracking number is required to complete the order');
      return;
    }

    try {
      setUpdating(true);
      await api.addOrderTracking(id, {
        tracking_number: completeForm.tracking_number.trim(),
        shipping_carrier: normalizeWorkflowValue(completeForm.shipping_carrier) || undefined,
        tracking_link: normalizeWorkflowValue(completeForm.tracking_link) || undefined,
        ship_date: normalizeWorkflowValue(completeForm.ship_date),
        customer_note: normalizeWorkflowValue(completeForm.customer_note),
        internal_note: normalizeWorkflowValue(completeForm.internal_note),
        notify_buyer: completeForm.notify_buyer,
      });
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setItems(refreshed?.items || refreshedOrder?.items || []);
      setWorkflowForm({
        ship_by_date: refreshedOrder?.workflow?.ship_by_date || '',
        estimated_delivery_start:
          refreshedOrder?.workflow?.estimated_delivery_start || '',
        estimated_delivery_end:
          refreshedOrder?.workflow?.estimated_delivery_end || '',
        customer_note: refreshedOrder?.workflow?.customer_note || '',
        internal_note: refreshedOrder?.workflow?.internal_note || '',
      });
      setLabelForm(buildLabelForm(refreshedOrder));
      setCompleteModalOpen(false);
      showNotification('success', 'Order completed and tracking saved');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to complete order'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleWorkflowSave = async () => {
    try {
      setUpdating(true);
      await api.updateOrderWorkflow(id, {
        ship_by_date: normalizeWorkflowValue(workflowForm.ship_by_date),
        estimated_delivery_start: normalizeWorkflowValue(
          workflowForm.estimated_delivery_start
        ),
        estimated_delivery_end: normalizeWorkflowValue(
          workflowForm.estimated_delivery_end
        ),
        customer_note: normalizeWorkflowValue(workflowForm.customer_note),
        internal_note: normalizeWorkflowValue(workflowForm.internal_note),
      });
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setWorkflowForm({
        ship_by_date: refreshedOrder?.workflow?.ship_by_date || '',
        estimated_delivery_start:
          refreshedOrder?.workflow?.estimated_delivery_start || '',
        estimated_delivery_end:
          refreshedOrder?.workflow?.estimated_delivery_end || '',
        customer_note: refreshedOrder?.workflow?.customer_note || '',
        internal_note: refreshedOrder?.workflow?.internal_note || '',
      });
      setLabelForm(buildLabelForm(refreshedOrder));
      showNotification('success', 'Order workflow updated');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to update workflow'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleLabelSave = async (nextStatus?: LabelStatus) => {
    const labelStatus = nextStatus || labelForm.label_status;

    try {
      setUpdating(true);
      await api.updateOrderLabel(id, {
        label_status: labelStatus,
        label_url: normalizeWorkflowValue(labelForm.label_url),
        label_file_name: normalizeWorkflowValue(labelForm.label_file_name),
        label_cost: parseMoneyToMinorUnits(labelForm.label_cost),
        label_currency:
          normalizeWorkflowValue(labelForm.label_currency)?.toUpperCase() ||
          order?.currency_code ||
          'INR',
        package_weight_grams: parseOptionalInteger(
          labelForm.package_weight_grams
        ),
        package_length_cm: parseOptionalInteger(labelForm.package_length_cm),
        package_width_cm: parseOptionalInteger(labelForm.package_width_cm),
        package_height_cm: parseOptionalInteger(labelForm.package_height_cm),
        carrier_service: normalizeWorkflowValue(labelForm.carrier_service),
      });
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setItems(refreshed?.items || refreshedOrder?.items || []);
      setLabelForm(buildLabelForm(refreshedOrder));
      try {
        const carrierData = await api.getOrderCarrierReadiness(id);
        setCarrierReadiness(carrierData?.readiness || null);
      } catch (carrierError) {
        console.error('Failed to refresh carrier readiness:', carrierError);
      }
      setCarrierRates(null);
      showNotification(
        'success',
        nextStatus === 'printed'
          ? 'Label marked as printed'
          : 'Label workflow saved'
      );
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to save label workflow'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleCarrierReadiness = async () => {
    try {
      setCarrierLoading(true);
      const carrierData = await api.getOrderCarrierReadiness(id);
      setCarrierReadiness(carrierData?.readiness || null);
      setCarrierRates(null);
      showNotification('success', 'Carrier readiness refreshed');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error
          ? error.message
          : 'Failed to check carrier readiness'
      );
    } finally {
      setCarrierLoading(false);
    }
  };

  const handleCarrierRates = async () => {
    try {
      setCarrierLoading(true);
      const result = await api.getOrderCarrierRates(id);
      setCarrierRates(result);
      setCarrierReadiness(result?.readiness || carrierReadiness);
      showNotification('success', 'Carrier rate check completed');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to fetch carrier rates'
      );
    } finally {
      setCarrierLoading(false);
    }
  };

  const handleBuyerTemplateChange = (template: BuyerUpdateTemplate) => {
    const nextTemplate = BUYER_UPDATE_TEMPLATES[template];
    setBuyerUpdateForm((current) => ({
      ...current,
      template,
      subject: nextTemplate.subject,
      message: nextTemplate.message,
    }));
  };

  const handleBuyerUpdateSend = async () => {
    if (!buyerUpdateForm.subject.trim() || !buyerUpdateForm.message.trim()) {
      showNotification('error', 'Subject and message are required');
      return;
    }

    try {
      setUpdating(true);
      await api.sendOrderBuyerUpdate(id, {
        template: buyerUpdateForm.template,
        subject: buyerUpdateForm.subject.trim(),
        message: buyerUpdateForm.message.trim(),
        include_tracking: buyerUpdateForm.include_tracking,
      });
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      showNotification('success', 'Buyer update sent');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to send buyer update'
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 pb-8 md:px-8">
        <PageHeader
          eyebrow="Orders"
          title="Order details"
          description="Loading the full order record."
        />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="px-4 pb-8 md:px-8">
        <PageHeader
          eyebrow="Orders"
          title="Order not found"
          description="This order could not be loaded."
        />
      </div>
    );
  }

  const canCompleteOrder = !['delivered', 'cancelled', 'refunded'].includes(
    normalizeStatus(order.status)
  );

  return (
    <div className="space-y-6 px-4 pb-8 md:space-y-8 md:px-8">
      <div className="pt-2">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--kv-muted)] hover:text-[var(--kv-text)]"
        >
          <ArrowLeft size={16} />
          Back to orders
        </Link>
      </div>

      <PageHeader
        eyebrow="Order detail"
        title={`Order #${order.order_number || order.display_id || id.slice(0, 8)}`}
        description={`Placed ${order.created_at ? new Date(order.created_at).toLocaleString() : 'recently'} by ${order.email}.`}
        actions={
          <>
            {canCompleteOrder ? (
              <ActionButton
                onClick={() => setCompleteModalOpen(true)}
                icon={PackageCheck}
                variant="primary"
              >
                Complete order
              </ActionButton>
            ) : null}
            <ActionButton onClick={handleInvoiceDownload} icon={Printer} variant="secondary">
              Invoice
            </ActionButton>
            <ActionButton
              href={`mailto:${order.email}?subject=Update on your Kvastram order #${order.order_number || ''}`}
              icon={Mail}
              variant="secondary"
            >
              Send email
            </ActionButton>
          </>
        }
      />

      {completeModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.35rem] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--kv-border)] px-5 py-5 md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                  Fulfillment
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                  Complete order
                </h2>
                <p className="mt-2 text-sm text-[var(--kv-muted)]">
                  Save ship date, tracking, and the buyer-facing note for this shipment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModalOpen(false)}
                className="rounded-full border border-[var(--kv-border)] px-3 py-1.5 text-sm font-semibold text-[var(--kv-text)]"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleCompleteOrder();
              }}
              className="space-y-4 px-5 py-5 md:px-6"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Ship date
                  </span>
                  <input
                    type="date"
                    value={completeForm.ship_date}
                    onChange={(event) =>
                      setCompleteForm((current) => ({
                        ...current,
                        ship_date: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                  />
                </label>
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Carrier
                  </span>
                  <input
                    type="text"
                    value={completeForm.shipping_carrier}
                    onChange={(event) =>
                      setCompleteForm((current) => ({
                        ...current,
                        shipping_carrier: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="Delhivery, Shiprocket, India Post"
                  />
                </label>
              </div>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Tracking number
                </span>
                <input
                  type="text"
                  required
                  value={completeForm.tracking_number}
                  onChange={(event) =>
                    setCompleteForm((current) => ({
                      ...current,
                      tracking_number: event.target.value,
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="Tracking number"
                />
              </label>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Tracking URL
                </span>
                <input
                  type="url"
                  value={completeForm.tracking_link}
                  onChange={(event) =>
                    setCompleteForm((current) => ({
                      ...current,
                      tracking_link: event.target.value,
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="https://..."
                />
              </label>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Note to buyer
                </span>
                <textarea
                  value={completeForm.customer_note}
                  onChange={(event) =>
                    setCompleteForm((current) => ({
                      ...current,
                      customer_note: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="Your Kvastram piece has been packed with care and is on its way."
                />
              </label>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Internal note
                </span>
                <textarea
                  value={completeForm.internal_note}
                  onChange={(event) =>
                    setCompleteForm((current) => ({
                      ...current,
                      internal_note: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="Packaging, carrier pickup, or support notes."
                />
              </label>

              <label className="flex items-start gap-3 rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-text)]">
                <input
                  type="checkbox"
                  checked={completeForm.notify_buyer}
                  onChange={(event) =>
                    setCompleteForm((current) => ({
                      ...current,
                      notify_buyer: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block font-semibold">Notify buyer</span>
                  <span className="mt-1 block text-[var(--kv-muted)]">
                    Send the shipping notification email after tracking is saved.
                  </span>
                </span>
              </label>

              <div className="flex flex-col gap-3 border-t border-[var(--kv-border)] pt-4 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {updating ? 'Completing...' : 'Complete order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <Surface className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                  Order status
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <StatusBadge status={order.status} className="text-sm" />
                  <select
                    value={normalizeStatus(order.status)}
                    onChange={(event) => void handleStatusChange(event.target.value)}
                    disabled={updating}
                    className="border px-4 py-3 text-sm"
                  >
                    {getStatusOptions(order.status).map(
                      (status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="rounded-[1.2rem] bg-[var(--kv-soft)] px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Total
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--kv-text)]">
                  {formatCurrency(order.total, order.currency_code || 'USD')}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {workflowTimeline.map((step, index) => {
                const reached = step.completed || step.current;
                return (
                  <div
                    key={step.key}
                    className={`rounded-[1.1rem] border px-4 py-4 ${
                      reached
                        ? 'border-[var(--kv-accent)] bg-[var(--kv-accent-soft)]'
                        : 'border-[var(--kv-border)] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                          reached
                            ? 'bg-[var(--kv-accent)] text-white'
                            : 'bg-[var(--kv-soft)] text-[var(--kv-muted)]'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold capitalize text-[var(--kv-text)]">
                        {step.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {order.workflow?.needs_attention ? (
              <div className="mt-6 rounded-[1.1rem] border border-[var(--kv-danger)]/20 bg-[var(--kv-danger)]/8 px-4 py-4 text-sm text-[var(--kv-text)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-danger)]">
                  Attention required
                </p>
                <p className="mt-2">
                  {order.workflow?.overdue_ship_by
                    ? 'This order is past its ship-by date and should be reviewed now.'
                    : order.workflow?.overdue_tracking
                      ? 'This order is still missing tracking details.'
                      : 'This workflow needs manual review.'}
                </p>
              </div>
            ) : null}
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader
              title="Products ordered"
              description="Items, quantities, and line totals."
            />
            <div className="divide-y divide-[var(--kv-border)]">
              {items.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-[var(--kv-muted)]">
                  No line items available.
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:px-6"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[var(--kv-soft)]">
                        {item.product_thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product_thumbnail}
                            alt={item.product_title || item.title || 'Product'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package size={20} className="text-[var(--kv-muted)]" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--kv-text)]">
                          {item.product_title || item.title || 'Unknown product'}
                        </p>
                        {item.variant_title && item.variant_title !== 'Default' ? (
                          <p className="mt-1 text-sm text-[var(--kv-muted)]">
                            {item.variant_title}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="md:ml-auto md:text-right">
                      <p className="font-semibold text-[var(--kv-text)]">
                        {formatCurrency(
                          item.total || item.unit_price * item.quantity,
                          order.currency_code || 'USD'
                        )}
                      </p>
                      <p className="mt-1 text-sm text-[var(--kv-muted)]">
                        Qty {item.quantity} x{' '}
                        {formatCurrency(item.unit_price, order.currency_code || 'USD')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[var(--kv-border)] bg-[var(--kv-soft)] px-5 py-5 md:px-6">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--kv-muted)]">Subtotal</span>
                  <span className="font-medium text-[var(--kv-text)]">
                    {formatCurrency(order.subtotal, order.currency_code || 'USD')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--kv-muted)]">Shipping</span>
                  <span className="font-medium text-[var(--kv-text)]">
                    {formatCurrency(
                      order.shipping_total,
                      order.currency_code || 'USD'
                    )}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--kv-border)] pt-4 text-base font-semibold text-[var(--kv-text)]">
                <span>Total</span>
                <span>{formatCurrency(order.total, order.currency_code || 'USD')}</span>
              </div>
            </div>
          </Surface>
        </div>

        <div className="space-y-6">
          <Surface className="overflow-hidden">
            <SectionHeader title="Customer" />
            <div className="space-y-5 px-5 py-5 md:px-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--kv-soft)] text-[var(--kv-accent-deep)]">
                  <User size={18} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--kv-text)]">
                    {order.customer_first_name && order.customer_last_name
                      ? `${order.customer_first_name} ${order.customer_last_name}`
                      : 'Guest customer'}
                  </p>
                  <p className="text-sm text-[var(--kv-muted)]">{order.email}</p>
                </div>
              </div>

              <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                <div className="flex items-start gap-3">
                  <Mail size={16} className="mt-0.5 text-[var(--kv-muted)]" />
                  <div>
                    <p className="font-medium text-[var(--kv-text)]">Contact</p>
                    <p className="mt-1 text-[var(--kv-muted)]">{order.email}</p>
                    <p className="text-[var(--kv-muted)]">
                      {order.customer_phone || 'No phone provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Shipping address" />
            <div className="px-5 py-5 md:px-6">
              {order.shipping_address ? (
                <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-text)]">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="mt-0.5 text-[var(--kv-muted)]" />
                    <div className="leading-6">
                      <p className="font-medium">
                        {order.shipping_address.first_name}{' '}
                        {order.shipping_address.last_name}
                      </p>
                      <p>{order.shipping_address.address_1}</p>
                      {order.shipping_address.address_2 ? (
                        <p>{order.shipping_address.address_2}</p>
                      ) : null}
                      <p>
                        {order.shipping_address.city},{' '}
                        {order.shipping_address.postal_code}
                      </p>
                      <p>
                        {(
                          order.shipping_address.province ||
                          order.shipping_address.country_code ||
                          ''
                        ).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--kv-muted)]">
                  No shipping address captured for this order.
                </p>
              )}
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Buyer communication" />
            <div className="space-y-4 px-5 py-5 md:px-6">
              <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--kv-accent-deep)]">
                    <MessageSquare size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--kv-text)]">
                      Send a buyer update
                    </p>
                    <p className="text-[var(--kv-muted)]">
                      Use a warm template, edit the copy, and log it on the order.
                    </p>
                  </div>
                </div>
              </div>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Template
                </span>
                <select
                  value={buyerUpdateForm.template}
                  onChange={(event) =>
                    handleBuyerTemplateChange(
                      event.target.value as BuyerUpdateTemplate
                    )
                  }
                  className="w-full border px-4 py-3 text-sm"
                >
                  {Object.entries(BUYER_UPDATE_TEMPLATES).map(
                    ([key, template]) => (
                      <option key={key} value={key}>
                        {template.label}
                      </option>
                    )
                  )}
                </select>
              </label>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Subject
                </span>
                <input
                  type="text"
                  value={buyerUpdateForm.subject}
                  onChange={(event) =>
                    setBuyerUpdateForm((current) => ({
                      ...current,
                      subject: event.target.value,
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                />
              </label>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Message
                </span>
                <textarea
                  value={buyerUpdateForm.message}
                  onChange={(event) =>
                    setBuyerUpdateForm((current) => ({
                      ...current,
                      message: event.target.value,
                    }))
                  }
                  rows={5}
                  className="w-full border px-4 py-3 text-sm"
                />
              </label>

              <label className="flex items-start gap-3 rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-text)]">
                <input
                  type="checkbox"
                  checked={buyerUpdateForm.include_tracking}
                  onChange={(event) =>
                    setBuyerUpdateForm((current) => ({
                      ...current,
                      include_tracking: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block font-semibold">Include tracking</span>
                  <span className="mt-1 block text-[var(--kv-muted)]">
                    Add tracking details when this order already has them.
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={() => void handleBuyerUpdateSend()}
                disabled={updating}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Send size={16} />
                {updating ? 'Sending...' : 'Send buyer update'}
              </button>

              <div className="border-t border-[var(--kv-border)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Communication timeline
                </p>
                <div className="mt-3 space-y-3">
                  {communicationEvents.length === 0 ? (
                    <p className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                      No buyer updates sent yet.
                    </p>
                  ) : (
                    communicationEvents.map((event, index) => (
                      <div
                        key={`${event.sent_at || 'event'}-${index}`}
                        className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4 text-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-[var(--kv-text)]">
                              {event.subject || 'Buyer update'}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--kv-muted)]">
                              {event.template || 'custom'} via{' '}
                              {event.channel || 'email'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              event.status === 'failed'
                                ? 'bg-[var(--kv-danger)]/10 text-[var(--kv-danger)]'
                                : 'bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                            }`}
                          >
                            {event.status || 'sent'}
                          </span>
                        </div>
                        {event.message ? (
                          <p className="mt-3 line-clamp-3 text-[var(--kv-muted)]">
                            {event.message}
                          </p>
                        ) : null}
                        {event.sent_at ? (
                          <p className="mt-3 text-xs text-[var(--kv-muted)]">
                            {new Date(event.sent_at).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Workflow details" />
            <div className="space-y-4 px-5 py-5 md:px-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Ship by
                  </span>
                  <input
                    type="date"
                    value={workflowForm.ship_by_date}
                    onChange={(event) =>
                      setWorkflowForm((current) => ({
                        ...current,
                        ship_by_date: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                  />
                </label>
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    ETA start
                  </span>
                  <input
                    type="date"
                    value={workflowForm.estimated_delivery_start}
                    onChange={(event) =>
                      setWorkflowForm((current) => ({
                        ...current,
                        estimated_delivery_start: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                  />
                </label>
              </div>
              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  ETA end
                </span>
                <input
                  type="date"
                  value={workflowForm.estimated_delivery_end}
                  onChange={(event) =>
                    setWorkflowForm((current) => ({
                      ...current,
                      estimated_delivery_end: event.target.value,
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                />
              </label>
              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Customer note
                </span>
                <textarea
                  value={workflowForm.customer_note}
                  onChange={(event) =>
                    setWorkflowForm((current) => ({
                      ...current,
                      customer_note: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="Shown in buyer tracking."
                />
              </label>
              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Internal note
                </span>
                <textarea
                  value={workflowForm.internal_note}
                  onChange={(event) =>
                    setWorkflowForm((current) => ({
                      ...current,
                      internal_note: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="Visible only in admin."
                />
              </label>
              <button
                type="button"
                onClick={() => void handleWorkflowSave()}
                disabled={updating}
                className="w-full rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {updating ? 'Saving…' : 'Save workflow details'}
              </button>
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Manual shipping label" />
            <div className="space-y-4 px-5 py-5 md:px-6">
              <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--kv-accent-deep)]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--kv-text)]">
                      {LABEL_STATUS_LABELS[labelForm.label_status]}
                    </p>
                    <p className="text-[var(--kv-muted)]">
                      {labelForm.label_file_name ||
                        labelForm.label_url ||
                        'No label attached'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Label status
                  </span>
                  <select
                    value={labelForm.label_status}
                    onChange={(event) =>
                      setLabelForm((current) => ({
                        ...current,
                        label_status: event.target.value as LabelStatus,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                  >
                    {LABEL_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {LABEL_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Label cost
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={labelForm.label_cost}
                    onChange={(event) =>
                      setLabelForm((current) => ({
                        ...current,
                        label_cost: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="0.00"
                  />
                </label>
              </div>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Label URL
                </span>
                <input
                  type="url"
                  value={labelForm.label_url}
                  onChange={(event) =>
                    setLabelForm((current) => ({
                      ...current,
                      label_url: event.target.value,
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="https://..."
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    File name
                  </span>
                  <input
                    type="text"
                    value={labelForm.label_file_name}
                    onChange={(event) =>
                      setLabelForm((current) => ({
                        ...current,
                        label_file_name: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="label.pdf"
                  />
                </label>
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Currency
                  </span>
                  <input
                    type="text"
                    maxLength={3}
                    value={labelForm.label_currency}
                    onChange={(event) =>
                      setLabelForm((current) => ({
                        ...current,
                        label_currency: event.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm uppercase"
                    placeholder="INR"
                  />
                </label>
              </div>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Carrier service
                </span>
                <input
                  type="text"
                  value={labelForm.carrier_service}
                  onChange={(event) =>
                    setLabelForm((current) => ({
                      ...current,
                      carrier_service: event.target.value,
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="Delhivery Surface"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Weight grams
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={labelForm.package_weight_grams}
                    onChange={(event) =>
                      setLabelForm((current) => ({
                        ...current,
                        package_weight_grams: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="450"
                  />
                </label>
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Length cm
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={labelForm.package_length_cm}
                    onChange={(event) =>
                      setLabelForm((current) => ({
                        ...current,
                        package_length_cm: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="28"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Width cm
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={labelForm.package_width_cm}
                    onChange={(event) =>
                      setLabelForm((current) => ({
                        ...current,
                        package_width_cm: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="20"
                  />
                </label>
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Height cm
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={labelForm.package_height_cm}
                    onChange={(event) =>
                      setLabelForm((current) => ({
                        ...current,
                        package_height_cm: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="6"
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {labelForm.label_url ? (
                  <ActionButton
                    href={labelForm.label_url}
                    icon={ExternalLink}
                    variant="secondary"
                  >
                    Open label
                  </ActionButton>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleLabelSave('printed')}
                  disabled={updating || !labelForm.label_url}
                  className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)] disabled:opacity-60"
                >
                  Mark printed
                </button>
              </div>

              <button
                type="button"
                onClick={() => void handleLabelSave()}
                disabled={updating}
                className="w-full rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {updating ? 'Saving...' : 'Save label workflow'}
              </button>
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Carrier integration" />
            <div className="space-y-4 px-5 py-5 md:px-6">
              <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--kv-accent-deep)]">
                    <RadioTower size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--kv-text)]">
                      {carrierReadiness?.next_action || 'Check carrier readiness'}
                    </p>
                    <p className="text-[var(--kv-muted)]">
                      {carrierReadiness?.can_fetch_live_rates
                        ? 'Carrier rates can be requested for this shipment.'
                        : 'Manual labels stay available while carrier setup is completed.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {carrierReadiness?.providers?.map((provider) => (
                  <div
                    key={provider.provider}
                    className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[var(--kv-text)]">
                        {provider.label}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          provider.configured
                            ? 'bg-[var(--kv-accent-soft)] text-[var(--kv-accent-deep)]'
                            : 'bg-[var(--kv-soft)] text-[var(--kv-muted)]'
                        }`}
                      >
                        {provider.configured ? 'Connected' : 'Needs env'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--kv-muted)]">
                      {provider.required_env.join(', ')}
                    </p>
                  </div>
                )) || (
                  <div className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4 text-sm text-[var(--kv-muted)] md:col-span-2">
                    Carrier provider status has not been checked yet.
                  </div>
                )}
              </div>

              {carrierReadiness ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Address
                    </p>
                    {carrierReadiness.address_issues.length === 0 ? (
                      <p className="mt-2 font-semibold text-[var(--kv-text)]">
                        Ready
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-[var(--kv-muted)]">
                        {carrierReadiness.address_issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Package
                    </p>
                    {carrierReadiness.package_issues.length === 0 ? (
                      <p className="mt-2 font-semibold text-[var(--kv-text)]">
                        Ready
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-[var(--kv-muted)]">
                        {carrierReadiness.package_issues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}

              {carrierRates?.message ? (
                <div className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                  {carrierRates.message}
                </div>
              ) : null}

              {carrierRates?.rates?.length ? (
                <div className="space-y-2">
                  {carrierRates.rates.map((rate) => (
                    <div
                      key={rate.id}
                      className="flex items-center justify-between rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-[var(--kv-text)]">
                        {rate.service}
                      </span>
                      <span className="text-[var(--kv-muted)]">
                        {formatCurrency(rate.amount, rate.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void handleCarrierReadiness()}
                  disabled={carrierLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)] disabled:opacity-60"
                >
                  <RefreshCw size={16} />
                  Check readiness
                </button>
                <button
                  type="button"
                  onClick={() => void handleCarrierRates()}
                  disabled={carrierLoading}
                  className="rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {carrierLoading ? 'Checking...' : 'Fetch live rates'}
                </button>
              </div>
            </div>
          </Surface>

          <Surface className="overflow-hidden">
            <SectionHeader title="Fulfillment and tracking" />
            <div className="px-5 py-5 md:px-6">
              {order.tracking_number ? (
                <div className="space-y-4 text-sm">
                  <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Tracking number
                    </p>
                    <p className="mt-2 font-semibold text-[var(--kv-text)]">
                      {order.tracking_number}
                    </p>
                    {order.shipping_carrier ? (
                      <p className="mt-2 text-[var(--kv-muted)]">
                        Carrier: {order.shipping_carrier}
                      </p>
                    ) : null}
                  </div>
                  {order.tracking_link ? (
                    <ActionButton
                      href={order.tracking_link}
                      icon={Truck}
                      variant="secondary"
                    >
                      Open tracking link
                    </ActionButton>
                  ) : null}
                </div>
              ) : (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const payload = {
                      tracking_number: formData.get('tracking_number') as string,
                      shipping_carrier:
                        (formData.get('shipping_carrier') as string) || undefined,
                      tracking_link:
                        (formData.get('tracking_link') as string) || undefined,
                    };

                    if (!payload.tracking_number) {
                      return;
                    }

                    try {
                      setUpdating(true);
                      await api.addOrderTracking(id, payload);
                      const refreshed = await api.getOrder(id);
                      const refreshedOrder = refreshed?.order || refreshed;
                      setOrder(refreshedOrder);
                      setLabelForm(buildLabelForm(refreshedOrder));
                      showNotification('success', 'Tracking saved');
                    } catch (error: unknown) {
                      showNotification(
                        'error',
                        error instanceof Error
                          ? error.message
                          : 'Failed to save tracking'
                      );
                    } finally {
                      setUpdating(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <input
                    name="tracking_number"
                    type="text"
                    required
                    placeholder="Tracking number"
                    className="w-full border px-4 py-3 text-sm"
                  />
                  <input
                    name="shipping_carrier"
                    type="text"
                    placeholder="Carrier"
                    className="w-full border px-4 py-3 text-sm"
                  />
                  <input
                    name="tracking_link"
                    type="url"
                    placeholder="Tracking URL"
                    className="w-full border px-4 py-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={updating}
                    className="w-full rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {updating ? 'Saving…' : 'Add tracking number'}
                  </button>
                </form>
              )}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
