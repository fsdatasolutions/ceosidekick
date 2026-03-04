// src/app/api/admin/feedback/[id]/route.ts
// Admin API for updating feedback status and notes

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/admin";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { eq } from "drizzle-orm";

const VALID_STATUSES = ["open", "in_progress", "resolved", "closed"];
const VALID_PRIORITIES = ["low", "medium", "high", "critical"];

export async function PATCH(
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

        const { isAdmin } = await checkAdminAccess(session.user.id);
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { status, priority, adminNotes } = body as {
            status?: string;
            priority?: string;
            adminNotes?: string;
        };

        // Validate inputs
        if (status && !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
                { status: 400 }
            );
        }
        if (priority && !VALID_PRIORITIES.includes(priority)) {
            return NextResponse.json(
                { error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(", ")}` },
                { status: 400 }
            );
        }

        // Check feedback exists
        const [existing] = await db
            .select({ id: feedback.id, status: feedback.status })
            .from(feedback)
            .where(eq(feedback.id, id))
            .limit(1);

        if (!existing) {
            return NextResponse.json(
                { error: "Feedback not found" },
                { status: 404 }
            );
        }

        // Build update object
        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (status !== undefined) {
            updateData.status = status;
            // Auto-set resolvedAt/resolvedBy when resolving
            if (status === "resolved") {
                updateData.resolvedAt = new Date();
                updateData.resolvedBy = session.user.id;
            } else if (existing.status === "resolved" && status !== "resolved") {
                // Clear resolved fields when moving away from resolved
                updateData.resolvedAt = null;
                updateData.resolvedBy = null;
            }
        }

        if (priority !== undefined) {
            updateData.priority = priority;
        }

        if (adminNotes !== undefined) {
            updateData.adminNotes = adminNotes;
        }

        const [updated] = await db
            .update(feedback)
            .set(updateData)
            .where(eq(feedback.id, id))
            .returning();

        return NextResponse.json({ feedback: updated });
    } catch (error) {
        console.error("[Admin Feedback Update] Error:", error);
        return NextResponse.json(
            { error: "Failed to update feedback" },
            { status: 500 }
        );
    }
}
