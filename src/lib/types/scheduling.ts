// src/lib/types/scheduling.ts
// Shared types for LinkedIn content scheduling

export interface SchedulingMeta {
    postAs: string;                    // "personal" or org ID (e.g., "12345")
    visibility: "PUBLIC" | "CONNECTIONS";
    articleUrl?: string;               // URL for link-preview card
    articleTitle?: string;             // Title for link preview
    articleDescription?: string;       // Description for link preview
    linkedinPostId?: string;           // Set after successful publish
    errorMessage?: string;             // Set on failure
    retryCount?: number;               // Number of publish attempts
    lastAttemptAt?: string;            // ISO timestamp of last attempt
}
