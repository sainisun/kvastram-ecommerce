'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import PageForm from '@/components/PageForm';
import type { PageFormData } from '@/components/PageForm';

interface ApiErrorLike {
  message?: string;
  status?: number;
  response?: {
    status?: number;
  };
}

interface PageResponse {
  page: PageFormData;
}

type PageLoadState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'auth-error' }
  | { status: 'error'; message: string }
  | { status: 'ready'; page: PageFormData };

export default function EditPagePage() {
  const params = useParams();
  const pageId = typeof params.id === 'string' ? params.id : null;
  const [state, setState] = useState<PageLoadState>(
    pageId ? { status: 'loading' } : { status: 'not-found' }
  );

  useEffect(() => {
    if (!pageId) {
      return;
    }

    let active = true;

    api
      .getPage(pageId)
      .then((data: PageResponse) => {
        if (!active) {
          return;
        }
        setState({ status: 'ready', page: data.page });
      })
      .catch((err: ApiErrorLike) => {
        if (!active) {
          return;
        }
        const status = err.status || err.response?.status;
        if (status === 404) {
          setState({ status: 'not-found' });
        } else if (status === 401) {
          setState({ status: 'auth-error' });
        } else {
          setState({
            status: 'error',
            message: err.message || 'Failed to load page',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [pageId]);

  if (state.status === 'loading') return <div className="p-6">Loading...</div>;
  if (state.status === 'not-found') return <div className="p-6">Page not found</div>;
  if (state.status === 'auth-error') return <div className="p-6">Authentication required</div>;
  if (state.status === 'error') return <div className="p-6">Error: {state.message}</div>;

  return <PageForm initialData={state.page} isEdit />;
}
