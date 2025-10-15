import { Search, Tag, Keyboard, Sparkles } from "lucide-react";
import BrowserWindow from "../ui/BrowserWindow";
import Button from "../ui/Button";
import { motion } from "framer-motion";

const highlights = [
  {
    icon: Search,
    title: "AI-powered search",
    description: "Ask anything about your browsing history",
  },
  {
    icon: Tag,
    title: "Source attribution",
    description: "See exactly where information comes from",
  },
  {
    icon: Sparkles,
    title: "Smart organization",
    description: "Automatically organized by topic",
  },
  {
    icon: Keyboard,
    title: "Keyboard shortcuts",
    description: "Quick access anytime",
    shortcut: ["⌘", "U"],
  },
];

export default function Demo() {
  return (
    <section id="demo" className="py-24 md:py-32 lg:py-40 bg-dark-100.1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-poppins text-white-100 mb-6">
            See UrMind in action
          </h2>
          <p className="text-base md:text-lg text-white-100/70 max-w-2xl mx-auto leading-relaxed">
            Experience the power of AI-powered memory recall
          </p>
        </div>

        {/* Main Demo Image */}
        <div className="relative max-w-6xl mx-auto mb-16">
          <BrowserWindow url="chrome-extension://urmind/spotlight">
            <div className="relative group">
              <img
                src="/thumbnails/thumb-1.png"
                alt="UrMind Spotlight Search Interface"
                className="w-full h-auto transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-100.1/40 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </BrowserWindow>
        </div>

        {/* Feature highlights grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {highlights.map((highlight, index) => {
            const IconComponent = highlight.icon;
            return (
              <div key={index} className="text-center group">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-purple-100/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-100/30 transition-all duration-300">
                  <IconComponent size={24} className="text-purple-100" />
                </div>
                <h4 className="text-base md:text-lg font-semibold font-poppins text-white-100 mb-2">
                  {highlight.title}
                </h4>
                <p className="text-white-100/70 text-sm leading-relaxed mb-2">
                  {highlight.description}
                </p>
                {highlight.shortcut && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {highlight.shortcut.map((key, idx) => (
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
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-bold font-poppins text-white-100 mb-4">
            Ready to try it yourself?
          </h3>
          <p className="text-white-100/70 mb-8 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Install UrMind and start building your AI-powered memory today
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full mx-auto flex flex-col sm:flex-row md:flex-row gap-4 justify-center items-center mb-6"
          >
            <a
              href="https://github.com/Benrobo/urmind/releases/tag/v1.0"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-full bg-purple-100 hover:bg-purple-100/90 font-poppins sm:w-auto px-8 py-3 relative overflow-hidden group flex flex-center"
              >
                <span className="relative z-10 flex items-center gap-2 text-sm">
                  Install Extension
                </span>
              </Button>
            </a>
            <div className="w-full md:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-full bg-dark-100.3 font-poppins sm:w-auto px-8 py-3 flex flex-center"
              >
                <span className="relative z-10 flex items-center gap-2 text-sm">
                  Watch Demo Video
                </span>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
