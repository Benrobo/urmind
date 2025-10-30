import { Sparkles, Layout, Clock, Ticket, MousePointer } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import BrowserWindow from "../ui/BrowserWindow";
import Button from "../ui/Button";

const features = [
  {
    icon: Sparkles,
    title: "Instant Memory Recall",
    description:
      "Ask your mind anything. UrMind's AI searches your entire browsing history instantly, delivering precise answers with source attribution.",
    image: "/thumbnails/thumb-2.png",
    color: "purple-100",
    bgClass: "gradient-purple-subtle",
    imagePosition: "right",
  },
  {
    icon: Layout,
    title: "Visual Mindboard",
    description:
      "Organize everything visually with our beautiful canvas. Drag, drop, and connect your saved contexts. Create collections, link related information, and build your personal knowledge graph that grows with you.",
    image: "/thumbnails/thumb-4.png",
    color: "blue-100",
    bgClass: "gradient-blue-subtle",
    imagePosition: "left",
  },
  {
    icon: Clock,
    title: "Smart Auto-Save",
    description:
      "Automatically captures what matters. Every page you visit is intelligently indexed, every insight is saved, zero effort required. Your browsing becomes searchable history, automatically organized and always accessible.",
    image: "/thumbnails/thumb-3.png",
    color: "orange-350",
    bgClass: "gradient-orange-subtle",
    imagePosition: "right",
  },
  {
    icon: MousePointer,
    title: "Manual Indexing & Smart Control",
    description:
      "Choose how you capture: automatic, manual, or disabled. Use the floating index button to save any page on demand, with smart category suggestions and clear visual states for pending, processing, and completed saves.",
    image: "/changelogs/2.png",
    color: "purple-100",
    bgClass: "gradient-purple-subtle",
    imagePosition: "left",
  },
];

export default function Features() {
  return (
    <section id="features" className={cn("bg-dark-100.1")}>
      {/* Section header */}
      <div className={cn("py-20 md:py-24 bg-dark-100.1")}>
        <div
          className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center")}
        >
          <h2
            className={cn(
              "text-3xl md:text-4xl lg:text-5xl font-bold font-poppins text-white-100 mb-4"
            )}
          >
            Why choose UrMind?
          </h2>
          <p
            className={cn(
              "text-base md:text-sm font-geistmono text-white-100/70 max-w-3xl mx-auto leading-relaxed"
            )}
          >
            Transform your browsing experience with AI-powered memory and
            organization
          </p>
        </div>
      </div>

      {/* Feature sections */}
      {features.map((feature, index) => {
        const IconComponent = feature.icon;
        const isImageLeft = feature.imagePosition === "left";

        return (
          <div
            key={index}
            className={cn("relative py-24 md:py-32 lg:py-40", feature.bgClass)}
          >
            <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>
              <div
                className={cn(
                  "grid lg:grid-cols-2 gap-12 lg:gap-16 items-center",
                  isImageLeft && "lg:grid-flow-dense"
                )}
              >
                {/* Text Side */}
                <div className={cn(isImageLeft && "lg:col-start-1")}>
                  {/* Icon */}
                  <div
                    className={cn(
                      "inline-flex w-12 h-12 mb-8 rounded-md items-center justify-center border border-white-100/10",
                      feature.color === "purple-100"
                        ? "bg-purple-100/20"
                        : feature.color === "blue-100"
                          ? "bg-blue-100/20"
                          : "bg-orange-350/20"
                    )}
                  >
                    <IconComponent
                      size={25}
                      className={cn(
                        feature.color === "purple-100"
                          ? "text-purple-200"
                          : feature.color === "blue-100"
                            ? "text-blue-100"
                            : "text-orange-350"
                      )}
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className={cn(
                      "text-2xl md:text-3xl lg:text-4xl font-bold font-poppins text-white-100 mb-4 leading-tight"
                    )}
                  >
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={cn(
                      "text-xs md:text-sm font-geistmono text-white-100/70 leading-relaxed mb-8"
                    )}
                  >
                    {feature.description}
                  </p>

                  
                </div>

                {/* Image Side */}
                <div
                  className={cn(isImageLeft && "lg:col-start-2 lg:row-start-1")}
                >
                  <BrowserWindow contentClassName="w-full relative">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className={cn(
                        "w-full h-full transition-transform duration-500 object-contain"
                      )}
                    />
                    <div
                      className={cn(
                        "absolute inset-0 bg-gradient-to-t from-dark-100.1/40 via-transparent to-transparent pointer-events-none"
                      )}
                    ></div>
                  </BrowserWindow>

                  {/* Floating badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={cn(
                      "absolute top-8 bg-white-100/10 backdrop-blur-sm border border-white-100/20 rounded-xl px-6 py-3",
                      isImageLeft ? "-right-4" : "-left-4"
                    )}
                  >
                    <p
                      className={cn(
                        "text-white-100 font-geistmono font-medium text-sm flex flex-center gap-2"
                      )}
                    >
                      <Ticket size={16} className="text-white-100/50" /> Feature{" "}
                      {index + 1}
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Bottom CTA */}
      <div className={cn("py-24 md:py-32 bg-dark-100.1 text-center")}>
        <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8")}>
          <h3
            className={cn(
              "text-2xl md:text-3xl lg:text-4xl font-bold font-poppins text-white-100 mb-6"
            )}
          >
            Ready to transform your browsing experience?
          </h3>
          <p className={cn("text-white-100/60 mb-10 text-lg leading-relaxed")}>
            Join thousands of users already browsing smarter with UrMind
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6"
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full rounded-full bg-purple-100 hover:bg-purple-100/90 font-poppins sm:w-auto px-8 py-3 relative overflow-hidden group flex flex-center"
            >
              <span className="relative z-10 flex items-center gap-2 text-sm text-center">
                Get Started Free
              </span>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
