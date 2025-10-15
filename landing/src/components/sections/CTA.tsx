import { CheckCircle, Shield, Zap } from "lucide-react";

const trustIndicators = [
  {
    icon: CheckCircle,
    text: "Free to use",
    color: "green-100",
  },
  {
    icon: Shield,
    text: "Chrome Web Store",
    color: "blue-100",
  },
  {
    icon: Zap,
    text: "Install in seconds",
    color: "orange-350",
  },
];

export default function CTA() {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-gradient-to-br from-purple-100/10 via-dark-100.1 to-blue-100/10 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(143,99,243,0.2),transparent_60%)]"></div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/3 -right-20 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-poppins text-white-100 mb-6 leading-tight">
            Transform Your Browser Into Your{" "}
            <span className="hero-gradient">Second Brain</span>
          </h2>

          {/* Subheadline */}
          <p className="text-base md:text-lg text-white-100/70 max-w-3xl mx-auto mb-10 leading-relaxed">
            Join thousands of users who have already upgraded their browsing
            experience with AI-powered memory.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8">
            {trustIndicators.map((indicator, index) => {
              const IconComponent = indicator.icon;
              return (
                <div
                  key={index}
                  className="flex items-center space-x-2 text-white-100/80"
                >
                  <IconComponent
                    size={20}
                    className={
                      indicator.color === "green-100"
                        ? "text-green-100"
                        : indicator.color === "blue-100"
                          ? "text-blue-100"
                          : "text-orange-350"
                    }
                  />
                  <span className="text-sm font-medium">{indicator.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
