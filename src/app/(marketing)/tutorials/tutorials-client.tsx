// src/app/(marketing)/tutorials/tutorials-client.tsx
// Client wrapper for tutorial cards and video modal interaction

"use client";

import { useState } from "react";
import {
    Play,
    Clock,
    Rocket,
    MessageSquare,
    PenTool,
    Linkedin,
    BookOpen,
    Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { VideoModal } from "@/components/tutorials/video-modal";
import { formatDuration } from "@/lib/tutorials";
import type { Tutorial, TutorialCategory } from "@/lib/tutorials";

const ICON_MAP: Record<string, LucideIcon> = {
    rocket: Rocket,
    "message-square": MessageSquare,
    "pen-tool": PenTool,
    linkedin: Linkedin,
    "book-open": BookOpen,
    target: Target,
};

interface TutorialsClientProps {
    grouped: Array<{
        category: TutorialCategory;
        tutorials: Tutorial[];
    }>;
}

export function TutorialsClient({ grouped }: TutorialsClientProps) {
    const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);

    return (
        <>
            {grouped.map(({ category, tutorials }) => {
                const Icon = ICON_MAP[category.iconName] || Rocket;

                return (
                    <section
                        key={category.id}
                        className="py-12 px-6 even:bg-neutral-50"
                    >
                        <div className="max-w-6xl mx-auto">
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-lg bg-primary-red/10 flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-primary-red" />
                                </div>
                                <div>
                                    <h2 className="font-display text-2xl font-bold text-neutral-900">
                                        {category.title}
                                    </h2>
                                </div>
                            </div>
                            <p className="text-neutral-600 mb-8 ml-[52px]">
                                {category.description}
                            </p>

                            {/* Tutorial Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {tutorials.map((tutorial) => (
                                    <button
                                        key={tutorial.id}
                                        onClick={() => {
                                            if (tutorial.youtubeId) {
                                                setActiveTutorial(tutorial);
                                            }
                                        }}
                                        className={`group bg-white rounded-2xl border border-neutral-200 overflow-hidden text-left transition-all hover:shadow-lg hover:border-neutral-300 ${
                                            tutorial.youtubeId
                                                ? "cursor-pointer"
                                                : "cursor-default"
                                        }`}
                                    >
                                        {/* Thumbnail / Placeholder */}
                                        <div className="relative aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                                            {tutorial.youtubeId ? (
                                                <>
                                                    {/* YouTube thumbnail */}
                                                    <img
                                                        src={`https://img.youtube.com/vi/${tutorial.youtubeId}/mqdefault.jpg`}
                                                        alt={tutorial.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    {/* Play overlay */}
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                                        <div className="w-14 h-14 rounded-full bg-white/90 group-hover:bg-white flex items-center justify-center shadow-lg transition-all group-hover:scale-110">
                                                            <Play className="w-6 h-6 text-primary-red ml-1" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                /* Coming soon placeholder */
                                                <div className="text-center px-4">
                                                    <div className="w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center mx-auto mb-2">
                                                        <Play className="w-6 h-6 text-neutral-400 ml-0.5" />
                                                    </div>
                                                    <p className="text-xs text-neutral-400 font-medium">
                                                        Coming Soon
                                                    </p>
                                                </div>
                                            )}

                                            {/* Duration badge */}
                                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDuration(tutorial.durationSeconds)}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary-red transition-colors">
                                                {tutorial.title}
                                            </h3>
                                            <p className="text-sm text-neutral-600 line-clamp-2">
                                                {tutorial.description}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            })}

            {/* Video Modal */}
            {activeTutorial && activeTutorial.youtubeId && (
                <VideoModal
                    isOpen={true}
                    onClose={() => setActiveTutorial(null)}
                    youtubeId={activeTutorial.youtubeId}
                    title={activeTutorial.title}
                />
            )}
        </>
    );
}
