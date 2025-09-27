import React from "react";
import { cn, sleep } from "@/lib/utils";
import {
  preferencesStore,
  EmbeddingStyle,
  GenerationStyle,
} from "@/store/preferences.store";
import useStorageStore from "@/hooks/useStorageStore";
import {
  Settings,
  AlertTriangle,
  Save,
  Key,
  Sparkles,
  TestTube,
} from "lucide-react";
import { useState, useEffect } from "react";
import { geminiAi } from "@/helpers/agent/utils";
import { generateText } from "ai";
import { ai_models } from "@/constant/internal";

export default function Popup() {
  const { value: preferences } = useStorageStore(preferencesStore);

  const [localApiKey, setLocalApiKey] = useState(preferences.geminiApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [dismissTimer, setDismissTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalApiKey(preferences.geminiApiKey);
  }, [preferences.geminiApiKey]);

  // Auto-dismiss success messages
  useEffect(() => {
    if (saveStatus === "success") {
      // Clear any existing timer
      if (dismissTimer) {
        clearTimeout(dismissTimer);
      }

      // Set new timer to dismiss after 3 seconds
      const timer = setTimeout(() => {
        setSaveStatus("idle");
        setDismissTimer(null);
      }, 3000);

      setDismissTimer(timer);
    }

    // Cleanup timer on unmount or status change
    return () => {
      if (dismissTimer) {
        clearTimeout(dismissTimer);
      }
    };
  }, [saveStatus, dismissTimer]);

  const handleEmbeddingStyleChange = async (style: EmbeddingStyle) => {
    await preferencesStore.setEmbeddingStyle(style);
  };

  const handleGenerationStyleChange = async (style: GenerationStyle) => {
    await preferencesStore.setGenerationStyle(style);
  };

  const testApiKey = async (apiKey: string): Promise<boolean> => {
    try {
      const genAI = geminiAi(apiKey);
      const result = await generateText({
        model: genAI(ai_models.generation.gemini_flash),
        prompt: "what is 2+2?",
      });
      console.log("result", result);
      return !!result.text;
    } catch (error) {
      console.error("API key test failed:", error);
      return false;
    }
  };

  const handleSaveApiKey = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      if (
        (preferences.embeddingStyle === "online" ||
          preferences.generationStyle === "online") &&
        !localApiKey.trim()
      ) {
        setSaveStatus("error");
        return;
      }

      // Test API key before saving
      if (
        (preferences.embeddingStyle === "online" ||
          preferences.generationStyle === "online") &&
        localApiKey.trim()
      ) {
        const isValid = await testApiKey(localApiKey);
        if (!isValid) {
          setSaveStatus("error");
          return;
        }
      }

      await preferencesStore.setGeminiApiKey(localApiKey);
      setSaveStatus("success");
      // setTimeout(() => setSaveStatus("idle"), 5000);
    } catch (error) {
      console.error("Failed to save API key:", error);
      setSaveStatus("error");
    } finally {
      await sleep(1000);
      setIsSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "w-[400px] h-[600px] flex flex-col",
        "bg-gray-100/80 backdrop-blur-xl",
        "border border-gray-102/30",
        "shadow-2xl shadow-black/20"
      )}
      style={{
        width: "400px",
        height: "600px",
        // overflow: "hidden",
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

      <div className="flex-1 overflow-y-auto customScrollbar">
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
                  "relative inline-flex h-6 w-12 items-center rounded-full transition-colors border-1",
                  preferences.embeddingStyle === "online"
                    ? "bg-dark-101.1 border-dark-103"
                    : "bg-white/20 border-white/10"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform mr-[1px]",
                    preferences.embeddingStyle === "online"
                      ? "translate-x-[2.1em]"
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

        {/* Generation Preference */}
        <div className="px-4 py-3 border-b border-white-400/20">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white">
                Generation Preference
              </div>
              <div className="text-xs text-white/70">
                {preferences.generationStyle === "offline"
                  ? "ChromeAI (local, offline)"
                  : "Gemini Flash (online, requires API key)"}
              </div>
            </div>

            {/* Model Toggle Switch */}
            <div className="flex items-center">
              <button
                onClick={() =>
                  handleGenerationStyleChange(
                    preferences.generationStyle === "offline"
                      ? "online"
                      : "offline"
                  )
                }
                className={cn(
                  "relative inline-flex h-6 w-12 items-center rounded-full transition-colors border-1",
                  preferences.generationStyle === "online"
                    ? "bg-dark-101.1 border-dark-103"
                    : "bg-white/20 border-white/10"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform mr-[1px]",
                    preferences.generationStyle === "online"
                      ? "translate-x-[2.1em]"
                      : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          {/* Online Generation Warning */}
          {preferences.generationStyle === "online" && (
            <div className="mt-3 flex items-start gap-2 p-2 bg-blue-500/20 border border-blue-400/30 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-200">
                <strong>Note:</strong> Online generation requires a valid Gemini
                API key.
              </div>
            </div>
          )}
        </div>

        {/* Gemini API Key Input */}
        <div
          className={cn(
            "px-4 py-3 border-b border-white-400/20 transition-all duration-300",
            preferences.embeddingStyle === "local" &&
              preferences.generationStyle === "offline"
              ? "opacity-50 grayscale pointer-events-none"
              : "opacity-100 grayscale-0"
          )}
        >
          <div className="space-y-3">
            <div className="text-sm font-medium text-white">Gemini API Key</div>

            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                disabled={
                  preferences.embeddingStyle === "local" &&
                  preferences.generationStyle === "offline"
                }
                className={cn(
                  "w-full pl-10 pr-4 py-2 bg-dark-103 border border-dark-101.1 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-dark-101.1 focus:border-dark-101.1 outline-none transition-all duration-300",
                  preferences.embeddingStyle === "local" &&
                    preferences.generationStyle === "offline"
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-text opacity-100"
                )}
              />
            </div>

            <p className="text-xs text-white/60">
              Your API key is stored locally and never shared.
            </p>
            <div className="mt-2 p-2 bg-blue-103/20 border border-blue-100/40 rounded-lg">
              <div className="text-xs text-blue-100">
                <strong>Fallback:</strong> If online model fails, the system
                will automatically switch to local Gemini Nano model.
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div
          className={cn(
            "px-4 py-3 transition-all duration-300",
            preferences.embeddingStyle === "local" &&
              preferences.generationStyle === "offline"
              ? "opacity-50 grayscale pointer-events-none"
              : "opacity-100 grayscale-0"
          )}
        >
          <button
            onClick={handleSaveApiKey}
            disabled={
              isSaving ||
              !localApiKey.trim() ||
              (preferences.embeddingStyle === "local" &&
                preferences.generationStyle === "offline")
            }
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors enableBounceEffect",
              isSaving ||
                !localApiKey.trim() ||
                (preferences.embeddingStyle === "local" &&
                  preferences.generationStyle === "offline")
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-dark-101.1 hover:bg-dark-101.1 text-white"
            )}
          >
            {isSaving ? (
              <>
                <TestTube className="w-4 h-4" />
                Testing & Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save API Key
              </>
            )}
          </button>
        </div>

        {/* Status Messages */}
        {saveStatus === "success" &&
          (preferences.embeddingStyle === "online" ||
            preferences.generationStyle === "online") && (
            <div className="px-4 py-3">
              <div className="p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white-100">
                    ✅ API key saved successfully!
                  </div>
                  <button
                    onClick={() => {
                      setSaveStatus("idle");
                      if (dismissTimer) {
                        clearTimeout(dismissTimer);
                        setDismissTimer(null);
                      }
                    }}
                    className="text-white-100/60 hover:text-white-100 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

        {saveStatus === "error" &&
          (preferences.embeddingStyle === "online" ||
            preferences.generationStyle === "online") && (
            <div className="px-4 py-3">
              <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-red-200">
                    ❌ API key test failed or save error. Please check your key
                    and try again.
                  </div>
                  <button
                    onClick={() => setSaveStatus("idle")}
                    className="text-red-200/60 hover:text-red-200 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Footer */}
      <div className="border-t border-white-400/60 px-4 py-3 bg-gray-100/50 backdrop-blur-sm">
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
