import { Context } from "@/types/context";

export const mockContexts: Context[] = [
  // Technical/Programming
  {
    id: "ctx-1",
    type: "url",
    title: "React Hooks Best Practices",
    description: "Comprehensive guide to using React hooks effectively",
    summary:
      "Best practices for useState, useEffect, custom hooks, and common pitfalls to avoid",
    url: "https://react.dev/learn/reusing-logic-with-custom-hooks",
    content:
      "This resource covers the most effective ways to use React hooks, including useState and useEffect, how to build custom hooks, and common mistakes to avoid. It provides code examples and practical advice for building robust React components.",
  },
  {
    id: "ctx-2",
    type: "text",
    title: "Python Data Analysis with Pandas",
    description: "Notes on data manipulation and analysis using pandas library",
    summary:
      "Key pandas functions, data cleaning techniques, and visualization methods for data science projects",
    content:
      "Pandas is a powerful Python library for data analysis. Key functions include DataFrame creation, indexing, filtering, groupby, and pivot tables. Data cleaning involves handling missing values, type conversions, and outlier detection. Visualization can be done with pandas' built-in plotting or libraries like matplotlib and seaborn.",
  },
  {
    id: "ctx-3",
    type: "artifact:document",
    title: "Docker Containerization Guide",
    description:
      "Step-by-step guide to containerizing applications with Docker",
    summary:
      "Dockerfile best practices, multi-stage builds, and deployment strategies for production",
    url: "docker-guide.pdf",
    content:
      "This document provides a comprehensive guide to containerizing applications using Docker. It covers writing efficient Dockerfiles, using multi-stage builds to reduce image size, and best practices for deploying containers in production environments.",
  },
  {
    id: "ctx-4",
    type: "url",
    title: "Git Workflow Strategies",
    description: "Different Git branching strategies for team collaboration",
    summary:
      "GitFlow, GitHub Flow, and trunk-based development approaches for software teams",
    url: "https://www.atlassian.com/git/tutorials/comparing-workflows",
    content:
      "Explore various Git workflows such as GitFlow, which uses feature and release branches; GitHub Flow, which emphasizes pull requests to main; and trunk-based development, which encourages frequent integration to a single branch. Each strategy has pros and cons for different team sizes and release cadences.",
  },

  // Business/Productivity
  {
    id: "ctx-5",
    type: "text",
    title: "Project Management Methodologies",
    description: "Comparison of Agile, Scrum, and Kanban approaches",
    summary:
      "When to use each methodology, team size considerations, and implementation best practices",
    content:
      "Agile is an iterative approach focusing on collaboration and flexibility. Scrum organizes work into sprints with defined roles and ceremonies. Kanban visualizes workflow and limits work in progress. Choose based on project complexity, team size, and need for adaptability.",
  },
  {
    id: "ctx-6",
    type: "url",
    title: "Remote Work Best Practices",
    description: "Tips for effective remote work and team collaboration",
    summary:
      "Communication strategies, productivity tools, and maintaining work-life balance while working remotely",
    url: "https://blog.remote.com/remote-work-best-practices",
    content:
      "Effective remote work relies on clear communication, regular check-ins, and the use of collaboration tools like Slack and Zoom. Set boundaries for work-life balance, create a dedicated workspace, and use productivity techniques such as time blocking.",
  },
  {
    id: "ctx-7",
    type: "artifact:image",
    title: "Marketing Funnel Diagram",
    description: "Visual representation of customer acquisition funnel",
    summary:
      "Awareness, consideration, and conversion stages with key metrics and optimization points",
    image: "marketing-funnel.png",
    content:
      "The marketing funnel diagram illustrates the stages a customer goes through: Awareness (top), Consideration (middle), and Conversion (bottom). Key metrics include impressions, leads, and sales. Optimization focuses on improving conversion rates at each stage.",
  },

  // Personal/Health
  {
    id: "ctx-8",
    type: "text",
    title: "Meditation and Mindfulness Techniques",
    description: "Daily practices for stress reduction and mental clarity",
    summary:
      "Breathing exercises, guided meditation apps, and incorporating mindfulness into daily routines",
    content:
      "Practice mindfulness by focusing on your breath, using guided meditation apps like Headspace or Calm, and integrating short meditation sessions into your daily routine. Benefits include reduced stress, improved focus, and better emotional regulation.",
  },
  {
    id: "ctx-9",
    type: "url",
    title: "Healthy Meal Prep Ideas",
    description: "Quick and nutritious meal preparation strategies",
    summary:
      "Batch cooking recipes, storage tips, and balanced nutrition for busy professionals",
    url: "https://www.healthline.com/nutrition/meal-prep-ideas",
    content:
      "Meal prep involves planning and preparing meals in advance. Focus on balanced recipes with lean proteins, whole grains, and vegetables. Use airtight containers for storage and plan meals for the week to save time and eat healthier.",
  },
  {
    id: "ctx-10",
    type: "text",
    title: "Exercise Routine for Desk Workers",
    description: "Stretches and exercises to counteract prolonged sitting",
    summary:
      "Daily stretches, desk exercises, and ergonomic setup recommendations for office workers",
    content:
      "Incorporate stretches for the neck, shoulders, and back every hour. Try desk exercises like seated leg lifts and standing squats. Set up your workstation ergonomically to reduce strain and encourage movement throughout the day.",
  },

  // Finance/Investment
  {
    id: "ctx-11",
    type: "url",
    title: "Index Fund Investment Strategy",
    description: "Long-term investment approach using low-cost index funds",
    summary:
      "Dollar-cost averaging, portfolio diversification, and retirement planning with index funds",
    url: "https://www.bogleheads.org/wiki/Getting_started",
    content:
      "Investing in index funds provides broad market exposure with low fees. Use dollar-cost averaging to invest consistently over time. Diversify across asset classes and rebalance periodically to align with your risk tolerance and retirement goals.",
  },
  {
    id: "ctx-12",
    type: "text",
    title: "Personal Budgeting Template",
    description: "Monthly budget tracking spreadsheet and categories",
    summary:
      "Income allocation, expense tracking, emergency fund planning, and financial goal setting",
    content:
      "A personal budget template helps track income, fixed and variable expenses, and savings goals. Allocate funds for essentials, savings, and discretionary spending. Review your budget monthly and adjust as needed to stay on track.",
  },

  // Creative/Hobbies
  {
    id: "ctx-13",
    type: "artifact:image",
    title: "Photography Composition Rules",
    description: "Visual guide to improving photography composition",
    summary:
      "Rule of thirds, leading lines, framing techniques, and lighting principles for better photos",
    image: "photography-composition.jpg",
    content:
      "Key composition rules include the rule of thirds, using leading lines to draw attention, framing your subject, and understanding natural and artificial lighting. Practice these techniques to enhance your photography skills.",
  },
  {
    id: "ctx-14",
    type: "text",
    title: "Guitar Chord Progressions",
    description: "Common chord progressions for songwriting and practice",
    summary:
      "Popular progressions in different keys, strumming patterns, and song structure basics",
    content:
      "Familiarize yourself with common progressions like I-IV-V, ii-V-I, and vi-IV-I-V. Practice in various keys and experiment with different strumming patterns. Understanding song structure helps in composing and improvising.",
  },
  {
    id: "ctx-15",
    type: "url",
    title: "Gardening for Beginners",
    description: "Starting a vegetable garden in small spaces",
    summary:
      "Container gardening, soil preparation, plant selection, and seasonal growing tips",
    url: "https://www.gardeningknowhow.com/edible/vegetables/vgen/starting-a-vegetable-garden.htm",
    content:
      "Beginner gardeners can start with container gardening using quality soil and easy-to-grow plants like herbs and lettuce. Pay attention to sunlight, watering schedules, and seasonal planting guides for best results.",
  },

  // Travel/Lifestyle
  {
    id: "ctx-16",
    type: "text",
    title: "Solo Travel Safety Tips",
    description: "Essential safety guidelines for traveling alone",
    summary:
      "Research destinations, emergency contacts, accommodation safety, and cultural awareness tips",
    content:
      "Before traveling solo, research your destination, keep emergency contacts handy, and choose safe accommodations. Stay aware of your surroundings, respect local customs, and share your itinerary with someone you trust.",
  },
  {
    id: "ctx-17",
    type: "url",
    title: "Minimalist Living Guide",
    description: "Simplifying life and reducing material possessions",
    summary:
      "Decluttering methods, mindful consumption, and creating more space for what matters",
    url: "https://www.theminimalists.com/minimalism/",
    content:
      "Minimalist living involves decluttering your space, being intentional with purchases, and focusing on experiences over possessions. Use methods like the KonMari technique and set clear goals for what you want to keep in your life.",
  },

  // Learning/Education
  {
    id: "ctx-18",
    type: "text",
    title: "Language Learning Techniques",
    description: "Effective methods for learning a new language",
    summary:
      "Spaced repetition, immersion techniques, conversation practice, and using technology for language learning",
    content:
      "Use spaced repetition systems (SRS) for vocabulary, immerse yourself by consuming media in the target language, and practice speaking with native speakers. Apps like Duolingo and Anki can accelerate your progress.",
  },
  {
    id: "ctx-19",
    type: "artifact:document",
    title: "Speed Reading Methods",
    description: "Techniques to improve reading speed and comprehension",
    summary:
      "Eye movement patterns, skimming strategies, and practice exercises for faster reading",
    url: "speed-reading-guide.pdf",
    content:
      "Speed reading techniques include minimizing subvocalization, using a pointer to guide your eyes, and practicing skimming and scanning. Regular exercises can help increase your reading speed while maintaining comprehension.",
  },

  // Technology/Tools
  {
    id: "ctx-20",
    type: "url",
    title: "VS Code Productivity Extensions",
    description: "Essential extensions for improving coding efficiency",
    summary:
      "Code formatting, debugging, Git integration, and language-specific tools for developers",
    url: "https://code.visualstudio.com/docs/editor/extension-marketplace",
    content:
      "Top VS Code extensions include Prettier for formatting, GitLens for Git integration, and language packs for enhanced syntax support. Explore the marketplace to find tools that match your workflow and boost productivity.",
  },
];
