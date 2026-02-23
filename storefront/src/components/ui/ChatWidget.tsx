'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Minimize2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    Tawk_API?: any;
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
  ];

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInputText('');

    // Simple auto-response (replace with Tawk.to or AI for real responses)
    setTimeout(() => {
      const botResponses: Record<string, string> = {
        track:
          'You can track your order at /track. Enter your order ID to see the status.',
        order:
          'You can track your order at /track. Enter your order ID to see the status.',
        return:
          'To return an item, go to your account > Orders > View Order > Request Return. Our return policy allows returns within 30 days.',
        shipping:
          'We offer free shipping on orders over $100. Standard delivery takes 5-7 business days. Express shipping available at checkout.',
        exchange:
          "For exchanges, please return the item and place a new order. We'll refund shipping costs for defective items.",
        refund:
          'Refunds are processed within 5-10 business days after return is approved.',
        contact:
          'You can reach us at support@kvastram.com or call +1 (555) 123-4567.',
        default:
          "Thank you for your message! Our team typically replies within minutes. Is there anything specific you'd like to know?",
      };

      const lowerMsg = userMessage.toLowerCase();
      let response = botResponses['default'];

      for (const [key, value] of Object.entries(botResponses)) {
        if (lowerMsg.includes(key)) {
          response = value;
          break;
        }
      }

      setMessages((prev) => [...prev, { role: 'bot', text: response }]);
    }, 500);
  };

  const handleQuickReply = (action: string) => {
    setMessages((prev) => [...prev, { role: 'user', text: action }]);

    setTimeout(() => {
      const botResponses: Record<string, string> = {
        track:
          'You can track your order at /track. Enter your order ID to see the status.',
        return:
          'To return an item, go to your account > Orders > View Order > Request Return. Our return policy allows returns within 30 days.',
        shipping:
          'We offer free shipping on orders over $100. Standard delivery takes 5-7 business days. Express shipping available at checkout.',
      };

      const lowerMsg = action.toLowerCase();
      let response = botResponses['default'] || 'Thank you for your message!';

      for (const [key, value] of Object.entries(botResponses)) {
        if (lowerMsg.includes(key)) {
          response = value;
          break;
        }
      }

      setMessages((prev) => [...prev, { role: 'bot', text: response }]);
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
          className="fixed bottom-6 right-6 w-14 h-14 bg-stone-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-stone-800 transition-colors z-40"
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
            className={`fixed bottom-6 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden ${isMinimized ? 'h-14' : 'h-[500px]'}`}
          >
            {/* Header */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Customer Support</h3>
                  <p className="text-xs text-white/70">
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
                    {/* Welcome Message */}
                    <div className="flex justify-start">
                      <div className="bg-white border border-stone-200 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                        <p className="text-sm text-stone-700">
                          Hello! Welcome to Kvastram. How can we help you today?
                        </p>
                      </div>
                    </div>

                    {/* Quick Replies */}
                    <div className="flex flex-wrap gap-2">
                      <button className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs text-stone-600 hover:border-stone-400 transition-colors">
                        Track my order
                      </button>
                      <button className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs text-stone-600 hover:border-stone-400 transition-colors">
                        Return an item
                      </button>
                      <button className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs text-stone-600 hover:border-stone-400 transition-colors">
                        Shipping info
                      </button>
                    </div>
                  </div>
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-stone-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-stone-200 rounded-full text-sm focus:outline-none focus:border-stone-900"
                    />
                    <button className="w-10 h-10 bg-stone-900 text-white rounded-full flex items-center justify-center hover:bg-stone-800 transition-colors">
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
                  <p className="text-[10px] text-stone-400 text-center mt-2">
                    Typically replies within minutes
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
