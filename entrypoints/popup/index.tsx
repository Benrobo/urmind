import React from "react";
import { cn, sleep } from "@/lib/utils";
import {
  preferencesStore,
  GenerationStyle,
  TimeUnit,
  TabTimingPreferences,
} from "@/store/preferences.store";
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
  Clock,
  Pause,
  Play,
  AlertTriangle as Warning,
} from "lucide-react";
import { useState, useEffect } from "react";
import { geminiAi } from "@/helpers/agent/utils";
import { generateText } from "ai";
import { ai_models } from "@/constant/internal";
import Accordion from "@/components/Accordion";
import toast, { Toaster } from "react-hot-toast";

export default function Popup() {
  const { value: preferences } = useStorageStore(preferencesStore);

  const [localApiKey, setLocalApiKey] = useState(preferences.geminiApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [setupAccordionOpen, setSetupAccordionOpen] = useState(true);
  const [modeAccordionOpen, setModeAccordionOpen] = useState(false);
  const [timingAccordionOpen, setTimingAccordionOpen] = useState(false);
  const [manualOverrideAccordionOpen, setManualOverrideAccordionOpen] =
    useState(false);
  const [localTiming, setLocalTiming] = useState<TabTimingPreferences>(
    preferences.tabTiming || {
      duration: 2,
      timeUnit: "minutes",
    }
  );
  const [originalTiming, setOriginalTiming] = useState<TabTimingPreferences>(
    preferences.tabTiming || {
      duration: 2,
      timeUnit: "minutes",
    }
  );

  useEffect(() => {
    setLocalApiKey(preferences.geminiApiKey);
  }, [preferences.geminiApiKey]);

  useEffect(() => {
    if (preferences.tabTiming) {
      setLocalTiming(preferences.tabTiming);
      setOriginalTiming(preferences.tabTiming);
    }
  }, [preferences.tabTiming]);

  const handleGenerationStyleChange = async (style: GenerationStyle) => {
    // Prevent switching to online mode without API key
    if (style === "online" && !preferences.geminiApiKey.trim()) {
      toast.error("API key is required for online mode");
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

    toast
      .promise(
        async () => {
          if (!localApiKey.trim()) {
            throw new Error("API key is required");
          }

          // Test API key before saving
          const isValid = await testApiKey(localApiKey);
          if (!isValid) {
            throw new Error("API key test failed");
          }

          await preferencesStore.setGeminiApiKey(localApiKey);
        },
        {
          loading: "Testing API key...",
          success: "API key saved successfully!",
          error: (err) => `API key test failed: ${err.message}`,
        }
      )
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleTimingChange = (timing: TabTimingPreferences) => {
    if (!timing) return;
    setLocalTiming(timing);
  };

  const handleSaveTiming = async () => {
    if (!localTiming) return;
    await preferencesStore.setTabTiming(localTiming);
    setOriginalTiming(localTiming);
  };

  const hasTimingChanged = () => {
    if (!localTiming || !originalTiming) return false;
    return (
      localTiming.duration !== originalTiming.duration ||
      localTiming.timeUnit !== originalTiming.timeUnit
    );
  };

  const isTimingValid = () => {
    if (!localTiming) return false;
    return localTiming.duration > 0;
  };

  const handleToggleIndexing = async () => {
    const newState = !preferences.indexingEnabled;
    await preferencesStore.setIndexingEnabled(newState);
  };

  return (
    <div
      className={cn(
        "w-[400px] h-[600px] flex flex-col",
        "bg-gray-100/80-- bg-dark-100.2 backdrop-blur-xl",
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

          <div className="space-y-3 mt-2">
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
            <p className="text-xs text-white/60 pb-2">
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
          <div className="space-y-3 mt-2">
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

        {/* Timing Accordion */}
        <Accordion
          title="Indexing Timing"
          subtitle={`Index pages after ${localTiming?.duration || 2} ${
            localTiming?.timeUnit || "minutes"
          }`}
          icon={
            <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center border-[.5px] border-orange-102">
              <Clock size={16} className="text-white-100" />
            </div>
          }
          isOpen={timingAccordionOpen}
          onToggle={() => setTimingAccordionOpen(!timingAccordionOpen)}
        >
          <div className="space-y-4 mt-3">
            {/* Duration and Time Unit */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-white">Index After</div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={localTiming?.duration || 2}
                  onChange={(e) =>
                    handleTimingChange({
                      ...(localTiming || {
                        duration: 2,
                        timeUnit: "minutes",
                      }),
                      duration: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-20 px-3 py-2 bg-dark-103 border border-dark-101.1 rounded-lg text-white text-center focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <select
                  value={localTiming?.timeUnit || "minutes"}
                  onChange={(e) =>
                    handleTimingChange({
                      ...(localTiming || {
                        duration: 2,
                        timeUnit: "minutes",
                      }),
                      timeUnit: e.target.value as TimeUnit,
                    })
                  }
                  className="px-3 py-2 bg-dark-103 border border-dark-101.1 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                >
                  <option value="seconds">Seconds</option>
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                </select>
                <button
                  onClick={handleSaveTiming}
                  disabled={!hasTimingChanged() || !isTimingValid()}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    hasTimingChanged() && isTimingValid()
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-gray-500 text-gray-300 cursor-not-allowed"
                  )}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-white-100">
                  <strong>How it works:</strong> UrMind waits for you to spend
                  time on a page before indexing it. This ensures only
                  meaningful content gets saved to your knowledge base.
                </div>
              </div>
            </div>
          </div>
        </Accordion>
      </div>

      {/* Manual Override Accordion */}
      <Accordion
        title="Manual Override"
        subtitle={
          preferences.indexingEnabled
            ? "Indexing is active"
            : "Indexing is paused"
        }
        icon={
          <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center border-[.1px] border-red-102/30">
            <Warning size={16} className="text-red-305" />
          </div>
        }
        isOpen={manualOverrideAccordionOpen}
        onToggle={() =>
          setManualOverrideAccordionOpen(!manualOverrideAccordionOpen)
        }
        className="border-t-[1px] border-white-400/60"
      >
        <div className="space-y-4 mt-3">
          {/* Warning Box */}
          <div className="p-3 bg-orange-300/10 border border-orange-300 rounded-lg">
            <div className="flex items-start gap-2">
              <Warning className="w-4 h-4 text-orange-300 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-white-100">
                <strong>Danger Zone:</strong> This section allows you to
                manually control when UrMind indexes pages. Use with caution as
                it affects the core functionality of the extension.
              </div>
            </div>
          </div>

          {/* Indexing Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">
                  Current Status
                </div>
                <div className="text-xs text-white/70">
                  {preferences.indexingEnabled
                    ? "UrMind is actively monitoring and indexing pages"
                    : "UrMind is paused and not indexing any pages"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full animate-pulse",
                    preferences.indexingEnabled ? "bg-green-100" : "bg-red-305"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    preferences.indexingEnabled
                      ? "text-green-100"
                      : "text-red-301"
                  )}
                >
                  {preferences.indexingEnabled ? "ACTIVE" : "PAUSED"}
                </span>
              </div>
            </div>

            {/* Toggle Button */}
            <button
              onClick={handleToggleIndexing}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                preferences.indexingEnabled
                  ? "border border-red-305/30 text-white-100 bg-red-305 hover:bg-red-305/90"
                  : "bg-purple-100 border border-purple-100/30 text-white-100 hover:bg-purple-100/90"
              )}
            >
              {preferences.indexingEnabled ? (
                <>
                  <Pause size={16} />
                  Stop Indexing
                </>
              ) : (
                <>
                  <Play size={16} />
                  Start Indexing
                </>
              )}
            </button>
          </div>
        </div>
      </Accordion>

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

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            backdropFilter: "blur(10px)",
          },
          success: {
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}
