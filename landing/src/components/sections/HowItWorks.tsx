import { Globe, Search, Brain } from "lucide-react";

const steps = [
  {
    icon: Globe,
    title: "Browse Naturally",
    description:
      "Extension runs silently in the background, automatically indexing every page you visit.",
    color: "blue-100",
  },
  {
    icon: Search,
    title: "Ask UrMind",
    description:
      "Press keyboard shortcut to search your memory. Ask anything about what you've browsed.",
    shortcut: ["⌘", "U"],
    color: "purple-100",
  },
  {
    icon: Brain,
    title: "Get Instant Answers",
    description:
      "AI retrieves and summarizes from your saved contexts with source attribution.",
    color: "orange-350",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 md:py-32 lg:py-40 bg-gray-100 relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-100/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-100/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-poppins text-white-100 mb-6">
            How it works
          </h2>
          <p className="text-base md:text-lg text-white-100/70 max-w-3xl mx-auto leading-relaxed">
            Three simple steps to transform your browser into your second brain
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-24">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center group">
                {/* Icon */}
                <div
                  className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-transform duration-300 shadow-lg group-hover:scale-110 ${
                    step.color === "blue-100"
                      ? "bg-blue-100/20"
                      : step.color === "purple-100"
                        ? "bg-purple-100/20"
                        : "bg-orange-350/20"
                  }`}
                >
                  <IconComponent
                    size={40}
                    className={
                      step.color === "blue-100"
                        ? "text-blue-100"
                        : step.color === "purple-100"
                          ? "text-purple-100"
                          : "text-orange-350"
                    }
                  />
                </div>

                {/* Content */}
                <div className="max-w-sm mx-auto px-4">
                  <h3 className="text-xl md:text-2xl font-bold font-poppins text-white-100 mb-4 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-white-100/70 leading-relaxed text-sm md:text-base mb-3">
                    {step.description}
                  </p>
                  {step.shortcut && (
                    <div className="flex items-center justify-center gap-2">
                      {step.shortcut.map((key, idx) => (
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
              </div>
            );
          })}
        </div>

        {/* Bottom section with visual */}
        <div className="text-center">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold font-poppins text-white-100 mb-12">
              Ready to start? It's that simple.
            </h3>

            {/* Demo visual */}
            <div className="relative rounded-xl overflow-hidden shadow-premium-lg border border-gray-102/20 group">
              <img
                src="/thumbnails/thumb-5.png"
                alt="UrMind workflow demonstration"
                className="w-full h-auto group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-100.1/40 via-transparent to-transparent pointer-events-none"></div>
            </div>

            <p className="text-white-100/70 mt-10 text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
              Install the extension and start building your AI-powered memory
              today
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
