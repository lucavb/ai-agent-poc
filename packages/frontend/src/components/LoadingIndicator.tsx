import { styled, keyframes } from '../stitches.config';

const bounce = keyframes({
  '0%, 80%, 100%': {
    transform: 'scale(0)',
    opacity: 0.5,
  },
  '40%': {
    transform: 'scale(1)',
    opacity: 1,
  },
});

const LoadingContainer = styled('div', {
  display: 'flex',
  alignItems: 'center',
  padding: '$4',
  marginBottom: '$4',
});

const LoadingBubble = styled('div', {
  maxWidth: '70%',
  padding: '$3 $4',
  borderRadius: '$lg',
  backgroundColor: '$assistantMessage',
  border: '1px solid $border',
  borderBottomLeftRadius: '$sm',
});

const DotsContainer = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$2',
});

const Dot = styled('div', {
  width: '8px',
  height: '8px',
  borderRadius: '$full',
  backgroundColor: '$textMuted',
  animation: `${bounce} 1.4s infinite ease-in-out both`,
  
  '&:nth-child(1)': {
    animationDelay: '-0.32s',
  },
  
  '&:nth-child(2)': {
    animationDelay: '-0.16s',
  },
});

const LoadingText = styled('span', {
  fontSize: '$sm',
  color: '$textSecondary',
  marginRight: '$2',
});

export function LoadingIndicator() {
  return (
    <LoadingContainer>
      <LoadingBubble>
        <DotsContainer>
          <LoadingText>Thinking</LoadingText>
          <Dot />
          <Dot />
          <Dot />
        </DotsContainer>
      </LoadingBubble>
    </LoadingContainer>
  );
}

