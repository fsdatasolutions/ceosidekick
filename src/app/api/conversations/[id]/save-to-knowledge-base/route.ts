// src/app/api/conversations/[id]/save-to-knowledge-base/route.ts
// Save conversation history to the user's knowledge base

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { conversations, messages, documents } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { getUserUsage } from "@/lib/usage";
import { generateStorageKey, uploadFile } from "@/lib/storage";
import { processDocument } from "@/lib/document-processor";

// Agent display names
const AGENT_NAMES: Record<string, string> = {
    technology: "Technology Partner",
    coach: "Executive Coach",
    legal: "Legal Advisor",
    hr: "HR Partner",
    marketing: "Marketing Partner",
    sales: "Sales Partner",
    knowledge: "Knowledge Base",
    content: "Content Engine",
};

interface ConversationMessage {
    id: string;
    role: string;
    content: string;
    createdAt: Date;
}

/**
 * Format messages into a markdown document
 */
function formatConversationAsMarkdown(
    title: string,
    agent: string,
    msgs: ConversationMessage[],
    isUpdate: boolean = false
): string {
    const agentName = AGENT_NAMES[agent] || agent;
    const now = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    let markdown = `# ${title || "Conversation"}\n\n`;
    markdown += `**Agent:** ${agentName}\n`;
    markdown += `**Saved:** ${now}\n`;

    if (isUpdate) {
        markdown += `**Type:** Incremental update (new messages only)\n`;
    }

    markdown += `\n---\n\n`;

    for (const msg of msgs) {
        const timestamp = new Date(msg.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });

        const speaker = msg.role === "user" ? "**User**" : `**${agentName}**`;
        markdown += `${speaker} _(${timestamp})_\n\n`;
        markdown += `${msg.content}\n\n`;
        markdown += `---\n\n`;
    }

    return markdown;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Verify authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // 2. Check if user is on paid tier
        const usage = await getUserUsage(session.user.id);
        if (usage.tier === "free") {
            return NextResponse.json(
                { error: "Saving conversations to Knowledge Base requires a paid subscription" },
                { status: 403 }
            );
        }

        const { id: conversationId } = await params;

        // 3. Verify the conversation belongs to the user
        const [conversation] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.id, conversationId),
                    eq(conversations.userId, session.user.id)
                )
            )
            .limit(1);

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        // 4. Determine if this is an update or first save
        const lastSavedAt = conversation.savedToKnowledgeBaseAt;
        const isUpdate = lastSavedAt !== null;

        // 5. Fetch messages (all or since last save)
        let conversationMessages: ConversationMessage[];

        if (isUpdate && lastSavedAt) {
            // Only get new messages since last save
            conversationMessages = await db
                .select({
                    id: messages.id,
                    role: messages.role,
                    content: messages.content,
                    createdAt: messages.createdAt,
                })
                .from(messages)
                .where(
                    and(
                        eq(messages.conversationId, conversationId),
                        gt(messages.createdAt, lastSavedAt)
                    )
                )
                .orderBy(messages.createdAt);
        } else {
            // Get all messages
            conversationMessages = await db
                .select({
                    id: messages.id,
                    role: messages.role,
                    content: messages.content,
                    createdAt: messages.createdAt,
                })
                .from(messages)
                .where(eq(messages.conversationId, conversationId))
                .orderBy(messages.createdAt);
        }

        // 6. Check if there are messages to save
        if (conversationMessages.length === 0) {
            return NextResponse.json(
                {
                    error: isUpdate
                        ? "No new messages to save since last update"
                        : "Conversation has no messages"
                },
                { status: 400 }
            );
        }

        // 7. Format conversation as markdown
        const markdown = formatConversationAsMarkdown(
            conversation.title || `Conversation with ${AGENT_NAMES[conversation.agent] || conversation.agent}`,
            conversation.agent,
            conversationMessages,
            isUpdate
        );

        // 8. Generate filename
        const timestamp = new Date().toISOString().split("T")[0];
        const sanitizedTitle = (conversation.title || "conversation")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .slice(0, 50);
        const fileName = `${sanitizedTitle}-${timestamp}.md`;

        // 9. Upload to GCS
        const buffer = Buffer.from(markdown, "utf-8");
        const storageKey = generateStorageKey(session.user.id, fileName);

        try {
            await uploadFile(buffer, storageKey, "text/markdown");
        } catch (uploadError) {
            console.error("[Save Conversation] GCS upload failed:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload conversation to storage" },
                { status: 500 }
            );
        }

        // 10. Create document record
        const [newDocument] = await db
            .insert(documents)
            .values({
                userId: session.user.id,
                name: fileName,
                originalName: fileName,
                type: "text/markdown",
                size: buffer.length,
                storageKey: storageKey,
                status: "pending",
                chunkCount: 0,
                metadata: {
                    source: "conversation",
                    conversationId: conversationId,
                    agent: conversation.agent,
                    isUpdate: isUpdate,
                    messageCount: conversationMessages.length,
                    savedAt: new Date().toISOString(),
                },
            })
            .returning();

        console.log("[Save Conversation] Document created:", newDocument.id);

        // 11. Process document for RAG
        try {
            console.log("[Save Conversation] Processing for RAG...");
            const result = await processDocument(newDocument.id);

            if (!result.success) {
                console.error("[Save Conversation] Processing failed:", result.error);
            } else {
                console.log("[Save Conversation] Processing complete:", result.chunkCount, "chunks");
            }
        } catch (processError) {
            console.error("[Save Conversation] Processing error:", processError);
        }

        // 12. Update conversation with save timestamp
        await db
            .update(conversations)
            .set({
                savedToKnowledgeBaseAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(conversations.id, conversationId));

        return NextResponse.json({
            success: true,
            document: {
                id: newDocument.id,
                name: newDocument.name,
            },
            messagesCount: conversationMessages.length,
            isUpdate,
        });
    } catch (error) {
        console.error("[Save Conversation to KB] Error:", error);
        return NextResponse.json(
            { error: "Failed to save conversation to knowledge base" },
            { status: 500 }
        );
    }
}

/**
 * GET - Check if conversation has unsaved messages
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { id: conversationId } = await params;

        // Get conversation
        const [conversation] = await db
            .select()
            .from(conversations)
            .where(
                and(
                    eq(conversations.id, conversationId),
                    eq(conversations.userId, session.user.id)
                )
            )
            .limit(1);

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        const lastSavedAt = conversation.savedToKnowledgeBaseAt;

        // Count unsaved messages
        let unsavedCount = 0;
        if (lastSavedAt) {
            const unsavedMessages = await db
                .select({ id: messages.id })
                .from(messages)
                .where(
                    and(
                        eq(messages.conversationId, conversationId),
                        gt(messages.createdAt, lastSavedAt)
                    )
                );
            unsavedCount = unsavedMessages.length;
        } else {
            // Never saved - count all messages
            const allMessages = await db
                .select({ id: messages.id })
                .from(messages)
                .where(eq(messages.conversationId, conversationId));
            unsavedCount = allMessages.length;
        }

        return NextResponse.json({
            conversationId,
            savedToKnowledgeBaseAt: lastSavedAt?.toISOString() || null,
            hasUnsavedMessages: unsavedCount > 0,
            unsavedMessageCount: unsavedCount,
            neverSaved: lastSavedAt === null,
        });
    } catch (error) {
        console.error("[Check Conversation Save Status] Error:", error);
        return NextResponse.json(
            { error: "Failed to check save status" },
            { status: 500 }
        );
    }
}