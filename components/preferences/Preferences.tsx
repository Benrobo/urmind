import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { preferencesStore, EmbeddingStyle } from "@/store/preferences.store";
import useStorageStore from "@/hooks/useStorageStore";
import { Settings, AlertTriangle, Save, Key, Sparkles } from "lucide-react";

export default function Preferences() {
  const { value: preferences } = useStorageStore(preferencesStore);

  const [localApiKey, setLocalApiKey] = useState(preferences.geminiApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );

  useEffect(() => {
    setLocalApiKey(preferences.geminiApiKey);
  }, [preferences.geminiApiKey]);

  const handleEmbeddingStyleChange = async (style: EmbeddingStyle) => {
    await preferencesStore.setEmbeddingStyle(style);
  };

  const handleSaveApiKey = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      if (preferences.embeddingStyle === "online" && !localApiKey.trim()) {
        setSaveStatus("error");
        return;
      }

      await preferencesStore.setGeminiApiKey(localApiKey);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Failed to save API key:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "w-[400px] max-h-[600px] rounded-[12px]",
        "bg-gray-100/80 backdrop-blur-xl",
        "border border-gray-102/30",
        "shadow-2xl shadow-black/20"
      )}
      style={{
        zIndex: 1000,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) scale(1)",
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white-400/60">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
            <Settings size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white">Preferences</div>
            <div className="text-xs text-white/70">
              Configure embedding settings
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-[500px] overflow-y-auto customScrollbar">
        {/* Embedding Style Toggle */}
        <div className="px-4 py-3 border-b border-white-400/20">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">
                Embedding Style
              </div>
              <div className="text-xs text-white/70">
                {preferences.embeddingStyle === "local"
                  ? "Local model (may have limitations)"
                  : "Online API (requires key)"}
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center">
              <button
                onClick={() =>
                  handleEmbeddingStyleChange(
                    preferences.embeddingStyle === "local" ? "online" : "local"
                  )
                }
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  preferences.embeddingStyle === "online"
                    ? "bg-blue-600"
                    : "bg-white/20"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    preferences.embeddingStyle === "online"
                      ? "translate-x-6"
                      : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Local Warning */}
          {preferences.embeddingStyle === "local" && (
            <div className="mt-3 flex items-start gap-2 p-2 bg-amber-500/20 border border-amber-400/30 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-200">
                <strong>Note:</strong> Local embeddings may have limitations on
                certain websites due to security restrictions (e.g., YouTube).
              </div>
            </div>
          )}
        </div>

        {/* Gemini API Key Input */}
        {preferences.embeddingStyle === "online" && (
          <div className="px-4 py-3 border-b border-white-400/20">
            <div className="space-y-3">
              <div className="text-sm font-medium text-white">
                Gemini API Key
              </div>

              <div className="relative">
                <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                <input
                  type="password"
                  value={localApiKey}
                  onChange={(e) => setLocalApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <p className="text-xs text-white/60">
                Your API key is stored locally and never shared.
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        {preferences.embeddingStyle === "online" && (
          <div className="px-4 py-3">
            <button
              onClick={handleSaveApiKey}
              disabled={isSaving || !localApiKey.trim()}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                isSaving || !localApiKey.trim()
                  ? "bg-white/10 text-white/40 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save API Key"}
            </button>
          </div>
        )}

        {/* Status Messages */}
        {saveStatus === "success" && (
          <div className="px-4 py-3">
            <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
              <div className="text-xs text-green-200">
                ✅ API key saved successfully!
              </div>
            </div>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="px-4 py-3">
            <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
              <div className="text-xs text-red-200">
                ❌ Failed to save API key. Please try again.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white-400/60 px-4 py-3 bg-gray-100/50 backdrop-blur-sm rounded-b-[12px]">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 bg-white/10 px-2 py-1.5 rounded-md">
            <Sparkles size={12} className="text-white/80" />
            <span className="text-white/80 ml-1">UrMind</span>
          </div>
          <div className="text-white/60">
            {preferences.embeddingStyle === "local"
              ? "Local Mode"
              : "Online Mode"}
          </div>
        </div>
      </div>
    </div>
  );
}
