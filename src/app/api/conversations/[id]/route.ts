import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

// Lazy database imports
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/db");
  return db;
}

async function getSchema() {
  const { conversations, messages } = await import("@/db/schema");
  return { conversations, messages };
}

// DELETE - Delete a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const { conversations, messages } = await getSchema();

    // Verify the conversation belongs to the user
    const existing = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          eq(conversations.userId, session.user.id)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Delete messages first (due to foreign key)
    await db.delete(messages).where(eq(messages.conversationId, id));

    // Delete the conversation
    await db.delete(conversations).where(eq(conversations.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Conversation DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}

// GET - Get a single conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const db = await getDb();
    if (!db) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const { conversations, messages } = await getSchema();

    // Verify the conversation belongs to the user
    const conv = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, id),
          eq(conversations.userId, session.user.id)
        )
      )
      .limit(1);

    if (conv.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    return NextResponse.json({
      conversation: conv[0],
      messages: msgs.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Conversation GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
