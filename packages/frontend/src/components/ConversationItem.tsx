import { styled } from '../stitches.config';
import type { ConversationSummary } from '../types/conversation';

const ItemContainer = styled('div', {
    padding: '$3 $4',
    borderRadius: '$base',
    cursor: 'pointer',
    transition: 'all $fast',
    marginBottom: '$2',
    position: 'relative',

    '&:hover': {
        backgroundColor: '$bgTertiary',
    },

    variants: {
        active: {
            true: {
                backgroundColor: '$primaryLight',
                borderLeft: '3px solid $primary',
                paddingLeft: 'calc($4 - 3px)',

                '&:hover': {
                    backgroundColor: '$primaryLight',
                },
            },
        },
    },
});

const Title = styled('div', {
    fontSize: '$sm',
    fontWeight: '$semibold',
    color: '$text',
    marginBottom: '$1',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-line-clamp': '2',
    '-webkit-box-orient': 'vertical',
    lineHeight: '1.4',
    maxHeight: '2.8em', // 2 lines * 1.4 line-height
    wordBreak: 'break-word',
});

const Preview = styled('div', {
    fontSize: '$xs',
    color: '$textSecondary',
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-line-clamp': '2',
    '-webkit-box-orient': 'vertical',
    lineHeight: '1.3',
    maxHeight: '2.6em', // 2 lines * 1.3 line-height
    wordBreak: 'break-word',
});

const Meta = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '$1',
    fontSize: '$xs',
    color: '$textMuted',
});

const MessageCount = styled('span', {
    display: 'flex',
    alignItems: 'center',
    gap: '$1',
});

const DeleteButton = styled('button', {
    position: 'absolute',
    top: '$2',
    right: '$2',
    padding: '$1',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '$sm',
    cursor: 'pointer',
    color: '$textMuted',
    fontSize: '$sm',
    opacity: 0,
    transition: 'all $fast',

    '&:hover': {
        backgroundColor: '$errorLight',
        color: '$error',
    },

    [`${ItemContainer}:hover &`]: {
        opacity: 1,
    },
});

interface ConversationItemProps {
    conversation: ConversationSummary;
    active: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

export function ConversationItem({ conversation, active, onSelect, onDelete }: ConversationItemProps) {
    const formatDate = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selecting the conversation
        if (confirm(`Delete "${conversation.title}"?`)) {
            onDelete();
        }
    };

    return (
        <ItemContainer active={active} onClick={onSelect}>
            <Title>{conversation.title}</Title>
            {conversation.lastMessage && <Preview>{conversation.lastMessage}</Preview>}
            <Meta>
                <MessageCount>💬 {conversation.messageCount}</MessageCount>
                <span>{formatDate(conversation.createdAt)}</span>
            </Meta>
            <DeleteButton onClick={handleDelete} title="Delete conversation">
                ✕
            </DeleteButton>
        </ItemContainer>
    );
}
