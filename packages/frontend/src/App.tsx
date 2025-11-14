import { useEffect } from 'react';
import { globalStyles, darkTheme } from './stitches.config';
import { ChatContainer } from './components/ChatContainer';

const THEME_STORAGE_KEY = 'ai-agent-theme';

function App() {
  // Apply global styles on mount
  useEffect(() => {
    globalStyles();
    
    // Initialize theme from localStorage or system preference
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const isDark = stored 
      ? stored === 'dark'
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const root = document.documentElement;
    if (isDark) {
      root.classList.add(darkTheme);
    } else {
      root.classList.remove(darkTheme);
    }
  }, []);

  return <ChatContainer />;
}

export default App;
