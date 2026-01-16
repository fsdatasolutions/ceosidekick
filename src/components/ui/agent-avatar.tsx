// src/components/ui/agent-avatar.tsx
// Professional illustrated avatars - All 8 agents

import React from "react";

interface AgentAvatarProps {
    agentId: string;
    className?: string;
    size?: "sm" | "md" | "lg";
}

const agentColors: Record<string, string> = {
    technology: "bg-accent-teal",
    coach: "bg-agent-coach",
    legal: "bg-agent-legal",
    hr: "bg-agent-hr",
    marketing: "bg-pink-600",
    sales: "bg-orange-600",
    knowledge: "bg-agent-knowledge",
    content: "bg-primary-red",
};

// Technology Partner - Professional female, glasses, polished corporate style
const TechnologyAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="t-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F7E1D3" />
                <stop offset="100%" stopColor="#E5C4B0" />
            </linearGradient>
            <radialGradient id="t-skinDepth" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#FAEADF" />
                <stop offset="70%" stopColor="#EACED0" />
                <stop offset="100%" stopColor="#DEBA9E" />
            </radialGradient>
            <radialGradient id="t-cheek" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E8A090" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#E8A090" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="t-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C9A08A" stopOpacity="0" />
                <stop offset="100%" stopColor="#C9A08A" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="t-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5A3D2E" />
                <stop offset="30%" stopColor="#4A3025" />
                <stop offset="70%" stopColor="#3D261C" />
                <stop offset="100%" stopColor="#2E1C14" />
            </linearGradient>
            <linearGradient id="t-hairMid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6B4A38" />
                <stop offset="100%" stopColor="#4A3025" />
            </linearGradient>
            <linearGradient id="t-hairShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7A5A48" stopOpacity="0" />
                <stop offset="30%" stopColor="#8B6B58" stopOpacity="0.5" />
                <stop offset="50%" stopColor="#9A7A65" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#8B6B58" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#7A5A48" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="t-irisOuter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5A7585" />
                <stop offset="100%" stopColor="#3A4D58" />
            </radialGradient>
            <radialGradient id="t-irisInner" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#7A9AA8" />
                <stop offset="50%" stopColor="#5A7A8A" />
                <stop offset="100%" stopColor="#3A5565" />
            </radialGradient>
            <linearGradient id="t-blazer" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#383838" />
                <stop offset="50%" stopColor="#2D2D2D" />
                <stop offset="100%" stopColor="#232323" />
            </linearGradient>
            <linearGradient id="t-blazerFold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#404040" />
                <stop offset="50%" stopColor="#2D2D2D" />
                <stop offset="100%" stopColor="#404040" />
            </linearGradient>
            <linearGradient id="t-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C4918A" />
                <stop offset="100%" stopColor="#A8756E" />
            </linearGradient>
        </defs>

        {/* Hair back */}
        <path d="M16 56 Q12 28 40 14 Q50 10 60 14 Q88 28 84 56 Q86 78 70 86 L68 62 Q74 38 50 28 Q26 38 32 62 L30 86 Q14 78 16 56" fill="url(#t-hair)" />
        <path d="M20 58 Q18 35 42 20 Q50 17 58 20 Q82 35 80 58" fill="url(#t-hairMid)" opacity="0.5" />

        {/* Neck */}
        <path d="M40 72 L40 86 Q50 88 60 86 L60 72" fill="url(#t-skin)" />
        <path d="M42 76 L42 84 Q50 86 58 84 L58 76" fill="url(#t-shadow)" />

        {/* Shoulders */}
        <path d="M10 100 L26 82 Q50 76 74 82 L90 100 Z" fill="url(#t-blazer)" />
        <path d="M26 82 L38 100" stroke="#404040" strokeWidth="1" fill="none" />
        <path d="M74 82 L62 100" stroke="#404040" strokeWidth="1" fill="none" />
        <path d="M30 85 Q50 80 70 85" fill="url(#t-blazerFold)" opacity="0.3" />

        {/* Blouse */}
        <path d="M40 84 Q50 90 60 84 L58 100 L42 100 Z" fill="#FAFAFA" />
        <path d="M44 86 Q50 90 56 86" stroke="#F0F0F0" strokeWidth="0.8" fill="none" />

        {/* Ears */}
        <ellipse cx="25" cy="52" rx="5" ry="8" fill="url(#t-skin)" />
        <ellipse cx="75" cy="52" rx="5" ry="8" fill="url(#t-skin)" />
        <path d="M23 48 Q25 52 24 56 Q23 59 25 61" stroke="#D4B09A" strokeWidth="0.8" fill="none" />
        <path d="M77 48 Q75 52 76 56 Q77 59 75 61" stroke="#D4B09A" strokeWidth="0.8" fill="none" />

        {/* Earrings */}
        <circle cx="25" cy="60" r="1.8" fill="#D4B078" />
        <circle cx="24.5" cy="59.5" r="0.6" fill="#F0D8A8" />
        <circle cx="75" cy="60" r="1.8" fill="#D4B078" />
        <circle cx="74.5" cy="59.5" r="0.6" fill="#F0D8A8" />

        {/* Face */}
        <ellipse cx="50" cy="48" rx="25" ry="29" fill="url(#t-skin)" />
        <ellipse cx="50" cy="49" rx="24" ry="27" fill="url(#t-skinDepth)" />
        <path d="M28 52 Q30 68 44 76" fill="url(#t-shadow)" opacity="0.2" />
        <path d="M72 52 Q70 68 56 76" fill="url(#t-shadow)" opacity="0.2" />
        <ellipse cx="32" cy="58" rx="7" ry="5" fill="url(#t-cheek)" />
        <ellipse cx="68" cy="58" rx="7" ry="5" fill="url(#t-cheek)" />

        {/* Hair front */}
        <path d="M25 52 Q22 24 50 16 Q78 24 75 52 Q72 34 50 26 Q28 34 25 52" fill="url(#t-hair)" />
        <path d="M28 48 Q28 28 50 20 Q72 28 72 48 Q68 34 50 26 Q32 34 28 48" fill="url(#t-hairMid)" />
        <path d="M32 44 Q34 30 50 24 Q66 30 68 44 Q62 34 50 28 Q38 34 32 44" fill="url(#t-hairShine)" />
        <path d="M26 48 Q32 28 54 26 Q42 38 34 50 Z" fill="url(#t-hair)" />
        <path d="M28 46 Q34 30 50 28 Q40 38 34 48 Z" fill="url(#t-hairMid)" opacity="0.7" />
        <path d="M32 26 Q36 34 34 44" stroke="#6B4A38" strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M40 24 Q42 32 40 42" stroke="#6B4A38" strokeWidth="0.6" fill="none" opacity="0.4" />
        <path d="M58 24 Q56 32 58 42" stroke="#6B4A38" strokeWidth="0.6" fill="none" opacity="0.4" />
        <path d="M66 26 Q64 34 66 44" stroke="#6B4A38" strokeWidth="0.6" fill="none" opacity="0.5" />

        {/* Eyebrows */}
        <path d="M33 42 C36 40 42 40 46 42.5" stroke="#4A3228" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M54 42.5 C58 40 64 40 67 42" stroke="#4A3228" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M35 42.2 C38 40.5 42 40.8 45 42.8" stroke="#4A3228" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M55 42.8 C58 40.8 62 40.5 65 42.2" stroke="#4A3228" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.5" />

        {/* Glasses */}
        <rect x="30" y="46" width="16" height="12" rx="1.5" fill="rgba(255,255,255,0.05)" stroke="#1A1A1A" strokeWidth="1.6" />
        <rect x="54" y="46" width="16" height="12" rx="1.5" fill="rgba(255,255,255,0.05)" stroke="#1A1A1A" strokeWidth="1.6" />
        <path d="M46 51 L54 51" stroke="#1A1A1A" strokeWidth="1.4" />
        <path d="M30 50 L25 48" stroke="#1A1A1A" strokeWidth="1.4" />
        <path d="M70 50 L75 48" stroke="#1A1A1A" strokeWidth="1.4" />
        <path d="M32 48 L35 48 L32 52" fill="#FFFFFF" opacity="0.08" />
        <path d="M56 48 L59 48 L56 52" fill="#FFFFFF" opacity="0.08" />

        {/* Eyes */}
        <ellipse cx="38" cy="52" rx="5" ry="3.8" fill="#FFFFFF" />
        <ellipse cx="62" cy="52" rx="5" ry="3.8" fill="#FFFFFF" />
        <ellipse cx="38" cy="53" rx="4.5" ry="3" fill="#F8F8F8" />
        <ellipse cx="62" cy="53" rx="4.5" ry="3" fill="#F8F8F8" />
        <circle cx="38" cy="52.5" r="3" fill="url(#t-irisOuter)" />
        <circle cx="62" cy="52.5" r="3" fill="url(#t-irisOuter)" />
        <circle cx="38" cy="52.3" r="2.2" fill="url(#t-irisInner)" />
        <circle cx="62" cy="52.3" r="2.2" fill="url(#t-irisInner)" />
        <circle cx="38" cy="52.3" r="1.2" fill="#0A0A0A" />
        <circle cx="62" cy="52.3" r="1.2" fill="#0A0A0A" />
        <circle cx="36.5" cy="51.2" r="1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="60.5" cy="51.2" r="1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="39" cy="53.5" r="0.5" fill="#FFFFFF" opacity="0.4" />
        <circle cx="63" cy="53.5" r="0.5" fill="#FFFFFF" opacity="0.4" />
        <path d="M33 49 Q38 47.5 43 49" stroke="#C8A898" strokeWidth="0.6" fill="none" />
        <path d="M57 49 Q62 47.5 67 49" stroke="#C8A898" strokeWidth="0.6" fill="none" />
        <path d="M34 55 Q38 56 42 55" stroke="#8A7060" strokeWidth="0.4" fill="none" opacity="0.4" />
        <path d="M58 55 Q62 56 66 55" stroke="#8A7060" strokeWidth="0.4" fill="none" opacity="0.4" />

        {/* Nose */}
        <path d="M50 50 Q49 56 48 61" stroke="#D8B8A0" strokeWidth="0.5" fill="none" opacity="0.4" />
        <path d="M50 50 Q51 56 52 61" stroke="#D8B8A0" strokeWidth="0.5" fill="none" opacity="0.2" />
        <path d="M47 63 Q50 66 53 63" stroke="#C8A088" strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse cx="50" cy="64" rx="4" ry="2" fill="#D8B8A0" opacity="0.12" />
        <path d="M50 52 L50 58" stroke="#FAF0E8" strokeWidth="1.2" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Lips */}
        <path d="M43 70 Q46 68.5 50 69 Q54 68.5 57 70" fill="url(#t-lip)" />
        <path d="M46 69.5 Q50 68 54 69.5" stroke="#B88880" strokeWidth="0.3" fill="none" />
        <path d="M43 70 Q50 74.5 57 70" fill="url(#t-lip)" />
        <path d="M43.5 70 Q50 70.5 56.5 70" stroke="#9A706A" strokeWidth="0.4" fill="none" />
        <path d="M47 72 Q50 72.5 53 72" stroke="#D8A8A0" strokeWidth="0.6" fill="none" opacity="0.5" />
        <path d="M49 66 L49 69" stroke="#D8B8A0" strokeWidth="0.4" fill="none" opacity="0.3" />
        <path d="M51 66 L51 69" stroke="#D8B8A0" strokeWidth="0.4" fill="none" opacity="0.3" />
        <ellipse cx="50" cy="76" rx="6" ry="3" fill="#FAF0E8" opacity="0.1" />
    </svg>
);

// Executive Coach - Professional female, elegant updo, warm and confident
const CoachAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="c-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5DDD0" />
                <stop offset="100%" stopColor="#E2C0AC" />
            </linearGradient>
            <radialGradient id="c-skinDepth" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#F8E5DA" />
                <stop offset="70%" stopColor="#E8CABC" />
                <stop offset="100%" stopColor="#D8B49C" />
            </radialGradient>
            <radialGradient id="c-cheek" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E09888" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#E09888" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="c-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C09888" stopOpacity="0" />
                <stop offset="100%" stopColor="#C09888" stopOpacity="0.28" />
            </linearGradient>
            <linearGradient id="c-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6B4832" />
                <stop offset="40%" stopColor="#5A3A28" />
                <stop offset="100%" stopColor="#3D2518" />
            </linearGradient>
            <linearGradient id="c-hairMid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B6048" />
                <stop offset="100%" stopColor="#5A3A28" />
            </linearGradient>
            <linearGradient id="c-hairShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9A7058" stopOpacity="0" />
                <stop offset="50%" stopColor="#AA8068" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#9A7058" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="c-irisOuter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5A8055" />
                <stop offset="100%" stopColor="#3A5538" />
            </radialGradient>
            <radialGradient id="c-irisInner" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#7AA072" />
                <stop offset="50%" stopColor="#5A8055" />
                <stop offset="100%" stopColor="#3A5538" />
            </radialGradient>
            <linearGradient id="c-blazer" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2D2D2D" />
                <stop offset="100%" stopColor="#1A1A1A" />
            </linearGradient>
            <linearGradient id="c-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C08078" />
                <stop offset="100%" stopColor="#A06058" />
            </linearGradient>
        </defs>

        {/* Hair back - elegant updo with loose pieces */}
        <ellipse cx="50" cy="16" rx="14" ry="10" fill="url(#c-hair)" />
        <ellipse cx="50" cy="14" rx="10" ry="7" fill="url(#c-hairMid)" />
        <path d="M22 52 Q18 30 40 18 Q50 14 60 18 Q82 30 78 52 L76 62 Q78 40 50 30 Q22 40 24 62 Z" fill="url(#c-hair)" />

        {/* Neck */}
        <path d="M40 70 L40 84 Q50 86 60 84 L60 70" fill="url(#c-skin)" />
        <path d="M42 74 L42 82 Q50 84 58 82 L58 74" fill="url(#c-shadow)" />

        {/* Shoulders - dark blazer */}
        <path d="M10 100 L26 82 Q50 76 74 82 L90 100 Z" fill="url(#c-blazer)" />
        <path d="M26 82 L38 100" stroke="#3A3A3A" strokeWidth="1" fill="none" />
        <path d="M74 82 L62 100" stroke="#3A3A3A" strokeWidth="1" fill="none" />

        {/* Blouse with neckline */}
        <path d="M38 82 Q50 92 62 82 L60 100 L40 100 Z" fill="#F5F0EB" />

        {/* Necklace */}
        <path d="M38 82 Q50 88 62 82" fill="none" stroke="#D4A858" strokeWidth="1.5" />
        <ellipse cx="50" cy="88" rx="4" ry="3" fill="#D4A858" />
        <ellipse cx="50" cy="88" rx="2" ry="1.5" fill="#F0D080" opacity="0.5" />

        {/* Ears */}
        <ellipse cx="26" cy="52" rx="4" ry="7" fill="url(#c-skin)" />
        <ellipse cx="74" cy="52" rx="4" ry="7" fill="url(#c-skin)" />
        <path d="M24 48 Q26 52 25 56 Q24 58 26 60" stroke="#D4A898" strokeWidth="0.7" fill="none" />
        <path d="M76 48 Q74 52 75 56 Q76 58 74 60" stroke="#D4A898" strokeWidth="0.7" fill="none" />

        {/* Pearl earrings */}
        <circle cx="26" cy="60" r="3" fill="#F8F4F0" />
        <circle cx="25" cy="59" r="1" fill="#FFFFFF" opacity="0.8" />
        <circle cx="74" cy="60" r="3" fill="#F8F4F0" />
        <circle cx="73" cy="59" r="1" fill="#FFFFFF" opacity="0.8" />

        {/* Face */}
        <ellipse cx="50" cy="48" rx="24" ry="28" fill="url(#c-skin)" />
        <ellipse cx="50" cy="49" rx="23" ry="26" fill="url(#c-skinDepth)" />
        <path d="M28 52 Q30 66 42 74" fill="url(#c-shadow)" opacity="0.2" />
        <path d="M72 52 Q70 66 58 74" fill="url(#c-shadow)" opacity="0.2" />
        <ellipse cx="32" cy="58" rx="7" ry="5" fill="url(#c-cheek)" />
        <ellipse cx="68" cy="58" rx="7" ry="5" fill="url(#c-cheek)" />

        {/* Hair front */}
        <path d="M26 48 Q24 26 50 18 Q76 26 74 48 Q70 34 50 28 Q30 34 26 48" fill="url(#c-hair)" />
        <path d="M30 44 Q32 28 50 22 Q68 28 70 44 Q64 34 50 28 Q36 34 30 44" fill="url(#c-hairMid)" />
        <path d="M34 40 Q38 30 50 26 Q62 30 66 40 Q58 32 50 30 Q42 32 34 40" fill="url(#c-hairShine)" />

        {/* Loose hair strands */}
        <path d="M28 46 Q26 52 28 60" stroke="#5A3A28" strokeWidth="1.5" fill="none" />
        <path d="M72 46 Q74 52 72 60" stroke="#5A3A28" strokeWidth="1.5" fill="none" />

        {/* Eyebrows */}
        <path d="M34 42 C37 39.5 42 39.5 46 42" stroke="#4A3020" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M54 42 C58 39.5 63 39.5 66 42" stroke="#4A3020" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Eyes */}
        <ellipse cx="40" cy="50" rx="5.5" ry="4" fill="#FFFFFF" />
        <ellipse cx="60" cy="50" rx="5.5" ry="4" fill="#FFFFFF" />
        <ellipse cx="40" cy="51" rx="5" ry="3.2" fill="#F8F8F8" />
        <ellipse cx="60" cy="51" rx="5" ry="3.2" fill="#F8F8F8" />
        <circle cx="40" cy="50.5" r="3.2" fill="url(#c-irisOuter)" />
        <circle cx="60" cy="50.5" r="3.2" fill="url(#c-irisOuter)" />
        <circle cx="40" cy="50.3" r="2.4" fill="url(#c-irisInner)" />
        <circle cx="60" cy="50.3" r="2.4" fill="url(#c-irisInner)" />
        <circle cx="40" cy="50.3" r="1.3" fill="#0A0A0A" />
        <circle cx="60" cy="50.3" r="1.3" fill="#0A0A0A" />
        <circle cx="38.5" cy="49.2" r="1.1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="58.5" cy="49.2" r="1.1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="41" cy="51.5" r="0.5" fill="#FFFFFF" opacity="0.4" />
        <circle cx="61" cy="51.5" r="0.5" fill="#FFFFFF" opacity="0.4" />

        {/* Eyelashes hint */}
        <path d="M35 48 Q40 46.5 45 48" stroke="#3A2518" strokeWidth="0.5" fill="none" />
        <path d="M55 48 Q60 46.5 65 48" stroke="#3A2518" strokeWidth="0.5" fill="none" />

        {/* Nose */}
        <path d="M50 50 Q49 56 48 60" stroke="#D4B098" strokeWidth="0.5" fill="none" opacity="0.4" />
        <path d="M47 62 Q50 65 53 62" stroke="#C4987E" strokeWidth="1" fill="none" strokeLinecap="round" />
        <ellipse cx="50" cy="63" rx="4" ry="2" fill="#D4B098" opacity="0.1" />
        <path d="M50 52 L50 57" stroke="#FAF0E8" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Lips - warm smile */}
        <path d="M43 68 Q47 66.5 50 67 Q53 66.5 57 68" fill="url(#c-lip)" />
        <path d="M43 68 Q50 73 57 68" fill="url(#c-lip)" />
        <path d="M44 68 Q50 68.5 56 68" stroke="#8A5858" strokeWidth="0.4" fill="none" />
        <path d="M46 70 Q50 71 54 70" stroke="#D09888" strokeWidth="0.5" fill="none" opacity="0.5" />

        {/* Chin */}
        <ellipse cx="50" cy="75" rx="5" ry="2.5" fill="#FAF0E8" opacity="0.1" />
    </svg>
);

// Legal Advisor - Distinguished male, gray temples, suit and tie
const LegalAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="l-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F2D8C8" />
                <stop offset="100%" stopColor="#E0BCA8" />
            </linearGradient>
            <radialGradient id="l-skinDepth" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#F5E0D4" />
                <stop offset="70%" stopColor="#E5C8B8" />
                <stop offset="100%" stopColor="#D4A894" />
            </radialGradient>
            <linearGradient id="l-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B89888" stopOpacity="0" />
                <stop offset="100%" stopColor="#B89888" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="l-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A4A4A" />
                <stop offset="50%" stopColor="#3A3A3A" />
                <stop offset="100%" stopColor="#2A2A2A" />
            </linearGradient>
            <linearGradient id="l-hairGray" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#808080" />
                <stop offset="100%" stopColor="#606060" />
            </linearGradient>
            <radialGradient id="l-irisOuter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5A6A7A" />
                <stop offset="100%" stopColor="#3A4A5A" />
            </radialGradient>
            <radialGradient id="l-irisInner" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#7A8A9A" />
                <stop offset="50%" stopColor="#5A6A7A" />
                <stop offset="100%" stopColor="#3A4A5A" />
            </radialGradient>
            <linearGradient id="l-suit" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A3540" />
                <stop offset="100%" stopColor="#1A2530" />
            </linearGradient>
            <linearGradient id="l-tie" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B2020" />
                <stop offset="100%" stopColor="#6B1515" />
            </linearGradient>
            <linearGradient id="l-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B08880" />
                <stop offset="100%" stopColor="#987068" />
            </linearGradient>
        </defs>

        {/* Neck */}
        <path d="M40 68 L40 82 Q50 84 60 82 L60 68" fill="url(#l-skin)" />
        <path d="M42 72 L42 80 Q50 82 58 80 L58 72" fill="url(#l-shadow)" />

        {/* Suit jacket */}
        <path d="M8 100 L24 80 Q50 74 76 80 L92 100 Z" fill="url(#l-suit)" />
        <path d="M24 80 L40 100" stroke="#3A4550" strokeWidth="1.5" fill="none" />
        <path d="M76 80 L60 100" stroke="#3A4550" strokeWidth="1.5" fill="none" />

        {/* Shirt */}
        <path d="M40 80 L50 92 L60 80" fill="#FFFFFF" />
        <path d="M42 80 L50 90 L58 80" fill="#F5F5F5" />

        {/* Tie */}
        <path d="M48 82 L50 100 L52 82 L50 86 Z" fill="url(#l-tie)" />
        <path d="M49 84 L50 86 L51 84" fill="#9B2525" opacity="0.5" />

        {/* Ears */}
        <ellipse cx="25" cy="50" rx="5" ry="8" fill="url(#l-skin)" />
        <ellipse cx="75" cy="50" rx="5" ry="8" fill="url(#l-skin)" />
        <path d="M23 46 Q25 50 24 54 Q23 57 25 59" stroke="#D0A898" strokeWidth="0.7" fill="none" />
        <path d="M77 46 Q75 50 76 54 Q77 57 75 59" stroke="#D0A898" strokeWidth="0.7" fill="none" />

        {/* Face */}
        <path d="M26 46 Q26 22 50 18 Q74 22 74 46 L74 54 Q74 74 50 76 Q26 74 26 54 Z" fill="url(#l-skin)" />
        <path d="M28 47 Q28 25 50 21 Q72 25 72 47 L72 53 Q72 71 50 73 Q28 71 28 53 Z" fill="url(#l-skinDepth)" />
        <path d="M30 52 Q32 64 44 72" fill="url(#l-shadow)" opacity="0.2" />
        <path d="M70 52 Q68 64 56 72" fill="url(#l-shadow)" opacity="0.2" />

        {/* Hair - distinguished with gray temples */}
        <path d="M26 44 Q26 20 50 16 Q74 20 74 44 Q70 30 50 24 Q30 30 26 44" fill="url(#l-hair)" />
        <path d="M30 40 Q32 24 50 20 Q68 24 70 40 Q64 30 50 26 Q36 30 30 40" fill="#4A4A4A" />
        {/* Gray temples */}
        <path d="M26 44 Q26 36 32 30 L30 42 Z" fill="url(#l-hairGray)" />
        <path d="M74 44 Q74 36 68 30 L70 42 Z" fill="url(#l-hairGray)" />

        {/* Eyebrows - distinguished */}
        <path d="M32 40 L46 38" stroke="#3A3A3A" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M54 38 L68 40" stroke="#3A3A3A" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Eyes */}
        <ellipse cx="39" cy="48" rx="5" ry="3.5" fill="#FFFFFF" />
        <ellipse cx="61" cy="48" rx="5" ry="3.5" fill="#FFFFFF" />
        <ellipse cx="39" cy="49" rx="4.5" ry="2.8" fill="#F8F8F8" />
        <ellipse cx="61" cy="49" rx="4.5" ry="2.8" fill="#F8F8F8" />
        <circle cx="39" cy="48.5" r="2.8" fill="url(#l-irisOuter)" />
        <circle cx="61" cy="48.5" r="2.8" fill="url(#l-irisOuter)" />
        <circle cx="39" cy="48.3" r="2" fill="url(#l-irisInner)" />
        <circle cx="61" cy="48.3" r="2" fill="url(#l-irisInner)" />
        <circle cx="39" cy="48.3" r="1.1" fill="#0A0A0A" />
        <circle cx="61" cy="48.3" r="1.1" fill="#0A0A0A" />
        <circle cx="37.5" cy="47.3" r="0.9" fill="#FFFFFF" opacity="0.95" />
        <circle cx="59.5" cy="47.3" r="0.9" fill="#FFFFFF" opacity="0.95" />

        {/* Subtle eye lines - age appropriate */}
        <path d="M33 46 Q39 44.5 45 46" stroke="#C0A090" strokeWidth="0.5" fill="none" />
        <path d="M55 46 Q61 44.5 67 46" stroke="#C0A090" strokeWidth="0.5" fill="none" />

        {/* Nose */}
        <path d="M50 48 L48 58 L52 58 Z" fill="#D8B8A0" opacity="0.2" />
        <path d="M47 60 Q50 63 53 60" stroke="#C49880" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M50 50 L50 56" stroke="#F5E8E0" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Lips - slight professional smile */}
        <path d="M44 68 Q50 66 56 68" fill="url(#l-lip)" />
        <path d="M44 68 Q50 72 56 68" fill="url(#l-lip)" />
        <path d="M45 68 Q50 68.5 55 68" stroke="#886060" strokeWidth="0.4" fill="none" />

        {/* Subtle expression lines */}
        <path d="M42 66 Q43 68 43 70" stroke="#D0B0A0" strokeWidth="0.4" fill="none" opacity="0.3" />
        <path d="M58 66 Q57 68 57 70" stroke="#D0B0A0" strokeWidth="0.4" fill="none" opacity="0.3" />
    </svg>
);

// HR Partner - Warm female, curly auburn hair, friendly approachable
const HRAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="h-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F8E4D6" />
                <stop offset="100%" stopColor="#E8C8B4" />
            </linearGradient>
            <radialGradient id="h-skinDepth" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#FAEEE4" />
                <stop offset="70%" stopColor="#ECD4C4" />
                <stop offset="100%" stopColor="#DCBAA4" />
            </radialGradient>
            <radialGradient id="h-cheek" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E8A090" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#E8A090" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="h-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C8A090" stopOpacity="0" />
                <stop offset="100%" stopColor="#C8A090" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="h-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A05030" />
                <stop offset="40%" stopColor="#8B4028" />
                <stop offset="100%" stopColor="#6B3020" />
            </linearGradient>
            <linearGradient id="h-hairMid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C06840" />
                <stop offset="100%" stopColor="#8B4028" />
            </linearGradient>
            <linearGradient id="h-hairShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D08050" stopOpacity="0" />
                <stop offset="50%" stopColor="#E09060" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#D08050" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="h-irisOuter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7A6050" />
                <stop offset="100%" stopColor="#5A4030" />
            </radialGradient>
            <radialGradient id="h-irisInner" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#9A7860" />
                <stop offset="50%" stopColor="#7A6050" />
                <stop offset="100%" stopColor="#5A4030" />
            </radialGradient>
            <linearGradient id="h-top" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4AA0A8" />
                <stop offset="100%" stopColor="#3A8088" />
            </linearGradient>
            <linearGradient id="h-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D09088" />
                <stop offset="100%" stopColor="#B07068" />
            </linearGradient>
        </defs>

        {/* Curly hair back - voluminous */}
        <ellipse cx="50" cy="40" rx="38" ry="34" fill="url(#h-hair)" />
        <circle cx="18" cy="48" r="10" fill="url(#h-hairMid)" />
        <circle cx="82" cy="48" r="10" fill="url(#h-hairMid)" />
        <circle cx="22" cy="60" r="8" fill="url(#h-hair)" />
        <circle cx="78" cy="60" r="8" fill="url(#h-hair)" />
        <ellipse cx="50" cy="18" rx="18" ry="10" fill="url(#h-hairMid)" />

        {/* Neck */}
        <path d="M40 70 L40 84 Q50 86 60 84 L60 70" fill="url(#h-skin)" />
        <path d="M42 74 L42 82 Q50 84 58 82 L58 74" fill="url(#h-shadow)" />

        {/* Shoulders - casual professional top */}
        <path d="M12 100 L28 82 Q50 76 72 82 L88 100 Z" fill="url(#h-top)" />

        {/* Scoop neckline */}
        <ellipse cx="50" cy="86" rx="12" ry="6" fill="url(#h-skin)" />

        {/* Face */}
        <ellipse cx="50" cy="50" rx="24" ry="28" fill="url(#h-skin)" />
        <ellipse cx="50" cy="51" rx="23" ry="26" fill="url(#h-skinDepth)" />
        <path d="M28 54 Q30 66 42 74" fill="url(#h-shadow)" opacity="0.2" />
        <path d="M72 54 Q70 66 58 74" fill="url(#h-shadow)" opacity="0.2" />
        <ellipse cx="32" cy="60" rx="8" ry="5" fill="url(#h-cheek)" />
        <ellipse cx="68" cy="60" rx="8" ry="5" fill="url(#h-cheek)" />

        {/* Hair front - curly texture */}
        <path d="M26 52 Q22 28 50 20 Q78 28 74 52 Q70 36 50 30 Q30 36 26 52" fill="url(#h-hair)" />
        <path d="M30 48 Q28 32 50 24 Q72 32 70 48 Q66 36 50 30 Q34 36 30 48" fill="url(#h-hairMid)" />
        <path d="M34 44 Q36 32 50 28 Q64 32 66 44" fill="url(#h-hairShine)" />

        {/* Curl details */}
        <circle cx="28" cy="42" r="6" fill="url(#h-hair)" />
        <circle cx="72" cy="42" r="6" fill="url(#h-hair)" />
        <circle cx="32" cy="36" r="4" fill="url(#h-hairMid)" />
        <circle cx="68" cy="36" r="4" fill="url(#h-hairMid)" />
        <circle cx="40" cy="26" r="5" fill="url(#h-hair)" />
        <circle cx="60" cy="26" r="5" fill="url(#h-hair)" />

        {/* Eyebrows - friendly arch */}
        <path d="M34 44 C38 41 42 41 46 44" stroke="#6B4030" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M54 44 C58 41 62 41 66 44" stroke="#6B4030" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Eyes - warm and friendly */}
        <ellipse cx="40" cy="52" rx="5.5" ry="4.5" fill="#FFFFFF" />
        <ellipse cx="60" cy="52" rx="5.5" ry="4.5" fill="#FFFFFF" />
        <ellipse cx="40" cy="53" rx="5" ry="3.5" fill="#F8F8F8" />
        <ellipse cx="60" cy="53" rx="5" ry="3.5" fill="#F8F8F8" />
        <circle cx="40" cy="52.5" r="3.5" fill="url(#h-irisOuter)" />
        <circle cx="60" cy="52.5" r="3.5" fill="url(#h-irisOuter)" />
        <circle cx="40" cy="52.3" r="2.5" fill="url(#h-irisInner)" />
        <circle cx="60" cy="52.3" r="2.5" fill="url(#h-irisInner)" />
        <circle cx="40" cy="52.3" r="1.4" fill="#0A0A0A" />
        <circle cx="60" cy="52.3" r="1.4" fill="#0A0A0A" />
        <circle cx="38.3" cy="51" r="1.2" fill="#FFFFFF" opacity="0.95" />
        <circle cx="58.3" cy="51" r="1.2" fill="#FFFFFF" opacity="0.95" />
        <circle cx="41.2" cy="53.5" r="0.5" fill="#FFFFFF" opacity="0.4" />
        <circle cx="61.2" cy="53.5" r="0.5" fill="#FFFFFF" opacity="0.4" />

        {/* Nose */}
        <path d="M50 52 Q49 58 48 62" stroke="#D8B8A0" strokeWidth="0.5" fill="none" opacity="0.4" />
        <path d="M47 64 Q50 67 53 64" stroke="#C8A088" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M50 54 L50 59" stroke="#FAF0E8" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Big warm smile */}
        <path d="M40 70 Q50 78 60 70" fill="url(#h-lip)" />
        <path d="M42 70 Q50 74 58 70" fill="#FFFFFF" />
        <path d="M42 71 L58 71" stroke="#F0F0F0" strokeWidth="0.3" fill="none" />
        <path d="M41 70 Q50 69 59 70" fill="url(#h-lip)" />
    </svg>
);

// Marketing Partner - Stylish female, dark hair, trendy professional
const MarketingAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="m-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5DDD0" />
                <stop offset="100%" stopColor="#E2C0AC" />
            </linearGradient>
            <radialGradient id="m-skinDepth" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#F8E5DA" />
                <stop offset="70%" stopColor="#E8CABC" />
                <stop offset="100%" stopColor="#D8B49C" />
            </radialGradient>
            <radialGradient id="m-cheek" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E89888" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#E89888" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="m-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C09080" stopOpacity="0" />
                <stop offset="100%" stopColor="#C09080" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="m-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A1A14" />
                <stop offset="50%" stopColor="#1A1210" />
                <stop offset="100%" stopColor="#0A0808" />
            </linearGradient>
            <linearGradient id="m-hairMid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3A2A20" />
                <stop offset="100%" stopColor="#1A1210" />
            </linearGradient>
            <linearGradient id="m-hairShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A3A30" stopOpacity="0" />
                <stop offset="50%" stopColor="#5A4A40" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#4A3A30" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="m-irisOuter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5A4A40" />
                <stop offset="100%" stopColor="#3A2A20" />
            </radialGradient>
            <radialGradient id="m-irisInner" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#7A6A58" />
                <stop offset="50%" stopColor="#5A4A40" />
                <stop offset="100%" stopColor="#3A2A20" />
            </radialGradient>
            <linearGradient id="m-top" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1A1A1A" />
                <stop offset="100%" stopColor="#0A0A0A" />
            </linearGradient>
            <linearGradient id="m-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C07068" />
                <stop offset="100%" stopColor="#A05048" />
            </linearGradient>
        </defs>

        {/* Hair back - long and stylish */}
        <path d="M16 54 Q10 26 40 14 Q50 10 60 14 Q90 26 84 54 Q86 78 70 88 L68 60 Q74 36 50 26 Q26 36 32 60 L30 88 Q14 78 16 54" fill="url(#m-hair)" />
        <path d="M20 56 Q16 32 42 18 Q50 15 58 18 Q84 32 80 56" fill="url(#m-hairMid)" opacity="0.5" />

        {/* Neck */}
        <path d="M40 72 L40 86 Q50 88 60 86 L60 72" fill="url(#m-skin)" />
        <path d="M42 76 L42 84 Q50 86 58 84 L58 76" fill="url(#m-shadow)" />

        {/* Shoulders - stylish black top */}
        <path d="M14 100 L30 84 Q50 78 70 84 L86 100 Z" fill="url(#m-top)" />

        {/* V-neckline */}
        <path d="M40 84 L50 96 L60 84" fill="url(#m-skin)" />

        {/* Ears */}
        <ellipse cx="28" cy="54" rx="4" ry="7" fill="url(#m-skin)" />
        <ellipse cx="72" cy="54" rx="4" ry="7" fill="url(#m-skin)" />
        <path d="M26 50 Q28 54 27 58" stroke="#D4A898" strokeWidth="0.7" fill="none" />
        <path d="M74 50 Q72 54 73 58" stroke="#D4A898" strokeWidth="0.7" fill="none" />

        {/* Statement earrings */}
        <circle cx="28" cy="62" r="4" fill="#E91E63" />
        <circle cx="27" cy="61" r="1.2" fill="#F48FB1" opacity="0.6" />
        <circle cx="72" cy="62" r="4" fill="#E91E63" />
        <circle cx="71" cy="61" r="1.2" fill="#F48FB1" opacity="0.6" />

        {/* Face */}
        <ellipse cx="50" cy="50" rx="24" ry="28" fill="url(#m-skin)" />
        <ellipse cx="50" cy="51" rx="23" ry="26" fill="url(#m-skinDepth)" />
        <path d="M28 54 Q30 66 42 74" fill="url(#m-shadow)" opacity="0.2" />
        <path d="M72 54 Q70 66 58 74" fill="url(#m-shadow)" opacity="0.2" />
        <ellipse cx="32" cy="60" rx="6" ry="4" fill="url(#m-cheek)" />
        <ellipse cx="68" cy="60" rx="6" ry="4" fill="url(#m-cheek)" />

        {/* Hair front - side swept with volume */}
        <path d="M26 52 Q22 24 50 16 Q78 24 74 52 Q70 34 50 26 Q30 34 26 52" fill="url(#m-hair)" />
        <path d="M30 48 Q28 28 50 20 Q72 28 70 48 Q66 34 50 28 Q34 34 30 48" fill="url(#m-hairMid)" />
        <path d="M34 44 Q36 30 50 24 Q64 30 66 44" fill="url(#m-hairShine)" />

        {/* Side swept bangs */}
        <path d="M26 50 Q34 26 56 24 Q42 38 34 52 Z" fill="url(#m-hair)" />
        <path d="M28 48 Q36 28 52 26 Q40 38 34 50 Z" fill="url(#m-hairMid)" opacity="0.7" />

        {/* Eyebrows - styled/groomed */}
        <path d="M34 44 C38 41.5 43 41.5 47 44" stroke="#1A1210" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M53 44 C57 41.5 62 41.5 66 44" stroke="#1A1210" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Eyes with subtle makeup */}
        <ellipse cx="40" cy="52" rx="5.5" ry="4" fill="#FFFFFF" />
        <ellipse cx="60" cy="52" rx="5.5" ry="4" fill="#FFFFFF" />
        <ellipse cx="40" cy="53" rx="5" ry="3.2" fill="#F8F8F8" />
        <ellipse cx="60" cy="53" rx="5" ry="3.2" fill="#F8F8F8" />
        <circle cx="40" cy="52.5" r="3.2" fill="url(#m-irisOuter)" />
        <circle cx="60" cy="52.5" r="3.2" fill="url(#m-irisOuter)" />
        <circle cx="40" cy="52.3" r="2.4" fill="url(#m-irisInner)" />
        <circle cx="60" cy="52.3" r="2.4" fill="url(#m-irisInner)" />
        <circle cx="40" cy="52.3" r="1.3" fill="#0A0A0A" />
        <circle cx="60" cy="52.3" r="1.3" fill="#0A0A0A" />
        <circle cx="38.5" cy="51.2" r="1.1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="58.5" cy="51.2" r="1.1" fill="#FFFFFF" opacity="0.95" />

        {/* Subtle eyeliner */}
        <path d="M35 51 Q34 50 35 49" stroke="#1A1A1A" strokeWidth="0.8" fill="none" />
        <path d="M65 51 Q66 50 65 49" stroke="#1A1A1A" strokeWidth="0.8" fill="none" />

        {/* Nose */}
        <path d="M50 52 Q49 58 48 62" stroke="#D4B098" strokeWidth="0.5" fill="none" opacity="0.4" />
        <path d="M47 64 Q50 67 53 64" stroke="#C4987E" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M50 54 L50 59" stroke="#FAF0E8" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Lips - defined color */}
        <path d="M43 70 Q47 68 50 68.5 Q53 68 57 70" fill="url(#m-lip)" />
        <path d="M43 70 Q50 74.5 57 70" fill="url(#m-lip)" />
        <path d="M44 70 Q50 70.5 56 70" stroke="#8A5050" strokeWidth="0.4" fill="none" />
        <path d="M46 72 Q50 72.5 54 72" stroke="#D09090" strokeWidth="0.5" fill="none" opacity="0.5" />
    </svg>
);

// Sales Partner - Confident male, styled hair, sharp suit
const SalesAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="s-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F4DCD0" />
                <stop offset="100%" stopColor="#E0BCA8" />
            </linearGradient>
            <radialGradient id="s-skinDepth" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#F8E4D8" />
                <stop offset="70%" stopColor="#E8C8B8" />
                <stop offset="100%" stopColor="#D8A898" />
            </radialGradient>
            <linearGradient id="s-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B89888" stopOpacity="0" />
                <stop offset="100%" stopColor="#B89888" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="s-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A2420" />
                <stop offset="50%" stopColor="#1A1814" />
                <stop offset="100%" stopColor="#0A0808" />
            </linearGradient>
            <linearGradient id="s-hairMid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3A3430" />
                <stop offset="100%" stopColor="#1A1814" />
            </linearGradient>
            <linearGradient id="s-hairShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A4440" stopOpacity="0" />
                <stop offset="50%" stopColor="#5A5450" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4A4440" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="s-irisOuter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#5A7080" />
                <stop offset="100%" stopColor="#3A5060" />
            </radialGradient>
            <radialGradient id="s-irisInner" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#7A9098" />
                <stop offset="50%" stopColor="#5A7080" />
                <stop offset="100%" stopColor="#3A5060" />
            </radialGradient>
            <linearGradient id="s-suit" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1A2028" />
                <stop offset="100%" stopColor="#0A1018" />
            </linearGradient>
            <linearGradient id="s-tie" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C04030" />
                <stop offset="100%" stopColor="#A03020" />
            </linearGradient>
            <linearGradient id="s-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B8908A" />
                <stop offset="100%" stopColor="#987068" />
            </linearGradient>
        </defs>

        {/* Neck */}
        <path d="M40 68 L40 82 Q50 84 60 82 L60 68" fill="url(#s-skin)" />
        <path d="M42 72 L42 80 Q50 82 58 80 L58 72" fill="url(#s-shadow)" />

        {/* Sharp suit */}
        <path d="M6 100 L22 80 Q50 74 78 80 L94 100 Z" fill="url(#s-suit)" />
        <path d="M22 80 L38 100" stroke="#2A3038" strokeWidth="1.5" fill="none" />
        <path d="M78 80 L62 100" stroke="#2A3038" strokeWidth="1.5" fill="none" />

        {/* Shirt */}
        <path d="M40 80 L50 92 L60 80" fill="#FFFFFF" />
        <path d="M42 80 L50 90 L58 80" fill="#F5F5F5" />

        {/* Tie */}
        <path d="M48 82 L50 100 L52 82 L50 86 Z" fill="url(#s-tie)" />
        <path d="M49 84 L50 86 L51 84" fill="#D05040" opacity="0.5" />

        {/* Pocket square */}
        <path d="M74 86 L78 83 L80 88" fill="#FFFFFF" opacity="0.8" />

        {/* Ears */}
        <ellipse cx="25" cy="50" rx="5" ry="8" fill="url(#s-skin)" />
        <ellipse cx="75" cy="50" rx="5" ry="8" fill="url(#s-skin)" />
        <path d="M23 46 Q25 50 24 54 Q23 57 25 59" stroke="#D0A898" strokeWidth="0.7" fill="none" />
        <path d="M77 46 Q75 50 76 54 Q77 57 75 59" stroke="#D0A898" strokeWidth="0.7" fill="none" />

        {/* Face - strong jaw */}
        <path d="M26 44 Q26 20 50 16 Q74 20 74 44 L74 52 Q74 72 50 74 Q26 72 26 52 Z" fill="url(#s-skin)" />
        <path d="M28 45 Q28 23 50 19 Q72 23 72 45 L72 51 Q72 69 50 71 Q28 69 28 51 Z" fill="url(#s-skinDepth)" />
        <path d="M30 50 Q32 62 44 70" fill="url(#s-shadow)" opacity="0.2" />
        <path d="M70 50 Q68 62 56 70" fill="url(#s-shadow)" opacity="0.2" />

        {/* Hair - styled and professional */}
        <path d="M26 42 Q26 18 50 14 Q74 18 74 42 Q70 28 50 22 Q30 28 26 42" fill="url(#s-hair)" />
        <path d="M30 38 Q32 22 50 18 Q68 22 70 38 Q64 28 50 24 Q36 28 30 38" fill="url(#s-hairMid)" />
        <path d="M34 34 Q38 24 50 22 Q62 24 66 34" fill="url(#s-hairShine)" />

        {/* Eyebrows - confident */}
        <path d="M32 40 L46 38" stroke="#1A1814" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M54 38 L68 40" stroke="#1A1814" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Eyes - confident and engaging */}
        <ellipse cx="39" cy="48" rx="5.5" ry="4" fill="#FFFFFF" />
        <ellipse cx="61" cy="48" rx="5.5" ry="4" fill="#FFFFFF" />
        <ellipse cx="39" cy="49" rx="5" ry="3.2" fill="#F8F8F8" />
        <ellipse cx="61" cy="49" rx="5" ry="3.2" fill="#F8F8F8" />
        <circle cx="39" cy="48.5" r="3.2" fill="url(#s-irisOuter)" />
        <circle cx="61" cy="48.5" r="3.2" fill="url(#s-irisOuter)" />
        <circle cx="39" cy="48.3" r="2.4" fill="url(#s-irisInner)" />
        <circle cx="61" cy="48.3" r="2.4" fill="url(#s-irisInner)" />
        <circle cx="39" cy="48.3" r="1.3" fill="#0A0A0A" />
        <circle cx="61" cy="48.3" r="1.3" fill="#0A0A0A" />
        <circle cx="37.5" cy="47.2" r="1.1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="59.5" cy="47.2" r="1.1" fill="#FFFFFF" opacity="0.95" />
        <circle cx="40" cy="49.5" r="0.5" fill="#FFFFFF" opacity="0.4" />
        <circle cx="62" cy="49.5" r="0.5" fill="#FFFFFF" opacity="0.4" />

        {/* Nose */}
        <path d="M50 48 L48 58 L52 58 Z" fill="#D8B8A0" opacity="0.15" />
        <path d="M47 60 Q50 63 53 60" stroke="#C49880" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M50 50 L50 56" stroke="#F5E8E0" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Confident smile with teeth */}
        <path d="M42 66 Q50 74 58 66" fill="url(#s-lip)" />
        <path d="M44 66 Q50 70 56 66" fill="#FFFFFF" />
        <path d="M44 67 L56 67" stroke="#F0F0F0" strokeWidth="0.3" fill="none" />
        <path d="M42 66 Q50 65 58 66" fill="url(#s-lip)" />
    </svg>
);

// Knowledge Base - Thoughtful, round glasses, medium hair
const KnowledgeAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="k-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5DDD0" />
                <stop offset="100%" stopColor="#E2C0AC" />
            </linearGradient>
            <radialGradient id="k-skinDepth" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#F8E5DA" />
                <stop offset="70%" stopColor="#E8CABC" />
                <stop offset="100%" stopColor="#D8B49C" />
            </radialGradient>
            <linearGradient id="k-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C09888" stopOpacity="0" />
                <stop offset="100%" stopColor="#C09888" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="k-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A3C32" />
                <stop offset="50%" stopColor="#3A2E26" />
                <stop offset="100%" stopColor="#2A201A" />
            </linearGradient>
            <linearGradient id="k-hairMid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5A4A3E" />
                <stop offset="100%" stopColor="#3A2E26" />
            </linearGradient>
            <linearGradient id="k-hairShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6A5A4E" stopOpacity="0" />
                <stop offset="50%" stopColor="#7A6A5E" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#6A5A4E" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="k-irisOuter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6A8A6A" />
                <stop offset="100%" stopColor="#4A6A4A" />
            </radialGradient>
            <radialGradient id="k-irisInner" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#8AAA8A" />
                <stop offset="50%" stopColor="#6A8A6A" />
                <stop offset="100%" stopColor="#4A6A4A" />
            </radialGradient>
            <linearGradient id="k-top" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5A80A0" />
                <stop offset="100%" stopColor="#4A6888" />
            </linearGradient>
            <linearGradient id="k-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#B89090" />
                <stop offset="100%" stopColor="#987878" />
            </linearGradient>
        </defs>

        {/* Hair back - medium length */}
        <path d="M22 52 Q18 26 45 16 Q55 14 65 18 Q82 28 78 52 L76 62 Q78 38 50 28 Q22 38 24 62 Z" fill="url(#k-hair)" />

        {/* Neck */}
        <path d="M42 70 L42 84 Q50 86 58 84 L58 70" fill="url(#k-skin)" />
        <path d="M44 74 L44 82 Q50 84 56 82 L56 74" fill="url(#k-shadow)" />

        {/* Casual top */}
        <path d="M14 100 L28 82 Q50 76 72 82 L86 100 Z" fill="url(#k-top)" />

        {/* Crew neck */}
        <ellipse cx="50" cy="84" rx="10" ry="5" fill="url(#k-skin)" />

        {/* Ears */}
        <ellipse cx="26" cy="52" rx="4" ry="7" fill="url(#k-skin)" />
        <ellipse cx="74" cy="52" rx="4" ry="7" fill="url(#k-skin)" />
        <path d="M24 48 Q26 52 25 56" stroke="#D4A898" strokeWidth="0.7" fill="none" />
        <path d="M76 48 Q74 52 75 56" stroke="#D4A898" strokeWidth="0.7" fill="none" />

        {/* Face */}
        <ellipse cx="50" cy="48" rx="24" ry="28" fill="url(#k-skin)" />
        <ellipse cx="50" cy="49" rx="23" ry="26" fill="url(#k-skinDepth)" />
        <path d="M28 52 Q30 64 42 72" fill="url(#k-shadow)" opacity="0.2" />
        <path d="M72 52 Q70 64 58 72" fill="url(#k-shadow)" opacity="0.2" />

        {/* Hair front */}
        <path d="M26 50 Q24 26 50 18 Q76 26 74 50 Q70 34 50 28 Q30 34 26 50" fill="url(#k-hair)" />
        <path d="M30 46 Q30 30 50 22 Q70 30 70 46 Q66 34 50 28 Q34 34 30 46" fill="url(#k-hairMid)" />
        <path d="M34 42 Q38 30 50 26 Q62 30 66 42" fill="url(#k-hairShine)" />

        {/* Eyebrows */}
        <path d="M32 44 C36 42 42 42 46 44.5" stroke="#3A2E26" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M54 44.5 C58 42 64 42 68 44" stroke="#3A2E26" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Round glasses */}
        <circle cx="38" cy="52" r="10" fill="rgba(255,255,255,0.05)" stroke="#3A3A3A" strokeWidth="2" />
        <circle cx="62" cy="52" r="10" fill="rgba(255,255,255,0.05)" stroke="#3A3A3A" strokeWidth="2" />
        <path d="M48 52 L52 52" stroke="#3A3A3A" strokeWidth="2" />
        <path d="M28 50 L26 48" stroke="#3A3A3A" strokeWidth="2" />
        <path d="M72 50 L74 48" stroke="#3A3A3A" strokeWidth="2" />

        {/* Eyes */}
        <ellipse cx="38" cy="52" rx="4.5" ry="3.5" fill="#FFFFFF" />
        <ellipse cx="62" cy="52" rx="4.5" ry="3.5" fill="#FFFFFF" />
        <ellipse cx="38" cy="53" rx="4" ry="2.8" fill="#F8F8F8" />
        <ellipse cx="62" cy="53" rx="4" ry="2.8" fill="#F8F8F8" />
        <circle cx="38" cy="52.5" r="2.8" fill="url(#k-irisOuter)" />
        <circle cx="62" cy="52.5" r="2.8" fill="url(#k-irisOuter)" />
        <circle cx="38" cy="52.3" r="2" fill="url(#k-irisInner)" />
        <circle cx="62" cy="52.3" r="2" fill="url(#k-irisInner)" />
        <circle cx="38" cy="52.3" r="1.1" fill="#0A0A0A" />
        <circle cx="62" cy="52.3" r="1.1" fill="#0A0A0A" />
        <circle cx="36.5" cy="51.2" r="0.9" fill="#FFFFFF" opacity="0.95" />
        <circle cx="60.5" cy="51.2" r="0.9" fill="#FFFFFF" opacity="0.95" />

        {/* Nose */}
        <path d="M50 52 Q49 58 48 62" stroke="#D4B098" strokeWidth="0.5" fill="none" opacity="0.4" />
        <path d="M47 64 Q50 67 53 64" stroke="#C4987E" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M50 54 L50 59" stroke="#FAF0E8" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Gentle smile */}
        <path d="M44 70 Q50 74 56 70" stroke="url(#k-lip)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
);

// Content Engine - Creative female, colorful streak, expressive
const ContentAvatar = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
            <linearGradient id="ct-skin" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F7E1D3" />
                <stop offset="100%" stopColor="#E5C4B0" />
            </linearGradient>
            <radialGradient id="ct-skinDepth" cx="40%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#FAEADF" />
                <stop offset="70%" stopColor="#EACED0" />
                <stop offset="100%" stopColor="#DEBA9E" />
            </radialGradient>
            <radialGradient id="ct-cheek" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E8A090" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#E8A090" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ct-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C9A08A" stopOpacity="0" />
                <stop offset="100%" stopColor="#C9A08A" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="ct-hair" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2A1C16" />
                <stop offset="50%" stopColor="#1A1410" />
                <stop offset="100%" stopColor="#0A0A08" />
            </linearGradient>
            <linearGradient id="ct-hairMid" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3A2C22" />
                <stop offset="100%" stopColor="#1A1410" />
            </linearGradient>
            <linearGradient id="ct-hairShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4A3C32" stopOpacity="0" />
                <stop offset="50%" stopColor="#5A4C42" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4A3C32" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ct-streak" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#E91E63" />
                <stop offset="100%" stopColor="#C2185B" />
            </linearGradient>
            <radialGradient id="ct-irisOuter" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7A5A48" />
                <stop offset="100%" stopColor="#5A3A28" />
            </radialGradient>
            <radialGradient id="ct-irisInner" cx="50%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#9A7A68" />
                <stop offset="50%" stopColor="#7A5A48" />
                <stop offset="100%" stopColor="#5A3A28" />
            </radialGradient>
            <linearGradient id="ct-top" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A2A2A" />
                <stop offset="100%" stopColor="#1A1A1A" />
            </linearGradient>
            <linearGradient id="ct-lip" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#C88080" />
                <stop offset="100%" stopColor="#A86060" />
            </linearGradient>
        </defs>

        {/* Hair back - creative flowing */}
        <path d="M16 54 Q10 26 40 14 Q50 10 60 14 Q90 26 84 54 Q86 78 70 88 L68 60 Q74 36 50 26 Q26 36 32 60 L30 88 Q14 78 16 54" fill="url(#ct-hair)" />

        {/* Creative color streak */}
        <path d="M32 20 Q36 35 34 55 Q32 72 30 84" fill="none" stroke="url(#ct-streak)" strokeWidth="6" />
        <path d="M34 22 Q37 35 35 52" fill="none" stroke="#F48FB1" strokeWidth="2" opacity="0.5" />

        {/* Neck */}
        <path d="M40 72 L40 86 Q50 88 60 86 L60 72" fill="url(#ct-skin)" />
        <path d="M42 76 L42 84 Q50 86 58 84 L58 76" fill="url(#ct-shadow)" />

        {/* Creative top */}
        <path d="M14 100 L30 84 Q50 78 70 84 L86 100 Z" fill="url(#ct-top)" />

        {/* Artistic neckline */}
        <path d="M38 84 Q50 92 62 84" fill="url(#ct-skin)" />

        {/* Ears */}
        <ellipse cx="28" cy="54" rx="4" ry="7" fill="url(#ct-skin)" />
        <ellipse cx="72" cy="54" rx="4" ry="7" fill="url(#ct-skin)" />
        <path d="M26 50 Q28 54 27 58" stroke="#D4B09A" strokeWidth="0.7" fill="none" />
        <path d="M74 50 Q72 54 73 58" stroke="#D4B09A" strokeWidth="0.7" fill="none" />

        {/* Creative dangling earrings */}
        <circle cx="28" cy="62" r="2" fill="#FFD700" />
        <circle cx="28" cy="68" r="3" fill="#E91E63" />
        <circle cx="27" cy="67" r="1" fill="#F48FB1" opacity="0.5" />
        <circle cx="72" cy="62" r="2" fill="#FFD700" />
        <circle cx="72" cy="68" r="3" fill="#E91E63" />
        <circle cx="71" cy="67" r="1" fill="#F48FB1" opacity="0.5" />

        {/* Face */}
        <ellipse cx="50" cy="50" rx="24" ry="28" fill="url(#ct-skin)" />
        <ellipse cx="50" cy="51" rx="23" ry="26" fill="url(#ct-skinDepth)" />
        <path d="M28 54 Q30 66 42 74" fill="url(#ct-shadow)" opacity="0.2" />
        <path d="M72 54 Q70 66 58 74" fill="url(#ct-shadow)" opacity="0.2" />
        <ellipse cx="32" cy="62" rx="6" ry="4" fill="url(#ct-cheek)" />
        <ellipse cx="68" cy="62" rx="6" ry="4" fill="url(#ct-cheek)" />

        {/* Hair front */}
        <path d="M28 52 Q24 26 50 18 Q76 26 72 52 Q68 36 50 28 Q32 36 28 52" fill="url(#ct-hair)" />
        <path d="M32 48 Q30 30 50 22 Q70 30 68 48 Q64 36 50 28 Q36 36 32 48" fill="url(#ct-hairMid)" />
        <path d="M36 44 Q40 32 50 28 Q60 32 64 44" fill="url(#ct-hairShine)" />

        {/* Eyebrows - expressive */}
        <path d="M34 46 C38 43 43 43 47 46" stroke="#1A1410" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M53 46 C57 43 62 43 66 46" stroke="#1A1410" strokeWidth="1.2" fill="none" strokeLinecap="round" />

        {/* Eyes - bright and expressive */}
        <ellipse cx="40" cy="54" rx="6" ry="4.5" fill="#FFFFFF" />
        <ellipse cx="60" cy="54" rx="6" ry="4.5" fill="#FFFFFF" />
        <ellipse cx="40" cy="55" rx="5.5" ry="3.5" fill="#F8F8F8" />
        <ellipse cx="60" cy="55" rx="5.5" ry="3.5" fill="#F8F8F8" />
        <circle cx="40" cy="54.5" r="3.5" fill="url(#ct-irisOuter)" />
        <circle cx="60" cy="54.5" r="3.5" fill="url(#ct-irisOuter)" />
        <circle cx="40" cy="54.3" r="2.5" fill="url(#ct-irisInner)" />
        <circle cx="60" cy="54.3" r="2.5" fill="url(#ct-irisInner)" />
        <circle cx="40" cy="54.3" r="1.4" fill="#0A0A0A" />
        <circle cx="60" cy="54.3" r="1.4" fill="#0A0A0A" />

        {/* Eye sparkles */}
        <circle cx="38.2" cy="53" r="1.3" fill="#FFFFFF" opacity="0.95" />
        <circle cx="58.2" cy="53" r="1.3" fill="#FFFFFF" opacity="0.95" />
        <circle cx="41.5" cy="55.5" r="0.6" fill="#FFFFFF" opacity="0.5" />
        <circle cx="61.5" cy="55.5" r="0.6" fill="#FFFFFF" opacity="0.5" />

        {/* Nose */}
        <path d="M50 54 Q49 60 48 64" stroke="#D8B8A0" strokeWidth="0.5" fill="none" opacity="0.4" />
        <path d="M47 66 Q50 69 53 66" stroke="#C8A088" strokeWidth="1" fill="none" strokeLinecap="round" />
        <path d="M50 56 L50 61" stroke="#FAF0E8" strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />

        {/* Expressive smile */}
        <path d="M42 72 Q50 80 58 72" fill="url(#ct-lip)" />
        <path d="M44 72 Q50 76 56 72" fill="#FFFFFF" />
        <path d="M44 73 L56 73" stroke="#F0F0F0" strokeWidth="0.3" fill="none" />
        <path d="M42 72 Q50 71 58 72" fill="url(#ct-lip)" />
    </svg>
);

const avatarComponents: Record<string, React.FC> = {
    technology: TechnologyAvatar,
    coach: CoachAvatar,
    legal: LegalAvatar,
    hr: HRAvatar,
    marketing: MarketingAvatar,
    sales: SalesAvatar,
    knowledge: KnowledgeAvatar,
    content: ContentAvatar,
};

const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
};

export function AgentAvatar({ agentId, className = "", size = "lg" }: AgentAvatarProps) {
    const bgColor = agentColors[agentId] || "bg-neutral-500";
    const AvatarComponent = avatarComponents[agentId] || TechnologyAvatar;

    return (
        <div
            className={`${sizeClasses[size]} rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0 overflow-hidden ${className}`}
        >
            <div className="w-full h-full">
                <AvatarComponent />
            </div>
        </div>
    );
}

export { agentColors };