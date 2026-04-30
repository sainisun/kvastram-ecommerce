'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MessageCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';

interface StudioMessage {
  id: string;
  sender_type: 'customer' | 'admin' | string;
  sender_name: string | null;
  message: string;
  created_at: string;
}

interface StudioInquiry {
  id: string;
  product_title: string;
  product_url: string | null;
  status: string;
  inquiry_type: string;
}

export default function AccountMessageDetailPage() {
  const { customer, loading } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<StudioInquiry | null>(null);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!loading && !customer) router.push(`/login?redirect=/account/messages/${params.id}`);
  }, [customer, loading, params.id, router]);

  const loadConversation = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCustomerStudioInquiry(params.id);
      setInquiry(data.inquiry);
      setMessages(data.messages || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (loading || !customer) return;
    void loadConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer, loading, params.id]);

  const sendReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const data = await api.sendCustomerStudioMessage(params.id, reply.trim());
      setMessages((prev) => [...prev, data.message]);
      setReply('');
    } finally {
      setSending(false);
    }
  };

  if (loading || !customer) {
    return <div className="min-h-screen bg-stone-50 px-6 py-12 md:px-12 lg:px-20" />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/account/messages" className="text-sm text-stone-500 hover:text-stone-900">
              Messages
            </Link>
            <h1 className="mt-2 font-serif text-3xl text-stone-900">{inquiry?.product_title || 'Studio Chat'}</h1>
            {inquiry?.product_url && (
              <a href={inquiry.product_url} className="mt-2 inline-block text-sm text-stone-500 underline underline-offset-4">
                View product
              </a>
            )}
          </div>
          <button type="button" onClick={() => void loadConversation()} className="text-stone-500 hover:text-stone-900" aria-label="Refresh messages">
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="border border-stone-200 bg-white">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-stone-400">
              <RefreshCw className="mr-2 animate-spin" size={20} />
              Loading conversation...
            </div>
          ) : (
            <div className="max-h-[560px] space-y-4 overflow-y-auto p-5">
              {messages.map((message) => {
                const isAdmin = message.sender_type === 'admin';
                return (
                  <div key={message.id} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[84%] rounded-2xl px-4 py-3 ${isAdmin ? 'bg-stone-100 text-stone-800' : 'bg-stone-900 text-white'}`}>
                      <p className={`mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${isAdmin ? 'text-stone-500' : 'text-stone-300'}`}>
                        {isAdmin ? message.sender_name || 'Kvastram Studio' : 'You'}
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={sendReply} className="border-t border-stone-200 p-5">
            <textarea
              required
              rows={4}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              className="w-full resize-none border border-stone-200 px-4 py-3 text-sm outline-none focus:border-stone-900"
              placeholder="Write a message..."
            />
            <button
              type="submit"
              disabled={sending || !reply.trim()}
              className="mt-4 inline-flex items-center gap-2 bg-stone-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white disabled:bg-stone-300"
            >
              <MessageCircle size={15} />
              {sending ? 'Sending' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
