'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface Category {
  id: string;
  name: string;
  slug: string;
  emoji?: string;
  header_image_url?: string;
  image?: string;
  children?: Category[];
}

interface MegaMenuProps {
  category: Category;
  isOpen: boolean;
}

export default function MegaMenu({ category, isOpen }: MegaMenuProps) {
  if (!isOpen) return null;

  const children = category.children ?? [];
  const hasChildren = children.length > 0;
  const hasHeaderImage = category.header_image_url || category.image;

  return (
    <div
      className="absolute left-0 top-full bg-white border-t border-gray-200 shadow-lg z-40 w-full"
      onMouseLeave={() => {
        /* Parent handles this */
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Subcategories Column */}
          {hasChildren && (
            <div className="col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
                {category.emoji && (
                  <span className="mr-2">{category.emoji}</span>
                )}
                Shop {category.name}
              </h3>
              <div className="space-y-2">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/categories/${child.slug}`}
                    className="block text-sm text-gray-700 hover:text-black transition-colors py-1"
                  >
                    {child.emoji && (
                      <span className="mr-2 text-base">
                        {child.emoji}
                      </span>
                    )}
                    {child.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Image Column - Takes up remaining space */}
          {hasHeaderImage && (
            <div
              className={`relative ${
                hasChildren ? 'col-span-2' : 'col-span-3'
              } h-64 rounded-lg overflow-hidden bg-gray-100`}
            >
              <OptimizedImage
                src={
                  category.header_image_url ||
                  category.image ||
                  ''
                }
                alt={category.name}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex items-end p-6">
                <Link
                  href={`/categories/${category.slug}`}
                  className="text-white text-lg font-semibold hover:opacity-80 transition-opacity"
                >
                  Explore {category.name}
                </Link>
              </div>
            </div>
          )}

          {/* No Image - Show more subcategories in grid */}
          {!hasHeaderImage && hasChildren && (
            <div className="col-span-2 grid grid-cols-2 gap-6">
              {children.slice(3).map((child) => (
                <Link
                  key={child.id}
                  href={`/categories/${child.slug}`}
                  className="p-4 border border-gray-200 rounded-lg hover:border-black transition-colors"
                >
                  {child.emoji && (
                    <div className="text-2xl mb-2">
                      {child.emoji}
                    </div>
                  )}
                  <h4 className="font-medium text-gray-900">
                    {child.name}
                  </h4>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
