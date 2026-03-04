// src/app/api/admin/feedback/route.ts
// Admin API for viewing all user feedback

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/admin";
import { db } from "@/db";
import { feedback, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { isAdmin } = await checkAdminAccess(session.user.id);
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        // Fetch all feedback joined with user info
        const allFeedback = await db
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
                pageUrl: feedback.pageUrl,
                adminNotes: feedback.adminNotes,
                resolvedAt: feedback.resolvedAt,
                createdAt: feedback.createdAt,
                updatedAt: feedback.updatedAt,
                userName: users.name,
                userEmail: users.email,
                userImage: users.image,
            })
            .from(feedback)
            .leftJoin(users, eq(feedback.userId, users.id))
            .orderBy(desc(feedback.createdAt));

        // Count by status
        const statusCounts = await db
            .select({
                status: feedback.status,
                count: sql<number>`COUNT(*)::int`,
            })
            .from(feedback)
            .groupBy(feedback.status);

        const counts = {
            total: allFeedback.length,
            open: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0,
        };

        for (const row of statusCounts) {
            if (row.status === "open") counts.open = row.count;
            else if (row.status === "in_progress") counts.inProgress = row.count;
            else if (row.status === "resolved") counts.resolved = row.count;
            else if (row.status === "closed") counts.closed = row.count;
        }

        return NextResponse.json({ feedback: allFeedback, counts });
    } catch (error) {
        console.error("[Admin Feedback] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch feedback" },
            { status: 500 }
        );
    }
}
