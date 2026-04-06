# CEO Sidekick — Tutorial Narration Scripts

Use these scripts to generate voiceover audio with `npm run generate-tutorial-audio` and `npm run generate-feature-audio`, then record your screen manually while the audio plays.

---

## Tutorial Videos (8 new)

### 1. Platform Overview & Dashboard Tour
**File:** `scripts/tutorial-videos/tutorials/onboarding.ts`
**Duration:** ~90 seconds
**Start on:** Dashboard (`/dashboard`)

> Welcome to CEO Sidekick. This is your dashboard — the command center for everything you do on the platform. From here you have instant access to all the tools and AI advisors that help you run your business more effectively.
>
> At the top of the dashboard you will see the tools grid. These are the core features of the platform: Chat for real-time AI advisor conversations, Templates for reusable prompt frameworks, Company Library for storing and referencing your business documents, Content Engine for generating LinkedIn posts and campaigns, Goals for tracking your strategic objectives, and Round Table for multi-advisor brainstorming sessions. Each card takes you directly into that feature with one click.
>
> On the left sidebar you will find persistent navigation to every area of the platform. This is how you move between Chat, Company Library, Content Engine, Goals, Settings, and more. The sidebar stays accessible from every page so you always know where you are and where to go next.
>
> Below the tools grid you will find your AI advisor team. These are specialized advisors covering areas like marketing, strategy, operations, finance, and leadership. Each card shows the advisor name and what they specialize in. Clicking any advisor card opens a direct conversation where the AI draws on your company context and preferences to give tailored advice.
>
> Further down the dashboard you can see your credit usage display showing how many credits you have used out of your total allocation, along with your recent conversations so you can quickly pick up where you left off. The dashboard gives you a complete picture of your activity and resources at a glance.

**What to show on screen:**
- Start on dashboard, scroll to reveal tools grid
- Hover over each tool card (Chat, Templates, Company Library, Content Engine, Goals, Round Table)
- Scroll back up, hover through sidebar nav links
- Scroll down to AI advisor team, hover over advisor cards
- Scroll to credit usage and recent conversations
- Scroll back to top

---

### 2. Settings & Personalization
**File:** `scripts/tutorial-videos/tutorials/settings-personalization.ts`
**Duration:** ~85 seconds
**Start on:** Settings (`/settings`)

> Let's take a look at how you can personalize CEO Sidekick to match your working style and business context. Getting these settings right makes every AI interaction dramatically more relevant and useful.
>
> Start with Your Profile at the top of the settings page. Here you will enter your role, your years of experience, and your primary areas of focus. This tells every AI advisor who they are talking to so they can calibrate the depth and angle of their responses accordingly.
>
> Next comes your Company Profile. Enter your company name, industry, company size, the products or services you offer, and your target market. This context is critical because it allows every advisor to tailor their guidance to your specific business situation rather than giving generic advice. Below that is the Business Context section where you describe your current goals, key challenges, and technology stack. The more detail you provide here, the better your results will be across the entire platform.
>
> Scroll down to AI Preferences where you can fine-tune how the AI communicates with you. Adjust your preferred communication style and response length so the advisors match your expectations. Some users prefer concise bullet points while others want detailed explanations — this is where you set that.
>
> The final sections are Content and Publishing, where you configure your blog directories and manage your LinkedIn connections, and Billing and Plans where you can view your current subscription. Completing all of these settings sections is one of the single biggest things you can do to improve the quality of AI responses across the entire platform.

**What to show on screen:**
- Start on settings page, scroll to Your Profile section
- Hover over role and experience fields
- Scroll to Company Profile, hover over company name and industry fields
- Scroll to Business Context section
- Scroll to AI Preferences, hover over communication style options
- Scroll to Content & Publishing and Billing sections
- Scroll back to top

---

### 3. Creating LinkedIn Posts
**File:** `scripts/tutorial-videos/tutorials/linkedin-posts.ts`
**Duration:** ~80 seconds
**Start on:** LinkedIn Posts list (`/content-engine/linkedin-posts`)

> Let's walk through creating a LinkedIn post from scratch using the Content Engine. This is one of the most frequently used features in CEO Sidekick.
>
> From the LinkedIn Posts page you will see your existing posts and a button to create a new one. Click that and you will be taken to the AI generation form. Start by entering your topic or a brief idea — it can be as simple as a few words or a full paragraph describing what is on your mind. The more context you give the AI, the better the output.
>
> Next, choose your post type. You can pick from thought leadership, storytelling, how-to guides, industry commentary, or personal updates. Each type follows a different structure that guides the AI when generating your draft. Then select your tone — professional, conversational, inspirational, or bold. You can also pick a Writer Profile if you have set up multiple voices for different contexts, ensuring the output matches the right person's style.
>
> Once you hit generate, the AI produces a full draft in seconds. You will land in the editor which is a straightforward textarea where you can refine the text, adjust wording, add emojis or hashtags, and see a character count to make sure your post fits LinkedIn's limits. The editing experience is clean and simple — just you and your content with no distractions.
>
> When you are happy with the post, you have three options: save it as a draft to come back to later, schedule it for a specific date and time to be published automatically, or publish it immediately to your connected LinkedIn account. Every post is tracked in your content library so you can revisit and repurpose your best content over time.

**What to show on screen:**
- Start on LinkedIn Posts list, show existing posts
- Click "New Post" button, navigate to creation form
- Hover over topic input, type a topic
- Show post type options, hover through them
- Show tone options, hover through them
- Show Writer Profile selector
- Click Generate, show the editor with generated content
- Show character count, hover over Save/Schedule buttons

---

### 4. Bulk Create Posts
**File:** `scripts/tutorial-videos/tutorials/bulk-create-posts.ts`
**Duration:** ~85 seconds
**Start on:** Bulk Create page (`/content-engine/linkedin-posts/bulk`)

> If you want to build out a full week or month of LinkedIn content in one sitting, bulk post creation is the way to go. Let's walk through how it works.
>
> On the bulk creation page you will start by selecting how many posts you want to generate. Use the slider to pick anywhere from one to twenty posts. Below that you will choose a theme — this keeps all your generated posts cohesive. You might pick something like leadership insights, product updates, or industry trends. The theme guides the AI so every post in the batch feels connected.
>
> Next, select the Writer Profile. If you manage content for multiple team members, you can choose whose voice and style the AI should use for this batch. Each writer profile pulls in that person's preferences, writing style, and tone settings automatically so the output feels authentic to them. This is powered by the WriterProfileSelector component which shows all configured profiles.
>
> Once you hit generate, the AI goes to work creating all your posts at once. Behind the scenes, Tavily web research runs for each post, pulling in current data and trends to make your content research-driven and timely. You will see a progress indicator and then a scrollable list of drafts. Each post can be individually edited, reordered, or removed. Click into any post to open the full editor and make refinements.
>
> The final step is reviewing and saving your batch. Each post is saved as a draft that you can then schedule individually from the LinkedIn Posts page. The platform suggests optimal posting times to help you space out your content. When everything looks good, confirm the batch and all posts are queued up as drafts ready for scheduling. You have just planned weeks of content in minutes.

**What to show on screen:**
- Start on bulk create page, show the configuration form
- Adjust the post count slider (e.g., drag to 5)
- Type a theme in the theme input
- Scroll to show Writer Profile selector, hover through profiles
- Show tone and post type options
- Click Generate, show the generating/progress state
- Show the generated posts list, scroll through them
- Click edit on one post, show inline editing
- Click regenerate on another post
- Show the Schedule step with date/time suggestions

---

### 5. Content Campaigns
**File:** `scripts/tutorial-videos/tutorials/content-campaigns.ts`
**Duration:** ~80 seconds
**Start on:** Campaign creation wizard (`/content-engine/create`)

> Content campaigns let you generate a complete set of multi-format content from a single brief. This is perfect when you have a product launch, thought leadership topic, or big announcement to promote across channels.
>
> The campaign creation wizard starts with your brief. In step one you will enter the topic for your campaign, define your target audience, list the key points you want to cover, and select your preferred tone. You can also choose an author from your writer profiles so the generated content matches a specific voice and style. Be as detailed as possible here because the AI uses every detail to craft more targeted content.
>
> In step two you select which output formats you want the AI to generate. The available options are Hero Image, LinkedIn Article, LinkedIn Post, and Web Blog. Check the boxes for each output you need and the platform will generate all of them from your single brief. You can select any combination depending on your campaign goals.
>
> Once you have configured your brief and selected your outputs, hit the generate button. You will see a progress indicator as the AI creates each piece of content. This may take a moment depending on how many outputs you selected, especially if you included a hero image.
>
> When generation is complete you land on the review screen where all your generated content is organized by type. Each piece can be previewed and edited individually. You can refine the LinkedIn post, adjust the blog article, or regenerate any single output without starting over. From here you can save items to your content library, schedule posts, or continue editing until everything is exactly right.

**What to show on screen:**
- Start on campaign wizard step 1
- Fill in topic, target audience, key points
- Select tone, show author/writer profile selector
- Click Next to step 2 (output selection)
- Check boxes: Hero Image, LinkedIn Article, LinkedIn Post, Web Blog
- Click Generate, show progress indicator
- Show the review screen with all generated content
- Click into a generated post to preview/edit

---

### 6. Connecting LinkedIn Accounts
**File:** `scripts/tutorial-videos/tutorials/linkedin-integration.ts`
**Duration:** ~75 seconds
**Start on:** Settings (`/settings`)

> Connecting your LinkedIn account to CEO Sidekick unlocks direct publishing and scheduling so you can go from content creation to live posts without leaving the platform. Let's walk through the integration setup.
>
> Head over to Settings and scroll down to the LinkedIn integration section. You will see two connection options: your personal LinkedIn profile and any LinkedIn organization pages you manage. Starting with your personal account, click the connect button and you will be guided through LinkedIn's standard OAuth flow. Authorize CEO Sidekick to post on your behalf, and you are connected in seconds.
>
> If you manage company pages on LinkedIn, you can connect those too. Click the connect button next to organization pages and select which pages you would like to link. This is especially useful if you create content for your company's official page in addition to your personal brand. Each connected page appears as a publishing destination when you schedule posts, giving you the flexibility to publish to any account from one place.
>
> Once connected, you will see a summary of all your linked accounts with status indicators showing whether each connection is active and healthy. If a token expires or needs re-authentication, the platform will notify you and provide a one-click reconnect option right here on the settings page.
>
> Managing your connections is straightforward. You can disconnect any account at any time if you no longer want CEO Sidekick to publish to that profile, refresh tokens when needed, or add new organization pages as your company grows. The integration is focused on publishing and scheduling — it gives CEO Sidekick the ability to post content on your behalf so you can automate your entire content pipeline.

**What to show on screen:**
- Start on Settings page
- Scroll down to LinkedIn integration section
- Show personal LinkedIn connect button, hover over it
- Show organization pages connect button
- Show connected accounts with status indicators (green = active)
- Hover over disconnect button
- Scroll back to top

---

### 7. Scheduling & Publishing Posts
**File:** `scripts/tutorial-videos/tutorials/scheduling-publishing.ts`
**Duration:** ~80 seconds
**Start on:** LinkedIn Posts list (`/content-engine/linkedin-posts`)

> Scheduling and publishing posts from CEO Sidekick keeps your LinkedIn presence consistent without you needing to be online at the perfect posting time. Let's see how it all works.
>
> From the LinkedIn Posts page you will see your content organized by status tabs: All, Drafts, Scheduled, Failed, Published, and Archived. These tabs let you quickly filter your posts and see exactly where each piece of content stands in your publishing pipeline. Click any tab to filter the list and focus on the posts that need your attention.
>
> To schedule a post, open any draft by clicking on it to go to the post detail page. There you will find the scheduling controls. Pick a date and time using the date and time picker, choose whether to post as your personal profile or your organization page, and set the visibility level. The platform suggests optimal posting times based on proven engagement windows to help you maximize reach.
>
> Once you confirm the schedule, the post moves to your Scheduled tab. This tab shows a list view of all your queued posts with their scheduled dates, times, and which LinkedIn page they will be published to. If plans change, you can cancel any scheduled post to revert it back to a draft. There is no calendar drag-and-drop — it is a clean, simple list that keeps things straightforward.
>
> When the scheduled time arrives, a background cron job automatically publishes your post to LinkedIn. You do not need to be logged in or have the app open. Posts that publish successfully move to the Published tab, and any that encounter issues appear in the Failed tab so you can retry them. This automated pipeline means you can batch your content creation and let the platform handle the rest.

**What to show on screen:**
- Start on LinkedIn Posts list, show status tabs
- Click through tabs: Drafts, Scheduled, Published
- Click into a draft post to open detail page
- Show the scheduling controls: date/time picker, post-as dropdown, visibility
- Click Schedule, show the post move to Scheduled tab
- Click Scheduled tab, show list of scheduled posts with dates and LinkedIn page names
- Hover over a scheduled post showing the date badge

---

### 8. Billing & Credits
**File:** `scripts/tutorial-videos/tutorials/billing-credits.ts`
**Duration:** ~70 seconds
**Start on:** Settings (`/settings`)

> Understanding how credits work in CEO Sidekick helps you get the most out of your plan. Let's take a quick tour of the billing experience and how credit costs break down.
>
> In Settings you will find your usage meter showing how many credits you have used out of your total allocation. Credits are the currency of the platform — every AI interaction consumes them. A standard advisor message costs one credit, generating a LinkedIn post costs one credit, and more intensive outputs like LinkedIn articles, web blog posts, and hero images cost three credits each. If you use voice mode with any advisor, that costs three times the normal rate, so plan accordingly.
>
> CEO Sidekick offers three plans to fit different needs. The Free plan gives you fifteen credits to explore the platform. PowerUser at twenty-nine dollars per month comes with two hundred fifty credits, which is enough for most active users. And the Pro plan at one hundred ninety-nine dollars per month provides twenty-five hundred credits for power users and teams who rely on the platform daily.
>
> To view your current plan details, scroll to the Billing and Plans section in Settings. You will see your plan name, credit balance, and usage for the current period. If you want to upgrade, there is a link in the sidebar to the pricing page where you can compare plans and switch in just a few clicks.
>
> Keeping an eye on your credit usage helps you budget your AI interactions throughout the month. If you find yourself running low, consider whether upgrading to the next tier makes more sense than rationing credits. The goal is to use CEO Sidekick freely without worrying about hitting limits during critical work.

**What to show on screen:**
- Start on Settings, scroll to billing/usage section
- Show usage meter (credits used / total)
- Hover over usage display
- Scroll to plan details section
- Show Pricing link in sidebar
- Scroll back to top

---

## Feature Videos (7 existing)

### 9. Dashboard Overview
**File:** `scripts/feature-videos/features/dashboard.ts`
**Duration:** ~90 seconds
**Start on:** Dashboard (`/dashboard`)

> Welcome to CEO Sidekick — your AI-powered command center for running a business. When you log in, you land on your personalized dashboard. Up top, you can see quick stats showing your credit usage, active conversations, and documents in your library. These give you an instant pulse on your activity.
>
> Below that, you'll find your tools grid. This is your launch pad for everything CEO Sidekick offers. You can jump into one-on-one chats with AI advisors, generate professional documents from templates, manage your company library, create marketing content with the content engine, set and track business goals, or start a round table discussion with multiple advisors at once.
>
> Scrolling down, you'll see your AI advisor team. CEO Sidekick gives you specialized advisors covering technology, executive coaching, legal, HR, marketing, sales, and content creation. Each one is trained for its domain and personalized to your business context.
>
> Finally, your recent conversations are always at your fingertips, so you can pick up right where you left off. The dashboard keeps everything organized and accessible, so you spend less time navigating and more time growing your business.

**What to show on screen:**
- Start on dashboard, scroll to show stats
- Hover over each tool card in the grid
- Scroll to advisor team, hover over advisor cards
- Scroll to recent conversations
- Scroll back to top

---

### 10. AI Advisor Chat
**File:** `scripts/feature-videos/features/advisor-chat.ts`
**Duration:** ~95 seconds
**Start on:** Chat with Technology Partner (`/chat?agent=technology`)

> The AI Advisor Chat is where you get one-on-one guidance from specialized advisors. On the left, you have your conversation sidebar showing your chat history. You can start a new conversation anytime or pick up a previous one.
>
> At the top, you can choose which advisor to speak with. Each advisor has deep expertise in their domain. The Technology Partner acts as your virtual CTO, helping with tech stack decisions and digital transformation. The Executive Coach supports your leadership development. The Legal Advisor helps with contracts and compliance. You also have HR, Marketing, and Sales partners.
>
> When you open a conversation, you'll see the full message thread with rich formatting. The advisor remembers your business context from your settings, so every response is tailored to your specific situation.
>
> Notice the suggested prompts that appear when you start a new chat. These are designed to help you get the most value quickly. You can also toggle voice mode for hands-free interaction. Every conversation is saved and searchable, building an ongoing knowledge base of advice specific to your business.

**What to show on screen:**
- Start on Chat page, click History button to show sidebar
- Close history sidebar
- Click agent name to open agent selector dropdown
- Hover through advisors: Technology, Coach, Legal, Marketing
- Click Marketing Partner to switch
- Show suggested prompts, hover over them
- Type a question in the input
- Hover over voice mode button
- Open history sidebar again briefly

---

### 11. Content Engine
**File:** `scripts/feature-videos/features/content-engine.ts`
**Duration:** ~92 seconds
**Start on:** Content Engine dashboard (`/content-engine`)

> The Content Engine is your AI-powered marketing department. It helps you create professional content at scale. Here on the main page, you can see your content stats at a glance, showing how many images, articles, posts, and blog entries you've created.
>
> You have four content types to work with. Images lets you generate or upload visuals. LinkedIn Articles are for long-form thought leadership. LinkedIn Posts help you create engaging short-form updates. And Web Blogs are for your company website.
>
> Let's look at the LinkedIn Posts section. Here you can see all your posts organized by status — drafts, scheduled, published, and archived. Each post shows a preview of the content and when it was last updated.
>
> Clicking into a post opens the full editor where you can refine the content, copy it to your clipboard, or publish directly. The content engine also supports creating full campaigns, where you enter a brief once and generate coordinated content across images, articles, posts, and blogs all at once. This saves you hours and keeps your messaging consistent across every channel.

**What to show on screen:**
- Start on Content Engine dashboard, show stats cards
- Hover over each content type card (Images, Articles, Posts, Blogs)
- Click LinkedIn Posts to navigate to post list
- Scroll through posts, hover over one
- Click into a post, show the editor
- Navigate back to Content Engine
- Scroll to show campaign creation area

---

### 12. Document Templates
**File:** `scripts/feature-videos/features/documents.ts`
**Duration:** ~87 seconds
**Start on:** Documents/Templates (`/documents`)

> Document Templates let you generate professional business documents in seconds, pre-filled with your company information.
>
> At the top, you can filter templates by category — Business, Finance, HR, or Marketing. CEO Sidekick offers templates including business plans, pitch decks, project proposals, meeting notes, invoices, expense reports, employee handbooks, job descriptions, marketing plans, and brand guidelines.
>
> Each template card shows the document name, a description, and the output format. You'll see formats like Word documents, PowerPoint presentations, Excel spreadsheets, and PDFs — each color-coded for easy scanning.
>
> When you click on a template, a preview modal opens showing what the generated document will look like before you commit. The document is automatically filled with your company details from your settings, so it's ready to review immediately.
>
> Once generated, you can download the document or save it directly to your Company Library for future reference. This feature alone can save you days of work on routine business documents.

**What to show on screen:**
- Start on templates page
- Click through category filters (Business, Finance, HR, Marketing, All)
- Scroll through template grid
- Hover over template cards showing format badges
- Click a template to open preview modal
- Show the modal with document preview
- Hover over download/generate button
- Close modal, scroll back to top

---

### 13. Company Library
**File:** `scripts/feature-videos/features/company-library.ts`
**Duration:** ~90 seconds
**Start on:** Knowledge Base (`/knowledge-base`)

> The Company Library is your centralized knowledge base. Upload your business documents here, and your AI advisors will use them as context when giving you advice.
>
> At the top, you can see storage stats showing how many documents you've uploaded, how much storage you're using, and how many text chunks have been indexed. The chunking process makes your documents searchable and accessible to the AI.
>
> The search bar lets you quickly find any document by name. Below that, there's a drag-and-drop zone for uploading new files. CEO Sidekick supports PDF, Word, plain text, and markdown files up to ten megabytes each.
>
> In the document table, you can see each file's name, processing status, size, and upload date. Documents go through an indexing pipeline — first uploaded, then processed into searchable chunks, and finally marked as ready. You can see the green Ready badges showing which documents are fully indexed.
>
> The power of the Company Library is that once your documents are here, every AI advisor automatically has access to your business context. The advice you get is grounded in your actual data, not generic recommendations.

**What to show on screen:**
- Start on Knowledge Base page, show storage stats
- Hover over document count, storage, chunks stats
- Click into search bar, type a search term, clear it
- Scroll to upload dropzone, hover over it
- Scroll to document table
- Hover over documents, show status badges (Ready, Processing)
- Scroll back to top

---

### 14. Goals & Action Plans
**File:** `scripts/feature-videos/features/goals.ts`
**Duration:** ~94 seconds
**Start on:** Goals (`/goals`)

> Goals helps you set business objectives and track your progress with AI-generated action plans.
>
> On the main page, you can see your goals organized with category badges like Revenue, Product, Team, Operations, and Marketing. Each goal card shows its title, a progress bar, the target date, and how many steps have been completed.
>
> You can filter goals by status — Active, Completed, or Archived. This keeps your workspace focused on what matters right now.
>
> Let's expand a goal to see its action plan. When you click on a goal, it reveals the full AI-generated step-by-step plan. Each step has a title, a detailed description, and a suggested timeframe. You can check off steps as you complete them, and the progress bar updates automatically.
>
> To create a new goal, simply describe what you want to achieve and the AI generates a complete action plan with specific milestones. You can customize the title, category, target date, and individual steps.
>
> Goals transforms vague business ambitions into concrete, trackable action plans. Whether you're preparing for a fundraise, scaling your team, or launching a new product, you'll have a clear roadmap to follow.

**What to show on screen:**
- Start on Goals page, show goal cards with category badges
- Scroll through goals, hover over progress bars
- Click Active filter, then Completed, then All
- Click a goal to expand it
- Scroll through the step-by-step plan
- Hover over step descriptions
- Check off a step, watch progress bar update
- Scroll to New Goal area
- Scroll back to see overview

---

### 15. Round Table
**File:** `scripts/feature-videos/features/roundtable.ts`
**Duration:** ~96 seconds
**Start on:** Round Table (`/roundtable`)

> The Round Table is CEO Sidekick's most powerful feature. Instead of consulting one advisor at a time, you can get perspectives from multiple advisors in a single conversation.
>
> On the left, you have your conversation history just like in regular chat. But the Round Table experience is fundamentally different. When you ask a question, CEO Sidekick automatically identifies which advisors are most relevant and consults them simultaneously.
>
> Look at how a response is structured. First, you see a synthesized summary that weaves together the best insights from all advisors. Then you can see each advisor's individual perspective. The Technology Partner might focus on technical implications, while the Legal Advisor highlights compliance considerations, and the Marketing Partner offers go-to-market insights.
>
> Each advisor's response is clearly labeled with their name and avatar, and you can see their relevance score for the topic. This multi-perspective approach catches blind spots that a single advisor might miss.
>
> The Round Table is ideal for complex decisions like entering a new market, restructuring your team, or evaluating an acquisition. You get the equivalent of a board meeting with domain experts, available anytime you need it.

**What to show on screen:**
- Start on Round Table page
- Click an existing conversation (or type a new question)
- Scroll to see the synthesized summary
- Scroll down to individual advisor perspectives
- Expand an advisor's response section
- Hover over advisor name/avatar and relevance score
- Expand another advisor's response
- Scroll through all responses
- Scroll to the input area, hover over suggested prompts
- Scroll back to top
