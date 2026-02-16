// src/app/(marketing)/terms/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms of Service | CEO Sidekick",
    description: "Terms of Service for CEO Sidekick — the rules governing use of our platform.",
};

export default function TermsPage() {
    const lastUpdated = "February 16, 2026";

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                    Terms of Service
                </h1>
                <p className="text-neutral-500 mb-12">Last updated: {lastUpdated}</p>

                <div className="prose prose-neutral max-w-none">
                    <p>
                        These Terms of Service (&quot;Terms&quot;) govern your access to and use of CEO Sidekick
                        (the &quot;Service&quot;), operated by Full Stack Data Solutions (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
                        By using the Service, you agree to be bound by these Terms.
                    </p>

                    <h2>1. Description of Service</h2>
                    <p>
                        CEO Sidekick is an AI-powered business advisory platform that provides access to
                        virtual AI advisors across multiple business domains. The Service includes chat-based
                        advisory, document storage and retrieval, business document generation, and
                        multi-advisor collaboration features.
                    </p>

                    <h2>2. Accounts</h2>
                    <p>
                        You must create an account to use the Service. You are responsible for maintaining
                        the security of your account credentials and for all activity that occurs under your account.
                        You must be at least 18 years old to use the Service.
                    </p>

                    <h2>3. Subscriptions and Payments</h2>
                    <p>
                        The Service offers free and paid subscription tiers. Paid subscriptions are billed
                        monthly through Stripe. You may cancel your subscription at any time, and cancellation
                        takes effect at the end of the current billing period. We reserve the right to change
                        pricing with 30 days&apos; notice.
                    </p>

                    <h2>4. Acceptable Use</h2>
                    <p>You agree not to:</p>
                    <ul>
                        <li>Use the Service for any unlawful purpose</li>
                        <li>Attempt to gain unauthorized access to the Service or its systems</li>
                        <li>Upload malicious content or documents designed to exploit the AI system</li>
                        <li>Resell, redistribute, or sublicense access to the Service</li>
                        <li>Use automated tools to scrape or extract data from the Service</li>
                        <li>Circumvent usage limits or subscription restrictions</li>
                    </ul>

                    <h2>5. AI-Generated Content Disclaimer</h2>
                    <p>
                        CEO Sidekick provides AI-generated advisory content for informational purposes only.
                        This content does not constitute professional legal, financial, medical, or accounting
                        advice. You should consult qualified professionals before making business decisions
                        based on AI-generated recommendations. We make no guarantees regarding the accuracy,
                        completeness, or suitability of AI responses.
                    </p>

                    <h2>6. Your Content</h2>
                    <p>
                        You retain ownership of all documents and data you upload to the Service. By uploading
                        content, you grant us a limited license to process, store, and use that content solely
                        to provide the Service to you. We will not share your uploaded content with other users
                        unless you explicitly enable team sharing features.
                    </p>

                    <h2>7. Intellectual Property</h2>
                    <p>
                        The Service, including its design, features, and underlying technology, is owned by
                        Full Stack Data Solutions. You may not copy, modify, or reverse-engineer any part
                        of the Service.
                    </p>

                    <h2>8. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, CEO Sidekick and Full Stack Data Solutions
                        shall not be liable for any indirect, incidental, special, consequential, or punitive
                        damages arising from your use of the Service, including but not limited to business
                        losses resulting from reliance on AI-generated advice.
                    </p>

                    <h2>9. Termination</h2>
                    <p>
                        We may suspend or terminate your account if you violate these Terms or engage in
                        activity that harms the Service or other users. You may delete your account at any
                        time by contacting us at{" "}
                        <a href="mailto:support@ceosidekick.biz">support@ceosidekick.biz</a>.
                    </p>

                    <h2>10. Changes to These Terms</h2>
                    <p>
                        We may update these Terms from time to time. Continued use of the Service after
                        changes constitutes acceptance of the updated Terms. We will notify you of material
                        changes via email or through the Service.
                    </p>

                    <h2>11. Contact Us</h2>
                    <p>
                        If you have questions about these Terms, please contact us at{" "}
                        <a href="mailto:support@ceosidekick.biz">support@ceosidekick.biz</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}