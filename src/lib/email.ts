// src/lib/email.ts
// Email utility using Resend for transactional emails

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified domain in production, Resend onboarding email for dev
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "CEO Sidekick <onboarding@resend.dev>";

export async function sendPasswordResetEmail(email: string, token: string) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Reset your CEO Sidekick password",
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #171717; font-size: 24px; margin: 0 0 8px 0;">Reset Your Password</h1>
                    <p style="color: #737373; font-size: 16px; margin: 0;">
                        Click the button below to set a new password for your CEO Sidekick account.
                    </p>
                </div>
                <div style="text-align: center; margin-bottom: 32px;">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #E53935; color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Reset Password
                    </a>
                </div>
                <p style="color: #a3a3a3; font-size: 14px; text-align: center; margin: 0 0 8px 0;">
                    This link will expire in 1 hour. If you didn&rsquo;t request a password reset, you can safely ignore this email.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
                <p style="color: #a3a3a3; font-size: 12px; text-align: center; margin: 0;">
                    CEO Sidekick by Full Stack Data Solutions
                </p>
            </div>
        `,
    });

    if (error) {
        console.error("[Email] Failed to send password reset email:", error);
        throw new Error("Failed to send password reset email");
    }
}
