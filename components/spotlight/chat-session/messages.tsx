import React from "react";
import { Sparkles, FileText, Globe, File, Image } from "lucide-react";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  sources?: Source[];
}

interface Source {
  id: string;
  title: string;
  subtitle: string;
  type: "text" | "url" | "artifact:document" | "artifact:image";
  url?: string;
}

interface ChatSessionMessagesProps {
  messages: Message[];
  isStreaming?: boolean;
  streamingText?: string;
}

// Get icon for content type
const getSourceIcon = (type: string) => {
  switch (type) {
    case "text":
      return FileText;
    case "url":
      return Globe;
    case "artifact:document":
      return File;
    case "artifact:image":
      return Image;
    default:
      return FileText;
  }
};

export default function ChatSessionMessages({
  messages,
  isStreaming = false,
  streamingText = "",
}: ChatSessionMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto customScrollbar">
      <div className="space-y-4 p-4">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === "user" ? (
              // User Message
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-white/15 rounded-lg p-3">
                  <p className="text-white text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ) : (
              // AI Response
              <div className="flex justify-start">
                <div className="max-w-[90%] bg-white/10 rounded-lg p-4 border border-white/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="w-4 h-4 text-white/80" />
                    <span className="text-white font-medium text-sm">
                      UrMind AI
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-white/90 text-sm leading-relaxed">
                      {message.content}
                    </p>

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-white/70 text-xs font-medium uppercase tracking-wide">
                          Sources
                        </h4>
                        <div className="space-y-2">
                          {message.sources.map((source) => {
                            const IconComponent = getSourceIcon(source.type);
                            return (
                              <div
                                key={source.id}
                                className="flex items-center space-x-3 p-2 bg-white/5 rounded border border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                              >
                                <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                                  <IconComponent className="w-3 h-3 text-white/60" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-medium truncate">
                                    {source.title}
                                  </p>
                                  <p className="text-white/50 text-xs truncate">
                                    {source.subtitle}
                                  </p>
                                </div>
                                <div className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
                                  {source.type}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming Response */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[90%] bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-white/80" />
                <span className="text-white font-medium text-sm">
                  UrMind AI
                </span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white/60 rounded-full animate-pulse"></div>
                  <div
                    className="w-1 h-1 bg-white/60 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-1 h-1 bg-white/60 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>

              <p className="text-white/90 text-sm leading-relaxed">
                {streamingText}
                <span className="inline-block w-2 h-4 bg-white/60 ml-1 animate-pulse"></span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
