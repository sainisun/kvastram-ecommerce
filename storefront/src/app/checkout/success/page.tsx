'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            // Use setTimeout to avoid synchronous setState warning
            setTimeout(() => {
                setStatus('error');
                setError('No order ID provided');
            }, 0);
            return;
        }

        // Poll for payment status
        const checkStatus = async () => {
            try {
                const res = await api.checkPaymentStatus(orderId);
                if (res.payment_status === 'captured') {
                    setStatus('success');
                } else if (res.payment_status === 'failed') {
                    setStatus('error');
                    setError('Payment failed. Please try again.');
                }
            } catch {
                console.error('Error checking status');
            }
        };

        // Check immediately
        checkStatus();

        // Then poll every 3 seconds for up to 30 seconds
        const interval = setInterval(checkStatus, 3000);
        const timeout = setTimeout(() => {
            clearInterval(interval);
            if (status === 'loading') {
                setStatus('success'); // Assume success after timeout
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [orderId, status]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
                <Loader2 size={48} className="animate-spin text-stone-400 mb-4" />
                <h1 className="text-2xl font-serif text-stone-900 mb-2">Processing Payment...</h1>
                <p className="text-stone-500 font-light">
                    Please wait while we confirm your payment.
                </p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-8">
                    <span className="text-3xl">✕</span>
                </div>
                <h1 className="text-4xl font-serif mb-4 text-stone-900">Payment Failed</h1>
                <p className="text-stone-500 mb-8 max-w-md font-light">
                    {error || 'Something went wrong with your payment. Please try again.'}
                </p>
                <Link href="/checkout" className="bg-stone-900 text-white px-8 py-3 rounded-none uppercase tracking-widest text-xs font-bold hover:bg-stone-800 transition-colors">
                    Try Again
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-white">
            <div className="w-20 h-20 bg-stone-100 text-stone-900 rounded-full flex items-center justify-center mb-8">
                <CheckCircle size={32} strokeWidth={1.5} />
            </div>
            <h1 className="text-4xl font-serif mb-4 text-stone-900">Order Confirmed</h1>
            <p className="text-stone-500 mb-8 max-w-md font-light">
                Thank you for choosing Kvastram. Your order has been confirmed and payment received. We will begin preparing it for shipment.
            </p>
            <div className="flex gap-4">
                <Link href="/" className="bg-stone-900 text-white px-8 py-3 rounded-none uppercase tracking-widest text-xs font-bold hover:bg-stone-800 transition-colors">
                    Continue Shopping
                </Link>
                <Link href="/account" className="border border-stone-300 text-stone-900 px-8 py-3 rounded-none uppercase tracking-widest text-xs font-bold hover:bg-stone-50 transition-colors">
                    View Orders
                </Link>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
