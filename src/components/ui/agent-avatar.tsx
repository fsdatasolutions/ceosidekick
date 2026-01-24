// src/components/ui/agent-avatar.tsx
// Agent Avatar Component - Uses centralized agent configuration
// Displays AI advisor avatars with fallback to initials

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
    type AgentType,
    AGENTS,
    AGENT_AVATARS,
    AGENT_COLORS,
    getAllAgentIds
} from "@/config/agent-config";

// ============================================
// TYPES
// ============================================

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface AgentAvatarProps {
    agentId: string;
    size?: AvatarSize;
    className?: string;
    style?: React.CSSProperties;
    showBorder?: boolean;
    showGlow?: boolean;
}

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const SIZE_CONFIG: Record<AvatarSize, {
    container: string;
    image: number;
    text: string;
    border: string;
    glow: string;
}> = {
    xs: {
        container: "w-6 h-6",
        image: 24,
        text: "text-[10px]",
        border: "ring-1",
        glow: "shadow-sm",
    },
    sm: {
        container: "w-8 h-8",
        image: 32,
        text: "text-xs",
        border: "ring-2",
        glow: "shadow-md",
    },
    md: {
        container: "w-10 h-10",
        image: 40,
        text: "text-sm",
        border: "ring-2",
        glow: "shadow-md",
    },
    lg: {
        container: "w-12 h-12",
        image: 48,
        text: "text-base",
        border: "ring-2",
        glow: "shadow-lg",
    },
    xl: {
        container: "w-16 h-16",
        image: 64,
        text: "text-lg",
        border: "ring-3",
        glow: "shadow-xl",
    },
    "2xl": {
        container: "w-20 h-20",
        image: 80,
        text: "text-xl",
        border: "ring-4",
        glow: "shadow-2xl",
    },
};

// ============================================
// DEFAULT FALLBACK FOR UNKNOWN AGENTS
// (e.g., "knowledge" which is no longer an agent type)
// ============================================

const DEFAULT_AGENT = {
    name: "AI Advisor",
    color: "bg-neutral-500",
    hex: "#6B7280",
};

// ============================================
// COMPONENT
// ============================================

export function AgentAvatar({
                                agentId,
                                size = "md",
                                className,
                                style,
                                showBorder = false,
                                showGlow = false,
                            }: AgentAvatarProps) {
    const [imageError, setImageError] = useState(false);

    // Check if this is a valid agent ID
    const validAgentIds = getAllAgentIds();
    const isValidAgent = validAgentIds.includes(agentId as AgentType);

    // Get agent data from centralized config (with fallback for unknown agents)
    const agent = isValidAgent ? AGENTS[agentId as AgentType] : null;
    const avatarUrl = isValidAgent ? AGENT_AVATARS[agentId as AgentType] : null;
    const colors = isValidAgent ? AGENT_COLORS[agentId as AgentType] : null;

    const sizeConfig = SIZE_CONFIG[size];

    // Generate initials for fallback (handle unknown agents)
    const agentName = agent?.name || DEFAULT_AGENT.name;
    const initials = agentName
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // Determine if we should show the image or fallback
    const showImage = avatarUrl && !imageError;

    // Get colors with fallback
    const bgColor = colors?.bg || DEFAULT_AGENT.color;
    const hexColor = colors?.hex || DEFAULT_AGENT.hex;

    return (
        <div
            style={style}
            className={cn(
                "relative rounded-xl overflow-hidden flex-shrink-0",
                sizeConfig.container,
                showBorder && `${sizeConfig.border} ring-white ring-offset-2`,
                showGlow && sizeConfig.glow,
                className
            )}
        >
            {showImage ? (
                // Avatar Image
                <Image
                    src={avatarUrl}
                    alt={`${agentName} avatar`}
                    width={sizeConfig.image}
                    height={sizeConfig.image}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    priority={size === "lg" || size === "xl" || size === "2xl"}
                />
            ) : (
                // Fallback: Colored background with initials
                <div
                    className={cn(
                        "w-full h-full flex items-center justify-center font-semibold text-white",
                        bgColor
                    )}
                >
                    <span className={sizeConfig.text}>{initials}</span>
                </div>
            )}

            {/* Optional: AI indicator dot */}
            {(size === "lg" || size === "xl" || size === "2xl") && (
                <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                    style={{ backgroundColor: hexColor }}
                    title="AI Advisor"
                />
            )}
        </div>
    );
}

// ============================================
// AVATAR GROUP COMPONENT
// For displaying multiple avatars in a stack
// ============================================

interface AgentAvatarGroupProps {
    agentIds: string[];
    size?: AvatarSize;
    max?: number;
    className?: string;
}

export function AgentAvatarGroup({
                                     agentIds,
                                     size = "sm",
                                     max = 4,
                                     className,
                                 }: AgentAvatarGroupProps) {
    const displayedAgents = agentIds.slice(0, max);
    const remainingCount = agentIds.length - max;

    return (
        <div className={cn("flex -space-x-2", className)}>
            {displayedAgents.map((agentId, index) => (
                <AgentAvatar
                    key={agentId}
                    agentId={agentId}
                    size={size}
                    showBorder
                    className="hover:z-10 transition-transform hover:scale-110"
                    style={{ zIndex: displayedAgents.length - index }}
                />
            ))}
            {remainingCount > 0 && (
                <div
                    className={cn(
                        "flex items-center justify-center rounded-xl bg-neutral-200 text-neutral-600 font-medium ring-2 ring-white",
                        SIZE_CONFIG[size].container,
                        SIZE_CONFIG[size].text
                    )}
                >
                    +{remainingCount}
                </div>
            )}
        </div>
    );
}

// ============================================
// EXPORTS
// ============================================

export type { AgentAvatarProps, AgentAvatarGroupProps, AvatarSize };