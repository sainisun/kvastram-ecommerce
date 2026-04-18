'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import PostForm from '@/components/PostForm';
import type { PostFormData } from '@/components/PostForm';

interface ApiErrorLike {
  message?: string;
}

interface PostResponse {
  post: PostFormData;
}

type PostLoadState =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'error'; message: string }
  | { status: 'ready'; post: PostFormData };

export default function EditPostPage() {
  const params = useParams();
  const postId = typeof params.id === 'string' ? params.id : null;
  const [state, setState] = useState<PostLoadState>(
    postId ? { status: 'loading' } : { status: 'not-found' }
  );

  useEffect(() => {
    if (!postId) {
      return;
    }

    let active = true;

    api
      .getPost(postId)
      .then((data: PostResponse) => {
        if (!active) {
          return;
        }
        setState({ status: 'ready', post: data.post });
      })
      .catch((err: ApiErrorLike) => {
        if (!active) {
          return;
        }
        console.error('Failed to load post:', err);
        setState({
          status: 'error',
          message: err.message || 'Failed to load post',
        });
      });

    return () => {
      active = false;
    };
  }, [postId]);

  if (state.status === 'loading') return <div className="p-6">Loading...</div>;
  if (state.status === 'error') return <div className="p-6">Error: {state.message}</div>;
  if (state.status === 'not-found') return <div className="p-6">Post not found</div>;

  return <PostForm initialData={state.post} isEdit />;
}
