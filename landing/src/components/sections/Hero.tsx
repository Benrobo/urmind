import BrowserWindow from "../ui/BrowserWindow";
import Button from "../ui/Button";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-dark-100.1 text-white-100 overflow-hidden pt-20 py-48 lg:py-56">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100/10 via-blue-100/5 to-dark-100.1"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-6xl mx-auto">
          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold font-poppins leading-[1.1] mb-6"
          >
            Never forget anything{" "}
            <span className="hero-gradient font-geistmono">you browse</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-md md:text-lg font-geistmono text-white-100/70 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            UrMind is your browser's AI-powered memory. Your personal second
            brain, always at your fingertips.
          </motion.p>

          {/* CTA Buttons */}
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
            <a href="#how-it-works" className="w-full md:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-full bg-dark-100.3 font-poppins sm:w-auto px-8 py-3 flex flex-center"
              >
                <span className="relative z-10 flex items-center gap-2 text-sm">
                  See How It Works
                </span>
              </Button>
            </a>
          </motion.div>

          {/* Micro-copy with urgency */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-white-100/60 mb-16"
          >
            <span className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-100 rounded-full animate-pulse"></div>
              Free forever • No credit card
            </span>
            <span className="hidden sm:block">•</span>
            <span>Chrome only • Other browsers coming soon</span>
          </motion.div>

          {/* Hero mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative max-w-6xl mx-auto"
          >
            <div className="relative rounded-xl overflow-hidden shadow-premium-lg border border-gray-102/20 hover:scale-[1.01] transition-transform duration-500">
              <BrowserWindow url="youtube.com/urmind">
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "56.25%" }}
                >
                  <iframe
                    className="absolute top-0 left-0 w-full h-full"
                    src="https://www.youtube.com/embed/_DQC8l2Q9bI"
                    title="UrMind Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </BrowserWindow>
              {/* Overlay gradient for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-100.1/40 via-transparent to-transparent pointer-events-none"></div>
            </div>

            {/* Glow effects */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl blur-2xl opacity-20 -z-10"></div>

            {/* Floating keyboard shortcut badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="absolute -top-4 -right-4 bg-white-100/20 backdrop-blur-lg border border-white/20 rounded-sm px-[3px] py-1 shadow-xl scale-[1.2]"
            >
              <div className="flex items-center gap-2 text-white-100/80 text-sm">
                <kbd className="w-5 h-5 flex-center bg-white-100/10 border border-white-100/20 rounded text-md font-jetbrains text-white-100">
                  ⌘
                </kbd>
                <kbd className="w-5 h-5 flex-center bg-white-100/10 border border-white-100/20 rounded text-md font-jetbrains text-white-100">
                  U
                </kbd>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-white-100/40 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white-100/60 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  );
}
