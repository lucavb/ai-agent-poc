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

interface ChatMessageProps {
    message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        }).format(date);
    };

    return (
        <MessageContainer role={message.role}>
            <MessageContent role={message.role}>
                <MessageBubble role={message.role}>{message.content}</MessageBubble>
                <MessageTime role={message.role}>{formatTime(message.timestamp)}</MessageTime>
            </MessageContent>
        </MessageContainer>
    );
}
