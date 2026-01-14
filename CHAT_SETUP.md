# Strategy Partner Chat Setup

LangGraph-powered AI chat with the Strategy Partner (Virtual CTO/CIO).

## Installation

```bash
npm install @langchain/core @langchain/anthropic @langchain/langgraph
```

## Environment Variables

Add to `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

Get your API key from [console.anthropic.com](https://console.anthropic.com/).

## Files Added

```
src/
├── agents/
│   ├── index.ts              # Exports
│   ├── types.ts              # Type definitions
│   ├── strategy-partner.ts   # Strategy Partner config & system prompt
│   └── graph.ts              # LangGraph workflow
└── app/
    ├── api/chat/
    │   └── route.ts          # Chat API with streaming
    └── (dashboard)/chat/
        └── page.tsx          # Chat UI
```

## Architecture

### LangGraph Workflow

```
[User Message] → [StateGraph] → [Claude API] → [Streamed Response]
                      ↓
              [Database Persistence]
```

The workflow:
1. Receives user message via API
2. Loads conversation history from database
3. Sends to Claude with system prompt
4. Streams response back to UI
5. Persists messages to database

### Agent System

Each agent has:
- **System Prompt**: Defines personality and expertise
- **Configuration**: Temperature, max tokens, etc.
- **Type ID**: For routing and storage

Currently implemented:
- ✅ Strategy Partner (Virtual CTO/CIO)
- 🔜 Executive Coach
- 🔜 Legal Advisor
- 🔜 HR Partner
- 🔜 Knowledge Base (requires RAG)
- 🔜 Content Engine (external)

## Usage

### Chat Page

Navigate to `/chat` or `/chat?agent=strategy` to start chatting.

URL parameters:
- `agent`: Agent type (`strategy`, `coach`, `legal`, `hr`, `knowledge`)
- `id`: Conversation ID (to resume existing chat)

### API Endpoints

**POST /api/chat** - Send a message (streaming response)
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Should I build or buy a CRM?",
    agent: "strategy",
    conversationId: "optional-existing-id"
  })
});

// Response is Server-Sent Events stream
// Events: conversation_id, content, done, error
```

**GET /api/chat** - Get conversation history
```typescript
// Get conversations list
GET /api/chat

// Get specific conversation
GET /api/chat?conversationId=xxx
```

## Customizing the Strategy Partner

Edit `src/agents/strategy-partner.ts` to modify:

```typescript
export const strategyPartnerConfig: AgentConfig = {
  id: "strategy",
  name: "Strategy Partner",
  subtitle: "Virtual CTO/CIO",
  temperature: 0.7,        // Adjust creativity
  maxTokens: 4096,         // Max response length
  systemPrompt: `...`,     // The personality and expertise
};
```

## Adding New Agents

1. Create config file (e.g., `src/agents/executive-coach.ts`)
2. Add to `agentConfigs` map in `src/agents/graph.ts`
3. Agent automatically available via API

Example:
```typescript
// src/agents/executive-coach.ts
export const executiveCoachConfig: AgentConfig = {
  id: "coach",
  name: "Executive Coach",
  subtitle: "Leadership Partner",
  systemPrompt: `You are an executive coach...`,
};
```

## Database Integration

When `DATABASE_URL` is set, conversations are automatically persisted:
- New conversations created on first message
- Messages saved with role and timestamp
- Conversation metadata updated (message count, last activity)

Without database, conversations are session-only.

## Streaming

The chat uses Server-Sent Events (SSE) for real-time streaming:

```typescript
// Event types
{ type: "conversation_id", id: "uuid" }  // Sent first
{ type: "content", content: "chunk" }    // Streamed content
{ type: "done" }                         // Complete
{ type: "error", error: "message" }      // On failure
```

## Model Configuration

Default: `claude-sonnet-4-20250514`

To change, edit `src/agents/graph.ts`:
```typescript
function createLLM(config: AgentConfig) {
  return new ChatAnthropic({
    model: "claude-sonnet-4-20250514", // or claude-3-haiku, etc.
    // ...
  });
}
```

## Next Steps

After chat is working:
1. Add Executive Coach agent
2. Add Legal Advisor agent  
3. Add HR Partner agent
4. Implement Knowledge Base with RAG
5. Add conversation search and history UI
