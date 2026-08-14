import { describe, expect, it } from 'vitest';
import { buildCarrierLabelContext } from '../src/domain/orders/carrier-context-policy';

const baseOrder = {
  id: 'order-1',
  customer_phone: '9000000001',
  shipping_address: { phone: null },
  workflow: {
    label: {
      package_weight_grams: 850,
      package_length_cm: 32,
      package_width_cm: 22,
      package_height_cm: 8,
      carrier_service: 'standard',
    },
    packages: [
      {
        id: 'pkg-primary',
        sequence: 1,
        package_weight_grams: 600,
        package_length_cm: null,
        carrier_service: null,
      },
      {
        id: 'pkg-secondary',
        sequence: 2,
        package_weight_grams: 300,
        package_length_cm: 15,
        package_width_cm: 10,
        package_height_cm: 5,
        carrier_service: 'express',
      },
    ],
    primary_package: { id: 'pkg-primary', sequence: 1 },
  },
};

describe('buildCarrierLabelContext', () => {
  it('uses the primary package with workflow-label fallback and customer phone fallback', () => {
    const context = buildCarrierLabelContext(baseOrder, [{ id: 'item-1' }]);

    expect(context.package).toMatchObject({ id: 'pkg-primary' });
    expect(context.items).toEqual([{ id: 'item-1' }]);
    expect(context.order.shipping_address.phone).toBe('9000000001');
    expect(context.order.workflow.label).toMatchObject({
      package_weight_grams: 850,
      package_length_cm: 32,
      package_width_cm: 22,
      package_height_cm: 8,
      carrier_service: 'standard',
    });
  });

  it('uses explicit secondary package fields without primary workflow-label fallback', () => {
    const context = buildCarrierLabelContext(baseOrder, [], 'pkg-secondary');

    expect(context.package).toMatchObject({ id: 'pkg-secondary' });
    expect(context.order.workflow.label).toMatchObject({
      package_weight_grams: 300,
      package_length_cm: 15,
      package_width_cm: 10,
      package_height_cm: 5,
      carrier_service: 'express',
    });
  });

  it('does not leak primary workflow-label dimensions to an explicit non-primary package', () => {
    const order = {
      ...baseOrder,
      workflow: {
        ...baseOrder.workflow,
        packages: [{ id: 'pkg-secondary', sequence: 2 }],
        primary_package: { id: 'pkg-primary', sequence: 1 },
      },
    };

    const context = buildCarrierLabelContext(order, [], 'pkg-secondary');

    expect(context.order.workflow.label).toMatchObject({
      package_weight_grams: null,
      package_length_cm: null,
      package_width_cm: null,
      package_height_cm: null,
      carrier_service: null,
    });
  });
});
