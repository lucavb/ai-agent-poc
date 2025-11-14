import { useEffect } from 'react';
import { globalStyles } from './stitches.config';
import { ChatContainer } from './components/ChatContainer';

function App() {
  // Apply global styles on mount
  useEffect(() => {
    globalStyles();
  }, []);

  return <ChatContainer />;
}

export default App;
