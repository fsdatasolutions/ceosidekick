// src/app/(marketing)/privacy/page.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy | CEO Sidekick",
    description: "Privacy Policy for CEO Sidekick — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
    const lastUpdated = "February 16, 2026";

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                    Privacy Policy
                </h1>
                <p className="text-neutral-500 mb-12">Last updated: {lastUpdated}</p>

                <div className="prose prose-neutral max-w-none">
                    <p>
                        CEO Sidekick (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by Full Stack Data Solutions.
                        This Privacy Policy explains how we collect, use, disclose, and safeguard your
                        information when you use the CEO Sidekick platform at ceosidekick.biz (the &quot;Service&quot;).
                    </p>

                    <h2>Information We Collect</h2>
                    <p>
                        <strong>Account Information:</strong> When you create an account, we collect your name,
                        email address, and authentication credentials (via third-party providers such as Google or GitHub).
                    </p>
                    <p>
                        <strong>Usage Data:</strong> We collect information about how you interact with the Service,
                        including messages sent to AI advisors, features used, and session duration.
                    </p>
                    <p>
                        <strong>Documents:</strong> If you use the Company Library feature, we store documents you
                        upload to provide AI-powered retrieval and search. Documents are stored securely in
                        Google Cloud Storage and are only accessible to your account.
                    </p>
                    <p>
                        <strong>Payment Information:</strong> Payment processing is handled by Stripe. We do not
                        store credit card numbers or bank account details on our servers.
                    </p>

                    <h2>How We Use Your Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li>Provide, maintain, and improve the Service</li>
                        <li>Process your transactions and manage your subscription</li>
                        <li>Generate AI-powered responses tailored to your context</li>
                        <li>Send you service-related communications</li>
                        <li>Monitor usage to enforce subscription limits</li>
                        <li>Detect and prevent fraud or abuse</li>
                    </ul>

                    <h2>Third-Party Services</h2>
                    <p>
                        We use the following third-party services to operate the platform:
                    </p>
                    <ul>
                        <li><strong>Anthropic (Claude):</strong> AI model provider for generating advisory responses</li>
                        <li><strong>OpenAI:</strong> Embedding generation for document search</li>
                        <li><strong>Google Cloud:</strong> Document storage infrastructure</li>
                        <li><strong>Stripe:</strong> Payment processing</li>
                        <li><strong>Neon:</strong> Database hosting</li>
                        <li><strong>Render:</strong> Application hosting</li>
                    </ul>
                    <p>
                        Each of these providers has their own privacy policies governing their handling of data.
                    </p>

                    <h2>Data Retention</h2>
                    <p>
                        We retain your account data and conversation history for as long as your account is active.
                        You may delete your account and associated data at any time by contacting us at{" "}
                        <a href="mailto:support@ceosidekick.biz">support@ceosidekick.biz</a>.
                    </p>

                    <h2>Data Security</h2>
                    <p>
                        We implement industry-standard security measures including encrypted data transmission (TLS),
                        secure authentication, and access controls. However, no method of electronic transmission
                        or storage is 100% secure.
                    </p>

                    <h2>Your Rights</h2>
                    <p>
                        Depending on your location, you may have the right to access, correct, or delete your
                        personal data. To exercise these rights, contact us at{" "}
                        <a href="mailto:support@ceosidekick.biz">support@ceosidekick.biz</a>.
                    </p>

                    <h2>Changes to This Policy</h2>
                    <p>
                        We may update this Privacy Policy from time to time. We will notify you of any material
                        changes by posting the updated policy on this page with a revised &quot;Last updated&quot; date.
                    </p>

                    <h2>Contact Us</h2>
                    <p>
                        If you have questions about this Privacy Policy, please contact us at{" "}
                        <a href="mailto:support@ceosidekick.biz">support@ceosidekick.biz</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}