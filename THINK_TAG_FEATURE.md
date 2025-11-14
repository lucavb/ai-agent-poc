# Think Tag Feature Implementation

## Overview
The frontend now intelligently handles `<think>` tags in AI responses. When present, the thinking/reasoning content is extracted and displayed in a collapsible, non-prominent section, allowing users to optionally view the AI's reasoning process.

## What Changed

### Updated File: `packages/frontend/src/components/ChatMessage.tsx`

#### New Imports
```typescript
import { useState } from 'react';
```

#### New Styled Components

1. **ThinkSection** - Container for the collapsible think content
   - Max width matches message bubble (70%)
   - Positioned below the message timestamp

2. **ThinkToggle** - Button to expand/collapse reasoning
   - Small, unobtrusive design
   - Hover and focus states for better UX
   - Contains an arrow icon that rotates when opened

3. **ThinkContent** - Display area for the think content
   - Light gray background for differentiation
   - Italic text to indicate internal reasoning
   - Pre-wrap for proper formatting

4. **ThinkIcon** - Animated arrow indicator
   - Rotates 90° when expanded
   - Smooth transition animation

#### New Function: `parseThinkTags()`
```typescript
function parseThinkTags(content: string): { mainContent: string; thinkContent: string | null }
```

**Purpose:** Extracts and separates `<think>` tags from message content

**Features:**
- Uses regex to find all `<think>...</think>` tags in the content
- Extracts all think content (supports multiple think tags)
- Returns cleaned main content with think tags removed
- Returns `null` for thinkContent if no think tags found

**How it works:**
1. Searches for all `<think>` tags using regex pattern: `/<think>([\s\S]*?)<\/think>/g`
2. Extracts content between tags
3. Removes tags from main content
4. Returns both parts separately

#### Updated Component Logic

The `ChatMessage` component now:
1. Parses the message content to extract think tags
2. Displays main content in the message bubble (without think tags)
3. Only shows the "Reasoning" collapsible for:
   - Assistant messages (not user messages)
   - Messages that contain think content
4. Manages expand/collapse state with React `useState`

## User Experience

### Without Think Tags
- Messages display normally as before
- No visual change or extra elements
- Fully backward compatible

### With Think Tags
- Main response shown clearly in the message bubble
- Small "Reasoning" button appears below the message
- Button shows a collapsed arrow (▶)
- Clicking reveals the AI's internal reasoning
- Arrow rotates to point down (▼) when expanded
- Think content shown in a subtle gray box with italic text

## Example Usage

### Input Message with Think Tag
```
<think>The user asks: "how many fields do we have?" We have just queried the core-service field table count, got 4. Need to respond with that number. Also earlier they asked about database schema; we already gave schema dump. Provide answer.</think>There are **4 fields** in the system's database.
```

### Display Result
**Main Message:**
```
There are **4 fields** in the system's database.
```

**Collapsible Reasoning (when expanded):**
```
The user asks: "how many fields do we have?" We have just queried the core-service field table count, got 4. Need to respond with that number. Also earlier they asked about database schema; we already gave schema dump. Provide answer.
```

## Technical Details

### Regex Pattern
```typescript
const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
```
- `[\s\S]*?` - Matches any character including newlines (non-greedy)
- `g` flag - Global match (finds all occurrences)

### Multiple Think Tags
If a message contains multiple `<think>` tags, they are:
- All extracted and combined
- Separated by double newlines
- Displayed together in the reasoning section

### Accessibility
- Proper ARIA attributes (`aria-expanded`, `aria-label`)
- Keyboard accessible (button element)
- Focus visible indicator
- Semantic HTML

## Styling Details

### Color Scheme
- **ThinkToggle**: Transparent background, gray text
- **ThinkToggle hover**: Light gray background
- **ThinkContent**: Very light gray background (`$gray50`)
- **Text**: Secondary text color, italic

### Typography
- **Toggle button**: Extra small font (`$xs`)
- **Think content**: Small font (`$sm`), italic
- **Line height**: Relaxed for readability

### Spacing
- **MarginTop**: Small gap between message and think section
- **Padding**: Comfortable padding in think content box

## Browser Compatibility
- Uses standard React hooks (useState)
- CSS transitions supported in all modern browsers
- Arrow character (▶) universally supported

## Performance Considerations
- Regex parsing happens once per message render
- Minimal re-renders (only when expanding/collapsing)
- No external dependencies required
- Lightweight implementation

## Future Enhancements (Optional)
- Add animation when expanding/collapsing
- Support for nested think tags
- Syntax highlighting for code in think content
- Keyboard shortcut to toggle all reasoning sections
- Remember user preference (always show/hide reasoning)

## Testing Recommendations

1. **Test with think tags:**
   - Single think tag
   - Multiple think tags
   - Empty think tag
   - Think tag with special characters

2. **Test without think tags:**
   - Verify normal messages display correctly
   - Ensure no extra spacing or elements

3. **Test interaction:**
   - Click to expand/collapse
   - Keyboard navigation (Tab, Enter, Space)
   - Multiple messages with mix of think/no-think

4. **Test edge cases:**
   - Very long think content
   - Think tags in user messages (should not show)
   - Malformed HTML tags (should display as text)

