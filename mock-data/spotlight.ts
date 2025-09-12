import { SearchResult } from "@/types/search";
import { MessageCircle, Star, Sparkles } from "lucide-react";

// Mock search results with different types
export const mockSearchResults: SearchResult[] = [
  {
    id: "1",
    title: "GTA VI Leaks",
    description:
      "With just over 24 hours left before Rockstar Games was set to debut its first Grand Theft Auto 6 trailer, a grainy video started circulating online: The GTA 6 trailer, but marked with a massive bitcoin water...",
    type: "context",
    source: "Notion page • GTA VI / Controversy / GTA VI Leaks",
    icon: "🤫",
    metadata: {
      created: "Oct 25",
      edited: "2h",
      author: "Steve",
      tags: ["Verified"],
    },
  },
  {
    id: "2",
    title: "Grand Theft Auto VI",
    description: "Wikipedia article about the upcoming Grand Theft Auto game",
    type: "link",
    source: "W Wikipedia",
    url: "https://en.wikipedia.org/wiki/Grand_Theft_Auto_VI",
  },
  {
    id: "3",
    title: "Grand Theft Auto VI Trailer 1",
    description: "Official trailer for GTA VI",
    type: "video",
    source: "YouTube",
    url: "https://youtube.com/watch?v=example",
    metadata: {
      tags: ["Popular"],
    },
  },
  {
    id: "4",
    title: "GTA VI Development Notes",
    description: "Internal development documentation and notes",
    type: "artifact",
    source: "Code Repository",
    metadata: {
      created: "Dec 1",
      author: "Dev Team",
      tags: ["Internal"],
    },
  },
  {
    id: "5",
    title: "The first GTA VI trailer is here",
    description: "News article about the GTA VI trailer release",
    type: "document",
    source: "The Verge / Recent tabs",
    url: "https://theverge.com/gta-vi-trailer",
  },
  {
    id: "6",
    title: "Elon Musk Biography",
    description:
      "Comprehensive biography of Elon Musk, CEO of Tesla and SpaceX",
    type: "context",
    source: "Wikipedia • Biography / Business Leaders",
    icon: "🚀",
    metadata: {
      created: "Nov 15",
      edited: "1d",
      author: "Wikipedia",
      tags: ["Featured"],
    },
  },
  {
    id: "7",
    title: "Tesla Model 3 Review",
    description: "In-depth review of the Tesla Model 3 electric vehicle",
    type: "video",
    source: "YouTube",
    url: "https://youtube.com/watch?v=tesla-review",
    metadata: {
      tags: ["Trending"],
    },
  },
  {
    id: "8",
    title: "SpaceX Mars Mission",
    description:
      "Technical documentation for SpaceX's Mars colonization mission",
    type: "artifact",
    source: "SpaceX Internal Docs",
    metadata: {
      created: "Dec 5",
      author: "SpaceX Engineering",
      tags: ["Confidential"],
    },
  },
];

export const mockActions = [
  {
    id: "ask-urmind",
    label: "Ask Urmind",
    icon: Sparkles,
    onClick: () => console.log("Ask Urmind clicked"),
  },
];

export const chatSessionMessages = [{}];

import { SpotlightConversations } from "@/types/spotlight";

export const mockSpotlightConversations: SpotlightConversations[] = [
  {
    id: "conv-1",
    messages: [
      {
        id: "msg-1",
        role: "user",
        parts: [
          {
            type: "text",
            text: "How do I implement authentication in a Next.js application with TypeScript?",
          },
        ],
      },
      {
        id: "msg-2",
        role: "assistant",
        parts: [
          {
            type: "step-start",
          },
          {
            type: "text",
            text: "I'll help you implement authentication in Next.js with TypeScript. Let me search through your saved contexts for relevant information.",
            state: "done",
          },
          {
            type: "tool-searchContexts",
            toolId: "search-contexts-1",
            state: "output-available",
            input: {
              queries: [
                "Next.js authentication TypeScript",
                "JWT authentication Next.js",
                "NextAuth.js implementation",
                "TypeScript auth middleware",
                "Next.js auth providers",
              ],
            },
            output: {
              query: "Next.js authentication TypeScript",
              results: [
                {
                  id: "ctx-1",
                  title: "NextAuth.js Documentation",
                  type: "url",
                  url: "https://next-auth.js.org/getting-started/introduction",
                  relevance: 0.95,
                },
                {
                  id: "ctx-2",
                  title: "Next.js Auth Tutorial",
                  type: "text",
                  content:
                    "Complete guide to implementing authentication in Next.js with TypeScript, covering JWT tokens, middleware, and session management.",
                  relevance: 0.92,
                },
                {
                  id: "ctx-3",
                  title: "TypeScript Auth Patterns",
                  type: "artifact:document",
                  url: "auth-patterns.pdf",
                  relevance: 0.88,
                },
                {
                  id: "ctx-4",
                  title: "Next.js Middleware Auth",
                  type: "url",
                  url: "https://nextjs.org/docs/app/building-your-application/routing/middleware",
                  relevance: 0.85,
                },
              ],
            },
          },
          {
            type: "step-start",
          },
          {
            type: "text",
            text: "# Next.js Authentication with TypeScript: Complete Implementation Guide\n\nImplementing authentication in Next.js with TypeScript involves several key components. Here's a comprehensive approach:\n\n## 1. Setting Up NextAuth.js\n\nNextAuth.js is the most popular authentication library for Next.js applications:\n\n```typescript\n// pages/api/auth/[...nextauth].ts\nimport NextAuth from 'next-auth'\nimport { NextAuthOptions } from 'next-auth'\nimport CredentialsProvider from 'next-auth/providers/credentials'\nimport JWT from 'jsonwebtoken'\n\nconst authOptions: NextAuthOptions = {\n  providers: [\n    CredentialsProvider({\n      name: 'credentials',\n      credentials: {\n        email: { label: 'Email', type: 'email' },\n        password: { label: 'Password', type: 'password' }\n      },\n      async authorize(credentials) {\n        // Your authentication logic here\n        const user = await authenticateUser(credentials)\n        return user ? { id: user.id, email: user.email, name: user.name } : null\n      }\n    })\n  ],\n  session: {\n    strategy: 'jwt',\n  },\n  callbacks: {\n    async jwt({ token, user }) {\n      if (user) {\n        token.id = user.id\n      }\n      return token\n    },\n    async session({ session, token }) {\n      if (token) {\n        session.user.id = token.id as string\n      }\n      return session\n    }\n  },\n  pages: {\n    signIn: '/auth/signin',\n    error: '/auth/error',\n  }\n}\n\nexport default NextAuth(authOptions)\n```\n\n## 2. TypeScript Configuration\n\nCreate proper TypeScript definitions for your auth types:\n\n```typescript\n// types/next-auth.d.ts\nimport NextAuth from 'next-auth'\n\ndeclare module 'next-auth' {\n  interface Session {\n    user: {\n      id: string\n      email: string\n      name: string\n    }\n  }\n\n  interface JWT {\n    id: string\n  }\n}\n```\n\n## 3. Middleware for Route Protection\n\nUse Next.js middleware to protect routes:\n\n```typescript\n// middleware.ts\nimport { withAuth } from 'next-auth/middleware'\n\nexport default withAuth(\n  function middleware(req) {\n    // Additional middleware logic\n  },\n  {\n    callbacks: {\n      authorized: ({ token }) => !!token\n    }\n  }\n)\n\nexport const config = {\n  matcher: ['/dashboard/:path*', '/profile/:path*']\n}\n```\n\n## 4. Client-Side Usage\n\n```typescript\n// components/AuthButton.tsx\nimport { useSession, signIn, signOut } from 'next-auth/react'\n\nexport default function AuthButton() {\n  const { data: session, status } = useSession()\n\n  if (status === 'loading') return <p>Loading...</p>\n\n  if (session) {\n    return (\n      <div>\n        <p>Signed in as {session.user.email}</p>\n        <button onClick={() => signOut()}>Sign out</button>\n      </div>\n    )\n  }\n\n  return <button onClick={() => signIn()}>Sign in</button>\n}\n```\n\n## 5. Server-Side Protection\n\n```typescript\n// pages/dashboard.tsx\nimport { getServerSession } from 'next-auth/next'\nimport { authOptions } from './api/auth/[...nextauth]'\nimport { redirect } from 'next/navigation'\n\nexport default async function Dashboard() {\n  const session = await getServerSession(authOptions)\n\n  if (!session) {\n    redirect('/auth/signin')\n  }\n\n  return <div>Protected content for {session.user.email}</div>\n}\n```\n\n## Key Benefits of This Approach\n\n- **Type Safety**: Full TypeScript support with proper type definitions\n- **Flexibility**: Multiple authentication providers supported\n- **Security**: Built-in CSRF protection and secure session handling\n- **Performance**: Optimized for Next.js with minimal bundle impact\n- **Developer Experience**: Excellent debugging tools and documentation\n\nThis implementation provides a solid foundation for authentication in your Next.js TypeScript application.",
            state: "done",
          },
        ],
      },
    ],
  },
];
