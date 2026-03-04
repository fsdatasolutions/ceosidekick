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

// GET /api/goals — List user's goals with steps
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await getDb();
        const { goals, goalSteps } = await getSchema();
        const { eq, desc, and } = await import("drizzle-orm");

        const statusFilter = request.nextUrl.searchParams.get("status");

        // Build where condition
        const conditions = [eq(goals.userId, session.user.id)];
        if (statusFilter && ["active", "completed", "archived"].includes(statusFilter)) {
            conditions.push(eq(goals.status, statusFilter));
        }

        const userGoals = await db
            .select()
            .from(goals)
            .where(and(...conditions))
            .orderBy(desc(goals.createdAt));

        // Fetch steps for all goals
        const goalIds = userGoals.map((g) => g.id);
        let allSteps: (typeof goalSteps.$inferSelect)[] = [];

        if (goalIds.length > 0) {
            const { inArray, asc } = await import("drizzle-orm");
            allSteps = await db
                .select()
                .from(goalSteps)
                .where(inArray(goalSteps.goalId, goalIds))
                .orderBy(asc(goalSteps.stepNumber));
        }

        // Group steps by goalId
        const stepsByGoal = allSteps.reduce((acc, step) => {
            if (!acc[step.goalId]) acc[step.goalId] = [];
            acc[step.goalId].push(step);
            return acc;
        }, {} as Record<string, typeof allSteps>);

        const goalsWithSteps = userGoals.map((goal) => ({
            ...goal,
            steps: stepsByGoal[goal.id] || [],
        }));

        return NextResponse.json({ goals: goalsWithSteps });
    } catch (error) {
        console.error("[Goals GET] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch goals" },
            { status: 500 }
        );
    }
}

// POST /api/goals — Save a new goal with steps
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await getDb();
        const { goals, goalSteps } = await getSchema();

        const body = await request.json();
        const { title, description, category, targetDate, aiModel, creditCost, steps } = body;

        if (!title || !Array.isArray(steps) || steps.length === 0) {
            return NextResponse.json(
                { error: "Title and at least one step are required" },
                { status: 400 }
            );
        }

        // Create the goal
        const [newGoal] = await db
            .insert(goals)
            .values({
                userId: session.user.id,
                title,
                description: description || null,
                category: category || null,
                status: "active",
                progress: 0,
                targetDate: targetDate ? new Date(targetDate) : null,
                aiModel: aiModel || null,
                creditCost: creditCost || null,
            })
            .returning();

        // Create the steps
        const stepValues = steps.map((step: { title: string; description?: string; timeframe?: string }, index: number) => ({
            goalId: newGoal.id,
            stepNumber: index + 1,
            title: step.title,
            description: step.description || null,
            timeframe: step.timeframe || null,
            completed: false,
        }));

        const createdSteps = await db
            .insert(goalSteps)
            .values(stepValues)
            .returning();

        return NextResponse.json({
            goal: {
                ...newGoal,
                steps: createdSteps,
            },
        });
    } catch (error) {
        console.error("[Goals POST] Error:", error);
        return NextResponse.json(
            { error: "Failed to create goal" },
            { status: 500 }
        );
    }
}
