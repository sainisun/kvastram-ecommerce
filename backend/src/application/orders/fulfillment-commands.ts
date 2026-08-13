export interface InvoiceDataPort {
  getInvoiceData(orderId: string): Promise<
    | {
        order: Record<string, unknown>;
        items: Record<string, unknown>[];
      }
    | null
  >;
}

export interface InvoiceGeneratorPort {
  generate(
    order: Record<string, unknown>,
    items: Record<string, unknown>[]
  ): Promise<Buffer>;
}

export async function generateOrderInvoiceCommand(
  orderId: string,
  dependencies: {
    invoiceData: InvoiceDataPort;
    invoiceGenerator: InvoiceGeneratorPort;
  }
) {
  const invoiceData = await dependencies.invoiceData.getInvoiceData(orderId);
  if (!invoiceData) return null;

  const pdfBuffer = await dependencies.invoiceGenerator.generate(
    invoiceData.order,
    invoiceData.items
  );

  return {
    order: invoiceData.order,
    pdfBuffer,
  };
}

export interface CarrierLabelPurchase {
  provider: string;
  shipping_carrier?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  label_status?: string | null;
  label_url?: string | null;
  label_file_name?: string | null;
  label_cost?: number | null;
  label_currency?: string | null;
  carrier_service?: string | null;
  shiprocket_order_id?: string | number | null;
  shiprocket_shipment_id?: string | number | null;
  shiprocket_courier_id?: string | number | null;
  shiprocket_pickup_id?: string | number | null;
}

export interface CarrierLabelProviderPort {
  purchaseLabel(
    context: { order: Record<string, any>; items: Record<string, any>[] },
    options: { provider?: string | null; package_id: string; courier_id: string | number }
  ): Promise<CarrierLabelPurchase>;
}

export async function purchaseCarrierLabelCommand(
  input: {
    context: { order: Record<string, any>; items: Record<string, any>[]; packageId?: string | null };
    options: { provider?: string | null; packageId?: string | null; courierId: string | number };
  },
  dependencies: {
    carrierLabelProvider: CarrierLabelProviderPort;
    updatePackage: (packageId: string, data: Record<string, unknown>) => Promise<unknown>;
  }
) {
  const packageId = input.options.packageId || input.context.packageId || 'pkg_1';
  const purchase = await dependencies.carrierLabelProvider.purchaseLabel(
    { order: input.context.order, items: input.context.items },
    {
      provider: input.options.provider,
      package_id: packageId,
      courier_id: input.options.courierId,
    }
  );

  const order = await dependencies.updatePackage(packageId, {
    label_provider: purchase.provider,
    shipping_carrier: purchase.shipping_carrier ?? null,
    tracking_number: purchase.tracking_number ?? null,
    tracking_link: purchase.tracking_url ?? null,
    label_state: purchase.label_status ?? null,
    label_url: purchase.label_url ?? null,
    label_file_name: purchase.label_file_name ?? null,
    label_cost: purchase.label_cost ?? null,
    label_currency: purchase.label_currency ?? null,
    package_weight_grams: input.context.order.workflow?.label?.package_weight_grams ?? null,
    package_length_cm: input.context.order.workflow?.label?.package_length_cm ?? null,
    package_width_cm: input.context.order.workflow?.label?.package_width_cm ?? null,
    package_height_cm: input.context.order.workflow?.label?.package_height_cm ?? null,
    carrier_service: purchase.carrier_service ?? null,
    provider_order_id:
      purchase.shiprocket_order_id != null ? String(purchase.shiprocket_order_id) : null,
    provider_shipment_id:
      purchase.shiprocket_shipment_id != null ? String(purchase.shiprocket_shipment_id) : null,
    provider_courier_id:
      purchase.shiprocket_courier_id != null ? String(purchase.shiprocket_courier_id) : null,
    pickup_reference:
      purchase.shiprocket_pickup_id != null ? String(purchase.shiprocket_pickup_id) : null,
    notify_buyer: false,
  });

  return { order, purchase };
}
