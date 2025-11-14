import { useEffect, useRef, useState, useCallback } from 'react';
import { styled } from '../stitches.config';
import { useChat } from '../hooks/useChat';
import { useConversations } from '../hooks/useConversations';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { LoadingIndicator } from './LoadingIndicator';
import { Sidebar } from './Sidebar';

const AppContainer = styled('div', {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
});

const MainContent = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    backgroundColor: '$bg',
    minWidth: 0, // Allow flex child to shrink
});

const Header = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '$4 $6',
    backgroundColor: '$bg',
    borderBottom: '1px solid $border',
});

const HeaderLeft = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '$3',
});

const MenuButton = styled('button', {
    padding: '$2',
    fontSize: '$lg',
    backgroundColor: 'transparent',
    border: '1px solid $border',
    borderRadius: '$base',
    cursor: 'pointer',
    transition: 'all $fast',
    display: 'none',

    '@media (max-width: 768px)': {
        display: 'block',
    },

    '&:hover': {
        backgroundColor: '$bgSecondary',
        borderColor: '$textSecondary',
    },

    '&:active': {
        transform: 'scale(0.95)',
    },
});

const TitleContainer = styled('div', {});

const Title = styled('h1', {
    fontSize: '$2xl',
    fontWeight: '$bold',
    color: '$text',
    margin: 0,
});

const Subtitle = styled('p', {
    fontSize: '$sm',
    color: '$textSecondary',
    margin: 0,
    marginTop: '$1',
});

const ClearButton = styled('button', {
    padding: '$2 $4',
    fontSize: '$sm',
    fontWeight: '$medium',
    color: '$textSecondary',
    backgroundColor: 'transparent',
    border: '1px solid $border',
    borderRadius: '$base',
    cursor: 'pointer',
    transition: 'all $fast',

    '&:hover': {
        backgroundColor: '$bgSecondary',
        borderColor: '$textSecondary',
        color: '$text',
    },

    '&:active': {
        transform: 'scale(0.98)',
    },
});

const MessagesContainer = styled('div', {
    flex: 1,
    overflowY: 'auto',
    padding: '$4 $6', // Reduced top/bottom padding from $6 to $4
    backgroundColor: '$bgSecondary',
    minHeight: 0, // Allow flex shrinking

    '&::-webkit-scrollbar': {
        width: '8px',
    },

    '&::-webkit-scrollbar-track': {
        backgroundColor: 'transparent',
    },

    '&::-webkit-scrollbar-thumb': {
        backgroundColor: '$border',
        borderRadius: '$full',

        '&:hover': {
            backgroundColor: '$textMuted',
        },
    },
});

const EmptyState = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    color: '$textSecondary',
});

const EmptyIcon = styled('div', {
    fontSize: '48px',
    marginBottom: '$4',
    width: '80px',
    height: '80px',
    borderRadius: '$full',
    backgroundColor: '$primaryLight',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '$primary',
    fontWeight: '$bold',
});

const EmptyTitle = styled('h2', {
    fontSize: '$xl',
    fontWeight: '$semibold',
    color: '$text',
    marginBottom: '$2',
});

const EmptyDescription = styled('p', {
    fontSize: '$base',
    color: '$textSecondary',
    maxWidth: '400px',
    lineHeight: '$relaxed',
});

const ExampleQueries = styled('div', {
    display: 'flex',
    flexDirection: 'column',
    gap: '$2',
    marginTop: '$4',
});

const ExampleQuery = styled('button', {
    padding: '$2 $4',
    fontSize: '$sm',
    color: '$primary',
    backgroundColor: '$primaryLight',
    border: '1px solid transparent',
    borderRadius: '$base',
    cursor: 'pointer',
    transition: 'all $fast',

    '&:hover': {
        borderColor: '$primary',
        transform: 'translateY(-1px)',
    },
});

export function ChatContainer() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const hasInitialized = useRef(false);

    const {
        conversationSummaries,
        currentConversation,
        currentConversationId,
        isLoaded,
        createConversation,
        switchConversation,
        deleteConversation,
        updateConversationMessages,
    } = useConversations();

    // Create initial conversation if none exists (only after loading is complete)
    useEffect(() => {
        if (isLoaded && !hasInitialized.current && !currentConversationId && conversationSummaries.length === 0) {
            hasInitialized.current = true;
            createConversation();
        }
    }, [isLoaded, currentConversationId, conversationSummaries.length, createConversation]);

    const handleMessagesChange = useCallback(
        (messages: any[]) => {
            if (currentConversationId) {
                updateConversationMessages(currentConversationId, messages);
            }
        },
        [currentConversationId, updateConversationMessages],
    );

    const { messages, isLoading, sendMessage, clearConversation } = useChat({
        sessionId: currentConversationId || 'default',
        initialMessages: currentConversation?.messages || [],
        onMessagesChange: handleMessagesChange,
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleExampleQuery = (query: string) => {
        sendMessage(query);
    };

    const handleClearChat = async () => {
        if (confirm('Clear this conversation?')) {
            await clearConversation();
            if (currentConversationId) {
                updateConversationMessages(currentConversationId, []);
            }
        }
    };

    const handleNewConversation = () => {
        createConversation();
        setSidebarOpen(false);
    };

    return (
        <AppContainer>
            <Sidebar
                conversations={conversationSummaries}
                currentConversationId={currentConversationId}
                onNewConversation={handleNewConversation}
                onSelectConversation={switchConversation}
                onDeleteConversation={deleteConversation}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <MainContent>
                <Header>
                    <HeaderLeft>
                        <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>☰</MenuButton>
                        <TitleContainer>
                            <Title>{currentConversation?.title || 'AI Database Chat'}</Title>
                            <Subtitle>Ask questions in natural language</Subtitle>
                        </TitleContainer>
                    </HeaderLeft>
                    {messages.length > 0 && <ClearButton onClick={handleClearChat}>Clear Chat</ClearButton>}
                </Header>

                <MessagesContainer>
                    {messages.length === 0 && !isLoading ? (
                        <EmptyState>
                            <EmptyIcon>💭</EmptyIcon>
                            <EmptyTitle>Start a conversation</EmptyTitle>
                            <EmptyDescription>
                                Ask me anything about your database. I can help you query data, explore schemas, and
                                analyze information using natural language.
                            </EmptyDescription>
                            <ExampleQueries>
                                <ExampleQuery onClick={() => handleExampleQuery('How many users are in the database?')}>
                                    How many users are in the database?
                                </ExampleQuery>
                                <ExampleQuery onClick={() => handleExampleQuery('Show me the database schema')}>
                                    Show me the database schema
                                </ExampleQuery>
                                <ExampleQuery onClick={() => handleExampleQuery('Which user has the most orders?')}>
                                    Which user has the most orders?
                                </ExampleQuery>
                            </ExampleQueries>
                        </EmptyState>
                    ) : (
                        <>
                            {messages.map((message) => (
                                <ChatMessage key={message.id} message={message} />
                            ))}
                            {isLoading && <LoadingIndicator />}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </MessagesContainer>

                <ChatInput onSend={sendMessage} disabled={isLoading} />
            </MainContent>
        </AppContainer>
    );
}
