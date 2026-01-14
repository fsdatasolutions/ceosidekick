# NextAuth Authentication Setup

Self-hosted authentication using NextAuth.js with email/password and OAuth support.

## Installation

```bash
npm install next-auth@beta @auth/core bcryptjs
npm install -D @types/bcryptjs
```

## Files Overview

```
src/
├── middleware.ts                          # Route protection
├── lib/
│   └── auth.ts                            # NextAuth configuration
├── types/
│   └── next-auth.d.ts                     # Type extensions
├── app/
│   ├── layout.tsx                         # Root layout with SessionProvider
│   ├── api/auth/
│   │   ├── [...nextauth]/route.ts         # NextAuth API handler
│   │   └── signup/route.ts                # User registration endpoint
│   ├── (auth)/
│   │   ├── login/page.tsx                 # Sign in page
│   │   └── signup/page.tsx                # Registration page
│   └── (dashboard)/
│       ├── layout.tsx                     # Dashboard layout with user info
│       └── dashboard/page.tsx             # Dashboard home
└── components/
    ├── auth-provider.tsx                  # SessionProvider wrapper
    ├── user-section.tsx                   # Sidebar user profile
    └── landing/
        └── header.tsx                     # Header with auth state
```

## Environment Variables

Add to `.env.local`:

```env
# Required - generate with: openssl rand -base64 32
AUTH_SECRET=your-secret-key-here

# Optional - OAuth providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Demo Credentials

Works immediately without any setup:

- **Email:** demo@ceosidekick.biz
- **Password:** password123

## Setting Up OAuth (Optional)

### Google

1. Go to [Google Cxloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Create "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create "New OAuth App"
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

## Connecting to Database

The current setup uses in-memory storage for demo purposes. To use a real database:

### 1. Update `src/lib/auth.ts`

Replace the `getUserByEmail` function:

```typescript
import { db } from "@/lib/db"; // Your database client

async function getUserByEmail(email: string) {
  return await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}
```

### 2. Update `src/app/api/auth/signup/route.ts`

Replace the in-memory array with database calls:

```typescript
import { db } from "@/lib/db";

// Check existing user
const existingUser = await db.user.findUnique({
  where: { email: email.toLowerCase() },
});

// Create new user
const newUser = await db.user.create({
  data: {
    email: email.toLowerCase(),
    password: hashedPassword,
    name: `${firstName} ${lastName}`,
  },
});
```

### Database Schema (PostgreSQL)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  name VARCHAR(255),
  image VARCHAR(500),
  email_verified TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type VARCHAR(50),
  scope VARCHAR(255),
  id_token TEXT,
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);
```

## Protected Routes

Routes are protected via middleware. Edit `src/middleware.ts` to change:

```typescript
// Add/remove protected routes
const protectedRoutes = ["/dashboard", "/chat", "/knowledge-base", "/settings"];

// Add/remove auth routes (redirect to dashboard if logged in)
const authRoutes = ["/login", "/signup"];
```

## Session Access

### Server Components

```typescript
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }
  
  return <div>Hello {session.user.name}</div>;
}
```

### Client Components

```typescript
"use client";

import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;
  
  return <div>Hello {session.user.name}</div>;
}
```

### Sign Out

```typescript
import { signOut } from "next-auth/react";

<button onClick={() => signOut({ callbackUrl: "/" })}>
  Sign Out
</button>
```

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- Sessions use JWT strategy (30-day expiry)
- CSRF protection is built-in
- OAuth state is validated automatically

## Troubleshooting

### "AUTH_SECRET is missing"
Generate one: `openssl rand -base64 32` and add to `.env.local`

### OAuth callback error
Make sure redirect URIs match exactly in provider settings

### Session not persisting
Check that `AUTH_SECRET` is the same across restarts