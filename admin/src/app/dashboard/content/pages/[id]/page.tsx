'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams } from 'next/navigation';
import PageForm from '@/components/PageForm';

export default function EditPagePage() {
    const params = useParams();
    const [page, setPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = params.id as string;
        api.getPage(id)
            .then(data => setPage(data.page))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [params.id]);

    if (loading) return <div className="p-6">Loading...</div>;
    if (!page) return <div className="p-6">Page not found</div>;

    return <PageForm initialData={page} isEdit />;
}
