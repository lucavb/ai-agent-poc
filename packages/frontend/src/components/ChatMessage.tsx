import { useState } from 'react';
import { styled } from '../stitches.config';
import type { Message } from '../hooks/useChat';

const MessageContainer = styled('div', {
    display: 'flex',
    marginBottom: '$4',

    width: '100%',
    variants: {
        role: {
            user: {
                justifyContent: 'flex-end',
            },
            assistant: {
                justifyContent: 'flex-start',
            },
        },
    },
});

const MessageContent = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    variants: {
        role: {
            user: {
                alignItems: 'flex-end',
            },
            assistant: {
                alignItems: 'flex-start',
            },
        },
    },
});

const MessageBubble = styled('div', {
    maxWidth: '70%',
    padding: '$3 $4',
    borderRadius: '$lg',
    fontSize: '$base',
    lineHeight: '$relaxed',
    overflowWrap: 'break-word',
    wordBreak: 'normal',
    whiteSpace: 'pre-wrap',

    variants: {
        role: {
            user: {
                backgroundColor: '$userMessage',
                color: '$userText',
                borderBottomRightRadius: '$sm',
            },
            assistant: {
                backgroundColor: '$assistantMessage',
                color: '$assistantText',
                border: '1px solid $border',
                borderBottomLeftRadius: '$sm',
            },
        },
    },
});

const MessageTime = styled('div', {
    fontSize: '$xs',
    color: '$textSecondary', // Changed from textMuted for better visibility
    marginTop: '$1',
    fontWeight: '$normal',

    variants: {
        role: {
            user: {
                textAlign: 'right',
            },
            assistant: {
                textAlign: 'left',
            },
        },
    },
});

const ThinkSection = styled('div', {
    maxWidth: '70%',
    marginTop: '$2',
});

const ThinkToggle = styled('button', {
    fontSize: '$xs',
    color: '$textSecondary',
    backgroundColor: 'transparent',
    border: 'none',
    padding: '$1 $2',
    borderRadius: '$sm',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '$1',
    fontWeight: '$medium',
    transition: 'background-color 0.2s ease',

    '&:hover': {
        backgroundColor: '$gray100',
    },

    '&:focus': {
        outline: '2px solid $primary',
        outlineOffset: '2px',
    },
});

const ThinkContent = styled('div', {
    fontSize: '$sm',
    color: '$textSecondary',
    backgroundColor: '$gray50',
    border: '1px solid $border',
    borderRadius: '$md',
    padding: '$2 $3',
    marginTop: '$1',
    lineHeight: '$relaxed',
    whiteSpace: 'pre-wrap',
    fontStyle: 'italic',
});

const ThinkIcon = styled('span', {
    fontSize: '$xs',
    transition: 'transform 0.2s ease',
    
    variants: {
        isOpen: {
            true: {
                transform: 'rotate(90deg)',
            },
            false: {
                transform: 'rotate(0deg)',
            },
        },
    },
});

interface ChatMessageProps {
    message: Message;
}

/**
 * Parses message content to extract think tags and main content
 */
function parseThinkTags(content: string): { mainContent: string; thinkContent: string | null } {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const matches = [...content.matchAll(thinkRegex)];
    
    if (matches.length === 0) {
        return { mainContent: content, thinkContent: null };
    }

    // Extract all think content
    const thinkContent = matches.map(match => match[1].trim()).join('\n\n');
    
    // Remove think tags from main content
    const mainContent = content.replace(thinkRegex, '').trim();
    
    return { mainContent, thinkContent };
}

export function ChatMessage({ message }: ChatMessageProps) {
    const [isThinkOpen, setIsThinkOpen] = useState(false);

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    };

    // Parse message content to extract think tags
    const { mainContent, thinkContent } = parseThinkTags(message.content);

    return (
        <MessageContainer role={message.role}>
            <MessageContent role={message.role}>
                <MessageBubble role={message.role}>{mainContent}</MessageBubble>
                <MessageTime role={message.role}>{formatTime(message.timestamp)}</MessageTime>
                
                {/* Show think section only for assistant messages with think content */}
                {message.role === 'assistant' && thinkContent && (
                    <ThinkSection>
                        <ThinkToggle 
                            onClick={() => setIsThinkOpen(!isThinkOpen)}
                            aria-expanded={isThinkOpen}
                            aria-label="Toggle reasoning"
                        >
                            <ThinkIcon isOpen={isThinkOpen}>▶</ThinkIcon>
                            <span>Reasoning</span>
                        </ThinkToggle>
                        {isThinkOpen && (
                            <ThinkContent>{thinkContent}</ThinkContent>
                        )}
                    </ThinkSection>
                )}
            </MessageContent>
        </MessageContainer>
    );
}
