// src/lib/hooks/useLinkedInStatus.ts
// Shared React hooks for LinkedIn connection status and posting.
// Used across Settings, campaign review page, and post editor.

"use client";

import { useState, useEffect, useCallback } from "react";

// ============================================
// LinkedIn Connection Status Hook
// ============================================

interface LinkedInProfile {
    name: string;
    personUrn: string;
}

interface LinkedInStatus {
    connected: boolean;
    configured?: boolean;
    profile?: LinkedInProfile;
    tokenExpired?: boolean;
}

export function useLinkedInStatus() {
    const [status, setStatus] = useState<LinkedInStatus | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/linkedin/status");
            if (response.ok) {
                const data = await response.json();
                setStatus(data);
            } else {
                setStatus({ connected: false });
            }
        } catch (error) {
            console.error("Failed to fetch LinkedIn status:", error);
            setStatus({ connected: false });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return { status, loading, refetch: fetchStatus };
}

// ============================================
// LinkedIn Post Hook
// ============================================

export function useLinkedInPost() {
    const [posting, setPosting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reconnectRequired, setReconnectRequired] = useState(false);

    const postToLinkedIn = useCallback(async (
        content: string,
        options?: {
            visibility?: string;
            articleUrl?: string;
            articleTitle?: string;
            articleDescription?: string;
        }
    ) => {
        setPosting(true);
        setError(null);
        setSuccess(false);
        setReconnectRequired(false);

        try {
            const response = await fetch("/api/linkedin/post", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    visibility: options?.visibility || "PUBLIC",
                    articleUrl: options?.articleUrl,
                    articleTitle: options?.articleTitle,
                    articleDescription: options?.articleDescription,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.reconnectRequired) {
                    setReconnectRequired(true);
                }
                throw new Error(data.error || "Failed to post to LinkedIn");
            }

            setSuccess(true);
            // Reset success after 5 seconds
            setTimeout(() => setSuccess(false), 5000);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to post";
            setError(errorMessage);
            return null;
        } finally {
            setPosting(false);
        }
    }, []);

    const reset = useCallback(() => {
        setPosting(false);
        setSuccess(false);
        setError(null);
        setReconnectRequired(false);
    }, []);

    return { postToLinkedIn, posting, success, error, reconnectRequired, reset };
}
