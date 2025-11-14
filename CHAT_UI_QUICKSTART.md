# Chat UI Quick Start Guide

## 🚀 Get the Full Stack Running

### Prerequisites

✅ Database running  
✅ Backend API running  
✅ Environment configured  

If not, follow these steps first:

```bash
# 1. Start database
docker compose up -d

# 2. Ensure .env file has API config
cat .env | grep API_PORT
# Should show: API_PORT=3001
```

## Step 1: Start the Backend API

In Terminal 1:

```bash
npm run dev:api
```

Wait for:
```
🚀 API Server Started
   URL: http://localhost:3001
✨ Ready to accept requests!
```

## Step 2: Start the Frontend

In Terminal 2:

```bash
npm run dev:frontend
```

Wait for:
```
  VITE v7.2.2  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Step 3: Open in Browser

Navigate to: **http://localhost:5173**

You should see:
- 💬 **"AI Database Chat"** header
- Welcome message
- Three example queries
- Input field at bottom

## 🎯 Try It Out

### Test 1: Click an Example Query

Click: **"How many users are in the database?"**

You'll see:
1. Your message appears (blue, right side)
2. "Thinking..." with animated dots
3. AI response appears (gray, left side)
4. Timestamp on each message

### Test 2: Type Your Own Query

In the input field, type:
```
Show me the database schema
```

Press **Enter** or click **Send**

### Test 3: Follow-up Question

After getting users, ask:
```
What are their email addresses?
```

The AI uses context from previous messages!

### Test 4: Clear Conversation

Click the **"Clear Chat"** button in the top right.

All messages disappear and you return to the welcome screen.

## 🎨 UI Features You'll See

### Messages
- **Your messages:** Blue bubbles on the right
- **AI messages:** Gray bubbles on the left
- **Timestamps:** Below each message

### Loading State
- Input field disabled
- "Thinking..." indicator with bouncing dots
- Can't send new messages while loading

### Empty State
- Welcome emoji 💬
- Helpful description
- Three clickable example queries

### Header
- Title: "AI Database Chat"
- Subtitle: "Ask questions in natural language"
- Clear button (only when messages exist)

## 📱 Responsive Design

### Desktop (> 768px)
- Centered with shadow
- Rounded corners
- Max width: 1200px
- Comfortable margins

### Mobile (< 768px)
- Full screen
- No rounded corners
- Touch-optimized buttons

## ⌨️ Keyboard Shortcuts

- **Enter:** Send message
- **Shift + Enter:** New line (not implemented, just sends)

## 🎯 Example Queries to Try

### Database Queries
```
How many users are in the database?
Show me all usernames
Which user has the most orders?
List all products with price > $50
What tables are in the database?
```

### Follow-up Questions
```
First: "How many orders does john have?"
Then: "Show me those orders"
Then: "What products did he buy?"
```

### Calculations
```
Calculate 15 * 23 + 42
What is (100 + 50) / 3?
```

### Schema Exploration
```
Show me the database schema
What columns does the users table have?
Describe the orders table
```

## 🐛 Troubleshooting

### "Failed to send message"

**Check:**
1. Is the API server running? (Terminal 1)
2. Is it on port 3001? `curl http://localhost:3001/health`
3. Check browser console for errors (F12)

**Fix:**
```bash
# Restart API server
npm run dev:api
```

### API returns slowly

**Expected:**
- Simple queries: 20-30 seconds
- Complex queries: 30-60 seconds

This is normal for LLM processing time.

### Messages not appearing

**Check:**
1. Browser console (F12) for errors
2. Network tab shows request to `/api/chat`
3. Response status is 200

**Fix:**
- Refresh the page (F5)
- Clear browser cache
- Restart frontend: `npm run dev:frontend`

### Clear button doesn't appear

**Why:**
- Button only shows when messages exist
- This is by design

**Test:**
- Send a message first
- Button should appear in header

### Example queries don't work

**Check:**
1. Database is running: `docker compose ps`
2. API can connect: `curl http://localhost:3001/health`

**Fix:**
```bash
# Restart database
docker compose restart
```

## 🎉 Success Checklist

- [ ] Frontend loads at http://localhost:5173
- [ ] See welcome screen with examples
- [ ] Can click example queries
- [ ] Can type and send messages
- [ ] Loading indicator appears
- [ ] AI responses appear
- [ ] Timestamps show
- [ ] Clear button works
- [ ] Follow-up questions work

## 📊 What's Happening Behind the Scenes

When you send a message:

1. **Frontend** (React)
   - Adds message to UI immediately
   - Shows loading indicator
   - Calls `/api/chat` endpoint

2. **Backend** (Express API)
   - Receives query
   - Passes to AI Agent
   - Agent uses tools (database, calculator)
   - Returns response

3. **AI Agent**
   - Analyzes query
   - Selects appropriate tools
   - Executes database queries
   - Formats natural language response

4. **Frontend** (React)
   - Receives response
   - Hides loading indicator
   - Displays AI message
   - Auto-scrolls to bottom

## 🎨 Customization

### Change API URL

Edit `packages/frontend/.env`:
```bash
VITE_API_URL=http://your-api-url:3001
```

Restart frontend: `npm run dev:frontend`

### Change Theme Colors

Edit `packages/frontend/src/stitches.config.ts`:
```typescript
colors: {
  primary: '#0066ff',  // Change this!
  userMessage: '#0066ff',  // And this!
  // ... more colors
}
```

### Modify Example Queries

Edit `packages/frontend/src/components/ChatContainer.tsx`:
```typescript
<ExampleQuery onClick={() => handleExampleQuery('Your custom query here')}>
  Your custom query here
</ExampleQuery>
```

## 🚀 Production Build

When ready to deploy:

```bash
# Build frontend
npm run build:frontend

# Build is in packages/frontend/dist/
# Serve with any static file server
```

## 📚 Full Documentation

- [Frontend Implementation Summary](FRONTEND_IMPLEMENTATION_SUMMARY.md)
- [API Documentation](packages/backend/API.md)
- [API Quick Start](API_QUICKSTART.md)

## 🎊 You're All Set!

Enjoy chatting with your database through natural language! 🎉

The AI Agent can:
- ✅ Query your database
- ✅ Understand follow-up questions
- ✅ Perform calculations
- ✅ Explain database schemas
- ✅ Remember conversation context

**Have fun exploring!** 🚀

