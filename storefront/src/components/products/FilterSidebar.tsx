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

  // ─── All existing routing/filter logic — unchanged ───
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
    if (expandedCats.includes(id)) {
      setExpandedCats((prev) => prev.filter((c) => c !== id));
    } else {
      setExpandedCats((prev) => [...prev, id]);
    }
  };

  // UI-only state for visual-only filters
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const toggleUIFilter = (
    setState: React.Dispatch<React.SetStateAction<string[]>>,
    value: string
  ) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const hasActiveFilters =
    currentCategoryId ||
    currentTagId ||
    currentCollectionId ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    selectedRating;

  return (
    <div className={`filters-panel-prem ${className}`}>
      {/* ─── Header ─── */}
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
        {hasActiveFilters && (
          <button
            onClick={() => {
              setSelectedColors([]);
              setSelectedSizes([]);
              setSelectedRating(null);
              router.push('/products');
            }}
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
        )}
      </div>

      {/* ─── Categories ─── */}
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
                <span className="filter-count-prem">
                  {Math.floor(Math.random() * 50) + 12}
                </span>
              </button>
              {cat.children && cat.children.length > 0 && (
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
                >
                  {expandedCats.includes(cat.id) ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                </button>
              )}
            </div>

            {/* Subcategories */}
            {cat.children &&
              cat.children.length > 0 &&
              expandedCats.includes(cat.id) && (
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
                      <span className="filter-count-prem">
                        {Math.floor(Math.random() * 20) + 5}
                      </span>
                    </button>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>

      {/* ─── Collections ─── */}
      {collections.length > 0 && (
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
      )}

      {/* ─── Tags ─── */}
      {tags.length > 0 && (
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
      )}

      {/* ─── Price Range (UI only) ─── */}
      <div className="filter-group-prem">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
          }}
        >
          <p className="filter-group-label-prem" style={{ marginBottom: 0 }}>
            Price Range
          </p>
          <span style={{ fontSize: '10px', color: 'var(--mid)' }}>
            ₹0 – ₹50,000+
          </span>
        </div>
        <div style={{ padding: '0 4px' }}>
          <div
            style={{
              height: '1px',
              background: 'var(--border)',
              position: 'relative',
              marginBottom: '16px',
              marginTop: '8px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '20%',
                right: '30%',
                height: '1px',
                background: 'var(--black)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: '20%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                width: '10px',
                height: '10px',
                background: 'var(--white)',
                border: '1px solid var(--black)',
                cursor: 'grab',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: '30%',
                top: '50%',
                transform: 'translate(50%, -50%)',
                width: '10px',
                height: '10px',
                background: 'var(--white)',
                border: '1px solid var(--black)',
                cursor: 'grab',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--mid)',
            }}
          >
            <span>₹4,000</span>
            <span>₹35,000</span>
          </div>
        </div>
      </div>

      {/* ─── Color Swatches (UI only) ─── */}
      <div className="filter-group-prem">
        <p className="filter-group-label-prem">Color</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {[
            { name: 'Black', hex: '#080808' },
            { name: 'Off White', hex: '#f0ede8' },
            { name: 'Navy', hex: '#1e3a8a' },
            { name: 'Terracotta', hex: '#c5523f' },
            { name: 'Olive', hex: '#556b2f' },
            { name: 'Taupe', hex: '#8b8589' },
          ].map((color) => (
            <button
              key={color.name}
              title={color.name}
              onClick={() => toggleUIFilter(setSelectedColors, color.name)}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: color.hex,
                border: selectedColors.includes(color.name)
                  ? '2px solid var(--black)'
                  : '1px solid var(--border)',
                cursor: 'pointer',
                outline: selectedColors.includes(color.name)
                  ? '2px solid var(--black)'
                  : 'none',
                outlineOffset: '2px',
                transition: 'transform 0.2s',
                transform: selectedColors.includes(color.name)
                  ? 'scale(1.15)'
                  : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ─── Size (UI only) ─── */}
      <div className="filter-group-prem">
        <p className="filter-group-label-prem">Size</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {['XS', 'S', 'M', 'L', 'XL', 'OS'].map((size) => (
            <button
              key={size}
              onClick={() => toggleUIFilter(setSelectedSizes, size)}
              className="size-btn-prem"
              style={{
                background: selectedSizes.includes(size)
                  ? 'var(--black)'
                  : 'none',
                color: selectedSizes.includes(size)
                  ? 'var(--white)'
                  : 'var(--black)',
                borderColor: selectedSizes.includes(size)
                  ? 'var(--black)'
                  : 'var(--border)',
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Rating (UI only) ─── */}
      <div className="filter-group-prem">
        <p className="filter-group-label-prem">Rating</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[5, 4, 3].map((rating) => (
            <button
              key={rating}
              onClick={() =>
                setSelectedRating(selectedRating === rating ? null : rating)
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 0',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div
                style={{
                  width: '14px',
                  height: '14px',
                  border: '1px solid',
                  borderColor:
                    selectedRating === rating
                      ? 'var(--black)'
                      : 'var(--border)',
                  background:
                    selectedRating === rating ? 'var(--black)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {selectedRating === rating && (
                  <span style={{ color: 'var(--white)', fontSize: '8px' }}>
                    ✓
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg
                    key={i}
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill={i <= rating ? '#080808' : '#ded9d3'}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--mid)',
                  letterSpacing: '0.05em',
                }}
              >
                {rating === 5 ? '' : '& Up'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
