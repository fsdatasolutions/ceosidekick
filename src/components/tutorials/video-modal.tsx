// src/components/tutorials/video-modal.tsx
// YouTube video modal for tutorial playback

"use client";

import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface VideoModalProps {
    isOpen: boolean;
    onClose: () => void;
    youtubeId: string;
    title: string;
}

export function VideoModal({ isOpen, onClose, youtubeId, title }: VideoModalProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-display font-semibold text-lg truncate pr-4">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Video container - 16:9 aspect ratio */}
                <div className="relative w-full rounded-xl overflow-hidden shadow-2xl" style={{ paddingBottom: "56.25%" }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                        title={title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                    />
                </div>
            </div>
        </div>
    );
}
