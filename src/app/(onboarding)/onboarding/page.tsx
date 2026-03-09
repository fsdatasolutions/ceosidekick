"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    MessageSquare,
    FolderOpen,
    Zap,
    Users,
    Rocket,
    User,
    Building,
    Target,
    Settings2,
    Wand2,
} from "lucide-react";
import {
    industries,
    companySizes,
    experienceLevels,
    communicationStyles,
    responseLengths,
} from "@/lib/constants/settings-options";

const TOTAL_STEPS = 6; // 0-5

// Fields that support AI suggestions
type SuggestableField = "areasOfFocus" | "productsServices" | "currentChallenges" | "shortTermGoals";

interface FormData {
    userRole: string;
    yearsExperience: string;
    areasOfFocus: string;
    companyName: string;
    industry: string;
    companySize: string;
    productsServices: string;
    currentChallenges: string;
    shortTermGoals: string;
    communicationStyle: string;
    responseLength: string;
}

export default function OnboardingPage() {
    const { data: session, update } = useSession();
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [suggestingField, setSuggestingField] = useState<SuggestableField | null>(null);
    const [formData, setFormData] = useState<FormData>({
        userRole: "",
        yearsExperience: "",
        areasOfFocus: "",
        companyName: "",
        industry: "",
        companySize: "",
        productsServices: "",
        currentChallenges: "",
        shortTermGoals: "",
        communicationStyle: "",
        responseLength: "",
    });

    const firstName = session?.user?.name?.split(" ")[0] || "there";

    const updateField = (field: keyof FormData, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // AI suggestion handler
    const handleSuggest = async (field: SuggestableField) => {
        setSuggestingField(field);
        try {
            const response = await fetch("/api/onboarding/suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field, context: formData }),
            });
            if (response.ok) {
                const { suggestion } = await response.json();
                if (suggestion) {
                    updateField(field, suggestion);
                }
            }
        } catch (error) {
            console.error("[Onboarding] Suggest error:", error);
        } finally {
            setSuggestingField(null);
        }
    };

    // Suggest button component
    const SuggestButton = ({ field }: { field: SuggestableField }) => (
        <button
            type="button"
            onClick={() => handleSuggest(field)}
            disabled={suggestingField !== null}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-red hover:text-primary-red/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {suggestingField === field ? (
                <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Suggest for me
                </>
            )}
        </button>
    );

    // Save step data to the server
    const saveStepData = async (fields: Partial<FormData>, complete = false) => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: fields, complete }),
            });
            if (!response.ok) {
                console.error("[Onboarding] Failed to save step data");
            }
        } catch (error) {
            console.error("[Onboarding] Error saving:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Handle "Next" click — save current step's data, advance
    const handleNext = async () => {
        const stepFieldMap: Record<number, (keyof FormData)[]> = {
            1: ["userRole", "yearsExperience", "areasOfFocus"],
            2: ["companyName", "industry", "companySize", "productsServices"],
            3: ["currentChallenges", "shortTermGoals"],
            4: ["communicationStyle", "responseLength"],
        };

        const fields = stepFieldMap[currentStep];
        if (fields) {
            const data: Partial<FormData> = {};
            for (const f of fields) {
                if (formData[f]) data[f] = formData[f];
            }
            if (Object.keys(data).length > 0) {
                await saveStepData(data);
            }
        }

        setCurrentStep((prev) => prev + 1);
    };

    // Handle "Go to Dashboard" on final step
    const handleComplete = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/onboarding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: {}, complete: true }),
            });
            if (!res.ok) {
                console.error("[Onboarding] Failed to complete onboarding");
                setIsSaving(false);
                return;
            }
            // Refresh the JWT token so middleware knows onboarding is done
            await update();
            // Use hard navigation to ensure middleware sees the fresh JWT cookie
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("[Onboarding] Error completing:", error);
            setIsSaving(false);
        }
    };

    // Handle "Skip for now"
    const handleSkip = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/onboarding/skip", { method: "POST" });
            if (!res.ok) {
                console.error("[Onboarding] Failed to skip onboarding");
                setIsSaving(false);
                return;
            }
            // Refresh the JWT token so middleware knows onboarding is done
            await update();
            // Use hard navigation to ensure middleware sees the fresh JWT cookie
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("[Onboarding] Error skipping:", error);
            setIsSaving(false);
        }
    };

    const progressPercent = ((currentStep) / (TOTAL_STEPS - 1)) * 100;

    return (
        <div>
            {/* Progress bar */}
            {currentStep > 0 && currentStep < TOTAL_STEPS - 1 && (
                <div className="mb-8">
                    <div className="flex items-center justify-between text-sm text-neutral-500 mb-2">
                        <span>Step {currentStep} of {TOTAL_STEPS - 2}</span>
                        <button
                            onClick={handleSkip}
                            disabled={isSaving}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                    <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-red rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Card container */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-8 md:p-10">
                {/* Step 0: Welcome */}
                {currentStep === 0 && (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-primary-red/10 flex items-center justify-center mx-auto mb-6">
                            <Rocket className="w-8 h-8 text-primary-red" />
                        </div>
                        <h1 className="font-display text-3xl font-bold text-neutral-900 mb-3">
                            Welcome, {firstName}!
                        </h1>
                        <p className="text-neutral-600 text-lg mb-2">
                            Let&apos;s set up your AI advisory team.
                        </p>
                        <p className="text-neutral-500 mb-8">
                            This takes about 2 minutes and helps your advisors give you
                            personalized, relevant guidance.
                        </p>
                        <Button
                            onClick={() => setCurrentStep(1)}
                            className="w-full sm:w-auto px-8"
                            size="lg"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5 ml-1" />
                        </Button>
                        <div className="mt-4">
                            <button
                                onClick={handleSkip}
                                disabled={isSaving}
                                className="text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                            >
                                {isSaving ? "Redirecting..." : "Skip for now"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 1: About You */}
                {currentStep === 1 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold text-neutral-900">
                                    About You
                                </h2>
                                <p className="text-sm text-neutral-500">
                                    Help your advisors understand your role
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                    Your role / title
                                </label>
                                <input
                                    type="text"
                                    value={formData.userRole}
                                    onChange={(e) => updateField("userRole", e.target.value)}
                                    placeholder="e.g. CEO, Founder, CTO, VP of Marketing"
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                    Years of experience
                                </label>
                                <select
                                    value={formData.yearsExperience}
                                    onChange={(e) => updateField("yearsExperience", e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red bg-white"
                                >
                                    <option value="">Select experience level</option>
                                    {experienceLevels.map((level) => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-neutral-700">
                                        What do you spend most of your time on?
                                    </label>
                                    <SuggestButton field="areasOfFocus" />
                                </div>
                                <textarea
                                    value={formData.areasOfFocus}
                                    onChange={(e) => updateField("areasOfFocus", e.target.value)}
                                    placeholder="e.g. Product strategy, fundraising, team building, sales..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Your Company */}
                {currentStep === 2 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                <Building className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold text-neutral-900">
                                    Your Company
                                </h2>
                                <p className="text-sm text-neutral-500">
                                    So your advisors can give industry-specific advice
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                    Company name
                                </label>
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => updateField("companyName", e.target.value)}
                                    placeholder="Your company name"
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                    Industry
                                </label>
                                <select
                                    value={formData.industry}
                                    onChange={(e) => updateField("industry", e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red bg-white"
                                >
                                    <option value="">Select your industry</option>
                                    {industries.map((ind) => (
                                        <option key={ind} value={ind}>
                                            {ind}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                                    Company size
                                </label>
                                <select
                                    value={formData.companySize}
                                    onChange={(e) => updateField("companySize", e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red bg-white"
                                >
                                    <option value="">Select company size</option>
                                    {companySizes.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-neutral-700">
                                        What does your company do?
                                    </label>
                                    <SuggestButton field="productsServices" />
                                </div>
                                <textarea
                                    value={formData.productsServices}
                                    onChange={(e) => updateField("productsServices", e.target.value)}
                                    placeholder="Briefly describe your products or services"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Your Goals */}
                {currentStep === 3 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                <Target className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold text-neutral-900">
                                    Your Goals
                                </h2>
                                <p className="text-sm text-neutral-500">
                                    Help your advisors focus on what matters most
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-neutral-700">
                                        What are your biggest business challenges right now?
                                    </label>
                                    <SuggestButton field="currentChallenges" />
                                </div>
                                <textarea
                                    value={formData.currentChallenges}
                                    onChange={(e) => updateField("currentChallenges", e.target.value)}
                                    placeholder="e.g. Scaling operations, finding product-market fit, hiring key roles..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-sm font-medium text-neutral-700">
                                        What are your goals for the next 3-6 months?
                                    </label>
                                    <SuggestButton field="shortTermGoals" />
                                </div>
                                <textarea
                                    value={formData.shortTermGoals}
                                    onChange={(e) => updateField("shortTermGoals", e.target.value)}
                                    placeholder="e.g. Launch new product, grow revenue 30%, expand to new market..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Preferences */}
                {currentStep === 4 && (
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                                <Settings2 className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold text-neutral-900">
                                    Communication Preferences
                                </h2>
                                <p className="text-sm text-neutral-500">
                                    How should your advisors communicate with you?
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-3">
                                    Communication style
                                </label>
                                <div className="space-y-3">
                                    {communicationStyles.map((style) => (
                                        <button
                                            key={style.value}
                                            type="button"
                                            onClick={() => updateField("communicationStyle", style.value)}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                formData.communicationStyle === style.value
                                                    ? "border-primary-red bg-primary-red/5"
                                                    : "border-neutral-200 hover:border-neutral-300"
                                            }`}
                                        >
                                            <div className="font-medium text-neutral-900">
                                                {style.label}
                                            </div>
                                            <div className="text-sm text-neutral-500 mt-0.5">
                                                {style.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-3">
                                    Response length
                                </label>
                                <div className="space-y-3">
                                    {responseLengths.map((length) => (
                                        <button
                                            key={length.value}
                                            type="button"
                                            onClick={() => updateField("responseLength", length.value)}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                                                formData.responseLength === length.value
                                                    ? "border-primary-red bg-primary-red/5"
                                                    : "border-neutral-200 hover:border-neutral-300"
                                            }`}
                                        >
                                            <div className="font-medium text-neutral-900">
                                                {length.label}
                                            </div>
                                            <div className="text-sm text-neutral-500 mt-0.5">
                                                {length.desc}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: All Set */}
                {currentStep === 5 && (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3">
                            You&apos;re all set!
                        </h2>
                        <p className="text-neutral-600 mb-8">
                            Your AI advisory team is ready. Here&apos;s what you can do:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
                            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-neutral-900 mb-1">
                                    Chat with Advisors
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    Get strategic guidance from 7 specialized AI advisors
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                                    <FolderOpen className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-neutral-900 mb-1">
                                    Company Library
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    Upload documents and get AI-powered answers
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                                <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center mb-3">
                                    <Zap className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="font-semibold text-neutral-900 mb-1">
                                    Content Engine
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    Generate blog posts, LinkedIn content, and more
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100">
                                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
                                    <Users className="w-5 h-5 text-amber-600" />
                                </div>
                                <h3 className="font-semibold text-neutral-900 mb-1">
                                    Round Table
                                </h3>
                                <p className="text-sm text-neutral-500">
                                    Get multi-advisor perspectives on tough decisions
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleComplete}
                            className="w-full sm:w-auto px-8"
                            size="lg"
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Setting up...
                                </>
                            ) : (
                                <>
                                    Go to Dashboard
                                    <ArrowRight className="w-5 h-5 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Navigation buttons (steps 1-4) */}
                {currentStep >= 1 && currentStep <= 4 && (
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
                        <button
                            onClick={() => setCurrentStep((prev) => prev - 1)}
                            className="flex items-center gap-1 text-neutral-500 hover:text-neutral-700 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                        <Button
                            onClick={handleNext}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : currentStep === 4 ? (
                                <>
                                    Finish
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
