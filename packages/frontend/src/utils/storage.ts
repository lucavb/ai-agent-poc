import type { Conversation } from '../types/conversation';

const STORAGE_KEY = 'ai-agent-conversations';

/**
 * Get all conversations from localStorage
 */
export function getConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const conversations = JSON.parse(data);
    
    // Parse dates
    return conversations.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  }
}

/**
 * Save all conversations to localStorage
 */
export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversations:', error);
  }
}

/**
 * Get a single conversation by ID
 */
export function getConversation(id: string): Conversation | null {
  const conversations = getConversations();
  return conversations.find(conv => conv.id === id) || null;
}

/**
 * Save a single conversation
 */
export function saveConversation(conversation: Conversation): void {
  const conversations = getConversations();
  const index = conversations.findIndex(conv => conv.id === conversation.id);
  
  if (index >= 0) {
    conversations[index] = conversation;
  } else {
    conversations.push(conversation);
  }
  
  saveConversations(conversations);
}

/**
 * Delete a conversation
 */
export function deleteConversation(id: string): void {
  const conversations = getConversations();
  const filtered = conversations.filter(conv => conv.id !== id);
  saveConversations(filtered);
}

/**
 * Generate a title from the first message
 */
export function generateTitle(firstMessage: string): string {
  const maxLength = 50;
  const cleaned = firstMessage.trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  return cleaned.substring(0, maxLength) + '...';
}

