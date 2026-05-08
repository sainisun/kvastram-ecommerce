'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  PackageCheck,
  ClipboardCheck,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Printer,
  RadioTower,
  RefreshCw,
  Send,
  Truck,
  Upload,
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

type LabelStatus =
  | 'draft'
  | 'created'
  | 'purchased'
  | 'printed'
  | 'voided'
  | 'refunded';
type BuyerUpdateTemplate =
  | 'order_received'
  | 'processing_started'
  | 'packed_with_care'
  | 'shipped'
  | 'delayed'
  | 'delivered_followup'
  | 'review_request'
  | 'return_refund_update'
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
  purchased: 'Purchased',
  printed: 'Printed',
  voided: 'Voided',
  refunded: 'Refunded',
};

const LABEL_STATUS_OPTIONS: LabelStatus[] = [
  'draft',
  'created',
  'purchased',
  'printed',
  'voided',
  'refunded',
];

const BUYER_UPDATE_TEMPLATES: Record<
  BuyerUpdateTemplate,
  { label: string; subject: string; message: string }
> = {
  order_received: {
    label: 'Order received',
    subject: 'We have received your Kvastram order',
    message:
      'Thank you for your Kvastram order. We have received it safely and will begin preparing it with care.',
  },
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
  shipped: {
    label: 'Shipped',
    subject: 'Your Kvastram order is on its way',
    message:
      'Your Kvastram order has been shipped. We have included the tracking details below so you can follow its journey.',
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
  review_request: {
    label: 'Review request',
    subject: 'How did your Kvastram piece feel?',
    message:
      'We hope your Kvastram piece feels special. If you have a moment, your review helps other buyers understand the craft and care behind it.',
  },
  return_refund_update: {
    label: 'Return/refund update',
    subject: 'Update on your Kvastram support request',
    message:
      'We are sharing an update on your return or refund request. Reply to this email if anything needs more attention from our team.',
  },
  custom: {
    label: 'Custom',
    subject: 'Update on your Kvastram order',
    message: '',
  },
};

const PACKAGING_CHECKS: Array<{
  key: keyof Omit<PackagingChecklistState, 'checked_by'>;
  label: string;
}> = [
  { key: 'product_quality_checked', label: 'Product quality checked' },
  { key: 'size_color_verified', label: 'Size and color verified' },
  { key: 'care_card_included', label: 'Care card included' },
  { key: 'thank_you_note_included', label: 'Thank-you note included' },
  { key: 'gift_wrap_applied', label: 'Gift wrap applied' },
  { key: 'invoice_included', label: 'Invoice included' },
];

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

function formatDateLabel(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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
  packages?: Array<{
    id: string;
    sequence: number;
    ship_date?: string | null;
    delivered_at?: string | null;
    carrier?: string | null;
    service?: string | null;
    label_provider?: string | null;
    tracking_number?: string | null;
    tracking_url?: string | null;
    label_url?: string | null;
    label_file_name?: string | null;
    label_state?: LabelStatus;
    label_cost?: number | null;
    label_currency?: string | null;
    package_weight_grams?: number | null;
    package_length_cm?: number | null;
    package_width_cm?: number | null;
    package_height_cm?: number | null;
    carrier_service?: string | null;
    provider_order_id?: string | null;
    provider_shipment_id?: string | null;
    provider_courier_id?: string | null;
    pickup_reference?: string | null;
    no_tracking?: boolean;
    no_tracking_reason?: string | null;
    notification_sent?: boolean;
  }>;
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
    packaging_checklist?: {
      product_quality_checked?: boolean;
      size_color_verified?: boolean;
      care_card_included?: boolean;
      thank_you_note_included?: boolean;
      gift_wrap_applied?: boolean;
      invoice_included?: boolean;
      checked_at?: string | null;
      checked_by?: string | null;
    };
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
      provider?: string | null;
      provider_order_id?: string | null;
      provider_shipment_id?: string | null;
      provider_courier_id?: string | null;
      pickup_reference?: string | null;
      created_at?: string | null;
      printed_at?: string | null;
    };
    primary_package?: {
      id: string;
      sequence: number;
      ship_date?: string | null;
      delivered_at?: string | null;
      carrier?: string | null;
      service?: string | null;
      label_provider?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      label_url?: string | null;
      label_file_name?: string | null;
      label_state?: LabelStatus;
      label_cost?: number | null;
      label_currency?: string | null;
      package_weight_grams?: number | null;
      package_length_cm?: number | null;
      package_width_cm?: number | null;
      package_height_cm?: number | null;
      carrier_service?: string | null;
      provider_order_id?: string | null;
      provider_shipment_id?: string | null;
      provider_courier_id?: string | null;
      pickup_reference?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      notification_sent?: boolean;
    } | null;
    packages?: Array<{
      id: string;
      sequence: number;
      ship_date?: string | null;
      delivered_at?: string | null;
      carrier?: string | null;
      service?: string | null;
      label_provider?: string | null;
      tracking_number?: string | null;
      tracking_url?: string | null;
      label_url?: string | null;
      label_file_name?: string | null;
      label_state?: LabelStatus;
      label_cost?: number | null;
      label_currency?: string | null;
      package_weight_grams?: number | null;
      package_length_cm?: number | null;
      package_width_cm?: number | null;
      package_height_cm?: number | null;
      carrier_service?: string | null;
      provider_order_id?: string | null;
      provider_shipment_id?: string | null;
      provider_courier_id?: string | null;
      pickup_reference?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      notification_sent?: boolean;
    }>;
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

interface PackageFormState {
  ship_date: string;
  shipping_carrier: string;
  shipping_service: string;
  tracking_number: string;
  tracking_link: string;
  no_tracking: boolean;
  no_tracking_reason: string;
  notify_buyer: boolean;
  delivered_at: string;
}

interface PackagingChecklistState {
  product_quality_checked: boolean;
  size_color_verified: boolean;
  care_card_included: boolean;
  thank_you_note_included: boolean;
  gift_wrap_applied: boolean;
  invoice_included: boolean;
  checked_by: string;
}

interface BuyerMessageSnippet {
  id: string;
  label: string;
  template: BuyerUpdateTemplate;
  subject: string;
  message: string;
  include_tracking: boolean;
}

interface OrderNoteSnippet {
  id: string;
  label: string;
  target: 'customer' | 'internal';
  content: string;
}

function createSnippetId(label: string) {
  const normalized = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${normalized || 'snippet'}-${Date.now()}`;
}

function normalizeBuyerSnippets(value: unknown): BuyerMessageSnippet[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === 'object' && !Array.isArray(entry)
    )
    .map((entry, index) => {
      const templateValue = String(entry.template || 'custom');
      const template = Object.prototype.hasOwnProperty.call(
        BUYER_UPDATE_TEMPLATES,
        templateValue
      )
        ? (templateValue as BuyerUpdateTemplate)
        : 'custom';
      const label =
        typeof entry.label === 'string' && entry.label.trim().length > 0
          ? entry.label.trim()
          : `Snippet ${index + 1}`;
      const subject =
        typeof entry.subject === 'string'
          ? entry.subject
          : BUYER_UPDATE_TEMPLATES[template].subject;
      const message =
        typeof entry.message === 'string'
          ? entry.message
          : BUYER_UPDATE_TEMPLATES[template].message;

      return {
        id:
          typeof entry.id === 'string' && entry.id.trim().length > 0
            ? entry.id
            : createSnippetId(label),
        label,
        template,
        subject,
        message,
        include_tracking: entry.include_tracking !== false,
      };
    });
}

function normalizeNoteSnippets(value: unknown): OrderNoteSnippet[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === 'object' && !Array.isArray(entry)
    )
    .map((entry, index) => {
      const label =
        typeof entry.label === 'string' && entry.label.trim().length > 0
          ? entry.label.trim()
          : `Note ${index + 1}`;
      const target: OrderNoteSnippet['target'] =
        entry.target === 'internal' ? 'internal' : 'customer';

      return {
        id:
          typeof entry.id === 'string' && entry.id.trim().length > 0
            ? entry.id
            : createSnippetId(label),
        label,
        target,
        content: typeof entry.content === 'string' ? entry.content : '',
      };
    })
    .filter((entry) => entry.content.trim().length > 0);
}

function buildPackagingChecklistForm(
  orderData?: OrderDetails | null
): PackagingChecklistState {
  const checklist = orderData?.workflow?.packaging_checklist;

  return {
    product_quality_checked: checklist?.product_quality_checked === true,
    size_color_verified: checklist?.size_color_verified === true,
    care_card_included: checklist?.care_card_included === true,
    thank_you_note_included: checklist?.thank_you_note_included === true,
    gift_wrap_applied: checklist?.gift_wrap_applied === true,
    invoice_included: checklist?.invoice_included === true,
    checked_by: checklist?.checked_by || '',
  };
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
    estimated_delivery_days?: number | null;
  }>;
  message?: string;
}

type WorkflowPackageRecord = NonNullable<
  NonNullable<OrderDetails['workflow']>['packages']
>[number];

function getOrderDisplayNumber(order?: OrderDetails | null) {
  return order?.order_number || order?.display_id || order?.id || 'your order';
}

function getBuyerFirstName(order?: OrderDetails | null) {
  const firstName = order?.customer_first_name?.trim();
  return firstName && firstName.length > 0 ? firstName : 'there';
}

function hasCommunicationTemplate(
  order: OrderDetails | null,
  template: BuyerUpdateTemplate
) {
  return (order?.workflow?.communication_events || []).some(
    (event) => event.template === template
  );
}

function buildBuyerUpdateDraft(
  order: OrderDetails | null,
  template: BuyerUpdateTemplate
) {
  const defaults = BUYER_UPDATE_TEMPLATES[template];
  if (!order) {
    return {
      template,
      subject: defaults.subject,
      message: defaults.message,
      include_tracking: template === 'shipped',
    };
  }

  const firstName = getBuyerFirstName(order);
  const orderNumber = getOrderDisplayNumber(order);
  const etaStart = formatDateLabel(order.workflow?.estimated_delivery_start);
  const etaEnd = formatDateLabel(order.workflow?.estimated_delivery_end);
  const etaRange =
    etaStart && etaEnd
      ? `${etaStart} to ${etaEnd}`
      : etaStart || etaEnd || 'the expected delivery window';
  const shipBy = formatDateLabel(order.workflow?.ship_by_date);
  const trackingTone = order.tracking_number
    ? 'You can use the tracking details in this email to follow every movement.'
    : 'We will share tracking as soon as it is ready.';

  const dynamicMessages: Record<BuyerUpdateTemplate, string> = {
    order_received: `Hi ${firstName},\n\nThank you for placing order #${orderNumber} with Kvastram. We have received it safely and our team will begin preparing it with care.\n\nWe will keep you posted as it moves through the next steps.`,
    processing_started: `Hi ${firstName},\n\nYour Kvastram order #${orderNumber} is now being prepared. We are checking the piece carefully before it moves to packing.\n\n${
      shipBy
        ? `We are currently working toward a ship-by date of ${shipBy}.`
        : 'We will share the shipping timeline as soon as it is locked in.'
    }`,
    packed_with_care: `Hi ${firstName},\n\nYour order #${orderNumber} has been quality checked and packed with care. It is now moving into the shipping stage.\n\n${
      etaStart || etaEnd
        ? `At the moment, we expect delivery around ${etaRange}.`
        : 'We will share the delivery window as soon as the shipment is booked.'
    }`,
    shipped: `Hi ${firstName},\n\nYour Kvastram order #${orderNumber} is now on its way.\n\n${trackingTone}\n\n${
      etaStart || etaEnd
        ? `Our current delivery estimate is ${etaRange}.`
        : 'We will keep a close eye on the shipment while it travels to you.'
    }`,
    delayed: `Hi ${firstName},\n\nA quick update on order #${orderNumber}: we need a little more time before it can move to the next step.\n\nWe are actively watching it and will send the next update as soon as we have firmer movement to share.`,
    delivered_followup: `Hi ${firstName},\n\nWe are checking in on order #${orderNumber} and hope it reached you safely.\n\nIf anything needs attention, simply reply to this email and our team will help right away. If everything feels good, we hope the piece settles beautifully into your wardrobe.`,
    review_request: `Hi ${firstName},\n\nWe hope order #${orderNumber} feels special in person.\n\nIf you have a moment, a review from you would help other buyers understand the craft and care behind Kvastram.`,
    return_refund_update: `Hi ${firstName},\n\nWe wanted to share an update on your support request for order #${orderNumber}.\n\nIf anything still needs clarification, reply here and our team will keep it moving for you.`,
    custom: defaults.message,
  };

  return {
    template,
    subject:
      template === 'custom'
        ? defaults.subject
        : `${defaults.subject} (#${orderNumber})`,
    message: dynamicMessages[template] || defaults.message,
    include_tracking: template === 'shipped',
  };
}

function getRecommendedBuyerTemplates(order: OrderDetails | null) {
  if (!order) return ['processing_started', 'packed_with_care'] as BuyerUpdateTemplate[];

  const status = normalizeStatus(order.status);
  const recommendations: BuyerUpdateTemplate[] = [];

  if (status === 'pending') {
    recommendations.push('order_received', 'processing_started');
  } else if (status === 'processing') {
    recommendations.push('processing_started', 'packed_with_care', 'delayed');
  } else if (status === 'shipped') {
    recommendations.push('shipped', 'delayed');
  } else if (status === 'delivered') {
    recommendations.push('delivered_followup', 'review_request');
  } else if (status === 'cancelled' || status === 'refunded') {
    recommendations.push('return_refund_update');
  }

  recommendations.push('custom');

  const unique = recommendations.filter(
    (template, index) => recommendations.indexOf(template) === index
  );
  const unsent = unique.filter((template) =>
    template === 'custom' ? true : !hasCommunicationTemplate(order, template)
  );

  return unsent.length > 0 ? unsent : unique;
}

function buildPackageLabelForm(
  orderData?: OrderDetails | null,
  pkg?: WorkflowPackageRecord | null
): LabelFormState {
  const primaryPackageId = orderData?.workflow?.primary_package?.id || null;
  const workflowLabel =
    !pkg || pkg.id === primaryPackageId ? orderData?.workflow?.label : null;
  const currency =
    pkg?.label_currency ||
    workflowLabel?.currency ||
    orderData?.currency_code ||
    'INR';

  return {
    label_status: pkg?.label_state || workflowLabel?.status || 'draft',
    label_url: pkg?.label_url || workflowLabel?.url || '',
    label_file_name: pkg?.label_file_name || workflowLabel?.file_name || '',
    label_cost: formatMinorUnitsForInput(pkg?.label_cost ?? workflowLabel?.cost),
    label_currency: currency,
    package_weight_grams:
      pkg?.package_weight_grams != null
        ? String(pkg.package_weight_grams)
        : workflowLabel?.package_weight_grams != null
          ? String(workflowLabel.package_weight_grams)
          : '',
    package_length_cm:
      pkg?.package_length_cm != null
        ? String(pkg.package_length_cm)
        : workflowLabel?.package_length_cm != null
          ? String(workflowLabel.package_length_cm)
          : '',
    package_width_cm:
      pkg?.package_width_cm != null
        ? String(pkg.package_width_cm)
        : workflowLabel?.package_width_cm != null
          ? String(workflowLabel.package_width_cm)
          : '',
    package_height_cm:
      pkg?.package_height_cm != null
        ? String(pkg.package_height_cm)
        : workflowLabel?.package_height_cm != null
          ? String(workflowLabel.package_height_cm)
          : '',
    carrier_service: pkg?.carrier_service || workflowLabel?.carrier_service || '',
  };
}

function buildPackageForm(pkg?: WorkflowPackageRecord | null): PackageFormState {
  return {
    ship_date: pkg?.ship_date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    shipping_carrier: pkg?.carrier || '',
    shipping_service: pkg?.service || '',
    tracking_number: pkg?.tracking_number || '',
    tracking_link: pkg?.tracking_url || '',
    no_tracking: pkg?.no_tracking === true,
    no_tracking_reason: pkg?.no_tracking_reason || '',
    notify_buyer: false,
    delivered_at: pkg?.delivered_at?.slice(0, 10) || '',
  };
}

function getWorkflowPackages(order?: OrderDetails | null) {
  return order?.workflow?.packages || [];
}

function getPackageById(
  order: OrderDetails | null | undefined,
  packageId: string | null | undefined
) {
  if (!order || !packageId) return null;
  return getWorkflowPackages(order).find((pkg) => pkg.id === packageId) || null;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
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
    shipping_service: '',
    tracking_link: '',
    no_tracking: false,
    no_tracking_reason: '',
    customer_note: '',
    internal_note: '',
    notify_buyer: true,
    send_admin_copy: false,
  });
  const [addPackageForm, setAddPackageForm] = useState<PackageFormState>(() =>
    buildPackageForm()
  );
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editPackageForm, setEditPackageForm] = useState<PackageFormState>(() =>
    buildPackageForm()
  );
  const [labelForm, setLabelForm] = useState<LabelFormState>(() =>
    buildPackageLabelForm()
  );
  const [labelPackageId, setLabelPackageId] = useState<string | null>(null);
  const [labelUploading, setLabelUploading] = useState(false);
  const [carrierReadiness, setCarrierReadiness] =
    useState<CarrierReadiness | null>(null);
  const [carrierRates, setCarrierRates] = useState<CarrierRatesResult | null>(
    null
  );
  const [carrierLoading, setCarrierLoading] = useState(false);
  const [selectedCarrierProvider, setSelectedCarrierProvider] =
    useState<CarrierProvider | 'auto'>('auto');
  const [buyerUpdateForm, setBuyerUpdateForm] = useState({
    template: 'processing_started' as BuyerUpdateTemplate,
    subject: BUYER_UPDATE_TEMPLATES.processing_started.subject,
    message: BUYER_UPDATE_TEMPLATES.processing_started.message,
    include_tracking: true,
  });
  const [buyerSnippets, setBuyerSnippets] = useState<BuyerMessageSnippet[]>([]);
  const [noteSnippets, setNoteSnippets] = useState<OrderNoteSnippet[]>([]);
  const [packagingChecklist, setPackagingChecklist] =
    useState<PackagingChecklistState>(() => buildPackagingChecklistForm());
  const requestedAction = searchParams.get('action');

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
        const primaryPackage =
          orderData?.workflow?.primary_package || orderData?.workflow?.packages?.[0];
        const nextLabelPackageId =
          primaryPackage?.id || orderData?.workflow?.packages?.[0]?.id || null;
        setCompleteForm({
          ship_date:
            primaryPackage?.ship_date?.slice(0, 10) ||
            new Date().toISOString().slice(0, 10),
          tracking_number:
            primaryPackage?.tracking_number || orderData?.tracking_number || '',
          shipping_carrier:
            primaryPackage?.carrier || orderData?.shipping_carrier || '',
          shipping_service: primaryPackage?.service || '',
          tracking_link:
            primaryPackage?.tracking_url || orderData?.tracking_link || '',
          no_tracking: primaryPackage?.no_tracking === true,
          no_tracking_reason: primaryPackage?.no_tracking_reason || '',
          customer_note: orderData?.workflow?.customer_note || '',
          internal_note: orderData?.workflow?.internal_note || '',
          notify_buyer: true,
          send_admin_copy: false,
        });
        setAddPackageForm(buildPackageForm());
        setEditingPackageId(null);
        setEditPackageForm(buildPackageForm(primaryPackage || null));
        setLabelPackageId(nextLabelPackageId);
        setLabelForm(
          buildPackageLabelForm(
            orderData,
            nextLabelPackageId ? getPackageById(orderData, nextLabelPackageId) : null
          )
        );
        setPackagingChecklist(buildPackagingChecklistForm(orderData));
        try {
          const carrierData = await api.getOrderCarrierReadiness(id);
          setCarrierReadiness(carrierData?.readiness || null);
          const configuredProvider =
            carrierData?.readiness?.configured_providers?.[0];
          setSelectedCarrierProvider(configuredProvider || 'auto');
        } catch (carrierError) {
          console.error('Failed to load carrier readiness:', carrierError);
        }
        setBuyerUpdateForm(buildBuyerUpdateDraft(orderData, 'processing_started'));
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadOrder();
  }, [id]);

  useEffect(() => {
    const loadWorkflowSnippets = async () => {
      try {
        const settingsResponse = await api.getSettings();
        const generalSettings = settingsResponse?.settings?.general || {};
        setBuyerSnippets(
          normalizeBuyerSnippets(generalSettings.order_workflow_buyer_snippets)
        );
        setNoteSnippets(
          normalizeNoteSnippets(generalSettings.order_workflow_note_snippets)
        );
      } catch (error) {
        console.error('Failed to load order workflow snippets', error);
      }
    };

    void loadWorkflowSnippets();
  }, []);

  useEffect(() => {
    if (!order || !requestedAction) return;

    if (requestedAction === 'complete') {
      setCompleteModalOpen(true);
      return;
    }

    if (requestedAction === 'edit-tracking') {
      const primaryPackage = order.workflow?.primary_package || order.workflow?.packages?.[0];
      if (primaryPackage) {
        setEditingPackageId(primaryPackage.id);
        setEditPackageForm(buildPackageForm(primaryPackage));
      }
    }

    const sectionId =
      requestedAction === 'message-buyer'
        ? 'buyer-communication'
        : requestedAction === 'add-package' || requestedAction === 'edit-tracking'
          ? 'fulfillment-and-tracking'
          : null;

    if (!sectionId) return;

    const timer = window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [order, requestedAction]);

  useEffect(() => {
    if (!order) return;

    const packages = getWorkflowPackages(order);
    const resolvedPackageId =
      labelPackageId && packages.some((pkg) => pkg.id === labelPackageId)
        ? labelPackageId
        : order.workflow?.primary_package?.id || packages[0]?.id || null;

    if (resolvedPackageId !== labelPackageId) {
      setLabelPackageId(resolvedPackageId);
    }

    setLabelForm(
      buildPackageLabelForm(order, getPackageById(order, resolvedPackageId))
    );
  }, [labelPackageId, order]);

  useEffect(() => {
    setCarrierRates(null);
    setCarrierReadiness(null);
  }, [labelPackageId]);

  const persistBuyerSnippets = async (nextSnippets: BuyerMessageSnippet[]) => {
    await api.updateSetting(
      'order_workflow_buyer_snippets',
      nextSnippets,
      'general'
    );
    setBuyerSnippets(nextSnippets);
  };

  const persistNoteSnippets = async (nextSnippets: OrderNoteSnippet[]) => {
    await api.updateSetting(
      'order_workflow_note_snippets',
      nextSnippets,
      'general'
    );
    setNoteSnippets(nextSnippets);
  };

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
  const recommendedTemplates = getRecommendedBuyerTemplates(order);
  const selectedLabelPackage =
    getPackageById(order, labelPackageId) || order?.workflow?.primary_package || null;
  const primaryShipment =
    order?.workflow?.primary_package || order?.workflow?.packages?.[0] || null;
  const packageCount =
    order?.workflow?.packages?.length || (primaryShipment ? 1 : 0);
  const customerNoteSnippets = noteSnippets.filter(
    (snippet) => snippet.target === 'customer'
  );
  const internalNoteSnippets = noteSnippets.filter(
    (snippet) => snippet.target === 'internal'
  );
  const completeOrderSubject = `Your Kvastram order #${
    order?.order_number || id.slice(0, 8)
  } has shipped`;
  const completeOrderPreview = completeForm.no_tracking
    ? 'Buyer will receive a shipped update without tracking details.'
    : completeForm.tracking_number.trim()
      ? `Buyer will receive tracking ${completeForm.tracking_number.trim()}${
          completeForm.shipping_carrier.trim()
            ? ` via ${completeForm.shipping_carrier.trim()}`
            : ''
        }.`
      : 'Buyer notification is ready once tracking details are added.';

  const openTrackingEditor = () => {
    if (primaryShipment) {
      startEditingPackage(primaryShipment);
    } else if (
      !['delivered', 'cancelled', 'refunded'].includes(
        normalizeStatus(order?.status || 'pending')
      )
    ) {
      setCompleteModalOpen(true);
    }

    document.getElementById('fulfillment-and-tracking')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const openLabelManager = () => {
    if (primaryShipment?.id) {
      setLabelPackageId(primaryShipment.id);
    }

    document.getElementById('manual-shipping-label')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

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
    if (!completeForm.no_tracking && !completeForm.tracking_number.trim()) {
      showNotification(
        'error',
        'Tracking number is required unless this shipment has no tracking'
      );
      return;
    }

    try {
      setUpdating(true);
      await api.completeOrder(id, {
        tracking_number: completeForm.no_tracking
          ? null
          : completeForm.tracking_number.trim(),
        shipping_carrier:
          normalizeWorkflowValue(completeForm.shipping_carrier) || undefined,
        shipping_service:
          normalizeWorkflowValue(completeForm.shipping_service) || undefined,
        tracking_link: completeForm.no_tracking
          ? null
          : normalizeWorkflowValue(completeForm.tracking_link) || undefined,
        no_tracking: completeForm.no_tracking,
        no_tracking_reason: completeForm.no_tracking
          ? normalizeWorkflowValue(completeForm.no_tracking_reason)
          : null,
        ship_date: normalizeWorkflowValue(completeForm.ship_date),
        customer_note: normalizeWorkflowValue(completeForm.customer_note),
        internal_note: normalizeWorkflowValue(completeForm.internal_note),
        notify_buyer: completeForm.notify_buyer,
        send_admin_copy: completeForm.send_admin_copy,
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
      setLabelForm(
        buildPackageLabelForm(
          refreshedOrder,
          getPackageById(refreshedOrder, labelPackageId)
        )
      );
      setCompleteModalOpen(false);
      showNotification('success', 'Order completed and shipment saved');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to complete order'
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleAddPackage = async () => {
    if (!addPackageForm.no_tracking && !addPackageForm.tracking_number.trim()) {
      showNotification(
        'error',
        'Tracking number is required unless this package has no tracking'
      );
      return;
    }

    try {
      setUpdating(true);
      await api.addOrderPackage(id, {
        ship_date: normalizeWorkflowValue(addPackageForm.ship_date),
        shipping_carrier:
          normalizeWorkflowValue(addPackageForm.shipping_carrier) || undefined,
        shipping_service:
          normalizeWorkflowValue(addPackageForm.shipping_service) || undefined,
        tracking_number: addPackageForm.no_tracking
          ? null
          : addPackageForm.tracking_number.trim(),
        tracking_link: addPackageForm.no_tracking
          ? null
          : normalizeWorkflowValue(addPackageForm.tracking_link) || undefined,
        no_tracking: addPackageForm.no_tracking,
        no_tracking_reason: addPackageForm.no_tracking
          ? normalizeWorkflowValue(addPackageForm.no_tracking_reason)
          : null,
        notify_buyer: addPackageForm.notify_buyer,
      });
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setItems(refreshed?.items || refreshedOrder?.items || []);
      setAddPackageForm(buildPackageForm());
      showNotification('success', 'Package added to order');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to add package'
      );
    } finally {
      setUpdating(false);
    }
  };

  const startEditingPackage = (pkg: WorkflowPackageRecord) => {
    setEditingPackageId(pkg.id);
    setEditPackageForm(buildPackageForm(pkg));
  };

  const cancelEditingPackage = () => {
    setEditingPackageId(null);
    setEditPackageForm(buildPackageForm());
  };

  const handleUpdatePackage = async () => {
    if (!editingPackageId) return;

    if (!editPackageForm.no_tracking && !editPackageForm.tracking_number.trim()) {
      showNotification(
        'error',
        'Tracking number is required unless this package has no tracking'
      );
      return;
    }

    try {
      setUpdating(true);
      await api.updateOrderPackage(id, editingPackageId, {
        ship_date: normalizeWorkflowValue(editPackageForm.ship_date),
        shipping_carrier:
          normalizeWorkflowValue(editPackageForm.shipping_carrier) || undefined,
        shipping_service:
          normalizeWorkflowValue(editPackageForm.shipping_service) || undefined,
        tracking_number: editPackageForm.no_tracking
          ? null
          : editPackageForm.tracking_number.trim(),
        tracking_link: editPackageForm.no_tracking
          ? null
          : normalizeWorkflowValue(editPackageForm.tracking_link) || undefined,
        no_tracking: editPackageForm.no_tracking,
        no_tracking_reason: editPackageForm.no_tracking
          ? normalizeWorkflowValue(editPackageForm.no_tracking_reason)
          : null,
        notify_buyer: editPackageForm.notify_buyer,
        delivered_at: normalizeWorkflowValue(editPackageForm.delivered_at),
      });
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setItems(refreshed?.items || refreshedOrder?.items || []);
      const refreshedPackage = (
        refreshedOrder?.workflow?.packages || []
      ).find((pkg: WorkflowPackageRecord) => pkg.id === editingPackageId);
      setEditPackageForm(buildPackageForm(refreshedPackage || null));
      setEditingPackageId(null);
      showNotification('success', 'Package updated');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to update package'
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
      setLabelForm(
        buildPackageLabelForm(
          refreshedOrder,
          getPackageById(refreshedOrder, labelPackageId)
        )
      );
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
    const targetPackageId = labelPackageId;

    try {
      setUpdating(true);
      if (targetPackageId) {
        await api.updateOrderPackage(id, targetPackageId, {
          label_state: labelStatus,
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
      } else {
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
      }
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setItems(refreshed?.items || refreshedOrder?.items || []);
      setLabelForm(
        buildPackageLabelForm(
          refreshedOrder,
          getPackageById(refreshedOrder, targetPackageId)
        )
      );
      try {
        const carrierData = await api.getOrderCarrierReadiness(id, {
          provider:
            selectedCarrierProvider === 'auto'
              ? null
              : selectedCarrierProvider,
          package_id: targetPackageId,
        });
        setCarrierReadiness(carrierData?.readiness || null);
        const configuredProvider =
          carrierData?.readiness?.configured_providers?.[0];
        if (selectedCarrierProvider === 'auto') {
          setSelectedCarrierProvider(configuredProvider || 'auto');
        }
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

  const handleLabelUpload = async (file?: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      showNotification('error', 'Only PDF label files can be uploaded');
      return;
    }

    try {
      setLabelUploading(true);
      const targetPackageId = labelPackageId;
      const uploaded = await api.uploadOrderLabel(file);
      const nextLabelForm = {
        ...labelForm,
        label_status: 'created' as LabelStatus,
        label_url: uploaded.url,
        label_file_name: uploaded.originalName || uploaded.filename || file.name,
      };
      setLabelForm(nextLabelForm);
      if (targetPackageId) {
        await api.updateOrderPackage(id, targetPackageId, {
          label_state: 'created',
          label_url: nextLabelForm.label_url,
          label_file_name: nextLabelForm.label_file_name,
          label_cost: parseMoneyToMinorUnits(nextLabelForm.label_cost),
          label_currency:
            normalizeWorkflowValue(nextLabelForm.label_currency)?.toUpperCase() ||
            order?.currency_code ||
            'INR',
          package_weight_grams: parseOptionalInteger(
            nextLabelForm.package_weight_grams
          ),
          package_length_cm: parseOptionalInteger(nextLabelForm.package_length_cm),
          package_width_cm: parseOptionalInteger(nextLabelForm.package_width_cm),
          package_height_cm: parseOptionalInteger(nextLabelForm.package_height_cm),
          carrier_service: normalizeWorkflowValue(nextLabelForm.carrier_service),
        });
      } else {
        await api.updateOrderLabel(id, {
          label_status: 'created',
          label_url: nextLabelForm.label_url,
          label_file_name: nextLabelForm.label_file_name,
          label_cost: parseMoneyToMinorUnits(nextLabelForm.label_cost),
          label_currency:
            normalizeWorkflowValue(nextLabelForm.label_currency)?.toUpperCase() ||
            order?.currency_code ||
            'INR',
          package_weight_grams: parseOptionalInteger(
            nextLabelForm.package_weight_grams
          ),
          package_length_cm: parseOptionalInteger(nextLabelForm.package_length_cm),
          package_width_cm: parseOptionalInteger(nextLabelForm.package_width_cm),
          package_height_cm: parseOptionalInteger(nextLabelForm.package_height_cm),
          carrier_service: normalizeWorkflowValue(nextLabelForm.carrier_service),
        });
      }
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setLabelForm(
        buildPackageLabelForm(
          refreshedOrder,
          getPackageById(refreshedOrder, targetPackageId)
        )
      );
      showNotification('success', 'Label PDF uploaded and attached');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to upload label PDF'
      );
    } finally {
      setLabelUploading(false);
    }
  };

  const handleCarrierReadiness = async () => {
    try {
      setCarrierLoading(true);
      const carrierData = await api.getOrderCarrierReadiness(id, {
        provider:
          selectedCarrierProvider === 'auto'
            ? null
            : selectedCarrierProvider,
        package_id: labelPackageId,
      });
      setCarrierReadiness(carrierData?.readiness || null);
      const configuredProvider = carrierData?.readiness?.configured_providers?.[0];
      setSelectedCarrierProvider(configuredProvider || 'auto');
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
      const result = await api.getOrderCarrierRates(id, {
        provider:
          selectedCarrierProvider === 'auto'
            ? null
            : selectedCarrierProvider,
        package_id: labelPackageId,
      });
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

  const handleCarrierLabelPurchase = async (courierId: string | number) => {
    try {
      setCarrierLoading(true);
      const result = await api.purchaseOrderCarrierLabel(id, {
        provider:
          selectedCarrierProvider === 'auto'
            ? 'shiprocket'
            : selectedCarrierProvider,
        package_id: labelPackageId,
        courier_id: courierId,
      });
      const nextOrder = result?.order;
      if (nextOrder) {
        setOrder(nextOrder);
        setLabelForm(
          buildPackageLabelForm(nextOrder, getPackageById(nextOrder, labelPackageId))
        );
      }
      setCarrierRates(null);
      showNotification('success', 'Carrier label purchased');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error
          ? error.message
          : 'Failed to purchase carrier label'
      );
    } finally {
      setCarrierLoading(false);
    }
  };

  const handleBuyerTemplateChange = (template: BuyerUpdateTemplate) => {
    setBuyerUpdateForm((current) => ({
      ...current,
      ...buildBuyerUpdateDraft(order, template),
    }));
  };

  const applyBuyerSnippet = (snippet: BuyerMessageSnippet) => {
    setBuyerUpdateForm({
      template: snippet.template,
      subject: snippet.subject,
      message: snippet.message,
      include_tracking: snippet.include_tracking,
    });
  };

  const handleSaveBuyerSnippet = async () => {
    if (!buyerUpdateForm.subject.trim() || !buyerUpdateForm.message.trim()) {
      showNotification('error', 'Subject and message are required before saving');
      return;
    }

    const label = window.prompt('Snippet name', buyerUpdateForm.subject.trim());
    if (!label) return;

    try {
      const nextSnippets = [
        ...buyerSnippets,
        {
          id: createSnippetId(label),
          label: label.trim(),
          template: buyerUpdateForm.template,
          subject: buyerUpdateForm.subject.trim(),
          message: buyerUpdateForm.message.trim(),
          include_tracking: buyerUpdateForm.include_tracking,
        },
      ];
      await persistBuyerSnippets(nextSnippets);
      showNotification('success', 'Buyer snippet saved');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to save buyer snippet'
      );
    }
  };

  const handleDeleteBuyerSnippet = async (snippetId: string) => {
    try {
      const nextSnippets = buyerSnippets.filter((snippet) => snippet.id !== snippetId);
      await persistBuyerSnippets(nextSnippets);
      showNotification('success', 'Buyer snippet removed');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to delete buyer snippet'
      );
    }
  };

  const applyNoteSnippet = (snippet: OrderNoteSnippet) => {
    setWorkflowForm((current) => ({
      ...current,
      customer_note:
        snippet.target === 'customer' ? snippet.content : current.customer_note,
      internal_note:
        snippet.target === 'internal' ? snippet.content : current.internal_note,
    }));
  };

  const handleSaveNoteSnippet = async (target: 'customer' | 'internal') => {
    const content =
      target === 'customer'
        ? workflowForm.customer_note.trim()
        : workflowForm.internal_note.trim();

    if (!content) {
      showNotification('error', 'Write the note first, then save it as a snippet');
      return;
    }

    const defaultLabel =
      target === 'customer' ? 'Customer note snippet' : 'Internal note snippet';
    const label = window.prompt('Snippet name', defaultLabel);
    if (!label) return;

    try {
      const nextSnippets = [
        ...noteSnippets,
        {
          id: createSnippetId(label),
          label: label.trim(),
          target,
          content,
        },
      ];
      await persistNoteSnippets(nextSnippets);
      showNotification('success', 'Note snippet saved');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to save note snippet'
      );
    }
  };

  const handleDeleteNoteSnippet = async (snippetId: string) => {
    try {
      const nextSnippets = noteSnippets.filter((snippet) => snippet.id !== snippetId);
      await persistNoteSnippets(nextSnippets);
      showNotification('success', 'Note snippet removed');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error ? error.message : 'Failed to delete note snippet'
      );
    }
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
      setBuyerUpdateForm(
        buildBuyerUpdateDraft(
          refreshedOrder,
          normalizeStatus(refreshedOrder.status) === 'delivered'
            ? 'review_request'
            : buyerUpdateForm.template
        )
      );
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

  const handlePackagingChecklistSave = async () => {
    try {
      setUpdating(true);
      await api.updateOrderPackagingChecklist(id, {
        ...packagingChecklist,
        checked_by: normalizeWorkflowValue(packagingChecklist.checked_by),
      });
      const refreshed = await api.getOrder(id);
      const refreshedOrder = refreshed?.order || refreshed;
      setOrder(refreshedOrder);
      setPackagingChecklist(buildPackagingChecklistForm(refreshedOrder));
      showNotification('success', 'Packaging checklist saved');
    } catch (error: unknown) {
      showNotification(
        'error',
        error instanceof Error
          ? error.message
          : 'Failed to save packaging checklist'
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
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Service
                  </span>
                  <input
                    type="text"
                    value={completeForm.shipping_service}
                    onChange={(event) =>
                      setCompleteForm((current) => ({
                        ...current,
                        shipping_service: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="Surface, Air, Express"
                  />
                </label>
                <label className="flex items-center gap-3 rounded-[1rem] border border-[var(--kv-border)] px-4 py-3 text-sm text-[var(--kv-text)]">
                  <input
                    type="checkbox"
                    checked={completeForm.no_tracking}
                    onChange={(event) =>
                      setCompleteForm((current) => ({
                        ...current,
                        no_tracking: event.target.checked,
                      }))
                    }
                  />
                  <span>This order doesn&apos;t have tracking</span>
                </label>
              </div>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Tracking number
                </span>
                <input
                  type="text"
                  required={!completeForm.no_tracking}
                  value={completeForm.tracking_number}
                  onChange={(event) =>
                    setCompleteForm((current) => ({
                      ...current,
                      tracking_number: event.target.value,
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="Tracking number"
                  disabled={completeForm.no_tracking}
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
                  disabled={completeForm.no_tracking}
                />
              </label>

              {completeForm.no_tracking ? (
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    No-tracking reason
                  </span>
                  <input
                    type="text"
                    value={completeForm.no_tracking_reason}
                    onChange={(event) =>
                      setCompleteForm((current) => ({
                        ...current,
                        no_tracking_reason: event.target.value,
                      }))
                    }
                    className="w-full border px-4 py-3 text-sm"
                    placeholder="Hand delivery, local pickup, bespoke courier"
                  />
                </label>
              ) : null}

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

              <div className="rounded-[1.1rem] border border-[var(--kv-border)] bg-white px-4 py-4 text-sm text-[var(--kv-text)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Buyer email preview
                </p>
                <p className="mt-2 font-semibold text-[var(--kv-text)]">
                  {completeOrderSubject}
                </p>
                <p className="mt-2 text-[var(--kv-muted)]">{completeOrderPreview}</p>
                {completeForm.customer_note ? (
                  <p className="mt-3 rounded-2xl bg-[var(--kv-soft)] px-3 py-3 text-[var(--kv-text)]">
                    {completeForm.customer_note}
                  </p>
                ) : null}
              </div>

              <label className="flex items-start gap-3 rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-text)]">
                <input
                  type="checkbox"
                  checked={completeForm.send_admin_copy}
                  onChange={(event) =>
                    setCompleteForm((current) => ({
                      ...current,
                      send_admin_copy: event.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4"
                  disabled={!completeForm.notify_buyer}
                />
                <span>
                  <span className="block font-semibold">Email admin copy</span>
                  <span className="mt-1 block text-[var(--kv-muted)]">
                    Send the same shipment email to the admin inbox for reference.
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

      <Surface className="overflow-hidden">
        <div className="border-b border-[var(--kv-border)] px-5 py-4 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--kv-muted)]">
                Shipping workbench
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--kv-text)]">
                Track, label, package, and notify from one place
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-[var(--kv-muted)]">
                This is the shipment-first surface. Tracking link, no-tracking reason,
                package count, label state, and buyer update shortcuts stay visible
                before the rest of the order detail.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton onClick={openTrackingEditor} icon={Truck}>
                {primaryShipment ? 'Edit tracking' : 'Start shipment'}
              </ActionButton>
              <ActionButton onClick={openLabelManager} icon={FileText} variant="secondary">
                Manage label
              </ActionButton>
              <ActionButton
                onClick={() =>
                  document.getElementById('buyer-communication')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
                icon={MessageSquare}
                variant="secondary"
              >
                Buyer updates
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 md:px-6 xl:grid-cols-[1.05fr_1.25fr_1fr_1fr]">
          <div className="border border-[var(--kv-border)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
              Workflow
            </p>
            <div className="mt-3 flex items-center gap-2">
              <StatusBadge status={order.status} className="text-[11px]" />
            </div>
            <div className="mt-3 space-y-2 text-sm text-[var(--kv-muted)]">
              <p>
                Ship by:{' '}
                <span className="font-medium text-[var(--kv-text)]">
                  {order.workflow?.ship_by_date
                    ? formatDateLabel(order.workflow.ship_by_date)
                    : 'Not set'}
                </span>
              </p>
              <p>
                ETA:{' '}
                <span className="font-medium text-[var(--kv-text)]">
                  {order.workflow?.estimated_delivery_start &&
                  order.workflow?.estimated_delivery_end
                    ? `${formatDateLabel(order.workflow?.estimated_delivery_start)} - ${formatDateLabel(order.workflow?.estimated_delivery_end)}`
                    : 'Not set'}
                </span>
              </p>
              <p>
                Buyer note:{' '}
                <span className="font-medium text-[var(--kv-text)]">
                  {order.workflow?.customer_note || 'Not added yet'}
                </span>
              </p>
            </div>
          </div>

          <div className="border border-[var(--kv-border)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
              Primary shipment
            </p>
            {primaryShipment ? (
              <>
                <p className="mt-3 text-lg font-semibold text-[var(--kv-text)]">
                  {primaryShipment.no_tracking
                    ? 'No tracking selected'
                    : primaryShipment.tracking_number || 'Tracking not filled yet'}
                </p>
                <p className="mt-2 text-sm text-[var(--kv-muted)]">
                  {[primaryShipment.carrier, primaryShipment.service]
                    .filter(Boolean)
                    .join(' • ') || 'Carrier and service not filled yet'}
                </p>
                <div className="mt-3 space-y-2 text-sm text-[var(--kv-muted)]">
                  <p>
                    Tracking link:{' '}
                    <span className="font-medium text-[var(--kv-text)]">
                      {primaryShipment.tracking_url ? 'Added' : 'Missing'}
                    </span>
                  </p>
                  {primaryShipment.no_tracking_reason ? (
                    <p>
                      No-tracking reason:{' '}
                      <span className="font-medium text-[var(--kv-text)]">
                        {primaryShipment.no_tracking_reason}
                      </span>
                    </p>
                  ) : null}
                  {primaryShipment.ship_date ? (
                    <p>
                      Ship date:{' '}
                      <span className="font-medium text-[var(--kv-text)]">
                        {formatDateLabel(primaryShipment.ship_date)}
                      </span>
                    </p>
                  ) : null}
                </div>
                {primaryShipment.tracking_url ? (
                  <div className="mt-4">
                    <ActionButton
                      href={primaryShipment.tracking_url}
                      icon={ExternalLink}
                      variant="secondary"
                    >
                      Open tracking link
                    </ActionButton>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--kv-muted)]">
                No package exists yet. Use Complete order to create package #1 and
                save the first tracking or no-tracking decision.
              </p>
            )}
          </div>

          <div className="border border-[var(--kv-border)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
              Packages
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--kv-text)]">
              {packageCount}
            </p>
            <div className="mt-3 space-y-2 text-sm text-[var(--kv-muted)]">
              <p>
                Latest label state:{' '}
                <span className="font-medium text-[var(--kv-text)]">
                  {primaryShipment?.label_state || order.workflow?.label?.status || 'draft'}
                </span>
              </p>
              <p>
                Label link:{' '}
                <span className="font-medium text-[var(--kv-text)]">
                  {primaryShipment?.label_url || order.workflow?.label?.url
                    ? 'Available'
                    : 'Not attached'}
                </span>
              </p>
              <p>
                Provider:{' '}
                <span className="font-medium text-[var(--kv-text)]">
                  {primaryShipment?.label_provider || order.workflow?.label?.provider || 'Manual / not set'}
                </span>
              </p>
            </div>
            <div className="mt-4">
              <ActionButton
                onClick={() =>
                  document.getElementById('fulfillment-and-tracking')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
                icon={Package}
                variant="secondary"
              >
                Open packages
              </ActionButton>
            </div>
          </div>

          <div className="border border-[var(--kv-border)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
              Quick actions
            </p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={openTrackingEditor}
                className="flex w-full items-center justify-between border border-[var(--kv-border)] px-3 py-3 text-sm font-medium text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
              >
                <span>Fill tracking / no tracking</span>
                <Truck size={16} />
              </button>
              <button
                type="button"
                onClick={openLabelManager}
                className="flex w-full items-center justify-between border border-[var(--kv-border)] px-3 py-3 text-sm font-medium text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
              >
                <span>Open label workflow</span>
                <FileText size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('fulfillment-and-tracking')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
                className="flex w-full items-center justify-between border border-[var(--kv-border)] px-3 py-3 text-sm font-medium text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
              >
                <span>Add another package</span>
                <Package size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('buyer-communication')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
                className="flex w-full items-center justify-between border border-[var(--kv-border)] px-3 py-3 text-sm font-medium text-[var(--kv-text)] hover:bg-[var(--kv-soft)]"
              >
                <span>Send buyer update</span>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </Surface>

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
            <div id="buyer-communication" />
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

              {labelPackageId ? (
                <div className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                  Shiprocket actions will use package #
                  {getPackageById(order, labelPackageId)?.sequence || 1}
                  {' '}and its current dimensions.
                </div>
              ) : null}

              <div className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Recommended next updates
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recommendedTemplates.map((template) => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => handleBuyerTemplateChange(template)}
                      className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${
                        buyerUpdateForm.template === template
                          ? 'bg-[var(--kv-accent)] text-white'
                          : 'bg-[var(--kv-soft)] text-[var(--kv-text)]'
                      }`}
                    >
                      {BUYER_UPDATE_TEMPLATES[template].label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-[var(--kv-muted)]">
                  Suggestions adapt to the current order status and hide updates that have already been sent.
                </p>
              </div>

              <div className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Saved snippets
                    </p>
                    <p className="mt-2 text-sm text-[var(--kv-muted)]">
                      Save your own buyer update copy for repeated situations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSaveBuyerSnippet()}
                    className="rounded-full border border-[var(--kv-border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-text)]"
                  >
                    Save current
                  </button>
                </div>
                {buyerSnippets.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {buyerSnippets.map((snippet) => (
                      <div
                        key={snippet.id}
                        className="flex items-center justify-between gap-3 rounded-[1rem] bg-[var(--kv-soft)] px-3 py-3 text-sm"
                      >
                        <button
                          type="button"
                          onClick={() => applyBuyerSnippet(snippet)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <span className="block truncate font-semibold text-[var(--kv-text)]">
                            {snippet.label}
                          </span>
                          <span className="block truncate text-[var(--kv-muted)]">
                            {snippet.subject}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteBuyerSnippet(snippet.id)}
                          className="rounded-full border border-[var(--kv-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 rounded-[1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                    No saved snippets yet.
                  </p>
                )}
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
            <SectionHeader title="Packaging checklist" />
            <div className="space-y-4 px-5 py-5 md:px-6">
              <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--kv-accent-deep)]">
                    <ClipboardCheck size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--kv-text)]">
                      Personal brand pack-out
                    </p>
                    <p className="text-[var(--kv-muted)]">
                      Confirm the order feels checked, thoughtful, and ready to receive.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {PACKAGING_CHECKS.map((check) => (
                  <label
                    key={check.key}
                    className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-3 text-sm text-[var(--kv-text)]"
                  >
                    <span className="font-medium">{check.label}</span>
                    <input
                      type="checkbox"
                      checked={packagingChecklist[check.key]}
                      onChange={(event) =>
                        setPackagingChecklist((current) => ({
                          ...current,
                          [check.key]: event.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                  </label>
                ))}
              </div>

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Checked by
                </span>
                <input
                  type="text"
                  value={packagingChecklist.checked_by}
                  onChange={(event) =>
                    setPackagingChecklist((current) => ({
                      ...current,
                      checked_by: event.target.value,
                    }))
                  }
                  className="w-full border px-4 py-3 text-sm"
                  placeholder="Team member"
                />
              </label>

              {order.workflow?.packaging_checklist?.checked_at ? (
                <p className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-3 text-sm text-[var(--kv-muted)]">
                  Last checked{' '}
                  {new Date(
                    order.workflow.packaging_checklist.checked_at
                  ).toLocaleString()}
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => void handlePackagingChecklistSave()}
                disabled={updating}
                className="w-full rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {updating ? 'Saving...' : 'Save packaging checklist'}
              </button>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Customer note snippets
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSaveNoteSnippet('customer')}
                      className="rounded-full border border-[var(--kv-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-text)]"
                    >
                      Save current
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {customerNoteSnippets.length > 0 ? (
                      customerNoteSnippets.map((snippet) => (
                        <div
                          key={snippet.id}
                          className="flex items-center justify-between gap-3 rounded-[1rem] bg-[var(--kv-soft)] px-3 py-3 text-sm"
                        >
                          <button
                            type="button"
                            onClick={() => applyNoteSnippet(snippet)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block truncate font-semibold text-[var(--kv-text)]">
                              {snippet.label}
                            </span>
                            <span className="block truncate text-[var(--kv-muted)]">
                              {snippet.content}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteNoteSnippet(snippet.id)}
                            className="rounded-full border border-[var(--kv-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-[1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                        No saved customer note snippets yet.
                      </p>
                    )}
                  </div>
                </div>
                <div className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Internal note snippets
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleSaveNoteSnippet('internal')}
                      className="rounded-full border border-[var(--kv-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-text)]"
                    >
                      Save current
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {internalNoteSnippets.length > 0 ? (
                      internalNoteSnippets.map((snippet) => (
                        <div
                          key={snippet.id}
                          className="flex items-center justify-between gap-3 rounded-[1rem] bg-[var(--kv-soft)] px-3 py-3 text-sm"
                        >
                          <button
                            type="button"
                            onClick={() => applyNoteSnippet(snippet)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block truncate font-semibold text-[var(--kv-text)]">
                              {snippet.label}
                            </span>
                            <span className="block truncate text-[var(--kv-muted)]">
                              {snippet.content}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteNoteSnippet(snippet.id)}
                            className="rounded-full border border-[var(--kv-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-[1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                        No saved internal note snippets yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
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
            <div id="manual-shipping-label" />
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
                      {labelPackageId ? `Package ${getPackageById(order, labelPackageId)?.sequence || 1} - ` : ''}
                      {labelForm.label_file_name ||
                        labelForm.label_url ||
                        'No label attached'}
                    </p>
                  </div>
                </div>
              </div>

              {(order.workflow?.packages || []).length > 0 ? (
                <label className="text-sm text-[var(--kv-text)]">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Label package
                  </span>
                  <select
                    value={labelPackageId || ''}
                    onChange={(event) => setLabelPackageId(event.target.value || null)}
                    className="w-full border px-4 py-3 text-sm"
                  >
                    {(order.workflow?.packages || []).map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        Package #{pkg.sequence}
                        {pkg.tracking_number ? ` - ${pkg.tracking_number}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

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

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)]">
                <Upload size={16} />
                {labelUploading ? 'Uploading label...' : 'Upload label PDF'}
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  disabled={labelUploading || updating}
                  onChange={(event) => {
                    void handleLabelUpload(event.target.files?.[0] || null);
                    event.target.value = '';
                  }}
                />
              </label>

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

              {selectedLabelPackage?.label_provider ||
              selectedLabelPackage?.provider_shipment_id ||
              selectedLabelPackage?.pickup_reference ? (
                <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-text)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                    Provider references
                  </p>
                  <div className="mt-3 space-y-1 text-[var(--kv-muted)]">
                    {selectedLabelPackage?.label_provider ? (
                      <p>Provider: {selectedLabelPackage.label_provider}</p>
                    ) : null}
                    {selectedLabelPackage?.provider_order_id ? (
                      <p>Provider order: {selectedLabelPackage.provider_order_id}</p>
                    ) : null}
                    {selectedLabelPackage?.provider_shipment_id ? (
                      <p>Shipment: {selectedLabelPackage.provider_shipment_id}</p>
                    ) : null}
                    {selectedLabelPackage?.provider_courier_id ? (
                      <p>Courier id: {selectedLabelPackage.provider_courier_id}</p>
                    ) : null}
                    {selectedLabelPackage?.pickup_reference ? (
                      <p>Pickup ref: {selectedLabelPackage.pickup_reference}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => void handleLabelSave('purchased')}
                  disabled={updating}
                  className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)] disabled:opacity-60"
                >
                  Mark purchased
                </button>
                <button
                  type="button"
                  onClick={() => void handleLabelSave('voided')}
                  disabled={updating}
                  className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)] disabled:opacity-60"
                >
                  Mark voided
                </button>
                <button
                  type="button"
                  onClick={() => void handleLabelSave('refunded')}
                  disabled={updating}
                  className="rounded-2xl border border-[var(--kv-border)] px-4 py-3 text-sm font-semibold text-[var(--kv-text)] disabled:opacity-60"
                >
                  Mark refunded
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

              <label className="text-sm text-[var(--kv-text)]">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                  Provider
                </span>
                <select
                  value={selectedCarrierProvider}
                  onChange={(event) =>
                    setSelectedCarrierProvider(
                      event.target.value as CarrierProvider | 'auto'
                    )
                  }
                  className="w-full border px-4 py-3 text-sm"
                >
                  <option value="auto">Auto-select first connected provider</option>
                  {carrierReadiness?.providers?.map((provider) => (
                    <option
                      key={provider.provider}
                      value={provider.provider}
                      disabled={!provider.configured}
                    >
                      {provider.label}
                      {provider.configured ? '' : ' (needs env)'}
                    </option>
                  ))}
                </select>
              </label>

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
                      className="flex items-center justify-between gap-4 rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-3 text-sm"
                    >
                      <div>
                        <span className="font-semibold text-[var(--kv-text)]">
                          {rate.service}
                        </span>
                        {rate.estimated_delivery_days ? (
                          <p className="mt-1 text-[var(--kv-muted)]">
                            ETA {rate.estimated_delivery_days} days
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[var(--kv-muted)]">
                          {formatCurrency(rate.amount, rate.currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCarrierLabelPurchase(rate.id)}
                          disabled={carrierLoading}
                          className="rounded-full bg-[var(--kv-text)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white disabled:opacity-60"
                        >
                          Buy label
                        </button>
                      </div>
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
            <div id="fulfillment-and-tracking" />
            <SectionHeader
              title="Packages and tracking"
              description="Every package keeps its own tracking link, no-tracking reason, label state, and delivery update."
            />
            <div className="px-5 py-5 md:px-6">
              <div className="space-y-4">
                {(order.workflow?.packages || []).length > 0 ? (
                  <div className="space-y-3">
                    {(order.workflow?.packages || []).map((pkg) => (
                      <div
                        key={pkg.id}
                        className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4 text-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                              Package #{pkg.sequence}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              {pkg.id === primaryShipment?.id ? (
                                <span className="rounded-full bg-[var(--kv-accent-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-accent-deep)]">
                                  Primary shipment
                                </span>
                              ) : null}
                              {pkg.no_tracking ? (
                                <span className="rounded-full bg-[#fff8ea] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a6620]">
                                  No tracking
                                </span>
                              ) : null}
                              {pkg.tracking_url ? (
                                <span className="rounded-full bg-[var(--kv-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                                  Tracking link added
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 font-semibold text-[var(--kv-text)]">
                              {pkg.no_tracking
                                ? 'No tracking attached'
                                : pkg.tracking_number || 'Tracking pending'}
                            </p>
                            <p className="mt-2 text-[var(--kv-muted)]">
                              {[pkg.carrier, pkg.service].filter(Boolean).join(' • ') ||
                                'Carrier not set'}
                            </p>
                            {pkg.ship_date ? (
                              <p className="mt-1 text-[var(--kv-muted)]">
                                Ship date: {formatDateLabel(pkg.ship_date)}
                              </p>
                            ) : null}
                            {pkg.delivered_at ? (
                              <p className="mt-1 text-[var(--kv-muted)]">
                                Delivered: {formatDateLabel(pkg.delivered_at)}
                              </p>
                            ) : null}
                            {pkg.no_tracking_reason ? (
                              <p className="mt-1 text-[var(--kv-muted)]">
                                Reason: {pkg.no_tracking_reason}
                              </p>
                            ) : null}
                            <p className="mt-1 text-[var(--kv-muted)]">
                              Tracking link:{' '}
                              <span className="font-medium text-[var(--kv-text)]">
                                {pkg.tracking_url ? 'Saved' : 'Missing'}
                              </span>
                            </p>
                            {pkg.label_provider ||
                            pkg.provider_shipment_id ||
                            pkg.pickup_reference ? (
                              <div className="mt-2 space-y-1 text-[var(--kv-muted)]">
                                {pkg.label_provider ? (
                                  <p>Provider: {pkg.label_provider}</p>
                                ) : null}
                                {pkg.provider_shipment_id ? (
                                  <p>Shipment ref: {pkg.provider_shipment_id}</p>
                                ) : null}
                                {pkg.pickup_reference ? (
                                  <p>Pickup ref: {pkg.pickup_reference}</p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="rounded-full bg-[var(--kv-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]">
                              {pkg.label_state || 'draft'}
                            </span>
                            {pkg.tracking_url ? (
                              <ActionButton
                                href={pkg.tracking_url}
                                icon={Truck}
                                variant="secondary"
                              >
                                Open tracking
                              </ActionButton>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => startEditingPackage(pkg)}
                              className="rounded-full border border-[var(--kv-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-text)]"
                            >
                              Edit tracking
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setLabelPackageId(pkg.id);
                                document.getElementById('manual-shipping-label')?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                });
                              }}
                              className="rounded-full border border-[var(--kv-border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--kv-text)]"
                            >
                              Manage label
                            </button>
                          </div>
                        </div>
                        {editingPackageId === pkg.id ? (
                          <form
                            onSubmit={(event) => {
                              event.preventDefault();
                              void handleUpdatePackage();
                            }}
                            className="mt-4 space-y-4 rounded-[1rem] bg-[var(--kv-soft)] px-4 py-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                                Edit package #{pkg.sequence}
                              </p>
                              <button
                                type="button"
                                onClick={cancelEditingPackage}
                                className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--kv-muted)]"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                              <input
                                type="date"
                                value={editPackageForm.ship_date}
                                onChange={(event) =>
                                  setEditPackageForm((current) => ({
                                    ...current,
                                    ship_date: event.target.value,
                                  }))
                                }
                                className="w-full border px-4 py-3 text-sm"
                              />
                              <input
                                type="text"
                                value={editPackageForm.shipping_carrier}
                                onChange={(event) =>
                                  setEditPackageForm((current) => ({
                                    ...current,
                                    shipping_carrier: event.target.value,
                                  }))
                                }
                                placeholder="Carrier"
                                className="w-full border px-4 py-3 text-sm"
                              />
                              <input
                                type="text"
                                value={editPackageForm.shipping_service}
                                onChange={(event) =>
                                  setEditPackageForm((current) => ({
                                    ...current,
                                    shipping_service: event.target.value,
                                  }))
                                }
                                placeholder="Service"
                                className="w-full border px-4 py-3 text-sm"
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <input
                                type="text"
                                value={editPackageForm.tracking_number}
                                onChange={(event) =>
                                  setEditPackageForm((current) => ({
                                    ...current,
                                    tracking_number: event.target.value,
                                  }))
                                }
                                placeholder="Tracking number"
                                className="w-full border px-4 py-3 text-sm"
                                disabled={editPackageForm.no_tracking}
                              />
                              <input
                                type="url"
                                value={editPackageForm.tracking_link}
                                onChange={(event) =>
                                  setEditPackageForm((current) => ({
                                    ...current,
                                    tracking_link: event.target.value,
                                  }))
                                }
                                placeholder="Tracking URL"
                                className="w-full border px-4 py-3 text-sm"
                                disabled={editPackageForm.no_tracking}
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <label className="text-sm text-[var(--kv-text)]">
                                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                                  Delivered on
                                </span>
                                <input
                                  type="date"
                                  value={editPackageForm.delivered_at}
                                  onChange={(event) =>
                                    setEditPackageForm((current) => ({
                                      ...current,
                                      delivered_at: event.target.value,
                                    }))
                                  }
                                  className="w-full border px-4 py-3 text-sm"
                                />
                              </label>
                              <div className="rounded-[1rem] border border-[var(--kv-border)] px-4 py-3 text-sm text-[var(--kv-muted)]">
                                Save a delivery date to push this package and the order timeline forward.
                              </div>
                            </div>

                            <label className="flex items-center gap-3 text-sm text-[var(--kv-text)]">
                              <input
                                type="checkbox"
                                checked={editPackageForm.no_tracking}
                                onChange={(event) =>
                                  setEditPackageForm((current) => ({
                                    ...current,
                                    no_tracking: event.target.checked,
                                  }))
                                }
                              />
                              <span>This package doesn&apos;t have tracking</span>
                            </label>
                            {editPackageForm.no_tracking ? (
                              <input
                                type="text"
                                value={editPackageForm.no_tracking_reason}
                                onChange={(event) =>
                                  setEditPackageForm((current) => ({
                                    ...current,
                                    no_tracking_reason: event.target.value,
                                  }))
                                }
                                placeholder="Reason for no tracking"
                                className="w-full border px-4 py-3 text-sm"
                              />
                            ) : null}
                            <label className="flex items-center gap-3 text-sm text-[var(--kv-text)]">
                              <input
                                type="checkbox"
                                checked={editPackageForm.notify_buyer}
                                onChange={(event) =>
                                  setEditPackageForm((current) => ({
                                    ...current,
                                    notify_buyer: event.target.checked,
                                  }))
                                }
                              />
                              <span>Notify buyer about this update</span>
                            </label>

                            <button
                              type="submit"
                              disabled={updating}
                              className="w-full rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                            >
                              {updating ? 'Saving...' : 'Save package changes'}
                            </button>
                          </form>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.1rem] bg-[var(--kv-soft)] px-4 py-4 text-sm text-[var(--kv-muted)]">
                    No shipment packages have been created yet.
                  </div>
                )}

                <div className="rounded-[1.1rem] border border-[var(--kv-border)] px-4 py-4">
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--kv-muted)]">
                      Add package
                    </p>
                    <p className="mt-2 text-sm text-[var(--kv-muted)]">
                      Create package #2 or later, save a fresh tracking link, or mark a split shipment as no-tracking without reopening the order.
                    </p>
                  </div>
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleAddPackage();
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <input
                        type="date"
                        value={addPackageForm.ship_date}
                        onChange={(event) =>
                          setAddPackageForm((current) => ({
                            ...current,
                            ship_date: event.target.value,
                          }))
                        }
                        className="w-full border px-4 py-3 text-sm"
                      />
                      <input
                        type="text"
                        value={addPackageForm.shipping_carrier}
                        onChange={(event) =>
                          setAddPackageForm((current) => ({
                            ...current,
                            shipping_carrier: event.target.value,
                          }))
                        }
                        placeholder="Carrier"
                        className="w-full border px-4 py-3 text-sm"
                      />
                      <input
                        type="text"
                        value={addPackageForm.shipping_service}
                        onChange={(event) =>
                          setAddPackageForm((current) => ({
                            ...current,
                            shipping_service: event.target.value,
                          }))
                        }
                        placeholder="Service"
                        className="w-full border px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={addPackageForm.tracking_number}
                        onChange={(event) =>
                          setAddPackageForm((current) => ({
                            ...current,
                            tracking_number: event.target.value,
                          }))
                        }
                        placeholder="Tracking number"
                        className="w-full border px-4 py-3 text-sm"
                        disabled={addPackageForm.no_tracking}
                      />
                      <input
                        type="url"
                        value={addPackageForm.tracking_link}
                        onChange={(event) =>
                          setAddPackageForm((current) => ({
                            ...current,
                            tracking_link: event.target.value,
                          }))
                        }
                        placeholder="Tracking URL"
                        className="w-full border px-4 py-3 text-sm"
                        disabled={addPackageForm.no_tracking}
                      />
                    </div>
                    <label className="flex items-center gap-3 text-sm text-[var(--kv-text)]">
                      <input
                        type="checkbox"
                        checked={addPackageForm.no_tracking}
                        onChange={(event) =>
                          setAddPackageForm((current) => ({
                            ...current,
                            no_tracking: event.target.checked,
                          }))
                        }
                      />
                      <span>This package doesn&apos;t have tracking</span>
                    </label>
                    {addPackageForm.no_tracking ? (
                      <input
                        type="text"
                        value={addPackageForm.no_tracking_reason}
                        onChange={(event) =>
                          setAddPackageForm((current) => ({
                            ...current,
                            no_tracking_reason: event.target.value,
                          }))
                        }
                        placeholder="Reason for no tracking"
                        className="w-full border px-4 py-3 text-sm"
                      />
                    ) : null}
                    <label className="flex items-center gap-3 text-sm text-[var(--kv-text)]">
                      <input
                        type="checkbox"
                        checked={addPackageForm.notify_buyer}
                        onChange={(event) =>
                          setAddPackageForm((current) => ({
                            ...current,
                            notify_buyer: event.target.checked,
                          }))
                        }
                      />
                      <span>Notify buyer about this package</span>
                    </label>
                    <button
                      type="submit"
                      disabled={updating}
                      className="w-full rounded-2xl bg-[var(--kv-text)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {updating ? 'Saving…' : 'Add package'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
