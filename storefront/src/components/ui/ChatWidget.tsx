'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { storefrontTrust } from '@/config/storefront-trust';

declare global {
  interface Window {
    Tawk_API?: {
      embedded?: string;
    };
    Tawk_LoadStart?: Date;
  }
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<
    { role: 'user' | 'bot'; text: string }[]
  >([
    {
      role: 'bot',
      text: 'Hello! Welcome to Kvastram. How can we help you today?',
    },
  ]);
  const [inputText, setInputText] = useState('');

  const TAWK_PROPERTY_ID = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;

  // If Tawk.to is configured, load the script
  if (TAWK_PROPERTY_ID) {
    return null;
  }

  const quickReplies = [
    { label: 'Track my order', action: 'I want to track my order' },
    { label: 'Return an item', action: 'How do I return an item?' },
    { label: 'Shipping info', action: 'What are the shipping options?' },
    { label: 'Payment help', action: 'I need help with payment' },
  ];

  const getBotResponse = (message: string) => {
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes('track') || lowerMsg.includes('order')) {
      return `You can track your order at ${storefrontTrust.policyRoutes.track}. Enter your order ID and email to see live status updates.`;
    }

    if (lowerMsg.includes('return') || lowerMsg.includes('refund')) {
      return `Eligible return guidance is available at ${storefrontTrust.policyRoutes.returns}. Signed-in customers can also open an order and request a return from their account when the order is eligible.`;
    }

    if (lowerMsg.includes('shipping') || lowerMsg.includes('delivery')) {
      return storefrontTrust.shippingSummary;
    }

    if (lowerMsg.includes('payment') || lowerMsg.includes('failed')) {
      return `Use ${storefrontTrust.policyRoutes.paymentHelp} if a payment attempt fails or you are unsure whether you were charged.`;
    }

    if (lowerMsg.includes('contact') || lowerMsg.includes('support')) {
      return `Reach us at ${storefrontTrust.supportEmail} or ${storefrontTrust.supportPhone} during ${storefrontTrust.supportHours}.`;
    }

    return `Thank you for your message. For order issues, payments, or policy questions, our support team can help at ${storefrontTrust.supportEmail}.`;
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInputText('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: getBotResponse(userMessage) },
      ]);
    }, 500);
  };

  const handleQuickReply = (action: string) => {
    setMessages((prev) => [...prev, { role: 'user', text: action }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: getBotResponse(action) },
      ]);
    }, 500);
  };

  const handleOpenChat = () => {
    setIsOpen(true);
  };

  return (
    <>
      {/* Chat Trigger Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="fixed bottom-40 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-white shadow-xl transition-colors hover:bg-stone-800 md:bottom-6 md:right-6"
          onClick={handleOpenChat}
          aria-label="Open chat support"
        >
          <MessageCircle size={24} />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-40 right-4 z-50 w-[calc(100vw-1rem)] max-w-80 overflow-hidden rounded-lg bg-white shadow-2xl md:bottom-6 md:right-6 md:w-96 ${isMinimized ? 'h-14' : 'h-[500px]'}`}
          >
            {/* Header */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <h3 className="type-medium text-body-sm">Customer Support</h3>
                  <p className="text-body-xs text-white/70">
                    We&apos;re here to help
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Minimize chat"
                >
                  <Minimize2 size={16} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Close chat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Content - Placeholder */}
            {!isMinimized && (
              <div className="flex flex-col h-[calc(100%-64px)]">
                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-stone-50">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-4 py-3 text-body-sm ${
                            message.role === 'user'
                              ? 'rounded-tr-sm bg-stone-900 text-white'
                              : 'rounded-tl-sm border border-stone-200 bg-white text-stone-700'
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}

                    <div className="flex flex-wrap gap-2">
                      {quickReplies.map((reply) => (
                        <button
                          key={reply.label}
                          type="button"
                          onClick={() => handleQuickReply(reply.action)}
                          className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-body-xs text-stone-600 transition-colors hover:border-stone-400"
                        >
                          {reply.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white border-t border-stone-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={inputText}
                      onChange={(event) => setInputText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleSendMessage();
                      }}
                      className="flex-1 px-4 py-2 border border-stone-200 rounded-full text-body-sm focus:outline-none focus:border-stone-900"
                    />
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900 text-white transition-colors hover:bg-stone-800"
                      aria-label="Send message"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-body-xs text-stone-500">
                    <Link href={storefrontTrust.policyRoutes.paymentHelp} className="underline underline-offset-4">
                      Payment Help
                    </Link>
                    <Link href={storefrontTrust.policyRoutes.returns} className="underline underline-offset-4">
                      Returns
                    </Link>
                    <Link href={storefrontTrust.policyRoutes.contact} className="underline underline-offset-4">
                      Contact
                    </Link>
                  </div>
                  <p className="mt-2 text-center text-body-xs text-stone-400">
                    {storefrontTrust.supportHours}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

