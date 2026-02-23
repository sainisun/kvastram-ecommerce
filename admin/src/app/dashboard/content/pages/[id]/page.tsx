'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import PageForm from '@/components/PageForm';

export default function EditPagePage() {
  const params = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    if (!id || Array.isArray(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    api
      .getPage(id)
      .then((data) => setPage(data.page))
      .catch((err) => {
        const status = err.status || err.response?.status;
        if (status === 404) {
          setNotFound(true);
        } else if (status === 401) {
          setAuthError(true);
        } else {
          setError(err.message || 'Failed to load page');
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (notFound) return <div className="p-6">Page not found</div>;
  if (authError) return <div className="p-6">Authentication required</div>;
  if (error) return <div className="p-6">Error: {error}</div>;
  if (!page) return <div className="p-6">Page not found</div>;

  return <PageForm initialData={page} isEdit />;
}
