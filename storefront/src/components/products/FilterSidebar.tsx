'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

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
  onApply?: () => void;
  onClose?: () => void;
}

type DraftFilters = {
  category_id: string;
  tag_id: string;
  collection_id: string;
};

const FILTER_QUERY_KEYS = [
  'category_id',
  'tag_id',
  'collection_id',
  'attribute_code',
  'attribute_value',
  'min_price',
  'max_price',
  'page',
];

export default function FilterSidebar({
  categories,
  tags,
  collections = [],
  className = '',
  onApply,
  onClose,
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
  const [draftFilters, setDraftFilters] = useState<DraftFilters>({
    category_id: currentCategoryId || '',
    tag_id: currentTagId || '',
    collection_id: currentCollectionId || '',
  });
  const [minPrice, setMinPrice] = useState(
    currentMinPrice ? String(Math.round(Number(currentMinPrice) / 100)) : ''
  );
  const [maxPrice, setMaxPrice] = useState(
    currentMaxPrice ? String(Math.round(Number(currentMaxPrice) / 100)) : ''
  );

  const pushProductsUrl = (params: URLSearchParams) => {
    const nextQuery = params.toString();
    router.push(nextQuery ? `/products?${nextQuery}` : '/products');
  };

  const updateDraftFilter = (
    type: 'category_id' | 'tag_id' | 'collection_id',
    value: string | null
  ) => {
    setDraftFilters((current) => ({
      ...current,
      [type]: current[type] === value || value === null ? '' : value,
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_QUERY_KEYS.forEach((key) => params.delete(key));

    if (draftFilters.category_id) {
      params.set('category_id', draftFilters.category_id);
    }

    if (draftFilters.collection_id) {
      params.set('collection_id', draftFilters.collection_id);
    }

    if (draftFilters.tag_id) {
      params.set('tag_id', draftFilters.tag_id);
    }

    if (minPrice.trim()) {
      params.set('min_price', String(Number(minPrice) * 100));
    }

    if (maxPrice.trim()) {
      params.set('max_price', String(Number(maxPrice) * 100));
    }

    pushProductsUrl(params);
    onApply?.();
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_QUERY_KEYS.forEach((key) => params.delete(key));

    setDraftFilters({
      category_id: '',
      tag_id: '',
      collection_id: '',
    });
    setMinPrice('');
    setMaxPrice('');
    pushProductsUrl(params);
  };

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) =>
      prev.includes(id)
        ? prev.filter((categoryId) => categoryId !== id)
        : [...prev, id]
    );
  };

  const hasActiveFilters = Boolean(
    currentCategoryId ||
      currentTagId ||
      currentCollectionId ||
      currentAttributeCode ||
      currentAttributeValue ||
      currentMinPrice ||
      currentMaxPrice ||
      draftFilters.category_id ||
      draftFilters.tag_id ||
      draftFilters.collection_id ||
      minPrice ||
      maxPrice
  );

  return (
    <div className={`flex min-h-full flex-col ${className}`}>
      <div className="flex-1 space-y-7">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <h3 className="filter-sidebar-title">
          Filters
        </h3>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearAllFilters}
            className="filter-clear-button underline underline-offset-4 transition"
          >
            Clear All
          </button>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <FilterGroup label="Categories">
          {categories.map((cat) => {
            const isActive = draftFilters.category_id === cat.id;
            const isExpanded = expandedCats.includes(cat.id);

            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between gap-2">
                  <FilterButton
                    active={isActive}
                    onClick={() =>
                      updateDraftFilter(
                        'category_id',
                        isActive ? null : cat.id
                      )
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
                        active={draftFilters.category_id === sub.id}
                        onClick={() =>
                          updateDraftFilter(
                            'category_id',
                            draftFilters.category_id === sub.id ? null : sub.id
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
              active={draftFilters.collection_id === col.id}
              onClick={() =>
                updateDraftFilter(
                  'collection_id',
                  draftFilters.collection_id === col.id ? null : col.id
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
        </div>
      </FilterGroup>

      {tags.length > 0 ? (
        <FilterGroup label="Tags">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isActive = draftFilters.tag_id === tag.id;
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    updateDraftFilter('tag_id', isActive ? null : tag.id)
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

      <div className="sticky bottom-0 -mx-4 mt-8 grid gap-3 border-t border-stone-200 bg-white px-4 py-4 sm:-mx-0 sm:grid-cols-2">
        <button
          type="button"
          onClick={applyFilters}
          className="h-11 bg-stone-950 px-5 text-body-xs type-bold uppercase tracking-token-wider text-white transition-opacity hover:opacity-90"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-11 border border-stone-300 bg-white px-5 text-body-xs type-bold uppercase tracking-token-wider text-stone-950 transition-colors hover:border-stone-950"
        >
          Close
        </button>
      </div>
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
