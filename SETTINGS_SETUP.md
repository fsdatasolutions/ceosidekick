# Settings Integration for Dynamic Agent Personalization

This update connects the Settings page to the AI agents, so they respond with personalized context based on your business information.

## What's Changed

### 1. Database Schema (`src/db/schema.ts`)
- Fixed duplicate relation definition

### 2. Seed Data (`src/db/seed.ts`)
- Added sample user settings for the demo user
- Settings represent a realistic B2B SaaS company scenario

### 3. Agent Graph (`src/agents/graph.ts`)
- New `buildUserContext()` function that formats settings into system prompt sections
- New `buildPreferences()` function that applies communication style preferences
- `streamConversation()` now accepts `settings` parameter

### 4. Chat API (`src/app/api/chat/route.ts`)
- Fetches user settings before each conversation
- Passes settings to `streamConversation()` for personalization

## Sample Settings Data

The seed creates a demo user with this profile:

| Field | Value |
|-------|-------|
| Company | GreenLeaf Technologies |
| Industry | Technology / Software |
| Size | 11-50 employees |
| Revenue | $1M - $5M |
| Role | CEO & Co-Founder |
| Experience | 10-20 years |

**Business Context:**
- B2B SaaS for sustainable supply chain management
- Preparing for Series A fundraising
- Growing from $800K to $1.5M ARR
- Hiring VP of Sales and engineers

**Tech Stack:**
- Next.js, TypeScript, PostgreSQL, AWS
- Stripe, HubSpot, Slack

## How It Works

When you chat with any agent, the system:

1. Fetches your settings from the database
2. Builds a "User Context" section that gets appended to the base system prompt
3. Applies communication preferences (formal/casual, concise/detailed)

**Example system prompt addition:**

```
## User Context
The following information has been provided about the user and their business:

**Company Profile**
Company: GreenLeaf Technologies
Industry: Technology / Software
Size: 11-50 employees
Revenue: $1M - $5M

**User Profile**
Role: CEO & Co-Founder
Experience: 10-20 years
Focus Areas: Product strategy, fundraising, key partnerships...

**Current Context**
Current Challenges: Scaling sales team, build vs buy decisions...
Short-term Goals: Close Series A, grow ARR...

## Communication Preferences
Use a casual, conversational tone. Provide detailed explanations with reasoning.
```

## Setup Steps

1. **Replace files** from this package into your project

2. **Push schema changes** to database:
   ```bash
   npm run db:push
   ```

3. **Re-seed the database** (optional - adds sample settings):
   ```bash
   # First, you may need to clear existing data or just add settings manually
   npm run db:seed
   ```

4. **Test it out:**
   - Go to Settings page and fill in your info (or use the seeded demo data)
   - Start a new chat with Strategy Partner
   - Ask something like "What should I prioritize this quarter?"
   - The response should reference your company context!

## Testing the Personalization

Try these prompts to see personalization in action:

**Strategy Partner:**
- "What should I prioritize this quarter?" 
- "Should I build or buy AI/ML capabilities?"
- "Help me prepare for our Series A pitch"

**HR Partner:**
- "Help me write a job description for VP of Sales"
- "How should I structure compensation for our stage?"

**Expected behavior:** The agents should reference your company name, industry, team size, challenges, and goals in their responses.

## Customizing Settings

Edit settings via:
1. **Settings page** (`/settings`) - Fill out the form
2. **Database directly** - Update `user_settings` table
3. **Seed file** - Modify `src/db/seed.ts` for different demo data

## Troubleshooting

**Settings not being applied:**
- Check server logs for `[API] Loaded user settings: yes`
- Verify settings exist in database: `SELECT * FROM user_settings;`
- Make sure you're logged in as the correct user

**Database errors after schema change:**
- Run `npm run db:push` to sync schema
- Check for any migration conflicts
