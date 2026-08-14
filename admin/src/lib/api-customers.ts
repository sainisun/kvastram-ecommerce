import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

export const adminCustomersApi = {
  getCustomers: async (page = 1, search = '', filter = 'all') => {
    let url = `${API_BASE_URL}/customers?page=${page}&limit=20`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (filter === 'registered') url += '&has_account=true';
    if (filter === 'guest') url += '&has_account=false';
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error('Failed to fetch customers');
    const response = await res.json();
    return { customers: response.data || [], pagination: response.pagination };
  },
  getCustomer: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch customer');
    return (await res.json()).data;
  },
  updateCustomer: async (id: string, data: unknown) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (!res.ok) return handleApiError(res, 'Failed to update customer');
    return (await res.json()).data;
  },
  deleteCustomer: async (id: string) => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
    if (!res.ok) return handleApiError(res, 'Failed to delete customer');
    return (await res.json()).data;
  },
  getCustomerStats: async () => {
    const res = await fetchWithTimeout(`${API_BASE_URL}/customers/stats/overview`);
    if (!res.ok) throw new Error('Failed to fetch customer stats');
    return (await res.json()).data;
  },
};
