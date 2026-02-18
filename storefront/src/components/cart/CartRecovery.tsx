'use client';

import { useCart } from '@/context/cart-context';
import { ShoppingCart, X, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';

export function CartRecovery() {
    const { savedCartCount, recoverSavedCart, dismissSavedCart } = useCart();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (savedCartCount > 0) {
            // Delay showing the modal slightly for better UX
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [savedCartCount]);

    const handleDismiss = () => {
        setIsVisible(false);
        dismissSavedCart();
    };

    const handleRecover = async () => {
        setIsVisible(false);
        await recoverSavedCart();
    };

    if (!isVisible || savedCartCount === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-8 rounded-lg shadow-xl animate-in fade-in zoom-in duration-300">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-stone-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-serif text-stone-900">Welcome Back!</h3>
                            <p className="text-sm text-stone-500">You have items in your saved cart</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="bg-stone-50 p-4 rounded-lg mb-6">
                    <p className="text-stone-600 text-sm">
                        You have <span className="font-semibold text-stone-900">{savedCartCount} item{savedCartCount > 1 ? 's' : ''}</span> in your cart from your last visit.
                    </p>
                    <p className="text-stone-400 text-xs mt-2">
                        Would you like to restore them?
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 py-3 border border-stone-200 text-stone-600 font-medium text-sm hover:bg-stone-50 transition-colors"
                    >
                        No, start fresh
                    </button>
                    <button
                        onClick={handleRecover}
                        className="flex-1 py-3 bg-stone-900 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
                    >
                        Restore Cart
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
