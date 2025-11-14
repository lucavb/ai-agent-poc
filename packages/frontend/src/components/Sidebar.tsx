import { styled } from '../stitches.config';
import { ConversationItem } from './ConversationItem';
import type { ConversationSummary } from '../types/conversation';
import YaraLogo from '../assets/Yara Logo RGB_Primary.svg';
import NerdGroupLogo from '../assets/Sticker_TheNerdGroup.svg';

const SidebarContainer = styled('div', {
  width: '300px',
  height: '100%',
  backgroundColor: '$bg',
  borderRight: '1px solid $border',
  display: 'flex',
  flexDirection: 'column',
  
  '@media (max-width: 768px)': {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 100,
    boxShadow: '$lg',
    transform: 'translateX(-100%)',
    transition: 'transform $base',
  },
  
  variants: {
    open: {
      true: {
        '@media (max-width: 768px)': {
          transform: 'translateX(0)',
        },
      },
    },
  },
});

const SidebarHeader = styled('div', {
  padding: '$4',
  borderBottom: '1px solid $border',
});

const SidebarFooter = styled('div', {
  padding: '$4',
  borderTop: '1px solid $border',
});

const LogoContainer = styled('div', {
  display: 'flex',
  alignItems: 'center',
  gap: '$3',
  justifyContent: 'flex-start',
});

const Logo = styled('img', {
  height: '75px',
  width: 'auto',
  objectFit: 'contain',
});

const NerdGroupLogoStyled = styled('img', {
  height: '100px',
  width: 'auto',
  objectFit: 'contain',
});

const NewConversationButton = styled('button', {
  width: '100%',
  padding: '$3 $4',
  fontSize: '$sm',
  fontWeight: '$semibold',
  color: '$bg',
  backgroundColor: '$primary',
  border: 'none',
  borderRadius: '$base',
  cursor: 'pointer',
  transition: 'all $fast',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',
  
  '&:hover': {
    backgroundColor: '$primaryHover',
    transform: 'translateY(-1px)',
    boxShadow: '$md',
  },
  
  '&:active': {
    transform: 'translateY(0)',
  },
});

const ConversationsList = styled('div', {
  flex: 1,
  overflowY: 'auto',
  padding: '$4',
  
  '&::-webkit-scrollbar': {
    width: '6px',
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
  padding: '$6',
  textAlign: 'center',
  color: '$textSecondary',
  fontSize: '$sm',
  lineHeight: '$relaxed',
});

const MobileOverlay = styled('div', {
  display: 'none',
  
  '@media (max-width: 768px)': {
    display: 'block',
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'opacity $base',
  },
  
  variants: {
    visible: {
      true: {
        '@media (max-width: 768px)': {
          opacity: 1,
          pointerEvents: 'auto',
        },
      },
    },
  },
});

interface SidebarProps {
  conversations: ConversationSummary[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  open?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  open = false,
  onClose,
}: SidebarProps) {
  return (
    <>
      <MobileOverlay visible={open} onClick={onClose} />
      <SidebarContainer open={open}>
        <SidebarHeader>
          <NewConversationButton onClick={onNewConversation}>
            <span>✨</span>
            <span>New Conversation</span>
          </NewConversationButton>
        </SidebarHeader>
        
        <ConversationsList>
          {conversations.length === 0 ? (
            <EmptyState>
              No conversations yet.<br />
              Start a new one to begin chatting!
            </EmptyState>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                active={conv.id === currentConversationId}
                onSelect={() => {
                  onSelectConversation(conv.id);
                  onClose?.();
                }}
                onDelete={() => onDeleteConversation(conv.id)}
              />
            ))
          )}
        </ConversationsList>
        
        <SidebarFooter>
          <LogoContainer>
            <Logo src={YaraLogo} alt="Yara Logo" />
            <NerdGroupLogoStyled src={NerdGroupLogo} alt="The Nerd Group" />
          </LogoContainer>
        </SidebarFooter>
      </SidebarContainer>
    </>
  );
}

