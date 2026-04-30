'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export interface StudioSocketMessage {
  id: string;
  sender_type: 'customer' | 'admin' | string;
  sender_name: string | null;
  sender_email: string | null;
  message: string;
  created_at: string;
}

interface StudioSocketPayload<TInquiry = unknown> {
  inquiryId: string;
  message: StudioSocketMessage;
  inquiry?: TInquiry;
}

interface UseStudioAdminSocketOptions<TInquiry> {
  inquiryId?: string | null;
  enabled?: boolean;
  onMessage?: (payload: StudioSocketPayload<TInquiry>) => void;
  onInquiryCreated?: (payload: { inquiry: TInquiry }) => void;
  onTyping?: (payload: { inquiryId: string; senderType: string; isTyping: boolean }) => void;
}

function getSocketUrl() {
  return (
    process.env.NEXT_PUBLIC_WS_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000'
  );
}

export function useStudioAdminSocket<TInquiry = unknown>({
  inquiryId,
  enabled = true,
  onMessage,
  onInquiryCreated,
  onTyping,
}: UseStudioAdminSocketOptions<TInquiry>) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messageRef = useRef(onMessage);
  const createdRef = useRef(onInquiryCreated);
  const typingRef = useRef(onTyping);

  useEffect(() => {
    messageRef.current = onMessage;
    createdRef.current = onInquiryCreated;
    typingRef.current = onTyping;
  }, [onMessage, onInquiryCreated, onTyping]);

  useEffect(() => {
    if (!enabled) return;

    const socket = io(getSocketUrl(), {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      timeout: 10000,
      withCredentials: true,
    });

    socketRef.current = socket;

    const subscribe = () => {
      socket.emit('subscribe:studio:admin', { inquiryId: inquiryId || undefined });
    };

    socket.on('connect', () => {
      setIsConnected(true);
      subscribe();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsSubscribed(false);
    });

    socket.on('studio:subscribed', () => {
      setIsSubscribed(true);
    });

    socket.on('studio:inquiry-created', (payload: { inquiry: TInquiry }) => {
      createdRef.current?.(payload);
    });

    socket.on('studio:inquiry-updated', (payload: StudioSocketPayload<TInquiry>) => {
      messageRef.current?.(payload);
    });

    socket.on('studio:typing', (payload: { inquiryId: string; senderType: string; isTyping: boolean }) => {
      typingRef.current?.(payload);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setIsSubscribed(false);
    });

    return () => {
      socket.emit('unsubscribe:studio', { inquiryId: inquiryId || undefined });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, inquiryId]);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!socketRef.current?.connected || !inquiryId) return;
      socketRef.current.emit('studio:typing', {
        inquiryId,
        senderType: 'admin',
        isTyping,
      });
    },
    [inquiryId]
  );

  return { isConnected, isSubscribed, sendTyping };
}
