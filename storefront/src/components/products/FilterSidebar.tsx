'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    children?: Category[];
}

interface Tag {
    id: string;
    name: string;
}

interface Collection {
    id: string;
    title: string;
}

interface FilterSidebarProps {
    categories: Category[];
    tags: Tag[];
    collections?: Collection[];
    className?: string;
}

export default function FilterSidebar({ categories, tags, collections = [], className = '' }: FilterSidebarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [expandedCats, setExpandedCats] = useState<string[]>([]);

    const currentCategoryId = searchParams.get('category_id');
    const currentTagId = searchParams.get('tag_id');
    const currentCollectionId = searchParams.get('collection_id');
    const _currentSort = searchParams.get('sort');

    const updateFilter = (type: 'category_id' | 'tag_id' | 'collection_id', value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(type, value);
        } else {
            params.delete(type);
        }
        router.push(`/products?${params.toString()}`);
    };

    const toggleCategory = (id: string) => {
        if (expandedCats.includes(id)) {
            setExpandedCats(prev => prev.filter(c => c !== id));
        } else {
            setExpandedCats(prev => [...prev, id]);
        }
    };

    return (
        <div className={`w-64 flex-shrink-0 border-r border-stone-100 pr-8 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-lg font-bold text-stone-900">Filters</h3>
                {(currentCategoryId || currentTagId || currentCollectionId) && (
                    <button
                        onClick={() => router.push('/products')}
                        className="text-xs text-red-500 hover:text-red-700 underline"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Categories */}
            <div className="mb-8">
                <h4 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-4 pb-2 border-b border-stone-100">
                    Categories
                </h4>
                <div className="space-y-1">
                    {categories.map(cat => (
                        <div key={cat.id} className="text-sm">
                            <div className={`flex items-center justify-between py-1 group`}>
                                <button
                                    onClick={() => updateFilter('category_id', currentCategoryId === cat.id ? null : cat.id)}
                                    className={`flex-1 text-left hover:text-black transition-colors ${currentCategoryId === cat.id ? 'font-bold text-black' : 'text-stone-600'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                                {cat.children && cat.children.length > 0 && (
                                    <button
                                        onClick={() => toggleCategory(cat.id)}
                                        className="text-stone-400 hover:text-black p-1"
                                    >
                                        {expandedCats.includes(cat.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </button>
                                )}
                            </div>

                            {/* Subcategories */}
                            {cat.children && cat.children.length > 0 && expandedCats.includes(cat.id) && (
                                <div className="pl-4 border-l border-stone-200 mt-1 mb-2 space-y-1">
                                    {cat.children.map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => updateFilter('category_id', currentCategoryId === sub.id ? null : sub.id)}
                                            className={`block w-full text-left py-1 text-xs hover:text-black transition-colors ${currentCategoryId === sub.id ? 'font-bold text-black' : 'text-stone-500'
                                                }`}
                                        >
                                            {sub.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Collections */}
            {collections.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-4 pb-2 border-b border-stone-100">
                        Collections
                    </h4>
                    <div className="space-y-1">
                        {collections.map(col => (
                            <button
                                key={col.id}
                                onClick={() => updateFilter('collection_id', currentCollectionId === col.id ? null : col.id)}
                                className={`block w-full text-left py-1 text-sm hover:text-black transition-colors ${currentCollectionId === col.id ? 'font-bold text-black' : 'text-stone-600'
                                    }`}
                            >
                                {col.title}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Tags */}
            <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-stone-900 mb-4 pb-2 border-b border-stone-100">
                    Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => updateFilter('tag_id', currentTagId === tag.id ? null : tag.id)}
                            className={`px-3 py-1 text-xs border rounded-full transition-all ${currentTagId === tag.id
                                ? 'bg-black text-white border-black'
                                : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                }`}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
