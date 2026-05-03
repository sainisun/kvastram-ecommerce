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

  const updateFilter = (
    type: 'category_id' | 'tag_id' | 'collection_id',
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

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) =>
      prev.includes(id)
        ? prev.filter((categoryId) => categoryId !== id)
        : [...prev, id]
    );
  };

  const hasActiveFilters =
    currentCategoryId || currentTagId || currentCollectionId;

  return (
    <div className={`space-y-7 ${className}`}>
      <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <h3 className="font-heading text-[26px] font-bold leading-none text-[var(--ink)]">
          Filters
        </h3>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted)] underline underline-offset-4 transition hover:text-[var(--ink)]"
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
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--soft)] hover:text-[var(--ink)]"
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
                  className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                    isActive
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-white'
                      : 'border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--ink)]'
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
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
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
      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition ${
        small ? 'text-[13px]' : 'text-[14px]'
      } ${
        active
          ? 'bg-[var(--ink)] font-bold text-white'
          : 'text-[var(--ink)] hover:bg-[var(--soft)]'
      }`}
    >
      <span className="line-clamp-1">{children}</span>
    </button>
  );
}
