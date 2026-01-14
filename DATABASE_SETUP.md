# Database Setup - CEO Sidekick

PostgreSQL database with Drizzle ORM for type-safe queries and migrations.

## Quick Start

### 1. Get a PostgreSQL Database

**Option A: Neon (Recommended - Free tier)**
1. Go to [neon.tech](https://neon.tech) and create account
2. Create a new project
3. Copy the connection string

**Option B: Supabase (Free tier)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database → Connection string (URI)

**Option C: Local PostgreSQL**
```bash
# macOS with Homebrew
brew install postgresql@15
brew services start postgresql@15
createdb ceosidekick

# Connection string
DATABASE_URL="postgresql://localhost:5432/ceosidekick"
```

### 2. Configure Environment

Add to `.env.local`:
```env
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"
```

### 3. Push Schema to Database

```bash
npm run db:push
```

This creates all tables in your database.

### 4. Seed Demo Data (Optional)

```bash
npm run db:seed
```

Creates a demo user and organization.

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, password, name) |
| `accounts` | OAuth provider accounts (Google, GitHub) |
| `sessions` | User sessions (for session strategy) |
| `organizations` | Companies/teams |
| `org_members` | User-organization relationships |
| `conversations` | Chat sessions with AI agents |
| `messages` | Individual messages in conversations |
| `documents` | Uploaded files for knowledge base |
| `document_chunks` | Chunked documents for RAG |
| `usage_logs` | Token usage and analytics |

### Entity Relationship

```
users
  ├── accounts (OAuth)
  ├── sessions
  ├── org_members ─── organizations
  ├── conversations ─── messages
  ├── documents ─── document_chunks
  └── usage_logs
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:push` | Push schema changes to database (dev) |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations (production) |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |
| `npm run db:seed` | Seed demo data |

### Development vs Production

**Development:** Use `db:push` for quick iteration
```bash
npm run db:push
```

**Production:** Use migrations for safety
```bash
npm run db:generate  # Create migration
npm run db:migrate   # Apply migration
```

---

## Using the Database

### Basic Queries

```typescript
import { db } from "@/db";
import { users, conversations, messages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Get user by email
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, "demo@ceosidekick.biz"))
  .limit(1);

// Get user's conversations
const convos = await db
  .select()
  .from(conversations)
  .where(eq(conversations.userId, userId))
  .orderBy(desc(conversations.lastMessageAt));

// Create a message
const [message] = await db
  .insert(messages)
  .values({
    conversationId: convoId,
    role: "user",
    content: "Hello!",
  })
  .returning();
```

### With Relations

```typescript
// Get conversation with messages
const convoWithMessages = await db.query.conversations.findFirst({
  where: eq(conversations.id, convoId),
  with: {
    messages: {
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    },
  },
});
```

---

## Files Added

```
ceosidekick/
├── drizzle.config.ts      # Drizzle Kit configuration
├── src/db/
│   ├── index.ts           # Database client
│   ├── schema.ts          # All table definitions
│   └── seed.ts            # Seed script
└── drizzle/               # Generated migrations (after db:generate)
```

---

## Fallback Behavior

The app works **without** a database configured:
- Login uses demo user (`demo@ceosidekick.biz` / `password123`)
- Signup stores users in memory (lost on restart)
- Conversations are not persisted

Once `DATABASE_URL` is set, everything persists automatically.

---

## Troubleshooting

### "DATABASE_URL is not set"
Add to `.env.local`:
```env
DATABASE_URL="your-connection-string"
```

### "Connection refused"
- Check if PostgreSQL is running
- Verify connection string format
- For cloud: ensure SSL mode (`?sslmode=require`)

### "Table does not exist"
Run migrations:
```bash
npm run db:push
```

### "Permission denied"
- Check database user has CREATE permissions
- For Neon/Supabase: use the "owner" connection string

---

## Next Steps

1. ✅ Set up PostgreSQL (Neon or Supabase)
2. ✅ Add `DATABASE_URL` to `.env.local`
3. ✅ Run `npm run db:push`
4. ✅ Run `npm run db:seed` (optional)
5. → Connect chat to Claude API
