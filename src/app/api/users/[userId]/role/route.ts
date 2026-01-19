// src/app/api/admin/stats/route.ts
// Admin API for dashboard statistics
// Security: Role-based access control via database lookup

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/admin";
import { db } from "@/db";
import { users, conversations, messages, subscriptions, monthlyUsage } from "@/db/schema";
import { eq, sql, desc, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        // 1. Verify authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // 2. Verify admin role from database (never trust client claims)
        const { isAdmin } = await checkAdminAccess(session.user.id);
        if (!isAdmin) {
            // Log unauthorized access attempts for security monitoring
            console.warn(
                "[Admin API] Unauthorized access attempt:",
                { userId: session.user.id, email: session.user.email }
            );
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // 3. Fetch admin statistics
        const [userCount] = await db
            .select({ count: count() })
            .from(users);

        const [conversationCount] = await db
            .select({ count: count() })
            .from(conversations);

        const [messageCount] = await db
            .select({ count: count() })
            .from(messages);

        // Get messages by role
        const messagesByRole = await db
            .select({
                role: messages.role,
                count: count(),
            })
            .from(messages)
            .groupBy(messages.role);

        const userMessages = messagesByRole.find(m => m.role === "user")?.count || 0;
        const assistantMessages = messagesByRole.find(m => m.role === "assistant")?.count || 0;

        // Get subscription tier distribution
        const tierDistribution = await db
            .select({
                tier: subscriptions.tier,
                count: count(),
            })
            .from(subscriptions)
            .groupBy(subscriptions.tier);

        // Get users with their stats (limit to prevent large data exposure)
        const userStats = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                image: users.image,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(100);

        // Get message counts per user
        const userMessageCounts = await db
            .select({
                userId: conversations.userId,
                messageCount: count(messages.id),
                conversationCount: sql<number>`COUNT(DISTINCT ${conversations.id})`,
            })
            .from(conversations)
            .leftJoin(messages, eq(messages.conversationId, conversations.id))
            .groupBy(conversations.userId);

        // Get subscription info per user
        const userSubscriptions = await db
            .select({
                userId: subscriptions.userId,
                tier: subscriptions.tier,
                status: subscriptions.status,
            })
            .from(subscriptions);

        // Get current month usage per user
        const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
        const currentUsage = await db
            .select({
                userId: monthlyUsage.userId,
                messagesUsed: monthlyUsage.messagesUsed,
                messagesLimit: monthlyUsage.messagesLimit,
                bonusMessages: monthlyUsage.bonusMessages,
            })
            .from(monthlyUsage)
            .where(eq(monthlyUsage.period, currentPeriod));

        // Combine user data
        const usersWithStats = userStats.map(user => {
            const msgStats = userMessageCounts.find(m => m.userId === user.id);
            const subInfo = userSubscriptions.find(s => s.userId === user.id);
            const usage = currentUsage.find(u => u.userId === user.id);

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role || "user",
                createdAt: user.createdAt,
                totalMessages: msgStats?.messageCount || 0,
                conversationCount: msgStats?.conversationCount || 0,
                tier: subInfo?.tier || "free",
                subscriptionStatus: subInfo?.status || "none",
                currentMonthUsage: usage?.messagesUsed || 0,
                currentMonthLimit: usage?.messagesLimit || 50,
                bonusMessages: usage?.bonusMessages || 0,
            };
        });

        // Sort by total messages (most active first)
        usersWithStats.sort((a, b) => (b.totalMessages as number) - (a.totalMessages as number));

        // Calculate averages
        const totalUsers = userCount.count || 0;
        const avgMessagesPerUser = totalUsers > 0 ? Math.round(userMessages / totalUsers) : 0;
        const avgConversationsPerUser = totalUsers > 0
            ? Math.round((conversationCount.count || 0) / totalUsers)
            : 0;

        // Get recent signups (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentSignups = usersWithStats.filter(u =>
            u.createdAt && new Date(u.createdAt) > sevenDaysAgo
        ).length;

        // Get active users (sent message this month)
        const activeUsers = usersWithStats.filter(u =>
            (u.currentMonthUsage as number) > 0
        ).length;

        // Revenue estimate (based on paid tiers)
        const paidTiers = tierDistribution.filter(t => t.tier !== "free" && t.tier !== null);
        const tierPrices: Record<string, number> = {
            power: 29,
            pro: 199,
            team: 500,
        };
        const estimatedMRR = paidTiers.reduce((total, t) => {
            const price = tierPrices[t.tier || ""] || 0;
            return total + (price * (t.count || 0));
        }, 0);

        return NextResponse.json({
            overview: {
                totalUsers: totalUsers,
                totalConversations: conversationCount.count || 0,
                totalMessages: messageCount.count || 0,
                userMessages,
                assistantMessages,
                avgMessagesPerUser,
                avgConversationsPerUser,
                recentSignups,
                activeUsers,
                estimatedMRR,
            },
            tierDistribution: tierDistribution.map(t => ({
                tier: t.tier || "free",
                count: t.count || 0,
            })),
            users: usersWithStats,
            currentPeriod,
        });
    } catch (error) {
        console.error("[Admin Stats] Error:", error);
        // Don't expose internal error details
        return NextResponse.json(
            { error: "An error occurred processing your request" },
            { status: 500 }
        );
    }
}