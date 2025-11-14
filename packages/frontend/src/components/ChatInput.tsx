import { useState, type KeyboardEvent } from 'react';
import { styled } from '../stitches.config';

const InputContainer = styled('div', {
  display: 'flex',
  gap: '$3',
  padding: '$4',
  backgroundColor: '$bg',
  borderTop: '1px solid $border',
});

const Input = styled('input', {
  flex: 1,
  padding: '$3 $4',
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

  const handleSend = () => {
    if (input.trim() && !disabled) {
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

  return (
    <InputContainer>
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
      />
      <SendButton
        onClick={handleSend}
        disabled={disabled || !input.trim()}
      >
        Send
      </SendButton>
    </InputContainer>
  );
}

