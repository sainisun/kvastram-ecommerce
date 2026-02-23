// CSV Export Utility Functions

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle null/undefined
          if (value === null || value === undefined) return '';
          // Handle strings with commas or quotes
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format data for export
export const formatCustomersForExport = (customers: any[]) => {
  return customers.map((customer) => ({
    ID: customer.id,
    'First Name': customer.first_name || '',
    'Last Name': customer.last_name || '',
    Email: customer.email,
    Phone: customer.phone || '',
    'Has Account': customer.has_account ? 'Yes' : 'No',
    'Total Orders': customer.order_count || 0,
    'Created At': new Date(customer.created_at).toLocaleDateString(),
  }));
};

export const formatProductsForExport = (products: any[]) => {
  return products.map((product) => ({
    ID: product.id,
    Title: product.title,
    Handle: product.handle,
    Status: product.status,
    'Total Inventory': product.total_inventory || 0,
    'Variant Count': product.variant_count || 0,
    'Created At': new Date(product.created_at).toLocaleDateString(),
  }));
};

export const formatOrdersForExport = (orders: any[]) => {
  return orders.map((order) => ({
    'Order Number': order.order_number,
    Status: order.status,
    'Customer Name':
      order.customer_first_name && order.customer_last_name
        ? `${order.customer_first_name} ${order.customer_last_name}`
        : 'Guest',
    Email: order.email,
    'Total (cents)': order.total,
    Currency: order.currency_code,
    'Created At': new Date(order.created_at).toLocaleDateString(),
  }));
};
