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
      className="absolute left-0 top-full bg-[var(--ds-surface-paper)] border-t border-[var(--ds-border-subtle)] shadow-lg z-40 w-full"
      onMouseLeave={() => {
        /* Parent handles this */
      }}
    >
      <div className="kv-page-container mx-auto max-w-[1440px] px-6 py-8 md:px-12 lg:px-20">
        <div className="grid grid-cols-3 gap-8">
          {/* Subcategories Column */}
          {hasChildren && (
            <div className="col-span-1">
              <h3 className="text-body-sm type-bold uppercase tracking-token-wider text-[var(--ds-text-primary)] mb-4">
                {category.emoji && (
                  <span className="mr-2">{category.emoji}</span>
                )}
                Shop {category.name}
              </h3>
              <div className="space-y-2">
                {children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/collections/${child.slug}`}
                    className="block text-body-sm text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors py-1"
                  >
                    {child.emoji && (
                      <span className="mr-2 text-body-md">
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
              } h-64 rounded-lg overflow-hidden bg-[var(--ds-surface-soft)]`}
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
              <div className="absolute inset-0 bg-[var(--ds-text-primary)]/30 flex items-end p-6">
                <Link
                  href={`/collections/${category.slug}`}
                  className="text-[var(--ds-text-inverse)] text-body-xl type-semibold hover:opacity-80 transition-opacity"
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
                  href={`/collections/${child.slug}`}
                  className="p-4 border border-[var(--ds-border-subtle)] rounded-lg hover:border-[var(--ds-text-primary)] transition-colors"
                >
                  {child.emoji && (
                    <div className="text-display-md mb-2">
                      {child.emoji}
                    </div>
                  )}
                  <h4 className="type-medium text-[var(--ds-text-primary)]">
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

