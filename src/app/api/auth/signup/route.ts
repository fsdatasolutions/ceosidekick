import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

// Lazy import database
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

// In-memory storage for demo mode
const inMemoryUsers: Array<{
  id: string;
  email: string;
  password: string;
  name: string;
  image: string | null;
}> = [];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password } = body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const db = await getDb();

    // Check if user exists and create new user
    if (db) {
      // Database mode
      const { users } = await getSchema();

      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [newUser] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          emailVerified: new Date(),
        })
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
        });

      return NextResponse.json({ user: newUser }, { status: 201 });
    } else {
      // Demo mode - in-memory storage
      console.log("[Signup] Using in-memory storage (database not configured)");

      const existingUser = inMemoryUsers.find(
        (u) => u.email === normalizedEmail
      );

      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        password: hashedPassword,
        name: `${firstName} ${lastName}`,
        image: null,
      };

      inMemoryUsers.push(newUser);

      return NextResponse.json(
        {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
