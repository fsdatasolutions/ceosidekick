import "dotenv/config";
import { db } from "./index";
import { users, organizations, orgMembers, userSettings } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Starting database seed...\n");

  try {
    // Create demo user
    console.log("Creating demo user...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    const [demoUser] = await db
      .insert(users)
      .values({
        email: "demo@ceosidekick.biz",
        password: hashedPassword,
        name: "Demo User",
        emailVerified: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    if (demoUser) {
      console.log(`✓ Created user: ${demoUser.email}`);

      // Create demo organization
      console.log("Creating demo organization...");
      const [demoOrg] = await db
        .insert(organizations)
        .values({
          name: "Demo Company",
          slug: "demo-company",
          plan: "professional",
        })
        .onConflictDoNothing()
        .returning();

      if (demoOrg) {
        console.log(`✓ Created organization: ${demoOrg.name}`);

        // Add user to organization
        await db
          .insert(orgMembers)
          .values({
            organizationId: demoOrg.id,
            userId: demoUser.id,
            role: "owner",
          })
          .onConflictDoNothing();

        console.log(`✓ Added ${demoUser.email} as owner of ${demoOrg.name}`);
      }

      // Create sample user settings
      console.log("Creating sample user settings...");
      await db
        .insert(userSettings)
        .values({
          userId: demoUser.id,
          // Company Profile
          companyName: "GreenLeaf Technologies",
          industry: "Technology / Software",
          companySize: "11-50 employees",
          annualRevenue: "$1M - $5M",
          productsServices: "B2B SaaS platform for sustainable supply chain management. We help mid-market manufacturers track and reduce their carbon footprint across their entire supply chain.",
          targetMarket: "Mid-market manufacturing companies (100-1000 employees) in North America and Europe, particularly those in automotive, electronics, and consumer goods sectors.",
          // User Profile
          userRole: "CEO & Co-Founder",
          yearsExperience: "10-20 years",
          areasOfFocus: "Product strategy, fundraising, key partnerships, and scaling the team. I'm technical but spending less time coding these days.",
          // Business Context
          currentChallenges: "1. Scaling our sales team - we've proven product-market fit but need to grow revenue faster. 2. Deciding whether to build or buy certain features (AI/ML capabilities). 3. Preparing for Series A fundraising in Q2.",
          shortTermGoals: "Close Series A at $8-10M valuation. Grow ARR from $800K to $1.5M. Hire VP of Sales and 3 more engineers.",
          longTermGoals: "Become the leading sustainability platform for manufacturing. Expand to Europe. Reach $10M ARR within 3 years.",
          techStack: "Next.js, TypeScript, PostgreSQL, AWS (ECS, RDS, S3), Vercel for frontend. Using Stripe for billing, HubSpot for CRM, Slack for internal comms.",
          teamStructure: "32 people total: 12 engineering (3 teams), 8 sales/CS, 5 marketing, 4 ops/finance, 3 co-founders. Engineering reports to CTO, sales to me temporarily until we hire VP Sales.",
          // Preferences
          communicationStyle: "casual",
          responseLength: "detailed",
        })
        .onConflictDoNothing();

      console.log("✓ Created sample user settings");
    } else {
      console.log("Demo user already exists, skipping...");
    }

    console.log("\n✅ Seed completed successfully!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
