'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { storefrontAttributeFilters } from '@/config/storefront-discovery';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface Tag {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  title: string;
}

interface FilterSidebarProps {
  categories: Category[];
  tags: Tag[];
  collections?: Collection[];
  className?: string;
}

export default function FilterSidebar({
  categories,
  tags,
  collections = [],
  className = '',
}: Readonly<FilterSidebarProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  const currentCategoryId = searchParams.get('category_id');
  const currentTagId = searchParams.get('tag_id');
  const currentCollectionId = searchParams.get('collection_id');
  const currentAttributeCode = searchParams.get('attribute_code');
  const currentAttributeValue = searchParams.get('attribute_value');
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';
  const [minPrice, setMinPrice] = useState(
    currentMinPrice ? String(Math.round(Number(currentMinPrice) / 100)) : ''
  );
  const [maxPrice, setMaxPrice] = useState(
    currentMaxPrice ? String(Math.round(Number(currentMaxPrice) / 100)) : ''
  );

  const updateFilter = (
    type:
      | 'category_id'
      | 'tag_id'
      | 'collection_id'
      | 'attribute_code'
      | 'attribute_value',
    value: string | null
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    router.push(`/products?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    if (minPrice.trim()) {
      params.set('min_price', String(Number(minPrice) * 100));
    } else {
      params.delete('min_price');
    }

    if (maxPrice.trim()) {
      params.set('max_price', String(Number(maxPrice) * 100));
    } else {
      params.delete('max_price');
    }

    router.push(`/products?${params.toString()}`);
  };

  const updateAttributeFilter = (code: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');

    const isSame =
      currentAttributeCode === code && currentAttributeValue === value;

    if (isSame) {
      params.delete('attribute_code');
      params.delete('attribute_value');
    } else {
      params.set('attribute_code', code);
      params.set('attribute_value', value);
    }

    router.push(`/products?${params.toString()}`);
  };

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) =>
      prev.includes(id)
        ? prev.filter((categoryId) => categoryId !== id)
        : [...prev, id]
    );
  };

  const hasActiveFilters =
    currentCategoryId ||
    currentTagId ||
    currentCollectionId ||
    currentAttributeCode ||
    currentAttributeValue ||
    currentMinPrice ||
    currentMaxPrice;

  return (
    <div className={`space-y-7 ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <h3 className="filter-sidebar-title">
          Filters
        </h3>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="filter-clear-button underline underline-offset-4 transition"
          >
            Clear All
          </button>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <FilterGroup label="Categories">
          {categories.map((cat) => {
            const isActive = currentCategoryId === cat.id;
            const isExpanded = expandedCats.includes(cat.id);

            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between gap-2">
                  <FilterButton
                    active={isActive}
                    onClick={() =>
                      updateFilter('category_id', isActive ? null : cat.id)
                    }
                  >
                    {cat.name}
                  </FilterButton>
                  {cat.children?.length ? (
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="filter-expand-button flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[var(--soft)]"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${cat.name}`}
                    >
                      {isExpanded ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>
                  ) : null}
                </div>

                {cat.children?.length && isExpanded ? (
                  <div className="ml-3 mt-2 space-y-1 border-l border-[var(--line)] pl-3">
                    {cat.children.map((sub) => (
                      <FilterButton
                        key={sub.id}
                        active={currentCategoryId === sub.id}
                        onClick={() =>
                          updateFilter(
                            'category_id',
                            currentCategoryId === sub.id ? null : sub.id
                          )
                        }
                        small
                      >
                        {sub.name}
                      </FilterButton>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </FilterGroup>
      ) : null}

      {collections.length > 0 ? (
        <FilterGroup label="Collections">
          {collections.map((col) => (
            <FilterButton
              key={col.id}
              active={currentCollectionId === col.id}
              onClick={() =>
                updateFilter(
                  'collection_id',
                  currentCollectionId === col.id ? null : col.id
                )
              }
            >
              {col.title}
            </FilterButton>
          ))}
        </FilterGroup>
      ) : null}

      <FilterGroup label="Price">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-body-sm"
            />
            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-md border border-[var(--line)] bg-white px-3 py-2 text-body-sm"
            />
          </div>
          <button
            type="button"
            onClick={applyPriceFilter}
            className="w-full rounded-md bg-[var(--ink)] px-4 py-2 text-body-xs uppercase tracking-token-wider text-white transition hover:opacity-90"
          >
            Apply Price
          </button>
        </div>
      </FilterGroup>

      {storefrontAttributeFilters.map((group) => (
        <FilterGroup key={group.code} label={group.label}>
          <div className="flex flex-wrap gap-2">
            {group.values.map((item) => {
              const isActive =
                currentAttributeCode === group.code &&
                currentAttributeValue === item.value;

              return (
                <button
                  key={`${group.code}-${item.value}`}
                  type="button"
                  onClick={() => updateAttributeFilter(group.code, item.value)}
                  className={`filter-tag-button rounded-full border px-3 py-2 transition ${
                    isActive
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                      : 'filter-tag-button-inactive border-[var(--line)] bg-white hover:border-[var(--ink)]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      ))}

      {tags.length > 0 ? (
        <FilterGroup label="Tags">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isActive = currentTagId === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    updateFilter('tag_id', isActive ? null : tag.id)
                  }
                  className={`filter-tag-button rounded-full border px-3 py-2 transition ${
                    isActive
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                      : 'filter-tag-button-inactive border-[var(--line)] bg-white hover:border-[var(--ink)]'
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </FilterGroup>
      ) : null}
    </div>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <p className="filter-group-label">
        {label}
      </p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function FilterButton({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean;
  onClick: () => void;
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`filter-option flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition ${
        small ? 'filter-option-small' : 'filter-option-regular'
      } ${
        active
          ? 'filter-option-active bg-[var(--ink)] text-white'
          : 'filter-option-inactive hover:bg-[var(--soft)]'
      }`}
    >
      <span className="line-clamp-1">{children}</span>
    </button>
  );
}
