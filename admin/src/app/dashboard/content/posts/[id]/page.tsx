'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import PostForm from '@/components/PostForm';

export default function EditPostPage() {
    const params = useParams();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = params.id as string;
        api.getPost(id)
            .then(data => setPost(data.post))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!post) return <div className="p-6">Post not found</div>;

    return <PostForm initialData={post} isEdit />;
}
