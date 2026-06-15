import { api } from '@/lib/api';
import { storefrontHrefOrNull } from '@/lib/links';
import { cloudinaryUrlOrNull } from '@/lib/media';
import type { HomepageCategoryCircle } from '@/types/homepage';
import { CircularCategoriesClient } from './CircularCategoriesClient';

interface CircularCategoriesProps {
  circles?: HomepageCategoryCircle[];
}

function categoryImageOrNull(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  return cloudinaryUrlOrNull(value);
}

function normalizeCircles(circles: HomepageCategoryCircle[]) {
  return circles
    .filter((c) => c.is_active && categoryImageOrNull(c.image_url) && storefrontHrefOrNull(c.link_url))
    .map((c) => ({
      ...c,
      image_url: categoryImageOrNull(c.image_url),
      link_url: storefrontHrefOrNull(c.link_url) || '/products',
    }))
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export async function CircularCategories({ circles: providedCircles }: CircularCategoriesProps) {
  let circles: HomepageCategoryCircle[] = providedCircles || [];
  try {
    if (!providedCircles) {
      const data = await api.getCategoryCircles();
      circles = data.circles || [];
    }
  } catch {
    circles = [];
  }

  const displayed = normalizeCircles(circles).slice(0, 10);

  if (displayed.length === 0) return null;

  return <CircularCategoriesClient circles={displayed} />;
}
