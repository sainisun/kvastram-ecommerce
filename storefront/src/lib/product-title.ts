export function getProductDisplayTitle(title: string): string {
  const displayTitle = title.split('|')[0]?.trim();
  return displayTitle || title;
}
