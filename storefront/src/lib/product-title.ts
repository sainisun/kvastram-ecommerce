export function getProductDisplayTitle(title: string | undefined | null): string {
  if (!title) return '';
  const displayTitle = title.split('|')[0]?.trim();
  return displayTitle || title;
}
