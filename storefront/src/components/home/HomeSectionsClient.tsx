'use client';

import { useEffect, useState } from 'react';
import { CollectionsSection } from '@/components/home/CollectionsSection';

interface Props {
  readonly collections: any[];
}

export default function HomeSectionsClient({ collections: initialCollections }: Props) {
  const [collections, setCollections] = useState<any[]>(initialCollections);

  useEffect(() => {
    if (initialCollections.length > 0) return;
    fetch('/api/collections')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((json) => {
        const fetched = (json.collections || []).slice(0, 2);
        if (fetched.length > 0) setCollections(fetched);
      })
      .catch(() => {});
  }, [initialCollections]);

  return <CollectionsSection collections={collections} />;
}
