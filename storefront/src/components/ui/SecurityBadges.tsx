'use client';

import { ShieldCheck, Lock, CreditCard } from 'lucide-react';

interface SecurityBadgesProps {
  className?: string;
}

export default function SecurityBadges({
  className = '',
}: SecurityBadgesProps) {
  return (
    <div className={`flex items-center justify-center gap-6 py-4 ${className}`}>
      {/* SSL Secure */}
      <div className="flex items-center gap-2 text-stone-500">
        <Lock size={16} className="text-green-600" />
        <span className="text-xs font-medium">SSL Secure</span>
      </div>

      {/* PCI Compliant */}
      <div className="flex items-center gap-2 text-stone-500">
        <CreditCard size={16} className="text-green-600" />
        <span className="text-xs font-medium">PCI Compliant</span>
      </div>

      {/* Authenticity */}
      <div className="flex items-center gap-2 text-stone-500">
        <ShieldCheck size={16} className="text-green-600" />
        <span className="text-xs font-medium">Authenticity Guaranteed</span>
      </div>
    </div>
  );
}

// Payment Icons Component
export function PaymentIcons({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {/* Visa */}
      <div className="h-8 w-12 bg-white rounded border border-stone-200 flex items-center justify-center">
        <span className="text-xs font-bold text-blue-900 italic">VISA</span>
      </div>

      {/* Mastercard */}
      <div className="h-8 w-12 bg-white rounded border border-stone-200 flex items-center justify-center">
        <div className="flex items-center gap-0.5">
          <div className="w-4 h-4 rounded-full bg-red-600"></div>
          <div className="w-4 h-4 rounded-full bg-yellow-500 -ml-2"></div>
        </div>
      </div>

      {/* Amex */}
      <div className="h-8 w-12 bg-white rounded border border-stone-200 flex items-center justify-center">
        <span className="text-[8px] font-bold text-blue-800">AMEX</span>
      </div>

      {/* PayPal */}
      <div className="h-8 w-14 bg-white rounded border border-stone-200 flex items-center justify-center">
        <span className="text-[10px] font-bold text-blue-700">PayPal</span>
      </div>

      {/* Apple Pay */}
      <div className="h-8 w-10 bg-black rounded flex items-center justify-center">
        <span className="text-white text-xs font-medium">Pay</span>
      </div>
    </div>
  );
}
