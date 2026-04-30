'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useStudioChatSocket } from '@/hooks/useStudioChatSocket';
import { api } from '@/lib/api';

interface StudioInquirySummary {
  id: string;
  product_title: string;
  product_handle: string | null;
  inquiry_type: string;
  status: string;
  last_message_at: string | null;
  unread_by_customer: boolean | null;
  created_at: string;
}

export default function AccountMessagesPage() {
  const { customer, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<StudioInquirySummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    if (!loading && !customer) router.push('/login?redirect=/account/messages');
  }, [customer, loading, router]);

  useEffect(() => {
    if (loading || !customer) return;
    api
      .getCustomerStudioInquiries()
      .then((data) => setMessages(data.inquiries || []))
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false));
  }, [customer, loading]);

  const mergeMessageSummary = useCallback((incoming: StudioInquirySummary) => {
    setMessages((prev) => {
      const exists = prev.some((item) => item.id === incoming.id);
      const next = exists
        ? prev.map((item) => (item.id === incoming.id ? { ...item, ...incoming } : item))
        : [incoming, ...prev];
      return next.sort((a, b) =>
        new Date(b.last_message_at || b.created_at).getTime() -
        new Date(a.last_message_at || a.created_at).getTime()
      );
    });
  }, []);

  const live = useStudioChatSocket({
    authMode: 'account-inbox',
    enabled: Boolean(customer && !loading),
    onMessage: ({ inquiry }) => {
      if (inquiry && typeof inquiry === 'object' && 'id' in inquiry) {
        mergeMessageSummary(inquiry as StudioInquirySummary);
      }
    },
  });

  if (loading || !customer) {
    return <div className="min-h-screen bg-stone-50 px-6 py-12 md:px-12 lg:px-20" />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/account" className="text-sm text-stone-500 hover:text-stone-900">
              Account
            </Link>
            <h1 className="mt-2 font-serif text-3xl text-stone-900">Messages</h1>
            <p className="mt-2 text-sm text-stone-500">Your product conversations with Kvastram Studio.</p>
            <p className={`mt-2 text-xs ${live.isConnected ? 'text-green-700' : 'text-stone-400'}`}>
              {live.isConnected ? 'Live inbox connected' : 'Live inbox connecting...'}
            </p>
          </div>
          <MessageCircle className="text-stone-300" size={34} />
        </div>

        {loadingMessages ? (
          <div className="flex h-48 items-center justify-center text-stone-400">
            <RefreshCw className="mr-2 animate-spin" size={20} />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="border border-stone-200 bg-white px-6 py-16 text-center">
            <MessageCircle className="mx-auto mb-4 text-stone-300" size={44} />
            <p className="font-medium text-stone-900">No messages yet</p>
            <p className="mt-2 text-sm text-stone-500">Ask a question from any product page to start a studio chat.</p>
            <Link href="/products" className="mt-6 inline-block bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <Link
                key={message.id}
                href={`/account/messages/${message.id}`}
                className="block border border-stone-200 bg-white p-5 transition hover:border-stone-400"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium text-stone-900">{message.product_title}</h2>
                      {message.unread_by_customer && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">New reply</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm capitalize text-stone-500">{message.inquiry_type.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right text-xs text-stone-400">
                    <p className="capitalize">{message.status.replace('_', ' ')}</p>
                    <p className="mt-1">{new Date(message.last_message_at || message.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
