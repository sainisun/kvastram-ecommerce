export type CarrierContextPackage = {
  id?: string;
  sequence?: number;
  package_weight_grams?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
  carrier_service?: string | null;
  [key: string]: unknown;
};

/**
 * Selects the requested or primary fulfillment package and applies the legacy
 * workflow-label fallback rules used to purchase carrier labels.
 */
export function buildCarrierLabelContext(
  order: Record<string, any>,
  items: Record<string, any>[],
  packageId?: string | null,
): { order: Record<string, any>; items: Record<string, any>[]; package: CarrierContextPackage | null } {
  const packages: CarrierContextPackage[] = order.workflow?.packages || [];
  const explicitlySelectedPackage = packageId
    ? packages.find((pkg) => pkg.id === packageId) || null
    : null;
  const primaryPackage = order.workflow?.primary_package || packages[0] || null;
  const selectedPackage = packageId ? explicitlySelectedPackage : primaryPackage;
  const workflowLabel = order.workflow?.label || {};
  const useWorkflowLabelFallback =
    !packageId ||
    (!!selectedPackage &&
      (selectedPackage.id === primaryPackage?.id ||
        selectedPackage.sequence === primaryPackage?.sequence));

  return {
    order: {
      ...order,
      shipping_address: {
        ...order.shipping_address,
        phone:
          order.shipping_address?.phone ||
          order.customer_phone ||
          order.customer?.phone ||
          null,
      },
      workflow: {
        ...order.workflow,
        label: {
          ...workflowLabel,
          package_weight_grams:
            selectedPackage?.package_weight_grams ??
            (useWorkflowLabelFallback ? workflowLabel.package_weight_grams : null) ??
            null,
          package_length_cm:
            selectedPackage?.package_length_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_length_cm : null) ??
            null,
          package_width_cm:
            selectedPackage?.package_width_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_width_cm : null) ??
            null,
          package_height_cm:
            selectedPackage?.package_height_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_height_cm : null) ??
            null,
          carrier_service:
            selectedPackage?.carrier_service ??
            (useWorkflowLabelFallback ? workflowLabel.carrier_service : null) ??
            null,
        },
      },
    },
    items,
    package: selectedPackage as CarrierContextPackage | null,
  };
}
