# Background Script Architecture

## Overview

The background script has been completely refactored into a clean, modular architecture with proper separation of concerns.

## Architecture Components

### 📁 Service Files

#### `services/background-message-handler.ts`

- **Purpose**: Manages all Chrome runtime message handling
- **Features**:
  - Content script readiness tracking
  - Page indexing job queuing
  - Navigation detection handling
  - Options page management
  - Type-safe message processing

#### `services/omnibox-handler.ts`

- **Purpose**: Handles Chrome omnibox integration
- **Features**:
  - Omnibox input handling
  - Suggestion management
  - Options page opening with fallbacks

#### `services/background-test-utils.ts`

- **Purpose**: Testing and debugging utilities
- **Features**:
  - Global test function exposure
  - Database testing helpers
  - Development debugging tools

#### `types/background-messages.ts`

- **Purpose**: TypeScript type definitions
- **Features**:
  - Type-safe message payloads
  - Response type definitions
  - Job queue type safety

### 🎯 Main Background Script (`entrypoints/background.ts`)

**Before (196 lines):**

```typescript
// Monolithic, hard to maintain
function handleOmniboxInput() {
  /* 30+ lines */
}
async function testCreateContext() {
  /* 30+ lines */
}
const readyContentScripts = new Set<number>();
// 80+ lines of message handling logic
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  // Massive switch statement with repeated logic
});
```

**After (28 lines):**

```typescript
export default defineBackground(() => {
  console.log("🚀 Background script loaded");

  // Initialize services
  const messageHandler = new BackgroundMessageHandler();
  const omniboxHandler = new OmniboxHandler();

  // Set up test utilities for debugging
  BackgroundTestUtils.setupGlobalTestFunctions();

  // Set up message handling
  chrome.runtime.onMessage.addListener(messageHandler.createMessageListener());

  // Set up tab cleanup
  chrome.tabs.onRemoved.addListener((tabId) => {
    messageHandler.cleanupTab(tabId);
  });

  // Initialize omnibox handling
  omniboxHandler.init();

  console.log("✅ Background script initialization complete");
});
```

## Benefits

### 🧹 Clean Code

- **Single Responsibility**: Each service has one focused purpose
- **Separation of Concerns**: Message handling, omnibox, testing are isolated
- **Type Safety**: Full TypeScript support with proper interfaces
- **Error Handling**: Consistent error handling across all services

### 🔧 Maintainability

- **Modular**: Easy to add new message types or handlers
- **Testable**: Each service can be tested independently
- **Readable**: Clear, self-documenting code structure
- **Extensible**: Easy to add new functionality

### 🚀 Developer Experience

- **Hot Reloading**: Changes to individual services don't affect others
- **Debugging**: Test utilities globally available
- **IntelliSense**: Full TypeScript autocomplete and type checking
- **Documentation**: Clear interfaces and JSDoc comments

## Usage Examples

### Adding a New Message Type

1. Add to `types/background-messages.ts`:

```typescript
export interface NewMessagePayload {
  data: string;
}
```

2. Add handler to `BackgroundMessageHandler`:

```typescript
async handleNewMessage(payload: NewMessagePayload): Promise<MessageResponse> {
  // Implementation
  return { success: true };
}
```

3. Add to switch statement:

```typescript
case "new-message":
  result = await this.handleNewMessage(request.payload);
  break;
```

### Testing

```typescript
// In console
testCreateContext(); // Globally available test function
```

## File Structure

```
services/
├── background-message-handler.ts  # Message routing & handling
├── omnibox-handler.ts            # Omnibox integration
├── background-test-utils.ts      # Testing utilities
├── db-message-handler.ts         # Database operations (content script)
└── db-proxy.ts                   # Database proxy (background script)

types/
└── background-messages.ts        # TypeScript definitions

entrypoints/
└── background.ts                 # Main entry point (28 lines!)
```

This architecture is production-ready, maintainable, and easily extensible! 🎉
