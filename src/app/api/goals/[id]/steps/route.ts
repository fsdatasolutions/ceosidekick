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
            .set({ progress: 0, updatedAt: new Date() })
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

// POST /api/goals/[id]/steps — Add a new step to a goal
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: goalId } = await params;
        const db = await getDb();
        const { goals, goalSteps } = await getSchema();
        const { eq, desc } = await import("drizzle-orm");

        // Check ownership
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

        const body = await request.json();
        const { title, description, timeframe } = body;

        if (!title) {
            return NextResponse.json(
                { error: "Step title is required" },
                { status: 400 }
            );
        }

        // Get the highest step number
        const [lastStep] = await db
            .select({ stepNumber: goalSteps.stepNumber })
            .from(goalSteps)
            .where(eq(goalSteps.goalId, goalId))
            .orderBy(desc(goalSteps.stepNumber))
            .limit(1);

        const nextStepNumber = (lastStep?.stepNumber ?? 0) + 1;

        const [newStep] = await db
            .insert(goalSteps)
            .values({
                goalId,
                stepNumber: nextStepNumber,
                title,
                description: description || null,
                timeframe: timeframe || null,
                completed: false,
            })
            .returning();

        // Recalculate progress
        await recalculateProgress(goalId);

        return NextResponse.json({ step: newStep });
    } catch (error) {
        console.error("[Goal Steps POST] Error:", error);
        return NextResponse.json(
            { error: "Failed to add step" },
            { status: 500 }
        );
    }
}
