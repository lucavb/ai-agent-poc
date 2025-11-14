import { useState, useRef, type KeyboardEvent, type ChangeEvent } from 'react';
import { styled } from '../stitches.config';

const InputContainer = styled('div', {
  display: 'flex',
  gap: '$3',
  padding: '$4',
  backgroundColor: '$bg',
  borderTop: '1px solid $border',
  position: 'relative',
});

const InputWrapper = styled('div', {
  flex: 1,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
});

const Input = styled('input', {
  flex: 1,
  padding: '$3 $4',
  paddingRight: '80px',
  fontSize: '$base',
  border: '1px solid $border',
  borderRadius: '$lg',
  backgroundColor: '$bg',
  color: '$text',
  outline: 'none',
  transition: 'all $fast',
  
  '&:focus': {
    borderColor: '$primary',
    boxShadow: '0 0 0 3px $primaryLight',
  },
  
  '&:disabled': {
    backgroundColor: '$bgTertiary',
    cursor: 'not-allowed',
    opacity: 0.6,
  },
  
  '&::placeholder': {
    color: '$textMuted',
  },
});

const KeyboardHint = styled('div', {
  position: 'absolute',
  right: '$3',
  display: 'flex',
  alignItems: 'center',
  gap: '$1',
  fontSize: '$xs',
  color: '$textMuted',
  pointerEvents: 'none',
  opacity: 0,
  transition: 'opacity $fast',
  
  variants: {
    visible: {
      true: {
        opacity: 1,
      },
    },
  },
});

const KeyboardKey = styled('span', {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: '20px',
  height: '20px',
  padding: '0 $1',
  fontSize: '$xs',
  fontWeight: '$semibold',
  backgroundColor: '$bgSecondary',
  border: '1px solid $border',
  borderRadius: '$sm',
  color: '$textSecondary',
});

const SendButton = styled('button', {
  padding: '$3 $6',
  fontSize: '$base',
  fontWeight: '$semibold',
  color: '$bg',
  backgroundColor: '$primary',
  border: 'none',
  borderRadius: '$lg',
  cursor: 'pointer',
  transition: 'all $fast',
  whiteSpace: 'nowrap',
  
  '&:hover:not(:disabled)': {
    backgroundColor: '$primaryHover',
    transform: 'translateY(-1px)',
    boxShadow: '$md',
  },
  
  '&:active:not(:disabled)': {
    transform: 'translateY(0)',
  },
  
  '&:disabled': {
    backgroundColor: '$bgTertiary',
    color: '$textMuted',
    cursor: 'not-allowed',
    transform: 'none',
  },
});

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSend, 
  disabled = false,
  placeholder = 'Ask a question about the database...'
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isNavigatingHistory, setIsNavigatingHistory] = useState(false);
  const originalInputRef = useRef<string>('');

  const handleSend = () => {
    if (input.trim() && !disabled) {
      const message = input.trim();
      // Add to history if it's different from the last message
      setMessageHistory((prev) => {
        if (prev.length === 0 || prev[prev.length - 1] !== message) {
          return [...prev, message];
        }
        return prev;
      });
      setHistoryIndex(-1);
      setIsNavigatingHistory(false);
      originalInputRef.current = '';
      onSend(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Handle up arrow to navigate message history
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (messageHistory.length === 0) return;
      
      // If we're not navigating yet, save the current input
      if (!isNavigatingHistory && input.trim()) {
        originalInputRef.current = input.trim();
      }
      
      setIsNavigatingHistory(true);
      
      // Navigate backwards through history
      if (historyIndex === -1) {
        // Start from the most recent message
        setHistoryIndex(messageHistory.length - 1);
        setInput(messageHistory[messageHistory.length - 1]);
      } else if (historyIndex > 0) {
        // Go to previous message
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(messageHistory[newIndex]);
      }
      // If at the beginning, stay there
    }
    
    // Handle down arrow to navigate forward
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (!isNavigatingHistory) return;
      
      if (historyIndex < messageHistory.length - 1) {
        // Go to next message
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(messageHistory[newIndex]);
      } else {
        // Reached the end, restore original input or clear
        setHistoryIndex(-1);
        setIsNavigatingHistory(false);
        setInput(originalInputRef.current || '');
        originalInputRef.current = '';
      }
    }
    
    // Exit history navigation when user starts typing
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && isNavigatingHistory) {
      setIsNavigatingHistory(false);
      setHistoryIndex(-1);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    // Exit history navigation when user types
    if (isNavigatingHistory) {
      setIsNavigatingHistory(false);
      setHistoryIndex(-1);
    }
  };

  const showHint = messageHistory.length > 0 && !disabled && (!input.trim() || isNavigatingHistory);

  return (
    <InputContainer>
      <InputWrapper>
        <Input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
        />
        {showHint && (
          <KeyboardHint visible={showHint}>
            {isNavigatingHistory && messageHistory.length > 1 ? (
              <>
                <KeyboardKey>↑</KeyboardKey>
                <KeyboardKey>↓</KeyboardKey>
                <span>to navigate</span>
              </>
            ) : (
              <>
                <KeyboardKey>↑</KeyboardKey>
                <span>to edit</span>
              </>
            )}
          </KeyboardHint>
        )}
      </InputWrapper>
      <SendButton
        onClick={handleSend}
        disabled={disabled || !input.trim()}
      >
        Send
      </SendButton>
    </InputContainer>
  );
}

