import { API_BASE_URL, fetchWithTimeout, handleApiError } from './api-client-core';

async function request(path: string, options: RequestInit & { timeout?: number } = {}, errorMessage = 'Request failed') {
  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, options);
  if (!response.ok) return handleApiError(response, errorMessage);
  return response.json();
}

export const adminContentMediaApi = {
  getTrendingReels: () => request('/admin/trending-reels', {}, 'Failed to fetch trending reels'),
  createTrendingReel: (formData: FormData) => request('/admin/trending-reels', { method: 'POST', body: formData, timeout: 300000 }, 'Failed to create trending reel'),
  updateTrendingReel: (id: string, formData: FormData) => request(`/admin/trending-reels/${id}`, { method: 'PUT', body: formData, timeout: 300000 }, 'Failed to update trending reel'),
  deleteTrendingReel: (id: string) => request(`/admin/trending-reels/${id}`, { method: 'DELETE' }, 'Failed to delete trending reel'),
  toggleTrendingReel: (id: string) => request(`/admin/trending-reels/${id}/toggle`, { method: 'PATCH' }, 'Failed to toggle trending reel'),
  getReelCollections: () => request('/admin/reel-collections', {}, 'Failed to fetch reel collections'),
  createReelCollection: (formData: FormData) => request('/admin/reel-collections', { method: 'POST', body: formData, timeout: 180000 }, 'Failed to create reel collection'),
  updateReelCollection: (id: string, formData: FormData) => request(`/admin/reel-collections/${id}`, { method: 'PUT', body: formData, timeout: 180000 }, 'Failed to update reel collection'),
  deleteReelCollection: (id: string) => request(`/admin/reel-collections/${id}`, { method: 'DELETE' }, 'Failed to delete reel collection'),
  toggleReelCollection: (id: string) => request(`/admin/reel-collections/${id}/toggle`, { method: 'PATCH' }, 'Failed to toggle reel collection'),
  getCategoryCircles: () => request('/admin/category-circles', {}, 'Failed to fetch category circles'),
  createCategoryCircle: (formData: FormData) => request('/admin/category-circles', { method: 'POST', body: formData }, 'Failed to create category circle'),
  updateCategoryCircle: (id: string, formData: FormData) => request(`/admin/category-circles/${id}`, { method: 'PUT', body: formData }, 'Failed to update category circle'),
  deleteCategoryCircle: (id: string) => request(`/admin/category-circles/${id}`, { method: 'DELETE' }, 'Failed to delete category circle'),
  toggleCategoryCircle: (id: string) => request(`/admin/category-circles/${id}/toggle`, { method: 'PATCH' }, 'Failed to toggle category circle'),
  getHomepageSocialPosts: () => request('/admin/homepage-social-posts', {}, 'Failed to fetch homepage social posts'),
  createHomepageSocialPost: (formData: FormData) => request('/admin/homepage-social-posts', { method: 'POST', body: formData }, 'Failed to create homepage social post'),
  updateHomepageSocialPost: (id: string, formData: FormData) => request(`/admin/homepage-social-posts/${id}`, { method: 'PUT', body: formData }, 'Failed to update homepage social post'),
  toggleHomepageSocialPost: (id: string) => request(`/admin/homepage-social-posts/${id}/toggle`, { method: 'PATCH' }, 'Failed to toggle homepage social post'),
  deleteHomepageSocialPost: (id: string) => request(`/admin/homepage-social-posts/${id}`, { method: 'DELETE' }, 'Failed to delete homepage social post'),
};
