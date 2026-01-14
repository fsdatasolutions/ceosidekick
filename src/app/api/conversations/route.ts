import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq, desc, and } from "drizzle-orm";

// Lazy database imports
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/db");
  return db;
}

async function getSchema() {
  const { conversations } = await import("@/db/schema");
  return { conversations };
}

// GET - List user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agent = searchParams.get("agent");

    const db = await getDb();
    if (!db) {
      return NextResponse.json({ conversations: [] });
    }

    const { conversations } = await getSchema();

    // Build query conditions
    const conditions = [eq(conversations.userId, session.user.id)];
    if (agent) {
      conditions.push(eq(conversations.agent, agent));
    }

    const results = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        agent: conversations.agent,
        lastMessageAt: conversations.lastMessageAt,
        messageCount: conversations.messageCount,
      })
      .from(conversations)
      .where(and(...conditions))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(50);

    return NextResponse.json({ 
      conversations: results.map(c => ({
        ...c,
        lastMessageAt: c.lastMessageAt?.toISOString() || new Date().toISOString(),
      }))
    });
  } catch (error) {
    console.error("Conversations GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
