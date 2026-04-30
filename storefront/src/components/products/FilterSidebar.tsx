'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
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
    if (value) {
      params.set(type, value);
    } else {
      params.delete(type);
    }
    router.push(`/products?${params.toString()}`);
  };

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) =>
      prev.includes(id) ? prev.filter((categoryId) => categoryId !== id) : [...prev, id]
    );
  };

  const hasActiveFilters =
    currentCategoryId || currentTagId || currentCollectionId;

  return (
    <div className={`filters-panel-prem ${className}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <h3
          className="filters-header-prem"
          style={{ margin: 0, padding: 0, border: 'none' }}
        >
          Filters
        </h3>
        {hasActiveFilters ? (
          <button
            onClick={() => router.push('/products')}
            style={{
              fontSize: '9px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'var(--mid)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              paddingBottom: '2px',
              borderBottom: '1px solid var(--mid)',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            Clear All
          </button>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <div className="filter-group-prem">
          <p className="filter-group-label-prem">Categories</p>
          {categories.map((cat) => (
            <div key={cat.id}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={() =>
                    updateFilter(
                      'category_id',
                      currentCategoryId === cat.id ? null : cat.id
                    )
                  }
                  className="filter-option-prem"
                  style={{
                    opacity: currentCategoryId === cat.id ? 1 : undefined,
                    fontWeight: currentCategoryId === cat.id ? 500 : 400,
                  }}
                >
                  <span>{cat.name}</span>
                </button>
                {cat.children && cat.children.length > 0 ? (
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--mid)',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label={`${expandedCats.includes(cat.id) ? 'Collapse' : 'Expand'} ${cat.name}`}
                  >
                    {expandedCats.includes(cat.id) ? (
                      <ChevronDown size={12} />
                    ) : (
                      <ChevronRight size={12} />
                    )}
                  </button>
                ) : null}
              </div>

              {cat.children &&
              cat.children.length > 0 &&
              expandedCats.includes(cat.id) ? (
                <div
                  style={{
                    paddingLeft: '16px',
                    borderLeft: '1px solid var(--border)',
                    marginTop: '4px',
                    marginBottom: '8px',
                  }}
                >
                  {cat.children.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() =>
                        updateFilter(
                          'category_id',
                          currentCategoryId === sub.id ? null : sub.id
                        )
                      }
                      className="filter-option-prem"
                      style={{
                        fontSize: '12px',
                        opacity: currentCategoryId === sub.id ? 1 : 0.7,
                        fontWeight: currentCategoryId === sub.id ? 500 : 400,
                      }}
                    >
                      <span>{sub.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {collections.length > 0 ? (
        <div className="filter-group-prem">
          <p className="filter-group-label-prem">Collections</p>
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() =>
                updateFilter(
                  'collection_id',
                  currentCollectionId === col.id ? null : col.id
                )
              }
              className="filter-option-prem"
              style={{
                fontWeight: currentCollectionId === col.id ? 500 : 400,
                opacity: currentCollectionId === col.id ? 1 : undefined,
              }}
            >
              {col.title}
            </button>
          ))}
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="filter-group-prem">
          <p className="filter-group-label-prem">Tags</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() =>
                  updateFilter(
                    'tag_id',
                    currentTagId === tag.id ? null : tag.id
                  )
                }
                style={{
                  padding: '6px 12px',
                  fontSize: '9px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  border: '1px solid',
                  borderColor:
                    currentTagId === tag.id ? 'var(--black)' : 'var(--border)',
                  background:
                    currentTagId === tag.id ? 'var(--black)' : 'transparent',
                  color:
                    currentTagId === tag.id ? 'var(--white)' : 'var(--black)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'var(--font-body)',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
