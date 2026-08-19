'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button, IconButton, Input } from '@/design-system';
import {
  applyCatalogFilterQuery,
  clearCatalogFilterQuery,
} from '@/lib/catalog-filter-policy';

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
  basePath?: string;
  className?: string;
  onApply?: () => void;
  onClose?: () => void;
}

type DraftFilters = {
  category_id: string;
  tag_id: string;
  collection_id: string;
};

export default function FilterSidebar({
  categories,
  tags,
  collections = [],
  basePath = '/products',
  className = '',
  onApply,
  onClose,
}: Readonly<FilterSidebarProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<string[]>([
    'categories',
    'collections',
    'price',
    'tags',
  ]);

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
    router.push(nextQuery ? `${basePath}?${nextQuery}` : basePath);
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
    applyCatalogFilterQuery(params, {
      category_id: draftFilters.category_id,
      collection_id: draftFilters.collection_id,
      tag_id: draftFilters.tag_id,
      min_price: minPrice.trim() ? String(Number(minPrice) * 100) : undefined,
      max_price: maxPrice.trim() ? String(Number(maxPrice) * 100) : undefined,
    });

    pushProductsUrl(params);
    onApply?.();
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    clearCatalogFilterQuery(params);

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

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) =>
      prev.includes(id)
        ? prev.filter((groupId) => groupId !== id)
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
    <div className={`flex min-h-full flex-col bg-surface-paper ${className}`}>
      <FilterContent
        mode="mobile"
        categories={categories}
        tags={tags}
        collections={collections}
        draftFilters={draftFilters}
        minPrice={minPrice}
        maxPrice={maxPrice}
        hasActiveFilters={hasActiveFilters}
        expandedCats={expandedCats}
        openGroups={openGroups}
        onClear={clearAllFilters}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onToggleCategory={toggleCategory}
        onToggleGroup={toggleGroup}
        onUpdateDraftFilter={updateDraftFilter}
      />

      <FilterContent
        mode="desktop"
        categories={categories}
        tags={tags}
        collections={collections}
        draftFilters={draftFilters}
        minPrice={minPrice}
        maxPrice={maxPrice}
        hasActiveFilters={hasActiveFilters}
        expandedCats={expandedCats}
        openGroups={openGroups}
        onClear={clearAllFilters}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onToggleCategory={toggleCategory}
        onToggleGroup={toggleGroup}
        onUpdateDraftFilter={updateDraftFilter}
      />

      <div className="sticky bottom-0 -mx-4 mt-8 grid gap-3 border-t border-border-subtle bg-surface-paper px-4 py-4 sm:hidden sm:-mx-0 sm:grid-cols-2">
        <Button
          type="button"
          onClick={applyFilters}
          variant="secondary"
          size="md"
          className="h-11 px-5"
        >
          Apply
        </Button>
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          size="md"
          className="h-11 px-5"
        >
          Close
        </Button>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 hidden grid-cols-2 gap-3 border-t border-border-subtle bg-surface-paper px-4 py-4 shadow-[0_-10px_24px_rgba(var(--ds-black-rgb),0.04)] sm:-mx-5 sm:grid sm:px-5">
        <Button
          type="button"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          variant="outline"
          size="md"
          className="h-11 px-4"
        >
          Clear All
        </Button>
        <Button
          type="button"
          onClick={applyFilters}
          variant="secondary"
          size="md"
          className="h-11 px-4"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
type FilterMode = 'mobile' | 'desktop';

type FilterContentProps = {
  mode: FilterMode;
  categories: Category[];
  tags: Tag[];
  collections: Collection[];
  draftFilters: DraftFilters;
  minPrice: string;
  maxPrice: string;
  hasActiveFilters: boolean;
  expandedCats: string[];
  openGroups: string[];
  onClear: () => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onToggleCategory: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onUpdateDraftFilter: (
    type: 'category_id' | 'tag_id' | 'collection_id',
    value: string | null
  ) => void;
};

function FilterContent({
  mode,
  categories,
  tags,
  collections,
  draftFilters,
  minPrice,
  maxPrice,
  hasActiveFilters,
  expandedCats,
  openGroups,
  onClear,
  onMinPriceChange,
  onMaxPriceChange,
  onToggleCategory,
  onToggleGroup,
  onUpdateDraftFilter,
}: FilterContentProps) {
  const compact = mode === 'mobile';
  const groupIsOpen = (id: string) => compact || openGroups.includes(id);

  return (
    <div className={compact ? 'flex-1 sm:hidden' : 'hidden flex-1 sm:block'}>
      <div className={compact ? 'space-y-7' : undefined}>
        {compact ? (
          <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <h3 className="filter-sidebar-title">Filters</h3>
            {hasActiveFilters ? (
              <Button
                type="button"
                onClick={onClear}
                variant="ghost"
                size="sm"
                className="filter-clear-button px-0 underline underline-offset-4"
              >
                Clear All
              </Button>
            ) : null}
          </div>
        ) : null}

        {categories.length > 0 ? (
          <FilterSection
            id="categories"
            label="Categories"
            compact={compact}
            isOpen={groupIsOpen('categories')}
            onToggle={() => onToggleGroup('categories')}
          >
            <CategoryOptions
              categories={categories}
              compact={compact}
              draftCategoryId={draftFilters.category_id}
              expandedCats={expandedCats}
              onToggleCategory={onToggleCategory}
              onUpdateDraftFilter={onUpdateDraftFilter}
            />
          </FilterSection>
        ) : null}

        {collections.length > 0 ? (
          <FilterSection
            id="collections"
            label="Collections"
            compact={compact}
            isOpen={groupIsOpen('collections')}
            onToggle={() => onToggleGroup('collections')}
          >
            <div className={compact ? 'space-y-1' : 'space-y-1'}>
              {collections.map((collection) => {
                const active = draftFilters.collection_id === collection.id;
                return (
                  <FilterOption
                    key={collection.id}
                    active={active}
                    compact={compact}
                    onClick={() =>
                      onUpdateDraftFilter(
                        'collection_id',
                        active ? null : collection.id
                      )
                    }
                  >
                    {collection.title}
                  </FilterOption>
                );
              })}
            </div>
          </FilterSection>
        ) : null}

        <FilterSection
          id="price"
          label="Price"
          compact={compact}
          isOpen={groupIsOpen('price')}
          onToggle={() => onToggleGroup('price')}
        >
          <div className="space-y-3">
            <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3'}>
              <Input
                type="number"
                {...(compact ? { 'aria-label': 'Minimum price' } : { label: 'Min' })}
                inputMode="numeric"
                min="0"
                placeholder={compact ? 'Min' : '0'}
                value={minPrice}
                onChange={(event) => onMinPriceChange(event.target.value)}
              />
              <Input
                type="number"
                {...(compact ? { 'aria-label': 'Maximum price' } : { label: 'Max' })}
                inputMode="numeric"
                min="0"
                placeholder={compact ? 'Max' : 'Any'}
                value={maxPrice}
                onChange={(event) => onMaxPriceChange(event.target.value)}
              />
            </div>
          </div>
        </FilterSection>

        {tags.length > 0 ? (
          <FilterSection
            id="tags"
            label="Tags"
            compact={compact}
            isOpen={groupIsOpen('tags')}
            onToggle={() => onToggleGroup('tags')}
          >
            <TagOptions
              tags={tags}
              compact={compact}
              draftTagId={draftFilters.tag_id}
              onUpdateDraftFilter={onUpdateDraftFilter}
            />
          </FilterSection>
        ) : null}
      </div>
    </div>
  );
}

function CategoryOptions({
  categories,
  compact,
  draftCategoryId,
  expandedCats,
  onToggleCategory,
  onUpdateDraftFilter,
}: {
  categories: Category[];
  compact: boolean;
  draftCategoryId: string;
  expandedCats: string[];
  onToggleCategory: (id: string) => void;
  onUpdateDraftFilter: FilterContentProps['onUpdateDraftFilter'];
}) {
  return (
    <div className="space-y-1">
      {categories.map((category) => {
        const active = draftCategoryId === category.id;
        const expanded = expandedCats.includes(category.id);
        return (
          <div key={category.id}>
            <div className="flex items-center justify-between gap-2">
              <FilterOption
                active={active}
                compact={compact}
                onClick={() =>
                  onUpdateDraftFilter('category_id', active ? null : category.id)
                }
              >
                {category.name}
              </FilterOption>
              {category.children?.length ? (
                <IconButton
                  type="button"
                  onClick={() => onToggleCategory(category.id)}
                  variant="ghost"
                  size="sm"
                  className={compact ? 'filter-expand-button rounded-full' : 'filter-expand-button rounded-full shrink-0'}
                  aria-label={(expanded ? 'Collapse' : 'Expand') + ' ' + category.name}
                >
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </IconButton>
              ) : null}
            </div>
            {category.children?.length && expanded ? (
              <div className={(compact ? 'ml-3 mt-2' : 'ml-4 mt-1') + ' space-y-1 border-l border-border-subtle pl-3'}>
                {category.children.map((child) => {
                  const childActive = draftCategoryId === child.id;
                  return (
                    <FilterOption
                      key={child.id}
                      active={childActive}
                      compact={compact}
                      small
                      onClick={() =>
                        onUpdateDraftFilter(
                          'category_id',
                          childActive ? null : child.id
                        )
                      }
                    >
                      {child.name}
                    </FilterOption>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function TagOptions({
  tags,
  compact,
  draftTagId,
  onUpdateDraftFilter,
}: {
  tags: Tag[];
  compact: boolean;
  draftTagId: string;
  onUpdateDraftFilter: FilterContentProps['onUpdateDraftFilter'];
}) {
  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'space-y-1'}>
      {tags.map((tag) => {
        const active = draftTagId === tag.id;
        if (compact) {
          return (
            <Button
              key={tag.id}
              type="button"
              onClick={() => onUpdateDraftFilter('tag_id', active ? null : tag.id)}
              variant={active ? 'chipSelected' : 'chip'}
              size="sm"
              className="px-3 text-body-xs tracking-token-wider"
            >
              {tag.name}
            </Button>
          );
        }
        return (
          <FilterOption
            key={tag.id}
            active={active}
            compact={false}
            onClick={() => onUpdateDraftFilter('tag_id', active ? null : tag.id)}
          >
            {tag.name}
          </FilterOption>
        );
      })}
    </div>
  );
}

function FilterSection({
  id,
  label,
  compact,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  compact: boolean;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  if (compact) {
    return (
      <section className="space-y-3">
        <p className="filter-group-label">{label}</p>
        <div className="space-y-1">{children}</div>
      </section>
    );
  }

  const panelId = 'filter-panel-' + id;
  return (
    <section className="border-b border-border-subtle">
      <Button
        type="button"
        onClick={onToggle}
        variant="ghost"
        size="md"
        className="flex w-full justify-between gap-4 px-0 py-5 text-left"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="filter-group-label">{label}</span>
        <ChevronDown
          size={16}
          className={'text-secondary transition-transform ' + (isOpen ? 'rotate-180' : '')}
          aria-hidden="true"
        />
      </Button>
      {isOpen ? (
        <div id={panelId} className="space-y-1 pb-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function FilterOption({
  active,
  compact,
  small,
  onClick,
  children,
}: {
  active: boolean;
  compact: boolean;
  small?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  if (compact) {
    return (
      <Button
        type="button"
        onClick={onClick}
        variant="ghost"
        size="sm"
        className={[
          'filter-option flex w-full justify-between rounded-md px-3 py-2 text-left',
          small ? 'filter-option-small' : 'filter-option-regular',
          active
            ? 'filter-option-active bg-primary text-inverse'
            : 'filter-option-inactive hover:bg-surface-soft',
        ].join(' ')}
      >
        <span className="line-clamp-1">{children}</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={active}
      variant="ghost"
      size="sm"
      className={[
        'filter-option flex w-full justify-start gap-3 border px-3 py-2.5 text-left',
        small ? 'filter-option-small' : 'filter-option-regular',
        active
          ? 'filter-option-active border-border-subtle bg-surface-soft text-primary'
          : 'filter-option-inactive border-transparent bg-surface-paper text-secondary hover:border-border-subtle hover:bg-surface-soft hover:text-primary',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-4 w-4 shrink-0 items-center justify-center border transition-colors',
          active
            ? 'border-primary bg-surface-paper text-primary'
            : 'border-border bg-surface-paper',
        ].join(' ')}
        aria-hidden="true"
      >
        {active ? <Check size={12} strokeWidth={2.5} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Button>
  );
}
