'use client';

import { ThumbsUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { StarRating } from '@/components/ui/StarRating';
import { useAuth } from '@/context/auth-context';

interface ReviewsProps {
    productId: string;
}

export function Reviews({ productId }: ReviewsProps) {
    const [reviews, setReviews] = useState<Array<{ id: string; title?: string; author_name: string; content: string; rating: number; created_at: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { customer } = useAuth();

    // Form State
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await api.getReviews(productId);
                setReviews(data.reviews || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, [productId]);

    const averageRating = reviews.length
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : '0.0';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.createReview(productId, {
                rating,
                title,
                content,
                author_name: customer?.first_name || authorName || 'Anonymous',
                customer_id: customer?.id
            });
            setSubmitted(true);
            setShowForm(false);
        } catch (err) {
            alert('Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="border-t border-stone-100 pt-16 pb-16" id="reviews">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-2xl font-serif text-stone-900 mb-2">Client Reviews</h2>
                        <div className="flex items-center gap-2">
                            <StarRating rating={Number(averageRating)} size={18} />
                            <span className="text-sm text-stone-500 font-medium">
                                {averageRating} ({reviews.length} Reviews)
                            </span>
                        </div>
                    </div>

                    {!submitted && (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="px-6 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors"
                        >
                            {showForm ? 'Cancel' : 'Write a Review'}
                        </button>
                    )}
                </div>

                {/* Review Form */}
                {showForm && !submitted && (
                    <form onSubmit={handleSubmit} className="max-w-xl bg-stone-50 p-8 mb-12 rounded-sm space-y-4">
                        <h3 className="text-lg font-serif mb-4">Share you experience</h3>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Rating</label>
                            <StarRating rating={rating} onRatingChange={setRating} editable size={24} />
                        </div>

                        {!customer && (
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                                    value={authorName}
                                    onChange={(e) => setAuthorName(e.target.value)}
                                    placeholder="Your Name"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Title</label>
                            <input
                                type="text"
                                required
                                className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Summary of your experience"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Review</label>
                            <textarea
                                required
                                className="w-full border border-stone-200 p-3 text-sm focus:outline-none focus:border-stone-900 min-h-[100px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="How was the quality, fit, and delivery?"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-stone-900 text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-stone-800 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Submit Review'}
                        </button>
                    </form>
                )}

                {submitted && (
                    <div className="bg-green-50 text-green-800 p-6 mb-12 rounded-sm text-center">
                        <h3 className="font-bold mb-2">Thank you!</h3>
                        <p className="text-sm">Your review has been submitted and is pending approval.</p>
                    </div>
                )}

                {/* Reviews List */}
                {loading ? (
                    <div className="text-center py-12 text-stone-400">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 bg-stone-50 text-stone-500 italic">
                        No reviews yet. Be the first to review this product.
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-8">
                        {reviews.map(review => (
                            <div key={review.id} className="bg-stone-50 p-8 relative group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="mb-2">
                                            <StarRating rating={review.rating} size={14} />
                                        </div>
                                        <h3 className="font-bold text-stone-900 border-b border-transparent group-hover:border-stone-200 inline-block pb-1 transition-colors">{review.title}</h3>
                                    </div>
                                    <span className="text-xs text-stone-400">
                                        {new Date(review.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-stone-600 font-light text-sm leading-relaxed mb-6">
                                    &quot;{review.content}&quot;
                                </p>
                                <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                                    <div className="text-xs">
                                        <span className="font-bold text-stone-900">{review.author_name}</span>
                                        <span className="text-stone-400 ml-2 text-[10px] uppercase tracking-wider">• Verified Buyer</span>
                                    </div>
                                    <button className="text-stone-400 hover:text-stone-600 flex items-center gap-1 text-xs">
                                        <ThumbsUp size={12} /> Helpful
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
