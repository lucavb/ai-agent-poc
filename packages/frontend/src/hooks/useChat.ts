import { useState, useCallback, useEffect, useRef } from 'react';
import { sendChatMessage, clearContext, type ChatResponse } from '../services/api';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface UseChatOptions {
    sessionId: string;
    initialMessages?: Message[];
    onMessagesChange?: (conversationId: string, messages: Message[]) => void;
}

export function useChat({ sessionId, initialMessages = [], onMessagesChange }: UseChatOptions) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const previousSessionIdRef = useRef<string>(sessionId);
    const skipNextUpdateRef = useRef(false);

    // Update messages when switching conversations
    useEffect(() => {
        // Only update if sessionId actually changed
        if (previousSessionIdRef.current !== sessionId) {
            previousSessionIdRef.current = sessionId;
            setMessages(initialMessages);
            setIsLoading(false); // Clear loading state when switching conversations
            setError(null); // Clear any errors when switching conversations
            // Skip the next onMessagesChange call since this is just a conversation switch
            skipNextUpdateRef.current = true;
        }
    }, [sessionId, initialMessages]);

    // Notify parent of message changes
    useEffect(() => {
        // Skip update if this was triggered by a conversation switch
        if (skipNextUpdateRef.current) {
            skipNextUpdateRef.current = false;
            return;
        }

        if (onMessagesChange) {
            onMessagesChange(sessionId, messages);
        }
    }, [messages, onMessagesChange, sessionId]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!content.trim() || isLoading) return;

            // Capture the sessionId at the time of sending to detect conversation switches
            const messageSessionId = sessionId;

            // Add user message immediately
            const userMessage: Message = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: content.trim(),
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            // Capture the messages at send time (including the user message we just added)
            let messagesAtSendTime: Message[] = [];
            setMessages((prev) => {
                messagesAtSendTime = prev;
                return prev;
            });

            try {
                // Send to API
                const response: ChatResponse = await sendChatMessage(content.trim(), messageSessionId);

                // Add assistant response
                const assistantMessage: Message = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: response.response,
                    timestamp: new Date(response.timestamp),
                };

                if (previousSessionIdRef.current === messageSessionId) {
                    // Still in the same conversation - update local state
                    setMessages((prev) => [...prev, assistantMessage]);
                } else {
                    // Conversation was switched - save response to the original conversation in the background
                    const updatedMessages = [...messagesAtSendTime, assistantMessage];
                    if (onMessagesChange) {
                        onMessagesChange(messageSessionId, updatedMessages);
                    }
                }
            } catch (err) {
                // Only show error if we're still in the same conversation
                if (previousSessionIdRef.current === messageSessionId) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
                    setError(errorMessage);

                    // Add error message
                    const errorMsg: Message = {
                        id: `error-${Date.now()}`,
                        role: 'assistant',
                        content: `Sorry, I encountered an error: ${errorMessage}`,
                        timestamp: new Date(),
                    };

                    setMessages((prev) => [...prev, errorMsg]);
                } else {
                    // Even if switched away, we might want to save the error to the original conversation
                    // For now, we'll just silently discard errors for switched conversations
                }
            } finally {
                // Only clear loading if we're still in the same conversation
                if (previousSessionIdRef.current === messageSessionId) {
                    setIsLoading(false);
                }
            }
        },
        [sessionId, isLoading, onMessagesChange],
    );

    const clearConversation = useCallback(async () => {
        try {
            await clearContext(sessionId);
            setMessages([]);
            setError(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to clear conversation';
            setError(errorMessage);
        }
    }, [sessionId]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearConversation,
    };
}
