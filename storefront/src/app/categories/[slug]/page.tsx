import { permanentRedirect } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

// Permanent redirect: /categories/[slug] → /collections/[slug]
// MegaMenu and any external links using /categories/ are handled here.
export default async function CategoryRedirectPage({ params }: Props) {
  const { slug } = await params;
  permanentRedirect(`/collections/${slug}`);
}
