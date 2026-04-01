"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  User,
  Building,
  CreditCard,
  Bell,
  Shield,
  Users,
  Target,
  ChevronLeft,
  Save,
  Loader2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Globe,
  Linkedin,
  AlertTriangle,
  ExternalLink,
  Unlink,
  Plus,
} from "lucide-react";
import { useLinkedInStatus, useLinkedInOrgStatus } from "@/lib/hooks/useLinkedInStatus";
import {
  industries,
  companySizes,
  revenueRanges,
  experienceLevels,
  communicationStyles,
  responseLengths,
} from "@/lib/constants/settings-options";

// Types
interface UserSettings {
  companyName?: string;
  industry?: string;
  companySize?: string;
  annualRevenue?: string;
  productsServices?: string;
  targetMarket?: string;
  userRole?: string;
  yearsExperience?: string;
  areasOfFocus?: string;
  currentChallenges?: string;
  shortTermGoals?: string;
  longTermGoals?: string;
  techStack?: string;
  teamStructure?: string;
  communicationStyle?: string;
  responseLength?: string;
  blogContentDir?: string;
  blogImagesDir?: string;
  siteUrl?: string;
  linkedinProfileUrl?: string;
  githubRepo?: string;
  githubBranch?: string;
  githubToken?: string;
  githubBlogPath?: string;
  githubImagesPath?: string;
}

interface UsageData {
  creditsThisMonth: number;
  creditLimit: number;
  conversationCount: number;
  documentCount: number;
  plan: string;
}

type SettingSection =
    | "menu"
    | "profile"
    | "organization"
    | "ai-context"
    | "ai-preferences"
    | "content-publishing"
    | "team"
    | "billing"
    | "notifications"
    | "security";

// Settings menu items
const settingsSections = [
  {
    id: "profile" as const,
    icon: User,
    title: "Your Profile",
    description: "Your role, experience, and focus areas",
    implemented: true,
  },
  {
    id: "organization" as const,
    icon: Building,
    title: "Company Profile",
    description: "Company details, industry, and market",
    implemented: true,
  },
  {
    id: "ai-context" as const,
    icon: Target,
    title: "Business Context",
    description: "Goals, challenges, tech stack, and team",
    implemented: true,
    highlight: true,
  },
  {
    id: "ai-preferences" as const,
    icon: Sparkles,
    title: "AI Preferences",
    description: "Communication style and response format",
    implemented: true,
    highlight: true,
  },
  {
    id: "content-publishing" as const,
    icon: Globe,
    title: "Content & Publishing",
    description: "Blog directories, site URL, and LinkedIn profile",
    implemented: true,
  },
  {
    id: "team" as const,
    icon: Users,
    title: "Team Members",
    description: "Invite and manage team members",
    implemented: false,
  },
  {
    id: "billing" as const,
    icon: CreditCard,
    title: "Billing & Plans",
    description: "Manage your subscription and payment methods",
    implemented: true,
    href: "/pricing",
  },
  {
    id: "notifications" as const,
    icon: Bell,
    title: "Notifications",
    description: "Configure email and in-app notifications",
    implemented: false,
  },
  {
    id: "security" as const,
    icon: Shield,
    title: "Security",
    description: "Manage password, 2FA, and API keys",
    implemented: false,
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingSection>("menu");
  const [settings, setSettings] = useState<UserSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [usage, setUsage] = useState<UsageData>({
    creditsThisMonth: 0,
    creditLimit: 500,
    conversationCount: 0,
    documentCount: 0,
    plan: "starter",
  });

  // LinkedIn personal connection
  const { status: linkedInStatus, loading: linkedInLoading, refetch: refetchLinkedIn } = useLinkedInStatus();
  const [disconnecting, setDisconnecting] = useState(false);
  const [linkedInMessage, setLinkedInMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showLinkedInReassign, setShowLinkedInReassign] = useState(false);
  const searchParams = useSearchParams();

  // LinkedIn org connection
  const { status: linkedInOrgStatus, loading: linkedInOrgLoading, refetch: refetchLinkedInOrg } = useLinkedInOrgStatus();
  const [disconnectingOrg, setDisconnectingOrg] = useState(false);
  const [linkedInOrgMessage, setLinkedInOrgMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showLinkedInOrgReassign, setShowLinkedInOrgReassign] = useState(false);
  const [orgVanityName, setOrgVanityName] = useState("");
  const [addingOrgPage, setAddingOrgPage] = useState(false);
  const [addOrgPageError, setAddOrgPageError] = useState<string | null>(null);

  async function handleAddOrgPage() {
    if (!orgVanityName.trim()) return;
    setAddingOrgPage(true);
    setAddOrgPageError(null);
    try {
      const response = await fetch("/api/linkedin/org/add-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vanityName: orgVanityName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setAddOrgPageError(data.error || "Failed to add organization page");
        return;
      }
      setOrgVanityName("");
      setLinkedInOrgMessage({ type: "success", text: `Added ${data.org.name} successfully!` });
      refetchLinkedInOrg();
      setTimeout(() => setLinkedInOrgMessage(null), 5000);
    } catch {
      setAddOrgPageError("Failed to add organization page");
    } finally {
      setAddingOrgPage(false);
    }
  }

  // Handle LinkedIn callback query params (personal + org)
  useEffect(() => {
    const linkedInParam = searchParams.get("linkedin");
    if (linkedInParam === "connected") {
      setLinkedInMessage({ type: "success", text: "LinkedIn connected successfully!" });
      refetchLinkedIn();
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setLinkedInMessage(null), 5000);
    } else if (linkedInParam === "confirm_reassign") {
      setLinkedInMessage({ type: "error", text: "This LinkedIn account is already connected to another account. It will be unlinked from that account if you continue." });
      setShowLinkedInReassign(true);
      window.history.replaceState({}, "", "/settings");
    } else if (linkedInParam === "error") {
      const errorMsg = searchParams.get("linkedin_error") || "Failed to connect LinkedIn";
      setLinkedInMessage({ type: "error", text: errorMsg });
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setLinkedInMessage(null), 8000);
    }

    const linkedInOrgParam = searchParams.get("linkedin_org");
    if (linkedInOrgParam === "connected") {
      setLinkedInOrgMessage({ type: "success", text: "Organization pages connected successfully!" });
      refetchLinkedInOrg();
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setLinkedInOrgMessage(null), 5000);
    } else if (linkedInOrgParam === "confirm_reassign") {
      setLinkedInOrgMessage({ type: "error", text: "This LinkedIn organization is already connected to another account. It will be unlinked from that account if you continue." });
      setShowLinkedInOrgReassign(true);
      window.history.replaceState({}, "", "/settings");
    } else if (linkedInOrgParam === "error") {
      const errorMsg = searchParams.get("linkedin_org_error") || "Failed to connect organization pages";
      setLinkedInOrgMessage({ type: "error", text: errorMsg });
      window.history.replaceState({}, "", "/settings");
      setTimeout(() => setLinkedInOrgMessage(null), 8000);
    }
  }, [searchParams, refetchLinkedIn, refetchLinkedInOrg]);

  async function disconnectLinkedIn() {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/linkedin/disconnect", { method: "POST" });
      if (response.ok) {
        setLinkedInMessage({ type: "success", text: "LinkedIn disconnected." });
        refetchLinkedIn();
        setTimeout(() => setLinkedInMessage(null), 3000);
      } else {
        setLinkedInMessage({ type: "error", text: "Failed to disconnect LinkedIn." });
      }
    } catch {
      setLinkedInMessage({ type: "error", text: "Failed to disconnect LinkedIn." });
    } finally {
      setDisconnecting(false);
    }
  }

  async function disconnectLinkedInOrg() {
    setDisconnectingOrg(true);
    try {
      const response = await fetch("/api/linkedin/org/disconnect", { method: "POST" });
      if (response.ok) {
        setLinkedInOrgMessage({ type: "success", text: "Organization pages disconnected." });
        refetchLinkedInOrg();
        setTimeout(() => setLinkedInOrgMessage(null), 3000);
      } else {
        setLinkedInOrgMessage({ type: "error", text: "Failed to disconnect organization pages." });
      }
    } catch {
      setLinkedInOrgMessage({ type: "error", text: "Failed to disconnect organization pages." });
    } finally {
      setDisconnectingOrg(false);
    }
  }

  // Define which fields belong to which section
  const sectionFields: Record<string, (keyof UserSettings)[]> = {
    profile: ["userRole", "yearsExperience", "areasOfFocus"],
    organization: ["companyName", "industry", "companySize", "annualRevenue", "productsServices", "targetMarket"],
    "ai-context": ["currentChallenges", "shortTermGoals", "longTermGoals", "techStack", "teamStructure"],
    "ai-preferences": ["communicationStyle", "responseLength"],
    "content-publishing": ["blogContentDir", "blogImagesDir", "siteUrl", "linkedinProfileUrl"],
  };

  // Order of sections for navigation
  const sectionOrder: SettingSection[] = ["profile", "organization", "ai-context", "ai-preferences", "content-publishing"];

  // Check if a section has any data
  function isSectionPopulated(section: SettingSection, settingsData: UserSettings): boolean {
    const fields = sectionFields[section];
    if (!fields) return true; // Non-form sections are considered "populated"
    return fields.some((field) => settingsData[field] && settingsData[field]!.trim() !== "");
  }

  // Get the next unpopulated section after the current one
  function getNextUnpopulatedSection(currentSection: SettingSection, settingsData: UserSettings): SettingSection | null {
    const currentIndex = sectionOrder.indexOf(currentSection);
    if (currentIndex === -1) return null;

    // Look for the next unpopulated section
    for (let i = currentIndex + 1; i < sectionOrder.length; i++) {
      if (!isSectionPopulated(sectionOrder[i], settingsData)) {
        return sectionOrder[i];
      }
    }
    return null; // All subsequent sections are populated
  }

  // Load settings and usage on mount
  useEffect(() => {
    loadSettings();
    loadUsage();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || {});
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUsage() {
    try {
      const response = await fetch("/api/usage");
      if (response.ok) {
        const data = await response.json();
        setUsage(data.usage);
      }
    } catch (error) {
      console.error("Failed to load usage:", error);
    }
  }

  async function saveSettings() {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSettings = data.settings || settings;

        // Check if there's a next unpopulated section to navigate to
        const nextSection = getNextUnpopulatedSection(activeSection, updatedSettings);

        if (nextSection) {
          // Navigate to the next unpopulated section
          setSaveSuccess(true);
          setTimeout(() => {
            setSaveSuccess(false);
            setActiveSection(nextSection);
          }, 1000); // Brief delay to show success message
        } else {
          // All sections complete, go back to menu
          setSaveSuccess(true);
          setTimeout(() => {
            setSaveSuccess(false);
            setActiveSection("menu");
          }, 1500);
        }
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  }

  function updateSetting(key: keyof UserSettings, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function goBack() {
    setActiveSection("menu");
  }

  // Loading state
  if (isLoading) {
    return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
    );
  }

  // Main menu view
  if (activeSection === "menu") {
    return (
        <div className="p-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Settings
            </h1>
            <p className="text-neutral-600">
              Manage your account settings and AI personalization.
            </p>
          </div>

          {/* AI Personalization Banner */}
          {(() => {
            const completedSections = sectionOrder.filter((s) => isSectionPopulated(s, settings)).length;
            const totalSections = sectionOrder.length;
            const progressPercent = (completedSections / totalSections) * 100;
            const firstIncompleteSection = sectionOrder.find((s) => !isSectionPopulated(s, settings));

            return (
                <div className="mb-6 p-4 bg-gradient-to-r from-primary-red/10 to-accent-gold/10 border border-primary-red/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-red/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary-red" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-neutral-900 mb-1">
                        {completedSections === totalSections
                            ? "AI Personalization Complete!"
                            : "Personalize Your AI Advisors"}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-3">
                        {completedSections === totalSections
                            ? "Your AI advisors are fully personalized to your business context."
                            : "Fill out your business context to get more relevant, tailored advice from all AI advisors."}
                      </p>

                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-white/50 rounded-full h-2">
                          <div
                              className="bg-primary-red h-2 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-neutral-700">
                      {completedSections}/{totalSections}
                    </span>
                      </div>
                    </div>

                    {/* Continue Setup button */}
                    {firstIncompleteSection && (
                        <Button
                            onClick={() => setActiveSection(firstIncompleteSection)}
                            size="sm"
                            className="shrink-0"
                        >
                          Continue Setup
                        </Button>
                    )}
                  </div>
                </div>
            );
          })()}

          {/* Settings Grid */}
          <div className="grid gap-3">
            {settingsSections.map((section) => {
              const isComplete = section.implemented && isSectionPopulated(section.id, settings);

              const content = (
                  <>
                    <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isComplete
                                ? "bg-green-100"
                                : section.highlight
                                    ? "bg-primary-red/10"
                                    : "bg-neutral-100"
                        }`}
                    >
                      {isComplete ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                          <section.icon
                              className={`w-6 h-6 ${
                                  section.highlight ? "text-primary-red" : "text-neutral-600"
                              }`}
                          />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900">
                          {section.title}
                        </h3>
                        {!section.implemented && (
                            <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-500 rounded-full">
                      Coming Soon
                    </span>
                        )}
                        {isComplete && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      Complete
                    </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500">{section.description}</p>
                    </div>
                    {section.implemented && (
                        <svg
                            className="w-5 h-5 text-neutral-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                          />
                        </svg>
                    )}
                  </>
              );

              // If section has an href, render as Link
              if (section.href) {
                return (
                    <Link
                        key={section.id}
                        href={section.href}
                        className="flex items-center gap-4 p-5 bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-sm transition-all text-left"
                    >
                      {content}
                    </Link>
                );
              }

              return (
                  <button
                      key={section.id}
                      onClick={() => section.implemented && setActiveSection(section.id)}
                      disabled={!section.implemented}
                      className={`flex items-center gap-4 p-5 bg-white rounded-xl border transition-all text-left ${
                          section.implemented
                              ? "border-neutral-200 hover:border-neutral-300 hover:shadow-sm cursor-pointer"
                              : "border-neutral-100 opacity-50 cursor-not-allowed"
                      } ${section.highlight ? "ring-1 ring-primary-red/20" : ""}`}
                  >
                    {content}
                  </button>
              );
            })}
          </div>

          {/* Current Plan */}
          <div className="mt-8 p-6 bg-neutral-900 rounded-xl text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-400 mb-1">Current Plan</p>
                <h3 className="font-display text-2xl font-bold mb-1 capitalize">{usage.plan}</h3>
                <p className="text-neutral-400">
                  {usage.creditsThisMonth} of {usage.creditLimit} credits used this month
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="gold" size="sm">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
            <div className="mt-4 bg-white/10 rounded-full h-2">
              <div
                  className={`h-2 rounded-full transition-all ${
                      usage.creditsThisMonth / usage.creditLimit > 0.9
                          ? "bg-red-500"
                          : usage.creditsThisMonth / usage.creditLimit > 0.7
                              ? "bg-amber-500"
                              : "bg-accent-gold"
                  }`}
                  style={{ width: `${Math.min((usage.creditsThisMonth / usage.creditLimit) * 100, 100)}%` }}
              />
            </div>
            {usage.creditsThisMonth / usage.creditLimit > 0.9 && (
                <p className="text-amber-400 text-sm mt-2">
                  ⚠️ You&apos;re approaching your credit limit. Consider upgrading for unlimited credits.
                </p>
            )}

            {/* Usage Details */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-neutral-300" />
                </div>
                <div>
                  <p className="text-lg font-semibold">{usage.conversationCount}</p>
                  <p className="text-xs text-neutral-400">Active Chats</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold">{usage.documentCount}</p>
                  <p className="text-xs text-neutral-400">Documents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="mt-8 p-6 border border-red-200 rounded-xl bg-red-50">
            <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-4">
              Permanently delete your account and all associated data.
            </p>
            <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
            >
              Delete Account
            </Button>
          </div>
        </div>
    );
  }

  // Section views with forms
  return (
      <div className="p-8 max-w-4xl">
        {/* Back button and header */}
        <div className="mb-6">
          <button
              onClick={goBack}
              className="flex items-center gap-2 text-neutral-500 hover:text-neutral-700 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Settings
          </button>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {sectionOrder.map((section, index) => {
              const isActive = section === activeSection;
              const isComplete = isSectionPopulated(section, settings);
              const sectionName = settingsSections.find((s) => s.id === section)?.title || section;

              return (
                  <div key={section} className="flex items-center">
                    <button
                        onClick={() => setActiveSection(section)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            isActive
                                ? "bg-primary-red text-white"
                                : isComplete
                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                    : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                        }`}
                    >
                      {isComplete && !isActive ? (
                          <CheckCircle2 className="w-4 h-4" />
                      ) : (
                          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                      )}
                      <span className="hidden sm:inline">{sectionName}</span>
                    </button>
                    {index < sectionOrder.length - 1 && (
                        <div className="w-8 h-px bg-neutral-200 mx-1" />
                    )}
                  </div>
              );
            })}
          </div>

          <h1 className="font-display text-2xl font-bold text-neutral-900">
            {activeSection === "profile" && "Your Profile"}
            {activeSection === "organization" && "Company Profile"}
            {activeSection === "ai-context" && "Business Context"}
            {activeSection === "ai-preferences" && "AI Preferences"}
            {activeSection === "content-publishing" && "Content & Publishing"}
          </h1>
        </div>

        {/* Form content */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          {/* Profile Section */}
          {activeSection === "profile" && (
              <div className="space-y-6">
                <p className="text-sm text-neutral-500">
                  Tell us about yourself so our AI advisors can tailor their advice to your experience level.
                </p>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Your Role / Title
                    </label>
                    <input
                        type="text"
                        value={settings.userRole || ""}
                        onChange={(e) => updateSetting("userRole", e.target.value)}
                        placeholder="e.g., CEO, Founder, CTO, Operations Manager"
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Years of Experience
                    </label>
                    <select
                        value={settings.yearsExperience || ""}
                        onChange={(e) => updateSetting("yearsExperience", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                    >
                      <option value="">Select experience level...</option>
                      {experienceLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Areas of Focus / Responsibility
                    </label>
                    <textarea
                        value={settings.areasOfFocus || ""}
                        onChange={(e) => updateSetting("areasOfFocus", e.target.value)}
                        placeholder="What areas do you oversee? What keeps you busy day-to-day?"
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                  </div>
                </div>
              </div>
          )}

          {/* Organization Section */}
          {activeSection === "organization" && (
              <div className="space-y-6">
                <p className="text-sm text-neutral-500">
                  Help our AI advisors understand your business context for better recommendations.
                </p>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Company Name
                    </label>
                    <input
                        type="text"
                        value={settings.companyName || ""}
                        onChange={(e) => updateSetting("companyName", e.target.value)}
                        placeholder="Acme Inc."
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Industry
                      </label>
                      <select
                          value={settings.industry || ""}
                          onChange={(e) => updateSetting("industry", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                      >
                        <option value="">Select industry...</option>
                        {industries.map((industry) => (
                            <option key={industry} value={industry}>
                              {industry}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Company Size
                      </label>
                      <select
                          value={settings.companySize || ""}
                          onChange={(e) => updateSetting("companySize", e.target.value)}
                          className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                      >
                        <option value="">Select size...</option>
                        {companySizes.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Annual Revenue
                    </label>
                    <select
                        value={settings.annualRevenue || ""}
                        onChange={(e) => updateSetting("annualRevenue", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                    >
                      <option value="">Select revenue range...</option>
                      {revenueRanges.map((range) => (
                          <option key={range} value={range}>
                            {range}
                          </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Products / Services
                    </label>
                    <textarea
                        value={settings.productsServices || ""}
                        onChange={(e) => updateSetting("productsServices", e.target.value)}
                        placeholder="Briefly describe what your company offers..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Target Market
                    </label>
                    <textarea
                        value={settings.targetMarket || ""}
                        onChange={(e) => updateSetting("targetMarket", e.target.value)}
                        placeholder="Who are your ideal customers? What markets do you serve?"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                  </div>
                </div>
              </div>
          )}

          {/* AI Context Section */}
          {activeSection === "ai-context" && (
              <div className="space-y-6">
                <p className="text-sm text-neutral-500">
                  Share your goals, challenges, and environment so our AI advisors can give more relevant guidance.
                </p>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Current Challenges
                    </label>
                    <textarea
                        value={settings.currentChallenges || ""}
                        onChange={(e) => updateSetting("currentChallenges", e.target.value)}
                        placeholder="What are your biggest challenges right now? What problems are you trying to solve?"
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Short-term Goals (Next 3-6 months)
                    </label>
                    <textarea
                        value={settings.shortTermGoals || ""}
                        onChange={(e) => updateSetting("shortTermGoals", e.target.value)}
                        placeholder="What are you trying to accomplish in the near term?"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Long-term Goals (1-3 years)
                    </label>
                    <textarea
                        value={settings.longTermGoals || ""}
                        onChange={(e) => updateSetting("longTermGoals", e.target.value)}
                        placeholder="Where do you see your business heading?"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Tech Stack / Tools
                    </label>
                    <textarea
                        value={settings.techStack || ""}
                        onChange={(e) => updateSetting("techStack", e.target.value)}
                        placeholder="What software and tools do you currently use? (e.g., Salesforce, QuickBooks, Slack, AWS)"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Team Structure
                    </label>
                    <textarea
                        value={settings.teamStructure || ""}
                        onChange={(e) => updateSetting("teamStructure", e.target.value)}
                        placeholder="Describe your team - departments, key roles, reporting structure, who reports to you"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                  </div>
                </div>
              </div>
          )}

          {/* AI Preferences Section */}
          {activeSection === "ai-preferences" && (
              <div className="space-y-6">
                <p className="text-sm text-neutral-500">
                  Customize how our AI advisors communicate with you.
                </p>

                <div className="grid gap-8">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Communication Style
                    </label>
                    <div className="space-y-3">
                      {communicationStyles.map((style) => (
                          <label
                              key={style.value}
                              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                  settings.communicationStyle === style.value
                                      ? "border-primary-red bg-primary-red/5 ring-1 ring-primary-red/20"
                                      : "border-neutral-200 hover:bg-neutral-50"
                              }`}
                          >
                            <input
                                type="radio"
                                name="communicationStyle"
                                value={style.value}
                                checked={settings.communicationStyle === style.value}
                                onChange={(e) =>
                                    updateSetting("communicationStyle", e.target.value)
                                }
                                className="mt-1 w-4 h-4 text-primary-red focus:ring-primary-red"
                            />
                            <div>
                              <span className="font-medium text-neutral-900">{style.label}</span>
                              <p className="text-sm text-neutral-500 mt-0.5">{style.desc}</p>
                            </div>
                          </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Response Length
                    </label>
                    <div className="space-y-3">
                      {responseLengths.map((length) => (
                          <label
                              key={length.value}
                              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                  settings.responseLength === length.value
                                      ? "border-primary-red bg-primary-red/5 ring-1 ring-primary-red/20"
                                      : "border-neutral-200 hover:bg-neutral-50"
                              }`}
                          >
                            <input
                                type="radio"
                                name="responseLength"
                                value={length.value}
                                checked={settings.responseLength === length.value}
                                onChange={(e) =>
                                    updateSetting("responseLength", e.target.value)
                                }
                                className="mt-1 w-4 h-4 text-primary-red focus:ring-primary-red"
                            />
                            <div>
                              <span className="font-medium text-neutral-900">{length.label}</span>
                              <p className="text-sm text-neutral-500 mt-0.5">{length.desc}</p>
                            </div>
                          </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          )}

          {/* Content & Publishing Section */}
          {activeSection === "content-publishing" && (
              <div className="space-y-6">
                <p className="text-sm text-neutral-500">
                  Configure where blog content is published and how it connects to your website.
                </p>

                {/* LinkedIn Connection Card */}
                <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                      <Linkedin className="w-5 h-5 text-[#0A66C2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 mb-1">LinkedIn Connection</h3>

                      {/* LinkedIn status message banner */}
                      {linkedInMessage && (
                          <div
                              className={`mb-3 px-3 py-2 rounded-lg text-sm ${
                                  linkedInMessage.type === "success"
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                          >
                            {linkedInMessage.text}
                            {showLinkedInReassign && (
                                <div className="mt-2 flex items-center gap-2">
                                  <a href="/api/linkedin/authorize?force=true">
                                    <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-100">
                                      Connect Anyway
                                    </Button>
                                  </a>
                                  <Button size="sm" variant="ghost" className="text-neutral-600" onClick={() => { setLinkedInMessage(null); setShowLinkedInReassign(false); }}>
                                    Cancel
                                  </Button>
                                </div>
                            )}
                          </div>
                      )}

                      {linkedInLoading ? (
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking connection...
                          </div>
                      ) : linkedInStatus?.connected ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">
                                Connected as {linkedInStatus.profile?.name || "LinkedIn User"}
                              </span>
                            </div>
                            {linkedInStatus.tokenExpired && (
                                <div className="flex items-center gap-2 mb-2 text-amber-600">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-sm">Token expired — reconnect to continue posting.</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {linkedInStatus.tokenExpired && (
                                  <a href="/api/linkedin/authorize">
                                    <Button size="sm" className="bg-[#0A66C2] hover:bg-[#004182] text-white">
                                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                      Reconnect
                                    </Button>
                                  </a>
                              )}
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={disconnectLinkedIn}
                                  disabled={disconnecting}
                                  className="text-neutral-600"
                              >
                                {disconnecting ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                ) : (
                                    <Unlink className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Disconnect
                              </Button>
                            </div>
                          </>
                      ) : linkedInStatus?.configured === false ? (
                          <p className="text-sm text-neutral-500">
                            LinkedIn integration is not configured. Add <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">LINKEDIN_CLIENT_ID</code> and <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">LINKEDIN_CLIENT_SECRET</code> to your environment variables.
                          </p>
                      ) : (
                          <>
                            <p className="text-sm text-neutral-500 mb-3">
                              Connect your LinkedIn account to post content directly from the Content Engine.
                            </p>
                            <a href="/api/linkedin/authorize">
                              <Button size="sm" className="bg-[#0A66C2] hover:bg-[#004182] text-white">
                                <Linkedin className="w-3.5 h-3.5 mr-1.5" />
                                Connect LinkedIn
                              </Button>
                            </a>
                          </>
                      )}
                    </div>
                  </div>
                </div>

                {/* LinkedIn Organization Pages Card */}
                <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5 text-[#0A66C2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 mb-1">Organization Pages</h3>
                      <p className="text-xs text-neutral-400 mb-2">Post to company LinkedIn pages you administer</p>

                      {/* Org status message banner */}
                      {linkedInOrgMessage && (
                          <div
                              className={`mb-3 px-3 py-2 rounded-lg text-sm ${
                                  linkedInOrgMessage.type === "success"
                                      ? "bg-green-50 text-green-700 border border-green-200"
                                      : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                          >
                            {linkedInOrgMessage.text}
                            {showLinkedInOrgReassign && (
                                <div className="mt-2 flex items-center gap-2">
                                  <a href="/api/linkedin/org/authorize?force=true">
                                    <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-100">
                                      Connect Anyway
                                    </Button>
                                  </a>
                                  <Button size="sm" variant="ghost" className="text-neutral-600" onClick={() => { setLinkedInOrgMessage(null); setShowLinkedInOrgReassign(false); }}>
                                    Cancel
                                  </Button>
                                </div>
                            )}
                          </div>
                      )}

                      {linkedInOrgLoading ? (
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking connection...
                          </div>
                      ) : linkedInOrgStatus?.connected ? (
                          <>
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-700 font-medium">
                                Connected
                              </span>
                            </div>
                            {/* List connected org pages */}
                            {linkedInOrgStatus.orgs && linkedInOrgStatus.orgs.length > 0 && (
                                <div className="mb-2 space-y-1">
                                  {linkedInOrgStatus.orgs.map((org) => (
                                      <div key={org.id} className="flex items-center gap-2 text-sm text-neutral-700">
                                        <Building className="w-3.5 h-3.5 text-neutral-400" />
                                        {org.name}
                                      </div>
                                  ))}
                                </div>
                            )}

                            {/* Add organization page by vanity name */}
                            <div className="mb-3 mt-2">
                              <label className="block text-xs text-neutral-500 mb-1">
                                Add a company page by vanity name
                              </label>
                              <p className="text-xs text-neutral-400 mb-1.5">
                                Enter the vanity name from your LinkedIn company URL (e.g. <code className="bg-neutral-100 px-1 rounded">linkedin.com/company/<strong>your-company</strong></code>)
                              </p>
                              <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={orgVanityName}
                                    onChange={(e) => { setOrgVanityName(e.target.value); setAddOrgPageError(null); }}
                                    placeholder="your-company"
                                    className="flex-1 px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                />
                                <Button
                                    size="sm"
                                    onClick={handleAddOrgPage}
                                    disabled={addingOrgPage || !orgVanityName.trim()}
                                    className="bg-[#0A66C2] hover:bg-[#004182] text-white"
                                >
                                  {addingOrgPage ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                  ) : (
                                      <Plus className="w-3.5 h-3.5 mr-1" />
                                  )}
                                  Add
                                </Button>
                              </div>
                              {addOrgPageError && (
                                  <p className="text-xs text-red-600 mt-1">{addOrgPageError}</p>
                              )}
                            </div>

                            {linkedInOrgStatus.tokenExpired && (
                                <div className="flex items-center gap-2 mb-2 text-amber-600">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-sm">Token expired — reconnect to continue posting.</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {linkedInOrgStatus.tokenExpired && (
                                  <a href="/api/linkedin/org/authorize">
                                    <Button size="sm" className="bg-[#0A66C2] hover:bg-[#004182] text-white">
                                      <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                      Reconnect
                                    </Button>
                                  </a>
                              )}
                              <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={disconnectLinkedInOrg}
                                  disabled={disconnectingOrg}
                                  className="text-neutral-600"
                              >
                                {disconnectingOrg ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                ) : (
                                    <Unlink className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Disconnect
                              </Button>
                            </div>
                          </>
                      ) : linkedInOrgStatus?.configured === false ? (
                          <p className="text-sm text-neutral-500">
                            Organization integration is not configured. Add <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">LINKEDIN_ORG_CLIENT_ID</code> and <code className="text-xs bg-neutral-100 px-1 py-0.5 rounded">LINKEDIN_ORG_CLIENT_SECRET</code> to your environment variables.
                          </p>
                      ) : (
                          <>
                            <p className="text-sm text-neutral-500 mb-3">
                              Connect a separate LinkedIn app with the Community Management API to post as your organization pages.
                            </p>
                            <a href="/api/linkedin/org/authorize">
                              <Button size="sm" className="bg-[#0A66C2] hover:bg-[#004182] text-white">
                                <Building className="w-3.5 h-3.5 mr-1.5" />
                                Connect Organization Pages
                              </Button>
                            </a>
                          </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6">
                  {/* GitHub Publishing */}
                  <div className="p-4 rounded-lg border border-neutral-200 bg-white space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-neutral-700" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      <h4 className="font-medium text-neutral-900">GitHub Publishing</h4>
                    </div>
                    <p className="text-xs text-neutral-500 -mt-2">
                      Publish blog posts as commits to your website&apos;s GitHub repository. Create a <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] underline">fine-grained personal access token</a> with &quot;Contents&quot; read/write access to your repo.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Repository</label>
                        <input
                            type="text"
                            value={settings.githubRepo || ""}
                            onChange={(e) => updateSetting("githubRepo", e.target.value)}
                            placeholder="owner/repo"
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Branch</label>
                        <input
                            type="text"
                            value={settings.githubBranch || ""}
                            onChange={(e) => updateSetting("githubBranch", e.target.value)}
                            placeholder="main"
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">Personal Access Token</label>
                      <input
                          type="password"
                          value={settings.githubToken || ""}
                          onChange={(e) => updateSetting("githubToken", e.target.value)}
                          placeholder="github_pat_..."
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red font-mono text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Blog Content Path</label>
                        <input
                            type="text"
                            value={settings.githubBlogPath || ""}
                            onChange={(e) => updateSetting("githubBlogPath", e.target.value)}
                            placeholder="src/content/blog"
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red font-mono text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 mb-1">Blog Images Path</label>
                        <input
                            type="text"
                            value={settings.githubImagesPath || ""}
                            onChange={(e) => updateSetting("githubImagesPath", e.target.value)}
                            placeholder="public/images/blog"
                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Local Filesystem (Dev) */}
                  <div className="p-4 rounded-lg border border-neutral-100 bg-neutral-50 space-y-4">
                    <h4 className="font-medium text-neutral-700 text-sm">Local Filesystem (Development Only)</h4>
                    <p className="text-xs text-neutral-400 -mt-2">
                      These paths are used when GitHub publishing is not configured. Only works in local development.
                    </p>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Blog Content Directory
                      </label>
                      <input
                          type="text"
                          value={settings.blogContentDir || ""}
                          onChange={(e) => updateSetting("blogContentDir", e.target.value)}
                          placeholder="e.g., /Users/me/Projects/myblog/src/content/blog"
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Blog Images Directory
                      </label>
                      <input
                          type="text"
                          value={settings.blogImagesDir || ""}
                          onChange={(e) => updateSetting("blogImagesDir", e.target.value)}
                          placeholder="e.g., /Users/me/Projects/myblog/public/images/blog"
                          className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Site URL
                    </label>
                    <input
                        type="url"
                        value={settings.siteUrl || ""}
                        onChange={(e) => updateSetting("siteUrl", e.target.value)}
                        placeholder="e.g., https://mysite.com"
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Your website base URL, used for blog post links when sharing on LinkedIn.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      LinkedIn Profile URL
                    </label>
                    <input
                        type="url"
                        value={settings.linkedinProfileUrl || ""}
                        onChange={(e) => updateSetting("linkedinProfileUrl", e.target.value)}
                        placeholder="e.g., https://linkedin.com/in/yourprofile"
                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Your LinkedIn profile URL for content previews and sharing.
                    </p>
                  </div>
                </div>
              </div>
          )}
        </div>

        {/* Save Button */}
        {(() => {
          const currentIndex = sectionOrder.indexOf(activeSection);
          const nextSection = currentIndex < sectionOrder.length - 1 ? sectionOrder[currentIndex + 1] : null;
          const nextSectionName = nextSection
              ? settingsSections.find((s) => s.id === nextSection)?.title
              : null;
          const isLastSection = currentIndex === sectionOrder.length - 1;

          return (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {saveSuccess && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Saved! {nextSectionName ? `Moving to ${nextSectionName}...` : "All done!"}</span>
                      </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {nextSection && (
                      <Button
                          variant="outline"
                          onClick={() => setActiveSection(nextSection)}
                          disabled={isSaving}
                      >
                        Skip for Now
                      </Button>
                  )}
                  <Button onClick={saveSettings} disabled={isSaving}>
                    {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                    ) : isLastSection ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Complete Setup
                        </>
                    ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save & Continue
                        </>
                    )}
                  </Button>
                </div>
              </div>
          );
        })()}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>How this helps:</strong> Our AI advisors use this information
            to give you more relevant, personalized advice. For example, the
            Strategy Partner will consider your current tech stack when making
            recommendations, and the HR Partner will factor in your company size
            when suggesting policies.
          </p>
        </div>
      </div>
  );
}