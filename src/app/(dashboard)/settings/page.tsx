"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

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
}

interface UsageData {
  messagesThisMonth: number;
  messageLimit: number;
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
    | "team"
    | "billing"
    | "notifications"
    | "security";

// Options data
const industries = [
  "Technology / Software",
  "E-commerce / Retail",
  "Healthcare / Medical",
  "Financial Services",
  "Professional Services",
  "Manufacturing",
  "Real Estate",
  "Education",
  "Media / Entertainment",
  "Food & Beverage",
  "Travel / Hospitality",
  "Non-profit",
  "Other",
];

const companySizes = [
  "Just me (solopreneur)",
  "2-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees",
];

const revenueRanges = [
  "Pre-revenue",
  "$0 - $100K",
  "$100K - $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M - $10M",
  "$10M+",
];

const experienceLevels = [
  "Less than 1 year",
  "1-3 years",
  "3-5 years",
  "5-10 years",
  "10-20 years",
  "20+ years",
];

const communicationStyles = [
  { value: "formal", label: "Formal & Professional", desc: "Clear, structured, business-appropriate" },
  { value: "casual", label: "Casual & Conversational", desc: "Friendly, relaxed, approachable" },
  { value: "technical", label: "Technical & Detailed", desc: "Precise terminology, in-depth explanations" },
];

const responseLengths = [
  { value: "concise", label: "Concise", desc: "Quick answers, bullet points, just the essentials" },
  { value: "detailed", label: "Detailed", desc: "Full explanations with reasoning and context" },
  { value: "comprehensive", label: "Comprehensive", desc: "Thorough analysis with examples and alternatives" },
];

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
    implemented: false,
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
    messagesThisMonth: 0,
    messageLimit: 500,
    conversationCount: 0,
    documentCount: 0,
    plan: "starter",
  });

  // Define which fields belong to which section
  const sectionFields: Record<string, (keyof UserSettings)[]> = {
    profile: ["userRole", "yearsExperience", "areasOfFocus"],
    organization: ["companyName", "industry", "companySize", "annualRevenue", "productsServices", "targetMarket"],
    "ai-context": ["currentChallenges", "shortTermGoals", "longTermGoals", "techStack", "teamStructure"],
    "ai-preferences": ["communicationStyle", "responseLength"],
  };

  // Order of sections for navigation
  const sectionOrder: SettingSection[] = ["profile", "organization", "ai-context", "ai-preferences"];

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
                  {usage.messagesThisMonth} of {usage.messageLimit} messages used this month
                </p>
              </div>
              <Button variant="gold" size="sm">
                Upgrade Plan
              </Button>
            </div>
            <div className="mt-4 bg-white/10 rounded-full h-2">
              <div
                  className={`h-2 rounded-full transition-all ${
                      usage.messagesThisMonth / usage.messageLimit > 0.9
                          ? "bg-red-500"
                          : usage.messagesThisMonth / usage.messageLimit > 0.7
                              ? "bg-amber-500"
                              : "bg-accent-gold"
                  }`}
                  style={{ width: `${Math.min((usage.messagesThisMonth / usage.messageLimit) * 100, 100)}%` }}
              />
            </div>
            {usage.messagesThisMonth / usage.messageLimit > 0.9 && (
                <p className="text-amber-400 text-sm mt-2">
                  ⚠️ You&apos;re approaching your message limit. Consider upgrading for unlimited messages.
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