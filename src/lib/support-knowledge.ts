// src/lib/support-knowledge.ts
// Comprehensive product knowledge for the support chatbot.
// This document is injected as context into every support chat request.

export const SUPPORT_KNOWLEDGE = `
# CEO Sidekick — Product Knowledge Base

## What is CEO Sidekick?
CEO Sidekick is an AI-powered business toolkit designed for small business owners, entrepreneurs, and startup founders. It provides a virtual board of advisors, content creation tools, a company knowledge base, goal tracking, and more — all in one platform.

---

## AI Advisors (Chat)
Access via the **Chat** page in the sidebar. Select an advisor from the dropdown at the top.

### Technology Partner (Virtual CTO/CIO)
- Technology stack recommendations, digital transformation roadmaps
- Vendor evaluation & selection, IT budget optimization
- Security & compliance guidance
- Example: "Should I build a custom app or use off-the-shelf software?"
- Navigate: Sidebar → Chat → Select "Technology Partner"

### Executive Coach (Leadership Partner)
- Decision-making frameworks, leadership development
- Difficult conversation preparation, goal setting (OKRs/KPIs)
- Work-life balance coaching
- Example: "Help me prepare for a difficult conversation with an underperforming employee"
- Navigate: Sidebar → Chat → Select "Executive Coach"

### Legal Advisor (Contract & Compliance)
- Contract review & red flags, terms of service guidance
- Business structure advice, IP protection overview
- Compliance checklists
- Note: Educational only — not a substitute for licensed legal counsel
- Navigate: Sidebar → Chat → Select "Legal Advisor"

### HR Partner (People Operations)
- Job description creation, interview question development
- Performance review frameworks, onboarding checklists
- Employee handbook guidance
- Example: "Help me write a job description for a marketing manager"
- Navigate: Sidebar → Chat → Select "HR Partner"

### Marketing Partner (Growth & Brand Strategy)
- Marketing strategy development, brand positioning
- Digital marketing campaigns, content marketing planning
- Marketing analytics & ROI measurement
- Example: "What marketing channels should I focus on with a $5K monthly budget?"
- Navigate: Sidebar → Chat → Select "Marketing Partner"

### Sales Partner (Revenue & Deals)
- Sales process development, pipeline management
- Objection handling, proposal & pricing strategy
- Sales team coaching
- Example: "How do I handle when prospects say we're too expensive?"
- Navigate: Sidebar → Chat → Select "Sales Partner"

### Knowledge Base (Company AI)
- Q&A powered by your uploaded documents
- Semantic search across all your docs
- Source citations in answers
- Example: "What was decided in last month's strategy meeting?"
- Navigate: Sidebar → Chat → Select "Knowledge Base"
- Requires uploaded documents in Company Library

### Content Engine (Thought Leadership)
- Blog post generation, social media content
- Marketing copy, email campaigns
- Thought leadership pieces
- Navigate: Sidebar → Chat → Select "Content Engine"
- Also has its own dedicated section (see Content Engine below)

---

## Round Table (Multi-Advisor Collaboration)
- Get perspectives from multiple AI advisors on a single question
- Advisors automatically selected based on relevance
- Responses synthesized into a unified recommendation
- Available on PowerUser, Pro, and Team plans only
- Navigate: Sidebar → Round Table
- Example: "I'm thinking about expanding into a new market — what should I consider?"

---

## Content Engine
Navigate: Sidebar → Content Engine

### LinkedIn Posts
- AI-generated short-form posts (150-300 words)
- Post types: Insight, Story, Tips, Question, Celebration, Behind-the-Scenes
- Tone options: Professional, Conversational, Inspiring, Educational, Humorous
- Writer profiles: Write as yourself or as an AI advisor persona
- 3000 character limit (LinkedIn max)
- Navigate: Content Engine → LinkedIn Posts → New Post

### Bulk Create Posts
- Generate 1-31 research-driven LinkedIn posts at once (full month of content)
- Web research powered by Tavily for real data and trends
- Choose a theme or let AI pick diverse topics
- Review, edit, and regenerate individual posts
- Schedule all posts with AI-suggested optimal times
- Navigate: Content Engine → LinkedIn Posts → Bulk Create

### LinkedIn Articles
- Long-form articles (800-1500 words)
- SEO-optimized with compelling hooks
- Markdown formatting with bold key points
- Can generate a companion post to promote the article

### Web Blogs
- Full blog posts (1000-2000 words)
- YAML frontmatter (title, description, category, tags)
- Can publish to GitHub or store internally

### Campaigns
- Generate multiple content types from a single brief
- Includes: hero image, LinkedIn article, LinkedIn post, web blog
- All pieces share consistent messaging

### Image Generation
- AI-generated images via DALL-E 3
- Professional, business-appropriate visuals
- Used as hero images for articles and blogs

### LinkedIn Integration
- Connect your personal LinkedIn profile
- Connect LinkedIn organization/company pages
- Publish posts directly or schedule for later
- Scheduling: Set date/time, choose personal or org page, set visibility (Public/Connections)
- Scheduled posts are published automatically via a cron job every 5 minutes
- Navigate: Settings → Content & Publishing → LinkedIn sections

---

## Company Library (Knowledge Base)
- Upload company documents (PDF, DOCX, TXT, etc.)
- Documents are chunked and embedded for semantic search
- Powers the Knowledge Base AI advisor
- Navigate: Sidebar → Company Library

---

## Goals
- Create and track business goals with AI assistance
- Categories: Revenue, Product, Team, Operations, Marketing
- AI generates step-by-step action plans for each goal
- Track progress with completion status per step
- Set target dates for accountability
- Navigate: Sidebar → Goals

---

## Settings
Navigate: Sidebar → Settings

### Your Profile
- Set your role/title, years of experience, areas of focus
- This personalizes AI advisor responses

### Company Profile
- Company name, industry, size, products/services, target market
- Enriches all advisor conversations with company context
- Complete this for better, more relevant AI responses

### Business Context
- Current goals, challenges, tech stack, team structure
- Provides deeper context to advisors

### AI Preferences
- Communication style (concise, detailed, conversational)
- Response length preferences

### Content & Publishing
- Blog directories, site URL
- LinkedIn profile connection
- GitHub repo integration for blog publishing

### Billing & Plans
- View current plan and usage
- Upgrade or manage subscription

---

## Pricing & Credits

### Free Plan — $0/month
- 15 credits per month
- Access to all AI advisors
- 5MB document storage

### PowerUser Plan — $29/month
- 250 credits per month
- Everything in Free, plus:
- Round Table multi-advisor collaboration
- 100MB document storage

### Pro Plan — $199/month
- 2,500 credits per month
- Everything in PowerUser, plus:
- API access and custom integrations
- 500MB document storage

### How Credits Work
- Each AI message costs approximately 1 credit
- Credit cost is token-scaled: 1 credit = ~3,000 tokens
- Voice mode costs 3x regular credits
- Content generation: LinkedIn post = 1 credit, article = 3 credits, blog = 3 credits, image = 3 credits
- Credits reset monthly
- You can purchase additional credit packs if you run out

---

## Getting Started (Onboarding)
1. Create an account (Google, GitHub, or email)
2. Complete the 6-step onboarding (~2 minutes):
   - Your role and experience
   - Company information
   - Business goals and challenges
   - Communication preferences
3. Start chatting with any AI advisor
4. Upload documents to the Company Library for personalized Q&A
5. Try the Content Engine for LinkedIn posts
6. Set up Goals to track your progress

---

## Tips for Getting the Most Value
- Complete your Company Profile in Settings — this dramatically improves advisor responses
- Upload key documents (business plans, meeting notes, strategies) to the Company Library
- Use the Round Table when facing cross-functional decisions
- Try different AI advisors for different types of questions
- Use the Content Engine's bulk create feature for consistent LinkedIn presence
- Set and track Goals to stay accountable

---

## Common Questions

**Q: How do I connect my LinkedIn account?**
A: Go to Settings → Content & Publishing → scroll to the LinkedIn section. Click "Connect LinkedIn" for personal or "Connect Organization" for company pages.

**Q: Why are my AI responses generic?**
A: Complete your Company Profile in Settings. The more context you provide (industry, products, target market), the more tailored responses become.

**Q: What's the difference between Chat and Content Engine?**
A: Chat is for conversations and advice. Content Engine is specifically for generating publishable content (posts, articles, blogs) with formatting, scheduling, and LinkedIn integration.

**Q: Can I use CEO Sidekick for free?**
A: Yes! The Free plan includes 15 credits per month and access to all AI advisors. Upgrade for more credits and features like Round Table.

**Q: How do I cancel or change my plan?**
A: Go to Settings → Billing & Plans, or click Pricing in the sidebar.

**Q: What file types can I upload to the Company Library?**
A: PDF, DOCX, TXT, and other common document formats. Files are processed for semantic search.
`;
