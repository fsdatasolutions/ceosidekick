// src/app/api/admin/page-views/route.ts
// Admin API for page view analytics

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/admin";
import { db } from "@/db";
import { pageViews } from "@/db/schema";
import { sql, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const { isAdmin } = await checkAdminAccess(session.user.id);
        if (!isAdmin) {
            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
        }

        // Total page views
        const [totalViews] = await db
            .select({ count: sql<number>`count(*)` })
            .from(pageViews);

        // Unique visitors (by visitor_id)
        const [uniqueVisitors] = await db
            .select({ count: sql<number>`count(distinct ${pageViews.visitorId})` })
            .from(pageViews);

        // Views today
        const [todayViews] = await db
            .select({ count: sql<number>`count(*)` })
            .from(pageViews)
            .where(sql`${pageViews.createdAt} >= current_date`);

        // Views this week
        const [weekViews] = await db
            .select({ count: sql<number>`count(*)` })
            .from(pageViews)
            .where(sql`${pageViews.createdAt} >= current_date - interval '7 days'`);

        // Top pages (all time)
        const topPages = await db
            .select({
                path: pageViews.path,
                views: sql<number>`count(*)`,
                uniqueVisitors: sql<number>`count(distinct ${pageViews.visitorId})`,
            })
            .from(pageViews)
            .groupBy(pageViews.path)
            .orderBy(desc(sql`count(*)`))
            .limit(15);

        // Daily views for the last 30 days
        const dailyViews = await db
            .select({
                date: sql<string>`to_char(${pageViews.createdAt}::date, 'YYYY-MM-DD')`,
                views: sql<number>`count(*)`,
                uniqueVisitors: sql<number>`count(distinct ${pageViews.visitorId})`,
            })
            .from(pageViews)
            .where(sql`${pageViews.createdAt} >= current_date - interval '30 days'`)
            .groupBy(sql`${pageViews.createdAt}::date`)
            .orderBy(sql`${pageViews.createdAt}::date`);

        // Top referrers
        const topReferrers = await db
            .select({
                referrer: pageViews.referrer,
                views: sql<number>`count(*)`,
            })
            .from(pageViews)
            .where(sql`${pageViews.referrer} is not null and ${pageViews.referrer} != ''`)
            .groupBy(pageViews.referrer)
            .orderBy(desc(sql`count(*)`))
            .limit(10);

        return NextResponse.json({
            overview: {
                totalViews: totalViews.count,
                uniqueVisitors: uniqueVisitors.count,
                todayViews: todayViews.count,
                weekViews: weekViews.count,
            },
            topPages,
            dailyViews,
            topReferrers,
        });
    } catch (error) {
        console.error("[Admin Page Views] Error:", error);
        return NextResponse.json(
            { error: "An error occurred processing your request" },
            { status: 500 }
        );
    }
}
