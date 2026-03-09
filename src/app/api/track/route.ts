// src/app/api/track/route.ts
// Lightweight page view tracking endpoint
// No auth required - tracks both anonymous and logged-in visitors

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { pageViews } from "@/db/schema";
import { createHash } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { path, referrer } = body;

        if (!path || typeof path !== "string") {
            return NextResponse.json({ error: "path is required" }, { status: 400 });
        }

        // Create anonymous visitor ID from IP + user agent (no PII stored)
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || request.headers.get("x-real-ip")
            || "unknown";
        const userAgent = request.headers.get("user-agent") || "";
        const visitorId = createHash("sha256")
            .update(`${ip}:${userAgent}`)
            .digest("hex")
            .slice(0, 16);

        await db.insert(pageViews).values({
            path: path.slice(0, 500),
            referrer: referrer?.slice(0, 1000) || null,
            userAgent: userAgent.slice(0, 500) || null,
            visitorId,
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[Track] Error:", error);
        return NextResponse.json({ ok: true }); // Don't break the client
    }
}
