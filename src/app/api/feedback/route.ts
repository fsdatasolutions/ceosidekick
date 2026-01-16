// src/app/api/feedback/route.ts
// Feedback API for bug reports and feature requests

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

// Lazy database imports
async function getDb() {
    if (!process.env.DATABASE_URL) return null;
    const { db } = await import("@/db");
    return db;
}

async function getSchema() {
    const { feedback } = await import("@/db/schema");
    return { feedback };
}

// Valid types and priorities
const VALID_TYPES = ["bug", "feature_request"] as const;
const VALID_PRIORITIES = ["low", "medium", "high", "critical"] as const;

type FeedbackType = (typeof VALID_TYPES)[number];
type FeedbackPriority = (typeof VALID_PRIORITIES)[number];

/**
 * GET /api/feedback
 * List user's feedback submissions
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        const db = await getDb();
        if (!db) {
            return NextResponse.json({
                feedback: [],
                message: "Database not configured",
            });
        }

        const { feedback } = await getSchema();

        const userFeedback = await db
            .select({
                id: feedback.id,
                type: feedback.type,
                title: feedback.title,
                description: feedback.description,
                status: feedback.status,
                priority: feedback.priority,
                stepsToReproduce: feedback.stepsToReproduce,
                expectedBehavior: feedback.expectedBehavior,
                actualBehavior: feedback.actualBehavior,
                useCase: feedback.useCase,
                createdAt: feedback.createdAt,
                updatedAt: feedback.updatedAt,
            })
            .from(feedback)
            .where(eq(feedback.userId, userId))
            .orderBy(desc(feedback.createdAt));

        return NextResponse.json({ feedback: userFeedback });
    } catch (error) {
        console.error("Error fetching feedback:", error);
        return NextResponse.json(
            { error: "Failed to fetch feedback" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/feedback
 * Submit new feedback (bug report or feature request)
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const body = await req.json();

        // Validate required fields
        const { type, title, description, priority = "medium" } = body;

        if (!type || !VALID_TYPES.includes(type)) {
            return NextResponse.json(
                { error: "Invalid feedback type. Must be 'bug' or 'feature_request'" },
                { status: 400 }
            );
        }

        if (!title || typeof title !== "string" || title.trim().length === 0) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        if (title.length > 255) {
            return NextResponse.json(
                { error: "Title must be 255 characters or less" },
                { status: 400 }
            );
        }

        if (!description || typeof description !== "string" || description.trim().length === 0) {
            return NextResponse.json(
                { error: "Description is required" },
                { status: 400 }
            );
        }

        if (!VALID_PRIORITIES.includes(priority)) {
            return NextResponse.json(
                { error: "Invalid priority. Must be 'low', 'medium', 'high', or 'critical'" },
                { status: 400 }
            );
        }

        const db = await getDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const { feedback } = await getSchema();

        // Build insert values with proper typing
        const [created] = await db
            .insert(feedback)
            .values({
                userId,
                type: type as FeedbackType,
                title: title.trim(),
                description: description.trim(),
                priority: priority as FeedbackPriority,
                status: "open",
                // Bug-specific fields
                stepsToReproduce: type === "bug" && body.stepsToReproduce
                    ? body.stepsToReproduce.trim()
                    : null,
                expectedBehavior: type === "bug" && body.expectedBehavior
                    ? body.expectedBehavior.trim()
                    : null,
                actualBehavior: type === "bug" && body.actualBehavior
                    ? body.actualBehavior.trim()
                    : null,
                // Feature request specific
                useCase: type === "feature_request" && body.useCase
                    ? body.useCase.trim()
                    : null,
                // Metadata
                metadata: body.metadata || null,
            })
            .returning();

        console.log(`[Feedback] New ${type} submitted by user ${userId}: ${title}`);

        return NextResponse.json({
            feedback: {
                id: created.id,
                type: created.type,
                title: created.title,
                status: created.status,
            },
            message: "Feedback submitted successfully",
        });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        return NextResponse.json(
            { error: "Failed to submit feedback" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/feedback?id=xxx
 * Delete a feedback submission (user can only delete their own)
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(req.url);
        const feedbackId = searchParams.get("id");

        if (!feedbackId) {
            return NextResponse.json(
                { error: "Feedback ID required" },
                { status: 400 }
            );
        }

        const db = await getDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const { feedback } = await getSchema();

        // Verify ownership
        const [existing] = await db
            .select()
            .from(feedback)
            .where(eq(feedback.id, feedbackId));

        if (!existing) {
            return NextResponse.json(
                { error: "Feedback not found" },
                { status: 404 }
            );
        }

        if (existing.userId !== userId) {
            return NextResponse.json(
                { error: "Not authorized to delete this feedback" },
                { status: 403 }
            );
        }

        // Only allow deletion of open feedback
        if (existing.status !== "open") {
            return NextResponse.json(
                { error: "Cannot delete feedback that is already being processed" },
                { status: 400 }
            );
        }

        await db.delete(feedback).where(eq(feedback.id, feedbackId));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting feedback:", error);
        return NextResponse.json(
            { error: "Failed to delete feedback" },
            { status: 500 }
        );
    }
}