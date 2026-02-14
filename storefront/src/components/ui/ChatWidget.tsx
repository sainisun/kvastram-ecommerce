'use client';

import { useState } from 'react';
import { MessageCircle, X, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // This is a placeholder - in production, integrate with:
    // - Tawk.to: https://www.tawk.to
    // - Intercom: https://www.intercom.com
    // - Zendesk: https://www.zendesk.com
    // - Custom chat solution

    const handleOpenChat = () => {
        // For demo, show a message. In production, open actual chat widget
        setIsOpen(true);
        setIsMinimized(false);
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
                                    <p className="text-xs text-white/70">We&apos;re here to help</p>
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
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
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
