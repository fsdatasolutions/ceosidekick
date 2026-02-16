// src/lib/services/error-logger.ts
// Automatic error logging to the feedback table for tracking user-facing errors

import { db } from "@/db";
import { feedback } from "@/db/schema";

interface ErrorLogOptions {
    userId: string;
    source: string; // e.g. "content-image-generate", "content-image-upload", "campaign-generate"
    error: unknown;
    metadata?: Record<string, any>;
}

/**
 * Log an error to the feedback table as an auto-reported bug.
 * This runs fire-and-forget so it never blocks the main flow.
 */
export function logErrorToFeedback(options: ErrorLogOptions): void {
    // Fire-and-forget — don't await, don't let logging failures propagate
    _logError(options).catch((loggingError) => {
        console.error("[ErrorLogger] Failed to log error to feedback table:", loggingError);
    });
}

async function _logError(options: ErrorLogOptions): Promise<void> {
    const { userId, source, error, metadata } = options;

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    await db.insert(feedback).values({
        userId,
        type: "bug",
        title: `[Auto] Error in ${source}`.substring(0, 255),
        description: errorMessage,
        status: "open",
        priority: "high",
        actualBehavior: errorMessage,
        metadata: {
            autoReported: true,
            source,
            errorStack,
            timestamp: new Date().toISOString(),
            ...metadata,
        },
    });

    console.log(`[ErrorLogger] Logged error to feedback table: [${source}] ${errorMessage.substring(0, 100)}`);
}
