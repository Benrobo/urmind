import React from "react";
import { cn, sleep } from "@/lib/utils";
import { preferencesStore, GenerationStyle } from "@/store/preferences.store";
import useStorageStore from "@/hooks/useStorageStore";
import {
  Settings,
  AlertTriangle,
  Save,
  Key,
  Sparkles,
  TestTube,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Info,
} from "lucide-react";
import { useState, useEffect } from "react";
import { geminiAi } from "@/helpers/agent/utils";
import { generateText } from "ai";
import { ai_models } from "@/constant/internal";
import Accordion from "@/components/Accordion";

export default function Popup() {
  const { value: preferences } = useStorageStore(preferencesStore);

  const [localApiKey, setLocalApiKey] = useState(preferences.geminiApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [dismissTimer, setDismissTimer] = useState<NodeJS.Timeout | null>(null);
  const [setupAccordionOpen, setSetupAccordionOpen] = useState(true);
  const [modeAccordionOpen, setModeAccordionOpen] = useState(false);

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

  const handleGenerationStyleChange = async (style: GenerationStyle) => {
    // Prevent switching to online mode without API key
    if (style === "online" && !preferences.geminiApiKey.trim()) {
      setSaveStatus("error");
      return;
    }
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
      if (!localApiKey.trim()) {
        setSaveStatus("error");
        return;
      }

      // Test API key before saving
      const isValid = await testApiKey(localApiKey);
      if (!isValid) {
        setSaveStatus("error");
        return;
      }

      await preferencesStore.setGeminiApiKey(localApiKey);
      setSaveStatus("success");
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
              Configure UrMind settings
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto customScrollbar">
        {/* Setup Accordion */}
        <Accordion
          title="Setup Required"
          subtitle={
            preferences.geminiApiKey.trim()
              ? "API key configured"
              : "Gemini API key needed"
          }
          icon={
            <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center border-[.5px] border-blue-102">
              <Key size={16} className="text-blue-201" />
            </div>
          }
          isOpen={setupAccordionOpen}
          onToggle={() => setSetupAccordionOpen(!setupAccordionOpen)}
        >
          <div className="p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg mt-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-201">
                <strong>Why do I need a Gemini API key?</strong>
                <br />
                UrMind uses Google's Gemini AI for smart content analysis and
                search. This ensures accurate results across all websites,
                including those with security restrictions.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-white">Gemini API Key</div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full pl-10 pr-4 py-2 bg-dark-103 border border-dark-101.1 rounded-lg text-white placeholder-white/60 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <p className="text-xs text-white/60">
              Your API key is stored locally and never shared.
            </p>
          </div>

          <button
            onClick={handleSaveApiKey}
            disabled={isSaving || !localApiKey.trim()}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors border-[1px] border-white-400",
              isSaving || !localApiKey.trim()
                ? "bg-white/10 text-white/40 cursor-not-allowed"
                : "bg-dark-103 hover:bg-dark-101 text-white"
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
        </Accordion>

        {/* Mode Accordion */}
        <Accordion
          title="Generation Mode"
          subtitle={
            preferences.generationStyle === "offline"
              ? "Offline Mode"
              : "Online Mode"
          }
          icon={
            <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center border-[.5px] border-white-100/50">
              <Sparkles size={16} className="text-white-100" />
            </div>
          }
          isOpen={modeAccordionOpen}
          onToggle={() => setModeAccordionOpen(!modeAccordionOpen)}
        >
          {/* Offline Mode */}
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  Offline Mode
                </div>
                <div className="text-xs text-white/70">
                  Uses Chrome's built-in AI (Gemini Nano)
                </div>
              </div>
              <button
                onClick={() => handleGenerationStyleChange("offline")}
                className={cn(
                  "relative inline-flex h-6 w-12 items-center rounded-full transition-colors border-1",
                  preferences.generationStyle === "offline"
                    ? "bg-blue-600 border-blue-500"
                    : "bg-white/20 border-white/10"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform mr-[1px]",
                    preferences.generationStyle === "offline"
                      ? "translate-x-[2.1em]"
                      : "translate-x-1"
                  )}
                />
              </button>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg">
              <div className="text-xs text-amber-200">
                <strong>Note:</strong> Offline mode may be less accurate and
                responses can vary. This uses Chrome's built-in AI which has
                limitations.
              </div>
            </div>
          </div>

          {/* Online Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  Online Mode
                </div>
                <div className="text-xs text-white/70">
                  Uses Gemini 2.5 Flash (requires API key)
                </div>
              </div>
              <button
                onClick={() => handleGenerationStyleChange("online")}
                disabled={!preferences.geminiApiKey.trim()}
                className={cn(
                  "relative inline-flex h-6 w-12 items-center rounded-full transition-colors border-1",
                  preferences.generationStyle === "online"
                    ? "bg-blue-600 border-blue-500"
                    : "bg-white/20 border-white/10",
                  !preferences.geminiApiKey.trim() &&
                    "opacity-50 cursor-not-allowed"
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
            <div className="p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
              <div className="text-xs text-white-100">
                <strong>Best Experience:</strong> Online mode provides the most
                accurate and consistent results. Uses Google's latest Gemini 2.5
                Flash model for superior performance.
              </div>
            </div>
          </div>
        </Accordion>

        {/* Status Messages */}
        {saveStatus === "success" && (
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

        {saveStatus === "error" && (
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
            {preferences.generationStyle === "offline"
              ? "Offline Mode"
              : "Online Mode"}
          </div>
        </div>
      </div>
    </div>
  );
}
