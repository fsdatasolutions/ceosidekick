"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface UserSectionProps {
  name: string;
  email: string;
  image?: string | null;
}

export function UserSection({ name, email, image }: UserSectionProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-4 border-t border-neutral-200">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-red flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{name}</p>
          <p className="text-xs text-neutral-500 truncate">{email}</p>
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full mt-2 flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </div>
  );
}
