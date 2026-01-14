import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// Lazy import database to handle cases where DATABASE_URL is not set
async function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  const { db } = await import("@/db");
  return db;
}

async function getSchema() {
  const { users } = await import("@/db/schema");
  return { users };
}

// Fallback demo users when database is not configured
const DEMO_USERS = [
  {
    id: "00000000-0000-0000-0000-000000000001", // Valid UUID
    email: "demo@ceosidekick.biz",
    password: "$2b$10$9YdoAln3mb7mBIWFcgWspeEPK2EX7u/pWwKDtLt7yf..vYXVjGEl6", // "password123"
    name: "Demo User",
    image: null,
  },
];

// Get user by email - uses database if available, falls back to demo users
async function getUserByEmail(email: string) {
  const db = await getDb();

  if (db) {
    try {
      const { users } = await getSchema();
      const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1);
      return user[0] || null;
    } catch (error) {
      console.error("[Auth] Database query failed:", error);
      // Fall back to demo users
    }
  }

  // Fallback to demo users
  console.log("[Auth] Using demo users (database not configured)");
  return DEMO_USERS.find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
  ) || null;
}

// Create user in database
async function createUser(data: {
  email: string;
  name?: string | null;
  image?: string | null;
  password?: string;
}) {
  const db = await getDb();

  if (!db) {
    console.log("[Auth] Cannot create user - database not configured");
    return null;
  }

  try {
    const { users } = await getSchema();
    const [user] = await db
        .insert(users)
        .values({
          email: data.email.toLowerCase(),
          name: data.name,
          image: data.image,
          password: data.password,
          emailVerified: new Date(),
        })
        .returning();
    return user;
  } catch (error) {
    console.error("[Auth] Failed to create user:", error);
    return null;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
    newUser: "/signup",
    error: "/login",
  },
  providers: [
    // Email/Password authentication
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("[Auth] Missing credentials");
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        console.log("[Auth] Attempting login for:", email);

        const user = await getUserByEmail(email);
        if (!user || !user.password) {
          console.log("[Auth] User not found or no password:", email);
          return null;
        }

        const passwordsMatch = await bcrypt.compare(password, user.password);
        console.log("[Auth] Password match:", passwordsMatch);

        if (!passwordsMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),

    // Google OAuth (optional - configure in .env.local)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
        : []),

    // GitHub OAuth (optional - configure in .env.local)
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ? [
          GitHub({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          }),
        ]
        : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // For credentials login, user.id is already the database ID
      if (user && account?.provider === "credentials") {
        token.id = user.id;
      }

      // For OAuth, we need to look up the database user ID
      if (user && account?.provider !== "credentials" && user.email) {
        const dbUser = await getUserByEmail(user.email);
        if (dbUser) {
          token.id = dbUser.id;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth providers, create user if doesn't exist
      if (account?.provider !== "credentials" && user.email) {
        const existingUser = await getUserByEmail(user.email);
        if (!existingUser) {
          console.log("[Auth] Creating new OAuth user:", user.email);
          await createUser({
            email: user.email,
            name: user.name,
            image: user.image,
          });
        } else {
          console.log("[Auth] OAuth user exists:", user.email);
        }
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
});