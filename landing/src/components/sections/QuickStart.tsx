import { useState } from "react";
import { Bookmark, Search, Layers, Sparkles } from "lucide-react";
import BrowserWindow from "../ui/BrowserWindow";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    icon: Bookmark,
    title: "Setup UrMind",
    description:
      "Click the extension icon to configure your Gemini API key, generation mode (offline/online), and indexing preferences. Manual override is enabled by default.",
    image: "/thumbnails/thumb-3.png",
  },
  {
    id: 2,
    icon: Search,
    title: "Search Your Mind",
    description:
      "Press keyboard shortcut anywhere to search. Ask questions, find information instantly.",
    image: "/thumbnails/thumb-1.png",
  },
  {
    id: 3,
    icon: Sparkles,
    title: "Deep Research",
    description:
      "Ask questions and receive comprehensive answers with sources cited. Like Perplexity, but powered by your browsing history.",
    shortcut: ["⌘", "⏎"],
    image: "/thumbnails/thumb-2.png",
  },
  {
    id: 4,
    icon: Layers,
    title: "Organize Visually",
    description:
      "Access your Mindboard. Drag, connect, and organize all your saved contexts.",
    image: "/thumbnails/thumb-4.png",
  },
];

export default function QuickStart() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <section className="py-24 md:py-32 lg:py-40 bg-gradient-to-b from-gray-100 to-dark-100.1 text-white-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-poppins mb-4">
            Get started in 4 simple steps
          </h2>
          <p className="text-base md:text-lg text-white-100/70 max-w-2xl mx-auto leading-relaxed">
            UrMind integrates seamlessly into your workflow. Start capturing and
            recalling information in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Left side - Vertical step cards */}
          <div className="space-y-4">
            {steps.map((step) => {
              const IconComponent = step.icon;
              const isActive = activeStep === step.id;

              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`
                    relative p-6 rounded-lg cursor-pointer transition-all duration-300
                    ${
                      isActive
                        ? "bg-white-100/8"
                        : "bg-transparent hover:bg-white-100/5"
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Step number badge */}
                    <div
                      className={`
                      flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-base font-poppins
                      ${isActive ? "bg-white-100/15 text-white-100" : "bg-white-100/8 text-white-100/50"}
                      transition-all duration-300
                    `}
                    >
                      {step.id}
                    </div>

                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent
                          size={18}
                          className={
                            isActive ? "text-white-100" : "text-white-100/50"
                          }
                        />
                        <h3
                          className={`text-base md:text-lg font-semibold font-geistmono ${isActive ? "text-white-100" : "text-white-100/70"}`}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <p
                        className={`text-xs font-geistmono leading-relaxed mb-2 ${isActive ? "text-white-100/70" : "text-white-100/50"}`}
                      >
                        {step.description}
                      </p>
                      {step?.shortcut && (
                        <div className="flex items-center gap-1.5 mt-3">
                          {step?.shortcut.map((key, idx) => (
                            <kbd
                              key={idx}
                              className="px-2 py-1 bg-white-100/10 border border-white-100/20 rounded text-xs font-jetbrains text-white-100"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Active indicator line */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-purple-100 rounded-r"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right side - Preview/Video area */}
          <div className="lg:sticky lg:top-8 lg:col-span-2">
            <BrowserWindow
              url="chrome-extension://urmind"
              contentClassName="min-h-[350px] md:h-[650px] relative p-0"
            >
              {/* Image display */}
              {steps.map((step) => {
                if (activeStep !== step.id) return null;
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "absolute inset-0 w-full min-h-full bg-center bg-no-repeat bg-cover grayscale hover:grayscale-0 transition-all duration-300 cursor-pointer hover:scale-105",
                      activeStep === step.id ? "opacity-100" : "opacity-0",
                      activeStep === 1 ? "grayscale-0" : "grayscale"
                    )}
                    style={{
                      backgroundImage: `url(${step.image})`,
                    }}
                    aria-label={step.title}
                    role="img"
                  />
                );
              })}

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-100.1/60 via-transparent to-transparent pointer-events-none"></div>

              {/* Step indicator */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="bg-dark-100.1/80 backdrop-blur-xl border border-gray-102/30 rounded-lg px-4 py-2">
                  <p className="text-white-100 text-sm font-medium">
                    Step {activeStep} of {steps.length}
                  </p>
                </div>

                <div className="flex gap-2">
                  {steps.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => setActiveStep(step.id)}
                      className={`
                          w-2 h-2 rounded-full transition-all duration-300
                          ${activeStep === step.id ? "bg-purple-100 w-6" : "bg-white-100/40"}
                        `}
                    />
                  ))}
                </div>
              </div>
              {/* </div> */}
            </BrowserWindow>

            {/* Caption */}
            <div className="mt-8 text-center">
              <p className="text-white-100/60 text-sm md:text-base">
                {steps.find((s) => s.id === activeStep)?.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
