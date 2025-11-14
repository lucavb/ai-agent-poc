import { useState, useEffect, useCallback } from 'react';
import type { Conversation, ConversationSummary } from '../types/conversation';
import {
    getConversations,
    saveConversation,
    deleteConversation as deleteConversationFromStorage,
    generateTitle,
} from '../utils/storage';
import type { Message } from './useChat';

export function useConversations() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load conversations on mount
    useEffect(() => {
        const loaded = getConversations();
        setConversations(loaded);

        // If there are conversations, select the most recent
        if (loaded.length > 0) {
            const mostRecent = loaded.reduce((prev, current) => (current.updatedAt > prev.updatedAt ? current : prev));
            setCurrentConversationId(mostRecent.id);
        }

        setIsLoaded(true); // Mark as loaded
    }, []); // Empty dependency array - only run once on mount

    // Create a new conversation
    const createConversation = useCallback((): string => {
        const newConversation: Conversation = {
            id: `conv-${Date.now()}`,
            title: 'New Conversation',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        saveConversation(newConversation);
        setConversations((prev) => [newConversation, ...prev]);
        setCurrentConversationId(newConversation.id);

        return newConversation.id;
    }, []);

    // Update conversation messages
    const updateConversationMessages = useCallback((conversationId: string, messages: Message[]) => {
        setConversations((prev) => {
            const updated = prev.map((conv) => {
                if (conv.id === conversationId) {
                    const updatedConv = {
                        ...conv,
                        messages,
                        updatedAt: new Date(),
                        // Update title based on first message if it's still "New Conversation"
                        title:
                            conv.title === 'New Conversation' && messages.length > 0 && messages[0].role === 'user'
                                ? generateTitle(messages[0].content)
                                : conv.title,
                    };
                    saveConversation(updatedConv);
                    return updatedConv;
                }
                return conv;
            });

            return updated;
        });
    }, []);

    // Switch to a conversation
    const switchConversation = useCallback((conversationId: string) => {
        setCurrentConversationId(conversationId);
    }, []);

    // Delete a conversation
    const deleteConversation = useCallback(
        (conversationId: string) => {
            deleteConversationFromStorage(conversationId);
            setConversations((prev) => prev.filter((conv) => conv.id !== conversationId));

            // If deleting current conversation, switch to another or create new
            if (conversationId === currentConversationId) {
                setConversations((remaining) => {
                    if (remaining.length > 0) {
                        setCurrentConversationId(remaining[0].id);
                    } else {
                        // Create a new conversation if no conversations left
                        const newId = createConversation();
                        setCurrentConversationId(newId);
                    }
                    return remaining;
                });
            }
        },
        [currentConversationId, createConversation],
    );

    // Get current conversation
    const currentConversation = conversations.find((conv) => conv.id === currentConversationId) || null;

    // Get conversation summaries for sidebar, sorted by creation time (newest first)
    const conversationSummaries: ConversationSummary[] = [...conversations]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((conv) => ({
            id: conv.id,
            title: conv.title,
            lastMessage:
                conv.messages.length > 0
                    ? conv.messages[conv.messages.length - 1].content.substring(0, 60) + '...'
                    : undefined,
            messageCount: conv.messages.length,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
        }));

    return {
        conversations,
        conversationSummaries,
        currentConversation,
        currentConversationId,
        isLoaded,
        createConversation,
        switchConversation,
        deleteConversation,
        updateConversationMessages,
    };
}
