import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

async function getDb() {
    const { db } = await import("@/db");
    return db;
}

async function getSchema() {
    const { goals, goalSteps } = await import("@/db/schema");
    return { goals, goalSteps };
}

// GET /api/goals/[id] — Single goal with steps
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
        const { goals, goalSteps } = await getSchema();
        const { eq, asc } = await import("drizzle-orm");

        const [goal] = await db
            .select()
            .from(goals)
            .where(eq(goals.id, id))
            .limit(1);

        if (!goal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        if (goal.userId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const steps = await db
            .select()
            .from(goalSteps)
            .where(eq(goalSteps.goalId, id))
            .orderBy(asc(goalSteps.stepNumber));

        return NextResponse.json({ goal: { ...goal, steps } });
    } catch (error) {
        console.error("[Goal GET] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch goal" },
            { status: 500 }
        );
    }
}

// PATCH /api/goals/[id] — Update goal fields
export async function PATCH(
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
        const { goals } = await getSchema();
        const { eq } = await import("drizzle-orm");

        // Check ownership
        const [goal] = await db
            .select()
            .from(goals)
            .where(eq(goals.id, id))
            .limit(1);

        if (!goal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        if (goal.userId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        const body = await request.json();
        const allowedFields = ["title", "description", "status", "targetDate", "category"];
        const updates: Record<string, unknown> = { updatedAt: new Date() };

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (field === "targetDate") {
                    updates[field] = body[field] ? new Date(body[field]) : null;
                } else {
                    updates[field] = body[field];
                }
            }
        }

        const [updated] = await db
            .update(goals)
            .set(updates)
            .where(eq(goals.id, id))
            .returning();

        return NextResponse.json({ goal: updated });
    } catch (error) {
        console.error("[Goal PATCH] Error:", error);
        return NextResponse.json(
            { error: "Failed to update goal" },
            { status: 500 }
        );
    }
}

// DELETE /api/goals/[id] — Delete goal (steps cascade)
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
        const { goals } = await getSchema();
        const { eq } = await import("drizzle-orm");

        // Check ownership
        const [goal] = await db
            .select()
            .from(goals)
            .where(eq(goals.id, id))
            .limit(1);

        if (!goal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        if (goal.userId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        await db.delete(goals).where(eq(goals.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Goal DELETE] Error:", error);
        return NextResponse.json(
            { error: "Failed to delete goal" },
            { status: 500 }
        );
    }
}
