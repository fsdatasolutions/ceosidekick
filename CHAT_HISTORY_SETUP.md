# Chat History & Markdown Rendering Setup

This update adds:
1. **Markdown rendering** for AI responses (bold, lists, code blocks, etc.)
2. **Chat history sidebar** to browse and continue past conversations
3. **Conversation management** - list, select, and delete conversations

## Files to Update/Create

### 1. Install dependencies
```bash
npm install react-markdown remark-gfm @tailwindcss/typography
```

### 2. Update globals.css
Add the typography plugin import at the top:
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

### 3. Create API endpoints

**`src/app/api/conversations/route.ts`**
- GET: Lists user's conversations (filtered by agent)

**`src/app/api/conversations/[id]/route.ts`**
- GET: Fetch single conversation with messages
- DELETE: Delete a conversation

### 4. Update chat page
**`src/app/(dashboard)/chat/page.tsx`**
- Markdown rendering with `react-markdown` and `remark-gfm`
- History sidebar toggle button
- Conversation list with delete option
- Select conversation to continue

## Features

### Markdown Rendering
AI responses now render properly with:
- **Bold** and *italic* text
- Bullet and numbered lists
- `inline code` and code blocks
- Headers
- Links and tables (via GFM)

### Chat History Sidebar
- Click the history icon (clock) in the header to toggle
- Shows conversations for the current agent
- Displays title, date, and message count
- Click a conversation to load it
- Hover to reveal delete button
- Current conversation is highlighted

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations?agent=strategy` | GET | List conversations |
| `/api/conversations/[id]` | GET | Get conversation + messages |
| `/api/conversations/[id]` | DELETE | Delete conversation |

## Troubleshooting

### Markdown not rendering
- Ensure `@tailwindcss/typography` is installed
- Check that `@plugin "@tailwindcss/typography"` is in globals.css
- Verify the prose classes are applied: `prose prose-sm prose-neutral`

### History not loading
- Check browser console for API errors
- Verify `/api/conversations` endpoint returns data
- Check that conversations exist in the database

### Styling issues
The prose component uses these Tailwind classes:
```
prose prose-sm max-w-none prose-neutral 
prose-p:my-2 prose-headings:my-3 
prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 
prose-pre:bg-neutral-800 prose-pre:text-neutral-100
```
