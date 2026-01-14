# CEO Sidekick

> Your AI-Powered C-Suite — On-demand access to AI executive advisors across technology, marketing, sales, legal, HR, and more.

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)
![LangGraph](https://img.shields.io/badge/LangGraph-0.2-orange)
![License](https://img.shields.io/badge/License-Proprietary-red)

CEO Sidekick provides entrepreneurs and small business owners with enterprise-grade executive guidance at a fraction of the cost of a traditional C-suite. Our AI advisors are trained on best practices across every business function.

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
- 📄 **Document Intelligence** — Upload and query your company documents (coming soon)
- 📊 **Usage Analytics** — Track message usage, conversations, and documents
- ⚙️ **Comprehensive Settings** — 4-section setup for personalized AI responses
- 🎨 **Beautiful UI** — Clean, professional design with FSDS brand colors

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17 or later
- PostgreSQL database
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/fsdatasolutions/ceosidekick.git
   cd ceosidekick
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/ceosidekick
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-32-character-secret
   ANTHROPIC_API_KEY=sk-ant-api03-...
   ```

4. **Run database migrations**
   ```bash
   npx drizzle-kit push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

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
│   │   ├── knowledge-base.ts      # Document Q&A
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
│   │   └── schema.ts              # Database schema
│   │
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration
│   │   └── utils.ts               # Utility functions
│   │
│   └── middleware.ts              # Auth protection
│
├── drizzle.config.ts              # Drizzle ORM config
├── next.config.ts
├── package.json
└── tsconfig.json
```

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
  | "knowledge"    // Knowledge Base
  | "content";     // Content Engine
```

### Agent Configuration

Each agent has:
- **System Prompt** — Detailed persona, expertise, and guidelines
- **Temperature** — 0.3-0.8 depending on creativity needs
- **UI Config** — Colors, icons, capabilities list, example queries

### Adding a New Agent

1. Create `src/agents/[agent-name].ts` with `AgentConfig`
2. Add to `AgentType` in `src/agents/types.ts`
3. Register in `agentConfigs` in `src/agents/graph.ts`
4. Add UI config in `src/agents/index.ts`
5. Update dashboard and chat pages

---

## 🗄️ Database Schema

Using **Drizzle ORM** with PostgreSQL:

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts (email, name, image) |
| `accounts` | OAuth provider links |
| `sessions` | Active sessions |
| `organizations` | Multi-tenant workspaces |
| `org_members` | User-organization relationships |
| `conversations` | Chat conversations by agent |
| `messages` | Individual messages (user/assistant) |
| `documents` | Uploaded files metadata |
| `document_chunks` | Chunked content for RAG |
| `user_settings` | Personalization data |
| `usage_logs` | Token usage tracking |

### Key Relationships

```
users
  ├── org_members → organizations
  ├── conversations → messages
  ├── documents → document_chunks
  ├── user_settings (1:1)
  └── usage_logs
```

---

## 🔌 API Routes

### Authentication
- `POST /api/auth/signup` — Create account with email/password
- `GET/POST /api/auth/[...nextauth]` — NextAuth handlers

### Chat
- `POST /api/chat` — Streaming chat with agents
  ```json
  {
    "message": "How should I structure my tech team?",
    "agent": "technology",
    "conversationId": "optional-uuid"
  }
  ```

### Conversations
- `GET /api/conversations` — List user's conversations
- `POST /api/conversations` — Create conversation
- `GET /api/conversations/[id]` — Get with messages
- `PATCH /api/conversations/[id]` — Update (title, archive)
- `DELETE /api/conversations/[id]` — Delete

### Settings
- `GET /api/settings` — Get user settings
- `PUT /api/settings` — Update settings

### Usage
- `GET /api/usage` — Get usage statistics (messages, conversations, docs)

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

---

## ⚙️ Settings System

Four-section personalization flow:

### 1. Your Profile
- Role/title
- Years of experience
- Areas of focus

### 2. Company Profile
- Company name & industry
- Company size & revenue
- Products/services & target market

### 3. Business Context
- Current challenges
- Short-term goals (3-6 months)
- Long-term goals (1-3 years)
- Tech stack & team structure

### 4. AI Preferences
- Communication style (formal/casual/technical)
- Response length (concise/detailed/comprehensive)

These are injected into agent system prompts for personalized advice.

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1 | App Router, SSR |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.0 | Styling |
| Lucide React | Latest | Icons |

### Backend
| Technology | Purpose |
|------------|---------|
| Next.js API Routes | REST endpoints |
| NextAuth.js | Authentication |
| Drizzle ORM | Database ORM |
| PostgreSQL | Primary database |

### AI/ML
| Service | Purpose |
|---------|---------|
| Anthropic Claude | LLM (claude-sonnet-4) |
| LangGraph | Conversation orchestration |
| LangChain | LLM abstractions |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Render.com | Hosting |
| Neon/Supabase | Managed PostgreSQL |

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

### Phase 2 — Core Features (Current)
- [ ] Chat UI polish & conversation history
- [ ] Knowledge Base RAG implementation
- [ ] Document upload & processing
- [ ] Stripe billing integration
- [ ] Content Engine integration

### Phase 3 — Scale & Enterprise
- [ ] Mobile app
- [ ] API access
- [ ] Integrations (Slack, Google Drive)
- [ ] Advanced analytics
- [ ] SOC 2 compliance

---

## 🔧 Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl
ANTHROPIC_API_KEY=sk-ant-...

# OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Future
STRIPE_SECRET_KEY=
OPENAI_API_KEY=  # For embeddings
```

---

## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npx drizzle-kit push` | Push schema to DB |
| `npx drizzle-kit studio` | Database GUI |

---

## 🔒 Security

- Encrypted data at rest and in transit
- Multi-tenant isolation by user/organization
- Rate limiting on API endpoints
- Legal disclaimer on Legal Advisor
- No PII in logs

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