import { useState } from "react";
import {
  Plus,
  MessageSquare,
  Search,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { SidepanelSearchInput } from "@/components/sidepanel";

function Sidepanel() {
  const [chatSessions, setChatSessions] = useState([]);
  const [hasQuery, setHasQuery] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const handleNewChat = () => {
    console.log("Starting new chat session");
    setHasQuery(false);
    setHasResults(false);
  };

  const handleQueryChange = (query: string) => {
    setHasQuery(query.trim().length > 0);
  };

  const handleResultsChange = (results: any[]) => {
    setHasResults(results.length > 0);
  };

  const showEmptyState = !hasQuery || (!hasResults && hasQuery);

  return (
    <div className="w-full h-screen bg-gray-100/95 backdrop-blur-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="w-full px-4 py-3 border-b border-gray-102/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-white/80" />
            <h1 className="text-white font-medium text-sm">UrMind</h1>
          </div>
          <button
            onClick={handleNewChat}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors group"
            title="Start new chat"
          >
            <Plus className="w-4 h-4 text-white/80 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {showEmptyState ? (
          <EmptyState hasQuery={hasQuery} onNewChat={handleNewChat} />
        ) : (
          <ChatInterface />
        )}
      </div>

      <SidepanelSearchInput
        onQueryChange={handleQueryChange}
        onResultsChange={handleResultsChange}
      />
    </div>
  );
}

export default Sidepanel;

interface EmptyStateProps {
  hasQuery: boolean;
  onNewChat: () => void;
}

function EmptyState({ hasQuery, onNewChat }: EmptyStateProps) {
  if (hasQuery) {
    // No results found for query
    return (
      <div className="w-full h-full flex flex-col items-center justify-center px-6">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-white/60" />
        </div>
        <h2 className="text-white font-medium text-lg mb-2">
          No results found
        </h2>
        <p className="text-white/60 text-sm text-center mb-6 max-w-sm">
          Try adjusting your search terms or ask UrMind for help with a
          different question.
        </p>
        <button
          onClick={onNewChat}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group"
        >
          <Sparkles className="w-4 h-4 text-white/80" />
          <span className="text-white text-sm font-medium">Ask UrMind</span>
          <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    );
  }

  // No query - initial state
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6">
      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-white/80" />
      </div>
      <h2 className="text-white font-semibold text-lg mb-2">
        Your Second Brain
      </h2>
      <p className="text-white/60 text-sm text-center mb-6 max-w-sm">
        Ask anything about what you've seen online
      </p>
    </div>
  );
}

function ChatInterface() {
  return (
    <div className="flex-1 flex flex-col p-4">
      {/* Chat Messages */}
      <div className="flex-1 space-y-4 mb-4">
        {/* User Message */}
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-white/15 rounded-lg p-3">
            <p className="text-white text-sm">
              What did I research about Docker yesterday?
            </p>
          </div>
        </div>

        {/* AI Response */}
        <div className="flex justify-start">
          <div className="max-w-[90%] bg-white/10 rounded-lg p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-white/80" />
              <span className="text-white font-medium text-sm">UrMind AI</span>
            </div>
            <div className="space-y-3">
              <p className="text-white/90 text-sm leading-relaxed">
                Based on your saved context, yesterday you researched Docker
                setup and configuration. Here's what I found:
              </p>

              {/* Sources */}
              <div className="space-y-2">
                <h4 className="text-white/70 text-xs font-medium uppercase tracking-wide">
                  Sources
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-2 bg-white/5 rounded border border-white/10">
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                      <FileText className="w-3 h-3 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">
                        Docker Setup Tutorial
                      </p>
                      <p className="text-white/50 text-xs truncate">
                        docker.com • text
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
