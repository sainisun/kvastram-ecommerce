'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-stone-200 rounded', className)} />
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="bg-white">
      {/* Image skeleton */}
      <div className="aspect-[3/4] bg-stone-100 mb-4 relative overflow-hidden">
        <Skeleton className="absolute inset-0" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-1/3 mt-2" />
      </div>
    </div>
  );
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Product detail skeleton
export function ProductDetailSkeleton() {
  return (
    <div className="bg-white min-h-screen pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* Breadcrumb skeleton */}
        <Skeleton className="h-4 w-64 mb-8" />

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Image Gallery skeleton */}
          <div className="aspect-square bg-stone-100">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Right: Details skeleton */}
          <div className="space-y-6">
            {/* Collection tag */}
            <Skeleton className="h-3 w-32" />

            {/* Title */}
            <Skeleton className="h-12 w-3/4" />

            {/* Price */}
            <Skeleton className="h-8 w-1/3" />

            {/* Description */}
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Variant selector */}
            <div className="pt-4 space-y-3">
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
            </div>

            {/* Add to cart */}
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 flex-1" />
            </div>

            {/* Trust badges */}
            <div className="space-y-2 pt-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart page skeleton
export function CartSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <Skeleton className="h-10 w-64 mb-8" />

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-7 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 bg-white p-4">
                <Skeleton className="w-24 h-24 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-full mt-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Checkout page skeleton
export function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <Skeleton className="h-10 w-64 mb-8" />

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Shipping form */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
            <Skeleton className="h-12" />
          </div>

          {/* Order summary */}
          <div className="bg-white p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-16 h-16 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
            <Skeleton className="h-px w-full my-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-12 w-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Account page skeleton
export function AccountSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <Skeleton className="h-10 w-64 mb-8" />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white p-6 space-y-4">
              <Skeleton className="w-16 h-16 rounded-full mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-1/2 mx-auto" />
              <Skeleton className="h-px w-full my-4" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-6">
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white p-6 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div className="bg-white p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between py-4 border-b">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Orders list skeleton
export function OrdersListSkeleton() {
  return (
    <div className="min-h-screen bg-stone-50 pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-6">
        <Skeleton className="h-10 w-64 mb-8" />

        <div className="bg-white">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-6 border-b"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Generic text skeleton for content
export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

// Hero section skeleton
export function HeroSkeleton() {
  return (
    <div className="relative min-h-[70vh] bg-stone-100 flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-24 w-full">
        <div className="max-w-2xl space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-12 w-48 mt-8" />
        </div>
      </div>
    </div>
  );
}

// Collection card skeleton
export function CollectionCardSkeleton() {
  return (
    <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
      <Skeleton className="absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
        <Skeleton className="h-6 w-3/4 bg-white/50" />
        <Skeleton className="h-4 w-1/2 bg-white/30 mt-2" />
      </div>
    </div>
  );
}
