import React, { useState } from "react";
import {
  Trash2,
  Database,
  MessageSquare,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import { DatabaseOperations } from "@/services/db-message-handler";

interface DevToolProps {
  className?: string;
}

export default function DevTool({ className }: DevToolProps) {
  const [isClearing, setIsClearing] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const clearOperations = [
    {
      id: "contexts",
      label: "Clear Contexts",
      icon: FileText,
      operation: "clearContexts",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      id: "embeddings",
      label: "Clear Embeddings",
      icon: Database,
      operation: "clearEmbeddings",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      id: "conversations",
      label: "Clear Conversations",
      icon: MessageSquare,
      operation: "clearConversations",
      color: "bg-red-500 hover:bg-red-600",
    },
  ];

  const handleClear = async (operation: DatabaseOperations, label: string) => {
    setIsClearing(operation);
    try {
      const response = await sendMessageToBackgroundScriptWithResponse({
        action: "db-operation",
        payload: { operation },
      });

      if (response?.success) {
        console.log(`✅ Successfully cleared ${label}`);
        // You could add a toast notification here
      } else {
        console.error(`❌ Failed to clear ${label}:`, response?.error);
      }
    } catch (error) {
      console.error(`❌ Error clearing ${label}:`, error);
    } finally {
      setIsClearing(null);
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-[9999] transition-all duration-300",
        className
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg border border-gray-600 flex items-center justify-center transition-all duration-200",
          isExpanded && "bg-gray-700"
        )}
        title="Dev Tools"
      >
        <Trash2 size={20} />
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-600 p-3 min-w-[200px]">
          <div className="text-white text-sm font-medium mb-3 text-center">
            Clear Database
          </div>
          <div className="space-y-2">
            {clearOperations.map(
              ({ id, label, icon: Icon, operation, color }) => (
                <button
                  key={id}
                  onClick={() =>
                    handleClear(operation as DatabaseOperations, label)
                  }
                  disabled={isClearing !== null}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                    color,
                    isClearing === operation && "opacity-75"
                  )}
                >
                  {isClearing === operation ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Icon size={16} />
                  )}
                  <span className="text-white text-[10px] flex-1 text-left">
                    {label}
                  </span>
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
