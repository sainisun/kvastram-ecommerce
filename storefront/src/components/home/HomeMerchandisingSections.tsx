'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import type { HomepageMerchandisingSlot } from '@/types/homepage';

interface HomeMerchandisingSectionsProps {
  merchandisingSlots: HomepageMerchandisingSlot[];
  children?: ReactNode;
}

function SectionHead({
  eyebrow,
  action,
}: {
  eyebrow: string;
  copy?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="kv-section-head mb-8 md:mb-12">
      <div className="kv-tag">{eyebrow}</div>
      {action ? (
        <Link href={action.href} className="kv-section-link">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function slotHref(slot: HomepageMerchandisingSlot) {
  if (slot.link_url) return slot.link_url;
  if (slot.linked_product_id) return `/products/${slot.linked_product_id}`;
  if (slot.linked_collection_id) return `/products?collection_id=${slot.linked_collection_id}`;
  if (slot.linked_category_id) return `/products?category_id=${slot.linked_category_id}`;
  if (slot.linked_tag_id) return `/products?tag_id=${slot.linked_tag_id}`;
  return '/products';
}

type MerchSlotCardVariant = 'default' | 'categoryOverlay';

function MerchSlotCard({
  slot,
  variant = 'default',
}: {
  slot: HomepageMerchandisingSlot;
  variant?: MerchSlotCardVariant;
}) {
  const isCategoryOverlay = variant === 'categoryOverlay';
  const cardClassName = isCategoryOverlay
    ? 'homepage-category-merch-card group'
    : 'relative min-h-[320px] min-w-[78%] snap-start overflow-hidden rounded-lg bg-gradient-to-br from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-accent-soft)] p-8 text-[var(--ds-text-inverse)] sm:min-w-[42%] lg:min-w-[31%]';
  const imageSizes = isCategoryOverlay
    ? '(max-width: 740px) 80vw, (max-width: 999px) 60vw, 23vw'
    : '(max-width: 768px) 78vw, 31vw';

  return (
    <Link
      href={slotHref(slot)}
      className={cardClassName}
    >
      {slot.image_url ? (
        <OptimizedImage
          src={slot.image_url}
          alt={slot.title}
          fill
          sizes={imageSizes}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : null}

      {isCategoryOverlay ? (
        <div className="homepage-category-merch-info">
          <h3>{slot.title}</h3>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-black-rgb),0.06),rgba(var(--ds-black-rgb),0.54))]" />
          <div className="relative z-10 flex h-full flex-col justify-end">
            <div className="text-body-xs  tracking-token-wider text-[var(--ds-text-inverse)]/75">
              {slot.eyebrow || 'Kvastram Edit'}
            </div>
            <h3 className="mt-3 font-display text-display-md leading-token-tight">
              {slot.title}
            </h3>
            {slot.copy ? (
              <p className="mt-3 max-w-[18rem] text-body-sm leading-token-relaxed text-[var(--ds-text-inverse)]/82">
                {slot.copy}
              </p>
            ) : null}
          </div>
        </>
      )}
    </Link>
  );
}

function groupSlots(slots: HomepageMerchandisingSlot[], key: string) {
  return slots
    .filter((slot) => slot.slot_key === key && slot.is_active)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

export function HomeMerchandisingSections({
  merchandisingSlots,
  children,
}: HomeMerchandisingSectionsProps) {
  const seasonalSlots = groupSlots(merchandisingSlots, 'seasonal_edits');
  const fabricSlots = groupSlots(merchandisingSlots, 'fabric_edits');
  const occasionSlots = groupSlots(merchandisingSlots, 'occasion_edits');

  return (
    <>
      {seasonalSlots.length > 0 ? (
        <section className="kv-section bg-[var(--ds-surface-page)]">
          <div className="kv-container">
            <SectionHead
              eyebrow="Limited editions"
              action={{ label: 'View All', href: '/products' }}
            />
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {seasonalSlots.map((slot) => (
                <MerchSlotCard key={slot.id} slot={slot} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {children}

      {fabricSlots.length > 0 ? (
        <section className="kv-section bg-[var(--ds-surface-page)]">
          <div className="kv-container">
            <SectionHead
              eyebrow="Craft &amp; material"
              action={{ label: 'View All', href: '/products' }}
            />
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {fabricSlots.map((slot) => (
                <MerchSlotCard
                  key={slot.id}
                  slot={slot}
                  variant="categoryOverlay"
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {occasionSlots.length > 0 ? (
        <section className="kv-section bg-[var(--ds-surface-page)]">
          <div className="kv-container">
            <SectionHead
              eyebrow="Dress for the moment"
              action={{ label: 'View All', href: '/collections' }}
            />
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {occasionSlots.map((slot) => (
                <MerchSlotCard
                  key={slot.id}
                  slot={slot}
                  variant="categoryOverlay"
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

