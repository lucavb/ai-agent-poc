import { useState, useEffect } from 'react';
import { styled } from '../stitches.config';
import { darkTheme } from '../stitches.config';

const ToggleContainer = styled('button', {
  position: 'relative',
  width: '64px',
  height: '36px',
  borderRadius: '$full',
  border: '2px solid $border',
  backgroundColor: '$bgSecondary',
  cursor: 'pointer',
  padding: '3px',
  transition: 'all $base',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  
  '&:hover': {
    borderColor: '$primary',
    backgroundColor: '$bgTertiary',
  },
  
  '&:focus': {
    outline: '2px solid $primary',
    outlineOffset: '2px',
  },
  
  '&:active': {
    transform: 'scale(0.95)',
  },
});

const ToggleTrack = styled('div', {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 4px',
});

const IconContainer = styled('div', {
  position: 'absolute',
  width: '28px',
  height: '28px',
  borderRadius: '$full',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform $base ease-in-out, background-color $base',
  fontSize: '18px',
  zIndex: 2,
  boxShadow: '$sm',
  
  variants: {
    isDark: {
      true: {
        transform: 'translateX(28px)',
        backgroundColor: '$bgTertiary',
      },
      false: {
        transform: 'translateX(0px)',
        backgroundColor: '$primaryLight',
      },
    },
  },
});

const Icon = styled('span', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity $fast, transform $base',
  
  variants: {
    visible: {
      true: {
        opacity: 1,
        transform: 'scale(1)',
      },
      false: {
        opacity: 0,
        transform: 'scale(0.5)',
      },
    },
  },
});

const SunIcon = styled(Icon, {
  position: 'absolute',
});

const MoonIcon = styled(Icon, {
  position: 'absolute',
});

const THEME_STORAGE_KEY = 'ai-agent-theme';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement;
    if (isDark) {
      root.classList.add(darkTheme);
    } else {
      root.classList.remove(darkTheme);
    }
    
    // Save to localStorage
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <ToggleContainer
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      type="button"
    >
      <ToggleTrack>
        <IconContainer isDark={isDark}>
          <SunIcon visible={!isDark}>☀️</SunIcon>
          <MoonIcon visible={isDark}>🌙</MoonIcon>
        </IconContainer>
      </ToggleTrack>
    </ToggleContainer>
  );
}

