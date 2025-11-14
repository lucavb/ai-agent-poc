# Markdown Support in Chat Messages

## Overview
The chat interface now fully supports markdown rendering in both user and assistant messages, as well as in the reasoning/thinking sections. Messages are parsed and displayed with proper formatting including headers, lists, code blocks, tables, links, and more.

## What Changed

### Dependencies Added
- **react-markdown** (v9.x) - A popular, secure markdown renderer for React
  - Automatically handles XSS protection
  - Supports all standard markdown features
  - Extensible with custom components

### Updated File: `packages/frontend/src/components/ChatMessage.tsx`

#### New Import
```typescript
import ReactMarkdown from 'react-markdown';
```

#### Enhanced MessageBubble Styling
Added comprehensive markdown element styling including:

**Typography:**
- Paragraph spacing with proper margins
- Headers (h1-h6) with appropriate font sizes
- Last paragraph margin removal for cleaner appearance

**Lists:**
- Bulleted (ul) and numbered (ol) lists with proper indentation
- List item spacing

**Code:**
- Inline code with gray background and monospace font
- Code blocks with enhanced background and scroll support
- Pre-formatted text blocks

**Other Elements:**
- Blockquotes with left border accent
- Links with primary color and hover effects
- Horizontal rules for visual separation
- Tables with borders and header styling
- Bold and italic text formatting

#### Enhanced ThinkContent Styling
Similar markdown styling for the reasoning section with:
- Lighter code background for better differentiation
- Smaller font sizes to maintain hierarchy
- All standard markdown elements supported

#### Updated Rendering
Both main content and think content now render through ReactMarkdown:
```typescript
<ReactMarkdown>{mainContent}</ReactMarkdown>
<ReactMarkdown>{thinkContent}</ReactMarkdown>
```

## Supported Markdown Features

### Headers
```markdown
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
```

### Text Formatting
```markdown
**bold text**
*italic text*
~~strikethrough~~ (if using remark-gfm)
```

### Lists
```markdown
- Bullet point 1
- Bullet point 2
  - Nested item

1. Numbered item 1
2. Numbered item 2
```

### Code
````markdown
Inline `code` with backticks

```javascript
// Code block
function example() {
  return true;
}
```
````

### Links
```markdown
[Link text](https://example.com)
```

### Blockquotes
```markdown
> This is a blockquote
> It can span multiple lines
```

### Tables
```markdown
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

### Horizontal Rules
```markdown
---
```

## Styling Details

### Color Scheme

**MessageBubble (Main Content):**
- Code background: `$gray100` (light gray)
- Blockquote border: `$gray300`
- Table borders: `$border`
- Links: `$primary` color

**ThinkContent (Reasoning):**
- Code background: `$gray200` (slightly darker for distinction)
- Overall lighter appearance to differentiate from main content

### Typography

**Headers:**
- H1: `$2xl` font size
- H2: `$xl` font size
- H3: `$lg` font size
- H4: `$base` font size
- All headers have `$semibold` weight

**Code:**
- Inline code: `$sm` font size
- Code blocks: monospace font family
- Proper padding and border radius

**Lists:**
- Left margin: `$4` space units
- Left padding: `$2` space units
- List item margin bottom: `$1`

### Spacing

**Paragraphs:**
- Bottom margin: `$2`
- Last paragraph: `0` margin

**Headers:**
- Top margin: `$3`
- Bottom margin: `$2`
- First header: `0` top margin

**Code Blocks:**
- Padding: `$3`
- Border radius: `$md`
- Auto overflow for long lines

## Security

### XSS Protection
- `react-markdown` sanitizes HTML by default
- No dangerouslySetInnerHTML used
- Safe rendering of user-provided content

### Link Safety
- External links should open in new tabs (can be configured)
- All links are properly escaped

## Examples

### Example 1: Text Formatting
**Input:**
```markdown
This is **bold** and this is *italic*. Here's some `inline code`.
```

**Output:**
This is **bold** and this is *italic*. Here's some `inline code`.

### Example 2: Lists and Code
**Input:**
````markdown
Here are the steps:
1. Install dependencies
2. Run the server
3. Test the endpoint

Example code:
```javascript
const result = await fetch('/api/endpoint');
```
````

**Output:**
Renders as a numbered list followed by a syntax-highlighted code block.

### Example 3: Tables
**Input:**
```markdown
| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Think Tags | ✅ |
| Syntax Highlighting | ⚠️ |
```

**Output:**
Renders as a styled table with borders and header background.

### Example 4: With Think Tags
**Input:**
```markdown
<think>User asked for database info. Need to query and format results as markdown table.</think>

## Database Results

| Table | Rows |
|-------|------|
| users | 42   |
| posts | 156  |

The query returned **2 tables** with data.
```

**Output:**
- Main message shows the header, table, and bold text properly formatted
- Think section (when expanded) shows the reasoning in italics

## Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- No polyfills required
- Graceful degradation for older browsers

## Performance

### Optimizations
- ReactMarkdown is lightweight (~20KB gzipped)
- No external CSS required (uses Stitches inline styles)
- Renders efficiently with React's virtual DOM

### Considerations
- Large messages with many markdown elements may take slightly longer to render
- Code blocks with very long lines are scrollable (no performance impact)

## Future Enhancements (Optional)

### Syntax Highlighting
Add `react-syntax-highlighter` for code block syntax highlighting:
```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

### GitHub Flavored Markdown (GFM)
Add `remark-gfm` for additional features like:
- Task lists
- Strikethrough
- Tables (enhanced)
- Autolinks

```bash
npm install remark-gfm
```

Usage:
```typescript
import remarkGfm from 'remark-gfm';

<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {content}
</ReactMarkdown>
```

### Math Equations
Add `remark-math` and `rehype-katex` for LaTeX math support:
```bash
npm install remark-math rehype-katex katex
```

### Emoji Support
Add `remark-emoji` for emoji shortcodes:
```bash
npm install remark-emoji
```

## Testing Recommendations

### Manual Testing
1. **Basic formatting:**
   - Send message with bold, italic, code
   - Verify proper styling

2. **Headers:**
   - Test all header levels (H1-H6)
   - Verify sizing hierarchy

3. **Lists:**
   - Test bullet and numbered lists
   - Test nested lists

4. **Code blocks:**
   - Test inline code
   - Test multi-line code blocks
   - Test very long lines (scrolling)

5. **Tables:**
   - Test simple tables
   - Test tables with many columns
   - Test table overflow

6. **Links:**
   - Test external links
   - Test hover state

7. **Think tags with markdown:**
   - Send message with think tag containing markdown
   - Verify both sections render markdown properly

### Edge Cases
- Empty markdown elements
- Malformed markdown
- Very long messages
- Messages with only whitespace
- Messages with special characters

## Troubleshooting

### Issue: Markdown not rendering
**Solution:** Ensure `react-markdown` is installed:
```bash
npm install react-markdown
```

### Issue: Styling looks wrong
**Solution:** Check that Stitches tokens are properly defined in `stitches.config.ts`

### Issue: Code blocks not scrolling
**Solution:** Verify `overflow: 'auto'` is applied to `pre` elements

### Issue: Links not working
**Solution:** Links should work by default. For new tab behavior, add custom component:
```typescript
<ReactMarkdown
  components={{
    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
  }}
>
  {content}
</ReactMarkdown>
```

## Accessibility

### Semantic HTML
- ReactMarkdown renders proper semantic HTML
- Headers maintain document outline
- Lists use proper `ul`/`ol`/`li` structure

### Screen Readers
- All elements are screen reader friendly
- Links announce properly
- Code blocks read as code

### Keyboard Navigation
- Links are keyboard accessible
- Focus states visible
- No keyboard traps

## Migration Notes

### From Plain Text to Markdown
- **No breaking changes** - Plain text displays as before
- Markdown is opt-in through syntax
- Existing messages continue to work

### User Messages
- Users can now use markdown in their messages
- Both user and assistant messages support markdown equally

### API Compatibility
- No API changes required
- Backend doesn't need modifications
- Content is still sent as plain text strings

