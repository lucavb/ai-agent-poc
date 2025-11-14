import { styled } from '../stitches.config';
import type { Message } from '../hooks/useChat';

const MessageContainer = styled('div', {
  display: 'flex',
  marginBottom: '$4',
  
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

const MessageBubble = styled('div', {
  maxWidth: '70%',
  padding: '$3 $4',
  borderRadius: '$lg',
  fontSize: '$base',
  lineHeight: '$relaxed',
  wordWrap: 'break-word',
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
  color: '$textMuted',
  marginTop: '$1',
  
  variants: {
    role: {
      user: {
        textAlign: 'right',
        color: 'rgba(255, 255, 255, 0.7)',
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
      <div>
        <MessageBubble role={message.role}>
          {message.content}
        </MessageBubble>
        <MessageTime role={message.role}>
          {formatTime(message.timestamp)}
        </MessageTime>
      </div>
    </MessageContainer>
  );
}

