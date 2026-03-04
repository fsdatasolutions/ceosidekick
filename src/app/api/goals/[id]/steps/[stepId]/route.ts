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

// Recalculate and update goal progress
async function recalculateProgress(goalId: string) {
    const db = await getDb();
    const { goals, goalSteps } = await getSchema();
    const { eq } = await import("drizzle-orm");

    const steps = await db
        .select()
        .from(goalSteps)
        .where(eq(goalSteps.goalId, goalId));

    if (steps.length === 0) {
        await db
            .update(goals)
            .set({ progress: 0, status: "active", updatedAt: new Date() })
            .where(eq(goals.id, goalId));
        return;
    }

    const completedCount = steps.filter((s) => s.completed).length;
    const progress = Math.round((completedCount / steps.length) * 100);
    const allDone = completedCount === steps.length;

    await db
        .update(goals)
        .set({
            progress,
            status: allDone ? "completed" : "active",
            updatedAt: new Date(),
        })
        .where(eq(goals.id, goalId));
}

// PATCH /api/goals/[id]/steps/[stepId] — Update step (toggle completed OR edit fields)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; stepId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: goalId, stepId } = await params;
        const db = await getDb();
        const { goals, goalSteps } = await getSchema();
        const { eq, and } = await import("drizzle-orm");

        // Check goal ownership
        const [goal] = await db
            .select()
            .from(goals)
            .where(eq(goals.id, goalId))
            .limit(1);

        if (!goal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        if (goal.userId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Verify step belongs to this goal
        const [step] = await db
            .select()
            .from(goalSteps)
            .where(and(eq(goalSteps.id, stepId), eq(goalSteps.goalId, goalId)))
            .limit(1);

        if (!step) {
            return NextResponse.json({ error: "Step not found" }, { status: 404 });
        }

        const body = await request.json();
        const updates: Record<string, unknown> = { updatedAt: new Date() };

        // Handle completion toggle
        if (body.completed !== undefined) {
            updates.completed = body.completed;
            updates.completedAt = body.completed ? new Date() : null;
        }

        // Handle field edits
        if (body.title !== undefined) updates.title = body.title;
        if (body.description !== undefined) updates.description = body.description;
        if (body.timeframe !== undefined) updates.timeframe = body.timeframe;
        if (body.stepNumber !== undefined) updates.stepNumber = body.stepNumber;

        const [updated] = await db
            .update(goalSteps)
            .set(updates)
            .where(eq(goalSteps.id, stepId))
            .returning();

        // Recalculate goal progress
        await recalculateProgress(goalId);

        return NextResponse.json({ step: updated });
    } catch (error) {
        console.error("[Goal Step PATCH] Error:", error);
        return NextResponse.json(
            { error: "Failed to update step" },
            { status: 500 }
        );
    }
}

// DELETE /api/goals/[id]/steps/[stepId] — Remove a step
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; stepId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: goalId, stepId } = await params;
        const db = await getDb();
        const { goals, goalSteps } = await getSchema();
        const { eq, and } = await import("drizzle-orm");

        // Check goal ownership
        const [goal] = await db
            .select()
            .from(goals)
            .where(eq(goals.id, goalId))
            .limit(1);

        if (!goal) {
            return NextResponse.json({ error: "Goal not found" }, { status: 404 });
        }

        if (goal.userId !== session.user.id) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Verify step belongs to this goal
        const [step] = await db
            .select()
            .from(goalSteps)
            .where(and(eq(goalSteps.id, stepId), eq(goalSteps.goalId, goalId)))
            .limit(1);

        if (!step) {
            return NextResponse.json({ error: "Step not found" }, { status: 404 });
        }

        await db.delete(goalSteps).where(eq(goalSteps.id, stepId));

        // Recalculate progress
        await recalculateProgress(goalId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Goal Step DELETE] Error:", error);
        return NextResponse.json(
            { error: "Failed to delete step" },
            { status: 500 }
        );
    }
}
