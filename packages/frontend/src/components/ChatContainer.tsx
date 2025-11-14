import { useEffect, useRef } from 'react';
import { styled } from '../stitches.config';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { LoadingIndicator } from './LoadingIndicator';

const Container = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  maxWidth: '1200px',
  margin: '0 auto',
  backgroundColor: '$bg',
  boxShadow: '$lg',
  
  '@md': {
    height: 'calc(100vh - 64px)',
    margin: '32px auto',
    borderRadius: '$xl',
  },
});

const Header = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$4 $6',
  backgroundColor: '$bg',
  borderBottom: '1px solid $border',
  borderTopLeftRadius: '$xl',
  borderTopRightRadius: '$xl',
});

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
  padding: '$6',
  backgroundColor: '$bgSecondary',
  
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
  fontSize: '64px',
  marginBottom: '$4',
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
  const { messages, isLoading, sendMessage, clearConversation } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleExampleQuery = (query: string) => {
    sendMessage(query);
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>AI Database Chat</Title>
          <Subtitle>Ask questions in natural language</Subtitle>
        </div>
        {messages.length > 0 && (
          <ClearButton onClick={clearConversation}>
            Clear Chat
          </ClearButton>
        )}
      </Header>
      
      <MessagesContainer>
        {messages.length === 0 && !isLoading ? (
          <EmptyState>
            <EmptyIcon>💬</EmptyIcon>
            <EmptyTitle>Start a conversation</EmptyTitle>
            <EmptyDescription>
              Ask me anything about your database. I can help you query data,
              explore schemas, and analyze information using natural language.
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
      
      <ChatInput
        onSend={sendMessage}
        disabled={isLoading}
      />
    </Container>
  );
}

