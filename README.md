# Flashcards — AI-Powered Study App

A cyberpunk-themed flashcard app that lets you generate study cards from lecture notes using any major AI provider, or create them manually.

## Features

- 🤖 **AI Generation** — Upload `.txt`/`.md` notes and generate flashcards using Anthropic, OpenAI, or Google Gemini
- ✏️ **Manual Creation** — Build decks by hand with full control over modules/groups
- 🔒 **Private API Keys** — Keys are used directly from your browser and never stored on any server. Each user enters their own.
- 🎨 **Per-module color coding** — Cards are color-coded by topic group
- 📊 **Progress tracking** — Track known vs. needs-review per session
- 📱 **Responsive** — Works on mobile and desktop

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
npm install -g vercel
cd flashcard-app
npm install
vercel
```

### Option 2: GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Vercel auto-detects Next.js — click **Deploy**

No environment variables needed — API keys are entered by users in the browser.

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## File Structure

```
flashcard-app/
├── components/
│   ├── HomePage.js        # Deck list, AI generation, manual creation
│   └── FlashcardViewer.js # Study interface
├── lib/
│   ├── data.js            # Default deck + constants
│   ├── generate.js        # AI API calls (Anthropic, OpenAI, Gemini)
│   └── storage.js         # Session storage utilities
├── pages/
│   ├── _app.js
│   ├── _document.js
│   └── index.js           # Main entry point
├── styles/
│   ├── globals.css        # Base theme, fonts, animations
│   ├── home.css           # Home page styles
│   └── viewer.css         # Flashcard viewer styles
├── public/
├── next.config.js
├── vercel.json
└── package.json
```

## Privacy Notes

- API keys are **never** sent to this app's server
- Keys are stored in `sessionStorage` (cleared when you close the tab)
- Each browser session is completely independent — sharing the URL with friends means they bring their own key
