// src/components/content-engine/writer-profile-selector.tsx
// Shared Writer Profile selector for content creation pages
// Allows selecting between the user's own voice and AI advisor personas

"use client";

import Image from "next/image";
import { User } from "lucide-react";

export interface AuthorOption {
    id: string;
    name: string;
    role: string;
    image: string;
}

// AI advisor personas available for content writing (excludes 'content-engine' which is the tool itself)
export const AI_AUTHOR_OPTIONS: AuthorOption[] = [
    { id: "technology-partner", name: "Technology Partner", role: "AI Technology Advisor", image: "/images/avatars/technology-partner.png" },
    { id: "executive-coach", name: "Executive Coach", role: "AI Executive Coach", image: "/images/avatars/executive-coach.png" },
    { id: "marketing-partner", name: "Marketing Partner", role: "AI Marketing Advisor", image: "/images/avatars/marketing-partner.png" },
    { id: "sales-partner", name: "Sales Partner", role: "AI Sales Advisor", image: "/images/avatars/sales-partner.png" },
    { id: "legal-advisor", name: "Legal Advisor", role: "AI Legal Advisor", image: "/images/avatars/legal-advisor.png" },
    { id: "hr-partner", name: "HR Partner", role: "AI HR Advisor", image: "/images/avatars/hr-partner.png" },
];

interface WriterProfileSelectorProps {
    selectedAuthorId: string;
    onSelect: (authorId: string) => void;
    userName: string;
    userRole: string;
    userImage: string;
}

export function WriterProfileSelector({
    selectedAuthorId,
    onSelect,
    userName,
    userRole,
    userImage,
}: WriterProfileSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
                Writer Profile
            </label>
            <p className="text-xs text-neutral-500 mb-3">
                Choose who writes the content. This shapes the voice, perspective, and expertise.
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                {/* "You" option */}
                <button
                    onClick={() => onSelect("self")}
                    className={`flex-shrink-0 w-32 p-3 rounded-xl border text-center transition-all ${
                        selectedAuthorId === "self"
                            ? "border-primary-red bg-primary-red/5 ring-1 ring-primary-red/20"
                            : "border-neutral-200 hover:border-neutral-300"
                    }`}
                >
                    <div className="w-10 h-10 rounded-full bg-neutral-200 mx-auto mb-2 overflow-hidden flex items-center justify-center">
                        {userImage ? (
                            <Image
                                src={userImage}
                                alt={userName}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <User className="w-5 h-5 text-neutral-500" />
                        )}
                    </div>
                    <p className="text-xs font-medium text-neutral-900 truncate">{userName}</p>
                    <p className="text-[10px] text-neutral-500 truncate">{userRole || "Your voice"}</p>
                </button>

                {/* AI Advisor options */}
                {AI_AUTHOR_OPTIONS.map((author) => (
                    <button
                        key={author.id}
                        onClick={() => onSelect(author.id)}
                        className={`flex-shrink-0 w-32 p-3 rounded-xl border text-center transition-all ${
                            selectedAuthorId === author.id
                                ? "border-primary-red bg-primary-red/5 ring-1 ring-primary-red/20"
                                : "border-neutral-200 hover:border-neutral-300"
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-neutral-100 mx-auto mb-2 overflow-hidden">
                            <Image
                                src={author.image}
                                alt={author.name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="text-xs font-medium text-neutral-900 truncate">{author.name}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{author.role}</p>
                    </button>
                ))}
            </div>
        </div>
    );
}

/**
 * Helper to get the display name and role for a given authorId.
 * Useful for preview sections that need to show the selected author.
 */
export function getAuthorDisplayInfo(
    authorId: string,
    userName: string,
    userRole: string,
    userImage: string
): { name: string; role: string; image: string } {
    if (!authorId || authorId === "self") {
        return { name: userName, role: userRole || "Your headline", image: userImage };
    }
    const advisor = AI_AUTHOR_OPTIONS.find((a) => a.id === authorId);
    if (advisor) {
        return { name: advisor.name, role: advisor.role, image: advisor.image };
    }
    return { name: userName, role: userRole || "Your headline", image: userImage };
}
