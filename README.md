# CEO Sidekick

> Your AI-Powered C-Suite — On-demand access to AI executive advisors across technology, marketing, sales, legal, HR, and more.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?logo=postgresql)

CEO Sidekick provides entrepreneurs and small business owners with enterprise-grade executive guidance at a fraction of the cost of a traditional C-suite. Our AI advisors are trained on best practices across every business function.

---

## Table of Contents

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Database Setup](#-database-setup)
- [Agent System](#-agent-system)
- [Chat System](#-chat-system)
- [Knowledge Base & RAG](#-knowledge-base--rag)
- [Settings & Personalization](#-settings--personalization)
- [API Reference](#-api-reference)
- [Design System](#-design-system)
- [Environment Variables](#-environment-variables)
- [Scripts & Commands](#-scripts--commands)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)

---

## ✨ Features

### AI Advisors (8 Specialized Agents)

| Agent | Role | Capabilities |
|-------|------|--------------|
| **Technology Partner** | Virtual CTO/CIO | Tech stack recommendations, digital transformation, build vs. buy, vendor evaluation |
| **Executive Coach** | Leadership Partner | Decision frameworks, leadership development, difficult conversations, OKRs/KPIs |
| **Legal Advisor** | Contract & Compliance | Contract review, terms of service, IP protection guidance, compliance checklists |
| **HR Partner** | People Operations | Job descriptions, interview questions, performance reviews, onboarding |
| **Marketing Partner** | Growth & Brand Strategy | Marketing strategy, brand development, digital campaigns, content planning |
| **Sales Partner** | Revenue & Deals | Sales process development, pipeline management, objection handling, pricing |
| **Knowledge Base** | Company AI | Document Q&A with citations, semantic search, meeting summaries |
| **Content Engine** | Thought Leadership | Blog posts, social media, marketing copy, email campaigns |

### Platform Features

- 🔐 **Secure Authentication** — OAuth (Google, GitHub) and email/password via NextAuth.js
- 💬 **Streaming AI Chat** — Real-time responses with LangGraph orchestration
- 🎯 **Personalized Advice** — AI adapts to your company context, goals, and preferences
- 📄 **Document Intelligence** — Upload PDF, DOCX, TXT, and MD files with RAG-powered Q&A
- 📊 **Usage Analytics** — Track message usage, conversations, and documents
- ⚙️ **Comprehensive Settings** — 4-section setup for personalized AI responses
- 📝 **Markdown Rendering** — Rich formatting in AI responses (bold, lists, code blocks)
- 🕐 **Chat History** — Browse and continue past conversations

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL database (Neon recommended)
- Anthropic API key
- OpenAI API key (for embeddings)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/fsdatasolutions/ceosidekick.git
cd ceosidekick

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials (see Environment Variables section)

# 4. Run database migrations
npm run db:push

# 5. Seed demo data (optional)
npm run db:seed

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
ceosidekick/
├── src/
│   ├── agents/                    # AI Agent Configurations
│   │   ├── index.ts               # Exports & UI configs
│   │   ├── types.ts               # AgentType, AgentConfig, AgentUIConfig
│   │   ├── graph.ts               # LangGraph conversation orchestration
│   │   ├── technology-partner.ts  # Technology/CTO advisor
│   │   ├── executive-coach.ts     # Leadership coach
│   │   ├── legal-advisor.ts       # Legal guidance (with disclaimers)
│   │   ├── hr-partner.ts          # HR/People operations
│   │   ├── marketing-partner.ts   # Marketing strategy
│   │   ├── sales-partner.ts       # Sales strategy
│   │   ├── knowledge-base.ts      # Document Q&A (RAG)
│   │   └── content-engine.ts      # Content creation
│   │
│   ├── app/                       # Next.js App Router
│   │   ├── (auth)/                # Auth routes (login, signup)
│   │   ├── (dashboard)/           # Protected app routes
│   │   │   ├── chat/              # AI chat interface
│   │   │   ├── dashboard/         # Main dashboard with real data
│   │   │   ├── knowledge-base/    # Document management
│   │   │   └── settings/          # User settings (4 sections)
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/              # NextAuth endpoints
│   │   │   ├── chat/              # Streaming chat endpoint
│   │   │   ├── conversations/     # CRUD for conversations
│   │   │   ├── documents/         # Document upload & search
│   │   │   ├── settings/          # User settings CRUD
│   │   │   └── usage/             # Usage statistics
│   │   ├── globals.css            # Design tokens & utilities
│   │   └── page.tsx               # Landing page
│   │
│   ├── components/
│   │   ├── landing/               # Landing page sections
│   │   ├── dashboard/             # Dashboard components
│   │   └── ui/                    # Reusable UI (Button, etc.)
│   │
│   ├── db/
│   │   ├── index.ts               # Drizzle client
│   │   ├── schema.ts              # Database schema
│   │   └── seed.ts                # Seed script
│   │
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── utils.ts               # Utility functions
│   │   ├── rag-config.ts          # Centralized RAG configuration
│   │   ├── embeddings.ts          # OpenAI embedding utilities
│   │   ├── chunking.ts            # Text chunking
│   │   ├── storage.ts             # GCS utilities
│   │   ├── vector-search.ts       # Hybrid vector search (pgvector)
│   │   └── document-processor.ts  # Document processing pipeline (PDF, DOCX, TXT, MD)
│   │
│   └── middleware.ts              # Auth protection
│
├── drizzle/                       # Generated migrations
├── drizzle.config.ts              # Drizzle ORM config
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 🗄️ Database Setup

### Quick Start with Neon (Recommended)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string to `.env.local`:
   ```env
   DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
   ```
4. Push the schema:
   ```bash
   npm run db:push
   ```

### Alternative Options

**Supabase (Free tier)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string (URI)

**Local PostgreSQL**
```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15
createdb ceosidekick

# Connection string
DATABASE_URL="postgresql://localhost:5432/ceosidekick"
```

### Enable pgvector Extension

Run in your database SQL editor:

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to document_chunks
ALTER TABLE document_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- Ensure type column can hold DOCX MIME type (71 chars)
ALTER TABLE documents ALTER COLUMN type TYPE varchar(100);
```

### Database Schema

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password, name) |
| `accounts` | OAuth provider accounts (Google, GitHub) |
| `sessions` | User sessions |
| `organizations` | Companies/teams |
| `org_members` | User-organization relationships |
| `conversations` | Chat sessions with AI agents |
| `messages` | Individual messages in conversations |
| `documents` | Uploaded files for knowledge base |
| `document_chunks` | Chunked documents with embeddings for RAG |
| `user_settings` | Personalization data |
| `usage_logs` | Token usage and analytics |

### Entity Relationships

```
users
  ├── accounts (OAuth)
  ├── sessions
  ├── org_members ─── organizations
  ├── conversations ─── messages
  ├── documents ─── document_chunks
  ├── user_settings (1:1)
  └── usage_logs
```

### Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes to database (dev) |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations (production) |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:seed` | Seed demo data |

---

## 🤖 Agent System

### Agent Types

```typescript
type AgentType =
  | "technology"   // Virtual CTO/CIO
  | "coach"        // Executive Coach
  | "legal"        // Legal Advisor
  | "hr"           // HR Partner
  | "marketing"    // Marketing Partner
  | "sales"        // Sales Partner
  | "knowledge"    // Knowledge Base (RAG)
  | "content";     // Content Engine
```

### Agent Configuration

Each agent has:
- `id` — Unique identifier
- `name` — Display name
- `subtitle` — Role description
- `description` — Capabilities summary
- `systemPrompt` — Core instructions
- `temperature` — Response creativity (0-1)
- `maxTokens` — Response length limit

### RAG-Enabled Agents

The Knowledge Base agent uses RAG (Retrieval-Augmented Generation):

```typescript
// src/agents/knowledge-base.ts
export const knowledgeBaseConfig: AgentConfig = {
  id: "knowledge",
  name: "Knowledge Base",
  useRAG: true,
  ragOptions: {
    limit: 5,           // Max chunks to retrieve
    threshold: 0.4,     // Min similarity score
    maxContextTokens: 3000,
  },
  // ...
};
```

---

## 📚 Knowledge Base & RAG

### Supported File Types

| Format | Extension | MIME Type | Library |
|--------|-----------|-----------|---------|
| Plain Text | `.txt` | `text/plain` | Built-in |
| Markdown | `.md` | `text/markdown` | Built-in |
| PDF | `.pdf` | `application/pdf` | `unpdf` |
| Word Document | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `mammoth` |

### Document Processing Pipeline

```
Upload → Extract Text → Chunk → Generate Embeddings → Store in pgvector
```

1. **Text Extraction**
    - TXT/MD: Direct UTF-8 conversion
    - PDF: `unpdf` library (serverless-friendly, works with Node.js)
    - DOCX: `mammoth` library for Word documents

2. **Chunking**
    - Target: ~500 tokens per chunk
    - Overlap: 50 tokens between chunks
    - Semantic boundaries: Respects paragraphs, sentences, words

3. **Embedding**
    - Model: OpenAI `text-embedding-3-small`
    - Dimensions: 1536
    - Batch processing: 100 chunks per API call

4. **Storage**
    - PostgreSQL with pgvector extension
    - HNSW index for fast similarity search

### Hybrid Search Strategy

The search combines three approaches:

1. **Document Name Matching** — Catches queries like "show me the FSDS document"
2. **PostgreSQL Full-Text Search** — Keyword matching with `ts_rank`
3. **Vector Similarity** — Semantic search via embeddings

Results are merged and deduplicated by priority.

### RAG Configuration

Centralized in `src/lib/rag-config.ts`:

```typescript
export const RAG_CONFIG = {
  DEFAULT_THRESHOLD: 0.4,  // Similarity threshold (0.3-0.6 typical)
  MIN_THRESHOLD: 0.3,
  MAX_THRESHOLD: 0.95,
  DEFAULT_LIMIT: 5,        // Chunks to retrieve
  MAX_LIMIT: 20,
  DEFAULT_MAX_CONTEXT_TOKENS: 3000,
};
```

### File Size Limits

- Current limit: 10MB per file
- Processing: Synchronous (suitable for files up to ~5MB)
- Future: Background job queue for larger files

---

## ⚙️ Settings & Personalization

### Four Settings Sections

1. **Company Profile** — Name, industry, size, revenue, products/services
2. **Your Role** — Title, experience, areas of focus
3. **Business Context** — Challenges, goals, tech stack, team structure
4. **Preferences** — Communication style, response length

Settings are injected into agent system prompts to personalize responses.

---

## 📡 API Reference

### Chat

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Streaming chat (SSE) |

**Request Body:**
```json
{
  "message": "Help me write a job description",
  "agent": "hr",
  "conversationId": "uuid-optional"
}
```

### Conversations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations` | GET | List user's conversations |
| `/api/conversations` | POST | Create new conversation |
| `/api/conversations/[id]` | GET | Get conversation with messages |
| `/api/conversations/[id]` | DELETE | Delete conversation |

### Documents

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents` | GET | List user's documents |
| `/api/documents` | POST | Upload document (multipart/form-data) |
| `/api/documents?id=xxx` | DELETE | Delete document |
| `/api/documents/[id]` | GET | Get document details + chunks |
| `/api/documents/[id]` | POST | Reprocess failed document |
| `/api/documents/search` | POST | Hybrid vector search |

**Upload Request (multipart/form-data):**
- `file`: The document file (PDF, DOCX, TXT, MD)
- `shared`: `"true"` to share with organization

**Search Request:**
```json
{
  "query": "What is our PTO policy?",
  "limit": 5,
  "threshold": 0.4
}
```

### Settings

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/settings` | GET | Get user settings |
| `/api/settings` | PUT | Update settings |

### Usage

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/usage` | GET | Get usage statistics |

---

## 🎨 Design System

### Brand Colors (FSDS)

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Red | `#C8102E` | Primary actions, brand |
| Accent Gold | `#FFB81C` | Highlights, upgrades |
| Accent Teal | `#00778B` | Technology Partner |

### Agent Colors

| Agent | Color | Tailwind Class |
|-------|-------|----------------|
| Technology | Teal | `bg-accent-teal` |
| Coach | Purple | `bg-agent-coach` |
| Legal | Blue | `bg-agent-legal` |
| HR | Green | `bg-agent-hr` |
| Marketing | Pink | `bg-pink-600` |
| Sales | Orange | `bg-orange-600` |
| Knowledge | Indigo | `bg-agent-knowledge` |
| Content | Red | `bg-primary-red` |

### Typography

| Type | Font | Usage |
|------|------|-------|
| Display | Space Grotesk | Headings |
| Body | DM Sans | Body text |
| Mono | JetBrains Mono | Code |

### Markdown Styling

```css
prose prose-sm max-w-none prose-neutral 
prose-p:my-2 prose-headings:my-3 
prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 
prose-pre:bg-neutral-800 prose-pre:text-neutral-100
```

---

## 🔐 Environment Variables

```env
# ===================
# Required
# ===================
DATABASE_URL=postgresql://user:pass@host:5432/ceosidekick?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# ===================
# Knowledge Base (RAG)
# ===================
OPENAI_API_KEY=sk-proj-xxxxx

# Google Cloud Storage (optional - for document storage)
GOOGLE_CLOUD_PROJECT=your-project-id
GCS_BUCKET_NAME=ceosidekick-documents
GCS_CREDENTIALS='{"type":"service_account",...}'

# ===================
# OAuth (Optional)
# ===================
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# ===================
# Future
# ===================
STRIPE_SECRET_KEY=
```

---

## 📜 Scripts & Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run db:push` | Push schema to DB (dev) |
| `npm run db:generate` | Generate migrations |
| `npm run db:migrate` | Run migrations (prod) |
| `npm run db:studio` | Database GUI |
| `npm run db:seed` | Seed demo data |

---

## 🔧 Troubleshooting

### Database Issues

**"DATABASE_URL is not set"**
- Add to `.env.local`: `DATABASE_URL="your-connection-string"`

**"Connection refused"**
- Check if PostgreSQL is running
- Verify connection string format
- For cloud: ensure SSL mode (`?sslmode=require`)

**"Table does not exist"**
- Run: `npm run db:push`

### Knowledge Base Issues

**"pgvector extension not found"**
- Run in SQL Editor: `CREATE EXTENSION IF NOT EXISTS vector;`

**"No search results" even with documents**
- Check threshold (default 0.4, try 0.3)
- Verify documents have status "ready"
- Check chunks have embeddings:
  ```sql
  SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL;
  ```

**"Embedding dimension mismatch"**
- Ensure column uses 1536 dimensions (text-embedding-3-small)

**PDF upload fails with "DOMMatrix is not defined"**
- This is a known issue with `pdf-parse` in Next.js/Turbopack
- Solution: Use `unpdf` library instead (already implemented)

**DOCX upload fails with schema error**
- The DOCX MIME type is 71 characters
- Run: `ALTER TABLE documents ALTER COLUMN type TYPE varchar(100);`

### Chat Issues

**Settings not being applied**
- Check server logs for `[API] Loaded user settings: yes`
- Verify settings exist in database

**Markdown not rendering**
- Ensure `@tailwindcss/typography` is installed
- Check `@plugin "@tailwindcss/typography"` in globals.css

**History not loading**
- Check browser console for API errors
- Verify `/api/conversations` endpoint returns data

### GCS Issues

**"Permission denied"**
- Check service account has Storage Admin role
- Verify bucket name in env vars

---

## 🗺️ Roadmap

### Phase 1 — MVP ✅ Complete
- [x] Project setup (Next.js 16 + Tailwind 4)
- [x] Design system & brand colors
- [x] Landing page
- [x] Authentication (NextAuth.js)
- [x] Database schema (Drizzle + PostgreSQL)
- [x] Dashboard with real user data
- [x] Settings system (4 sections)
- [x] All 8 agent configurations
- [x] Streaming chat API
- [x] Usage tracking
- [x] Chat history & markdown rendering

### Phase 2 — Knowledge Base ✅ Complete
- [x] Document upload & processing
- [x] Text chunking with semantic boundaries
- [x] OpenAI embeddings
- [x] pgvector storage
- [x] Hybrid search (vector + keyword + name matching)
- [x] RAG integration with Knowledge Base agent
- [x] Centralized RAG configuration
- [x] PDF support (using `unpdf`)
- [x] DOCX support (using `mammoth`)
- [x] Batch database inserts for performance

### Phase 3 — Polish & Scale (Current)
- [ ] Large file support (50-100MB)
- [ ] Background job queue (Inngest/BullMQ)
- [ ] Real-time processing progress
- [ ] Stripe billing integration
- [ ] Content Engine integration
- [ ] Document preview

### Phase 4 — Enterprise
- [ ] Mobile app
- [ ] API access
- [ ] Integrations (Slack, Google Drive)
- [ ] Advanced analytics
- [ ] SOC 2 compliance

---

## 💰 Cost Estimates

### OpenAI Embeddings
- Model: text-embedding-3-small
- Cost: ~$0.02 per 1M tokens
- 100 documents × 5KB each ≈ $0.003

### Google Cloud Storage
- Storage: $0.02/GB/month
- 100MB of docs ≈ $0.002/month

### Neon PostgreSQL
- Free tier: 0.5GB storage, 192 compute hours
- Pro: $19/month for more storage/compute

---

## 🔒 Security

- Encrypted data at rest and in transit
- Multi-tenant isolation by user/organization
- Rate limiting on API endpoints
- Legal disclaimer on Legal Advisor
- No PII in logs
- Documents stored in private GCS bucket
- Signed URLs for time-limited access

---

## 📦 Key Dependencies

### Document Processing
| Package | Purpose |
|---------|---------|
| `unpdf` | PDF text extraction (serverless-friendly) |
| `mammoth` | DOCX text extraction |
| `openai` | Embeddings generation |

### Database
| Package | Purpose |
|---------|---------|
| `drizzle-orm` | Type-safe ORM |
| `postgres` | PostgreSQL driver |
| `pgvector` | Vector similarity search |

### AI & Chat
| Package | Purpose |
|---------|---------|
| `@anthropic-ai/sdk` | Claude API |
| `@langchain/langgraph` | Conversation orchestration |

---

## 📄 License

Copyright © 2024-2025 Full Stack Data Solutions. All rights reserved.

---

## 📞 Support

- **Email:** support@ceosidekick.biz
- **Website:** [ceosidekick.biz](https://ceosidekick.biz)

---

<p align="center">
  <strong>CEO Sidekick</strong> — Built with ❤️ for entrepreneurs
  <br /><br />
  <a href="https://ceosidekick.biz">Website</a> · 
  <a href="https://ce.ceosidekick.biz">Content Engine</a>
</p>


# Content Engine API - Image Endpoints

## Overview

The Content Engine Image API allows users to upload images and generate AI images using DALL-E. All endpoints require authentication and deduct message credits from the user's subscription.

## Base URL

```
/api/content/images
```

## Authentication

All endpoints require a valid session. The API uses NextAuth.js for authentication.

## Credit Costs

| Action | Credits |
|--------|---------|
| Upload image | 1 |
| Generate DALL-E 2 (any size) | 1 |
| Generate DALL-E 3 (1024×1024, standard) | 2 |
| Generate DALL-E 3 (1024×1024, HD) | 3 |
| Generate DALL-E 3 (portrait/landscape, standard) | 3 |
| Generate DALL-E 3 (portrait/landscape, HD) | 4 |

---

## Endpoints

### 1. Upload Image

Upload an image file to Google Cloud Storage.

**Endpoint:** `POST /api/content/images/upload`

**Content-Type:** `multipart/form-data`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image file (JPEG, PNG, GIF, WebP) |
| `name` | string | No | Custom display name |
| `altText` | string | No | Alt text for accessibility |

**Constraints:**
- Max file size: 10MB
- Allowed types: image/jpeg, image/png, image/gif, image/webp

**Response:**

```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "name": "My Image",
    "url": "https://storage.googleapis.com/...",
    "mimeType": "image/png",
    "size": 123456,
    "width": 1024,
    "height": 768,
    "source": "upload",
    "createdAt": "2025-01-24T12:00:00Z"
  }
}
```

**Example (cURL):**

```bash
curl -X POST /api/content/images/upload \
  -H "Cookie: session=..." \
  -F "file=@my-image.png" \
  -F "name=Hero Banner" \
  -F "altText=A beautiful sunset over mountains"
```

---

### 2. Generate Image (DALL-E)

Generate an AI image using DALL-E 2 or DALL-E 3.

**Endpoint:** `POST /api/content/images/generate`

**Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `prompt` | string | Yes | - | Image generation prompt (max 4000 chars) |
| `model` | string | No | "dall-e-3" | "dall-e-2" or "dall-e-3" |
| `size` | string | No | "1024x1024" | See size options below |
| `quality` | string | No | "standard" | "standard" or "hd" (DALL-E 3 only) |
| `style` | string | No | "vivid" | "vivid" or "natural" (DALL-E 3 only) |
| `name` | string | No | Auto-generated | Custom display name |
| `altText` | string | No | Prompt/revised prompt | Alt text |

**Size Options:**

DALL-E 2:
- `256x256`
- `512x512`
- `1024x1024`

DALL-E 3:
- `1024x1024` (Square)
- `1024x1792` (Portrait)
- `1792x1024` (Landscape)

**Response:**

```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "name": "AI Image - 2025-01-24",
    "url": "https://storage.googleapis.com/...",
    "mimeType": "image/png",
    "size": 234567,
    "width": 1024,
    "height": 1024,
    "source": "dalle",
    "prompt": "A futuristic city at sunset",
    "revisedPrompt": "A stunning futuristic metropolis...",
    "generationSettings": {
      "size": "1024x1024",
      "quality": "standard",
      "style": "vivid"
    },
    "createdAt": "2025-01-24T12:00:00Z"
  },
  "creditsUsed": 2
}
```

**Example:**

```bash
curl -X POST /api/content/images/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "prompt": "A professional business meeting in a modern office",
    "model": "dall-e-3",
    "size": "1792x1024",
    "quality": "hd",
    "style": "natural"
  }'
```

---

### 3. Get Generation Options

Retrieve available DALL-E models and their options for building UI.

**Endpoint:** `GET /api/content/images/generate`

**Response:**

```json
{
  "models": [
    {
      "id": "dall-e-2",
      "name": "DALL-E 2",
      "description": "Faster generation, lower cost",
      "sizes": [
        { "value": "256x256", "label": "256×256 (Small)", "credits": 1 },
        { "value": "512x512", "label": "512×512 (Medium)", "credits": 1 },
        { "value": "1024x1024", "label": "1024×1024 (Large)", "credits": 1 }
      ],
      "supportsQuality": false,
      "supportsStyle": false
    },
    {
      "id": "dall-e-3",
      "name": "DALL-E 3",
      "description": "Higher quality, better prompt understanding",
      "sizes": [
        { "value": "1024x1024", "label": "1024×1024 (Square)", "credits": { "standard": 2, "hd": 3 } },
        { "value": "1024x1792", "label": "1024×1792 (Portrait)", "credits": { "standard": 3, "hd": 4 } },
        { "value": "1792x1024", "label": "1792×1024 (Landscape)", "credits": { "standard": 3, "hd": 4 } }
      ],
      "supportsQuality": true,
      "supportsStyle": true,
      "qualityOptions": [
        { "value": "standard", "label": "Standard" },
        { "value": "hd", "label": "HD (Higher detail)" }
      ],
      "styleOptions": [
        { "value": "vivid", "label": "Vivid (Dramatic, hyper-real)" },
        { "value": "natural", "label": "Natural (More realistic)" }
      ]
    }
  ]
}
```

---

### 4. List Images

Retrieve a paginated list of user's images.

**Endpoint:** `GET /api/content/images`

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `source` | string | - | Filter by source: "upload", "dalle", "other" |
| `limit` | number | 20 | Items per page (max 100) |
| `offset` | number | 0 | Pagination offset |

**Response:**

```json
{
  "images": [
    {
      "id": "uuid",
      "name": "My Image",
      "url": "https://storage.googleapis.com/...",
      "mimeType": "image/png",
      "size": 123456,
      "width": 1024,
      "height": 768,
      "source": "upload",
      "altText": "Description",
      "usageCount": 3,
      "createdAt": "2025-01-24T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Example:**

```bash
# Get all images
curl /api/content/images

# Get only DALL-E generated images
curl "/api/content/images?source=dalle"

# Paginate
curl "/api/content/images?limit=10&offset=20"
```

---

### 5. Get Single Image

Retrieve details for a specific image.

**Endpoint:** `GET /api/content/images/[id]`

**Response:**

```json
{
  "image": {
    "id": "uuid",
    "name": "My Image",
    "originalName": "original-filename.png",
    "url": "https://storage.googleapis.com/...",
    "mimeType": "image/png",
    "size": 123456,
    "width": 1024,
    "height": 768,
    "source": "dalle",
    "prompt": "A futuristic city",
    "aiModel": "dall-e-3",
    "generationSettings": {
      "size": "1024x1024",
      "quality": "standard",
      "style": "vivid"
    },
    "altText": "A futuristic city at sunset",
    "usageCount": 5,
    "createdAt": "2025-01-24T12:00:00Z",
    "updatedAt": "2025-01-24T14:00:00Z"
  }
}
```

---

### 6. Update Image

Update image metadata (name, alt text).

**Endpoint:** `PATCH /api/content/images/[id]`

**Content-Type:** `application/json`

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | New display name |
| `altText` | string | No | New alt text |

At least one field must be provided.

**Response:**

```json
{
  "success": true,
  "image": {
    "id": "uuid",
    "name": "Updated Name",
    "altText": "Updated alt text",
    "updatedAt": "2025-01-24T15:00:00Z"
  }
}
```

---

### 7. Delete Image

Delete an image from both database and Google Cloud Storage.

**Endpoint:** `DELETE /api/content/images/[id]`

**Response:**

```json
{
  "success": true,
  "message": "Image deleted successfully",
  "deletedId": "uuid"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Error Codes:**

| Status | Description |
|--------|-------------|
| 400 | Bad request (validation error) |
| 401 | Unauthorized (not logged in) |
| 402 | Payment required (insufficient credits) |
| 404 | Image not found |
| 500 | Server error |

**Credit Error Example:**

```json
{
  "error": "Insufficient message credits",
  "required": 3
}
```

---

## Dependencies

The image API requires these npm packages:

```bash
npm install @google-cloud/storage openai sharp
```

## Environment Variables

```env
GCS_BUCKET_NAME=ceosidekick-documents
GCS_CREDENTIALS={"type":"service_account",...}
OPENAI_API_KEY=sk-...
```
