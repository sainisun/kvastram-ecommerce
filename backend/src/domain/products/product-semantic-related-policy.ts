export type ProductSemanticMatch = {
  product_id: string;
  matches: number | null | undefined;
};

/**
 * Merges value and raw-attribute match counts, then keeps the legacy eight
 * highest-scoring product identifiers for the related-product query.
 */
export function rankSemanticRelatedProductIds(
  valueMatches: ProductSemanticMatch[],
  rawMatches: ProductSemanticMatch[],
  limit = 8,
): string[] {
  const scores = new Map<string, number>();
  for (const row of [...valueMatches, ...rawMatches]) {
    scores.set(row.product_id, (scores.get(row.product_id) || 0) + Number(row.matches || 0));
  }

  return Array.from(scores.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([productId]) => productId)
    .slice(0, limit);
}

/**
 * Restores ranked database candidates to score order and applies the legacy
 * storefront cap after unpublished or unavailable candidates are omitted.
 */
export function selectRankedSemanticCandidates<T extends { id: string }>(
  candidateIds: string[],
  availableCandidates: T[],
  limit = 4,
): T[] {
  return candidateIds
    .map((candidateId) => availableCandidates.find((candidate) => candidate.id === candidateId))
    .filter((candidate): candidate is T => Boolean(candidate))
    .slice(0, limit);
}
