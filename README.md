# UrMind

## Imagine Never Forgetting Anything You Browse

![UrMind - Your browser's AI-powered memory](/readme-screenshots/2.png)

You stumble across a brilliant idea, an essential resource, or that perfect recipe online — and this time, you _never_ lose it. With UrMind, your browser becomes your own AI-powered second brain, capturing everything you see using **Gemini Nano**, Google's cutting-edge on-device AI. Just hit ⌘U, and instantly search your entire digital memory — absolutely no internet required. It’s your personal knowledge assistant, right at your fingertips.

## 🎯 Why UrMind? Here’s the Problem

Let’s be honest, Researching online today is chaos. Planning a vacation? You bounce through blogs, reviews, forums. Learning to cook? You’re waist-deep in recipes, videos, and tips. Next time you want that info? Good luck finding it — Chrome history shows you URLs, but never _content_. Your best web insights… lost forever.

## ✅ Solution

UrMind transforms your unorganized browsing into a powerful, searchable memory. Every page, highlight, and insight you encounter is automatically indexed — no effort required. Stuck on “where did I see that restaurant?” or “how did I make that?” Just ask UrMind. It’ll surface the answer from your real browsing history, complete with sources, context, and highlights.

Welcome to memory on autopilot. You do the exploring, UrMind does the remembering.

## ✨ Why You’ll Love It

- **🚀 Automatic Capture**: Every site, every scroll, every ah-ha moment — UrMind saves it all (unless you pause it). Never wonder “where did I see that?” again.
- **⚡ Instant Search**: Hit ⌘U. Instantly surface any idea you’ve seen — faster than history, smarter than bookmarks.
- **🧠 On-Device AI**: Powered by **Gemini Nano** — privacy-first, zero-latency, and no cloud required (except for the initial setup).
- **📚 True Research Memory**: Reconstruct your research journeys. See pages, highlights, and rich context, not just a link.
- **🎨 Visually Organize**: Use the Mindboard, drag, organize and make sense of everything you’ve captured.
- **🔍 Ask Anything**: Pose deep questions and get robust, source-cited answers powered by your own research.
- **🔒 Privacy Built-In**: Your API keys and memories never leave your machine. 100% local, 100% yours.

## 🚀 Try UrMind in 30 Seconds

1. **Get Started**: Click our extension and connect your Gemini API key. Choose your indexing preferences.
2. **Browse Naturally**: The extension runs silently in the background, automatically indexing every page you visit.
3. **Start Remembering**: Press ⌘U to search your digital memory whenever inspiration strikes.
4. **Visualize**: Pop open your Mindboard to organize and see connections between your ideas.
5. **Get Answers**: Ask questions and get instant recall, powered by everything you’ve already discovered.

**Proudly built for the Google Chrome Built-in AI Challenge 2025** — Set up [Gemini Nano](./docs/GEMINI_NANO_SETUP.md) and experience on-device AI at its best.

## 🛠️ What’s Under the Hood?

- [WXT](https://wxt.dev/) – Effortless browser extension framework
- [React](https://react.dev/) – Leading-edge UI
- [TypeScript](https://www.typescriptlang.org/) – Maximum reliability
- [TanStack Query](https://tanstack.com/query) – Optimized data fetching
- [Google Gemini Nano](https://ai.google.dev/gemini-api/docs) – The future of private, offline AI
- [Tailwind CSS](https://tailwindcss.com/) – Gorgeous, intuitive design
- [Bun](https://bun.sh/) – Lightning-fast package management
- [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api) – Native AI in your browser
- [LangChain RecursiveCharacterTextSplitter](https://js.langchain.com/docs/how_to/recursive_text_splitter/) – Smart context management

## 📦 Getting UrMind

Launching soon on Chrome Web Store… Stay tuned!

## 🔧 For Builders & Hackers

Install dependencies:

```bash
bun install
```

Start the dev server:

```bash
# For the extension
cd extension
bun run dev

# For the landing page
cd landing
bun run dev
```

Build for release:

```bash
# Bundle the extension
cd extension
bun run build

# Bundle the landing page
cd landing
bun run build
```

## 🗄️ Inspecting Your Data

IndexedDB access can be tricky inside the service worker. Here’s how you peek under the hood:

1. Open DevTools
2. Go to the "Sources" tab
3. Pick one of your extension files, right-click, and open in a new tab
4. Launch DevTools in the new tab (chrome-extension://<id>/content-scripts/content.js)
5. Switch to the "Application" tab
6. In the sidebar, choose "IndexedDB"
7. Find and select the database
8. Click "Open Database"
9. Explore your saved memory!
