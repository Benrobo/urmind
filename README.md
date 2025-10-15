# UrMind

<div align="center">
  ![UrMind - Your browser's AI-powered memory](/readme-screenshots/2.png)
</div>

**Stop losing brilliant ideas you find online.** UrMind is your browser's AI-powered memory that automatically captures everything you browse using **Gemini Nano** - Google's cutting-edge on-device AI model. Join early adopters who never forget important information again. Press ⌘U anywhere to search through your captured content with **zero internet required**. Your personal second brain, always at your fingertips.

## ✨ Features

- **Automatic Capture**: Seamlessly indexes everything you browse (unless manually paused) - No more 'where did I see that article?'
- **Instant Search**: Press ⌘U anywhere to search through your captured content - Faster than Chrome history, smarter than bookmarks
- **AI-Powered**: Built with **Gemini Nano** for on-device AI processing - Your browsing, supercharged with zero-latency, privacy-first AI
- **Never Lose Context**: Unlike browser history that shows URLs, UrMind remembers the actual content and insights
- **Visual Organization**: Access your Mindboard to drag, connect, and organize contexts
- **Deep Research**: Ask questions and receive comprehensive answers with sources cited
- **Privacy-First**: Your API key is stored locally and never shared

## 🚀 Quick Start

1. **Setup UrMind**: Click the extension icon to configure your Gemini API key, generation mode, and indexing preferences
2. **Search Your Mind**: Press ⌘U anywhere to search through your captured content
3. **Organize Visually**: Access your Mindboard to organize all your saved contexts
4. **Deep Research**: Ask questions and get comprehensive answers powered by your browsing history

**🚀 Built for the Google Chrome Built-in AI Challenge 2025** - [Setup Gemini Nano](./docs/GEMINI_NANO_SETUP.md) to enable on-device AI processing with zero internet required.

## 🛠️ Tech Stack

- [WXT](https://wxt.dev/) - Web extension framework
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [TanStack Query](https://tanstack.com/query) - Data fetching and caching
- [Google Gemini Nano](https://ai.google.dev/gemini-api/docs) - On-device AI model for privacy-first, offline processing
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Bun](https://bun.sh/) - Fast package manager and runtime
- [Chrome Prompt API](https://developer.chrome.com/docs/ai/prompt-api) - Built-in AI APIs for Chrome Extensions
- [LangChain RecursiveCharacterTextSplitter](https://js.langchain.com/docs/how_to/recursive_text_splitter/) - Intelligent text chunking for context indexing

## 📦 Installation

Coming soon to Chrome Web Store...

## 🔧 Development

Install dependencies:

```bash
bun install
```

Start development server:

```bash
# Extension development
cd extension
bun run dev

# Landing page development
cd landing
bun run dev
```

Build for production:

```bash
# Extension build
cd extension
bun run build

# Landing page build
cd landing
bun run build
```

## 🗄️ Database

Managing IndexedDB from devtools within service worker isn't straightforward. To view/manage the database:

1. Open devtools
2. Select "Sources" tab
3. Select one of your application files, right-click and open in new tab
4. Open devtools within the new tab (chrome-extension://<id>/content-scripts/content.js)
5. Select "Application" tab
6. Select "IndexedDB" from the left sidebar
7. You should see the database name and version
8. Select the database and click "Open Database" button
9. You can now view/manage the database
