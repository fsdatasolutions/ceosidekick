/**
 * Temporarily set a password on the Google OAuth user account
 * so Playwright can log in via credentials for video recording.
 *
 * Usage:
 *   npx tsx scripts/feature-videos/set-video-password.ts
 */

import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcryptjs";
import postgres from "postgres";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const VIDEO_PASSWORD = "video-recording-temp-2024";
const USER_EMAIL = "shannonamcgill@gmail.com";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set. Check your .env.local file.");
    process.exit(1);
  }

  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  });

  try {
    // Hash the temporary password
    const hashedPassword = await bcrypt.hash(VIDEO_PASSWORD, 10);

    // Update the user's password
    const result = await sql`
      UPDATE users
      SET password = ${hashedPassword}, updated_at = NOW()
      WHERE LOWER(email) = LOWER(${USER_EMAIL})
      RETURNING id, email, name
    `;

    if (result.length === 0) {
      console.error(`❌ No user found with email: ${USER_EMAIL}`);
      process.exit(1);
    }

    const user = result[0];
    console.log(`\n✅ Password set for video recording:`);
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   ID:   ${user.id}`);
    console.log(`\n   You can now run: npm run generate-feature-videos\n`);
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
