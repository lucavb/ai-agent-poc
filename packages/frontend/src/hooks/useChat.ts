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

            // Capture the current message history BEFORE adding the new user message (for API)
            const currentHistory = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

            // Add user message immediately
            const userMessage: Message = {
                id: `user-${Date.now()}`,
                role: 'user',
                content: content.trim(),
                timestamp: new Date(),
            };

            // Keep track of messages including the new user message (for background save)
            const messagesWithUserMsg = [...messages, userMessage];

            setMessages((prev) => [...prev, userMessage]);
            setIsLoading(true);
            setError(null);

            try {
                // Send to API with history (excluding the current user message we just added)
                const response: ChatResponse = await sendChatMessage(content.trim(), messageSessionId, currentHistory);

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
                    const updatedMessages = [...messagesWithUserMsg, assistantMessage];
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
        [messages, sessionId, isLoading, onMessagesChange],
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

    const deleteLastMessage = useCallback(() => {
        if (messages.length === 0) return;

        setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];

            // If the last message is an assistant message, remove it and the previous user message
            if (lastMessage.role === 'assistant') {
                // Remove the assistant message
                newMessages.pop();
                // If there's a user message before it, remove that too
                if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'user') {
                    newMessages.pop();
                }
            } else if (lastMessage.role === 'user') {
                // If the last message is a user message, just remove it
                newMessages.pop();
            }

            // Notify parent of the change
            if (onMessagesChange) {
                onMessagesChange(sessionId, newMessages);
            }

            return newMessages;
        });
    }, [messages.length, sessionId, onMessagesChange]);

    return {
        messages,
        isLoading,
        error,
        sendMessage,
        clearConversation,
        deleteLastMessage,
    };
}
