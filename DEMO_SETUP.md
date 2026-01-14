# Interactive Product Demo

An auto-playing, animated product demo for the landing page that showcases CEO Sidekick's key features.

## What's Included

- **ProductDemo.tsx** - Main demo component with 7 animated screens
- **demo.tsx** - Landing page section wrapper
- **hero.tsx** - Updated with scroll-to-demo functionality
- **index.ts** - Updated exports
- **page.tsx** - Updated landing page with Demo section

## Features

### Demo Screens (7 total, ~42 seconds loop)
1. **Dashboard** - Overview of all AI advisors
2. **Settings Intro** - AI personalization banner with progress
3. **Settings Form** - Filling in company details
4. **Chat Start** - Beginning a conversation with Strategy Partner
5. **Chat Response** - Personalized AI response referencing user's business
6. **Agent Switch** - Dropdown showing all available agents
7. **Legal Response** - Different agent with specialized advice

### Controls
- **Play/Pause button** - Click to pause/resume
- **Progress dots** - Click any dot to jump to that screen
- Auto-loops continuously
- Each screen shows for ~6 seconds

### Animations
- Fade-in transitions between screens
- Staggered element animations within each screen
- Progress bar advances smoothly

## Installation

1. Create the demo component directory:
   ```bash
   mkdir -p src/components/demo
   ```

2. Copy the files:
   - `src/components/demo/ProductDemo.tsx`
   - `src/components/landing/demo.tsx`
   - `src/components/landing/index.ts`
   - `src/components/landing/hero.tsx`
   - `src/app/page.tsx`

3. The demo uses existing animations from `globals.css` (animate-fade-in, animate-fade-up, animate-scale-in)

## Customization

### Change Screen Duration
In `ProductDemo.tsx`, modify:
```typescript
const SCREEN_DURATION = 6000; // milliseconds
```

### Add/Remove Screens
1. Update the `screens` array
2. Add/remove screen components
3. Update the render conditionals

### Customize Content
Each screen is a separate function component at the bottom of `ProductDemo.tsx`:
- `DashboardScreen`
- `SettingsIntroScreen`
- `SettingsFormScreen`
- `ChatStartScreen`
- `ChatResponseScreen`
- `AgentSwitchScreen`
- `LegalResponseScreen`

## Usage

The "Watch Demo" button in the Hero section now scrolls smoothly to the demo section.

The demo appears between Hero and Features sections on the landing page.
