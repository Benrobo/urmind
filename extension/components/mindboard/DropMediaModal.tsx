import React from "react";
import { motion } from "motion/react";
import { Upload, Sparkles } from "lucide-react";

type DropMediaModalProps = {
  isDraggingOver: boolean;
};

export default function DropMediaModal({
  isDraggingOver,
}: DropMediaModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: isDraggingOver ? 1.1 : 1,
          opacity: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="relative"
      >
        {/* Outer glow ring */}
        <motion.div
          animate={{
            scale: isDraggingOver ? [1, 1.2, 1] : 1,
            opacity: isDraggingOver ? [0.3, 0.6, 0.3] : 0.3,
          }}
          transition={{
            duration: 2,
            repeat: isDraggingOver ? Infinity : 0,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl"
        />

        {/* Main container */}
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Animated background pattern */}
          <motion.div
            animate={{
              rotate: isDraggingOver ? 360 : 0,
            }}
            transition={{
              duration: 8,
              repeat: isDraggingOver ? Infinity : 0,
              ease: "linear",
            }}
            className="absolute inset-0 rounded-2xl opacity-10"
            style={{
              background: `conic-gradient(from 0deg, transparent, rgba(255,255,255,0.1), transparent)`,
            }}
          />

          {/* Content */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Icon with animation */}
            <motion.div
              animate={{
                y: isDraggingOver ? [-2, 2, -2] : 0,
                rotate: isDraggingOver ? [0, 5, -5, 0] : 0,
              }}
              transition={{
                duration: 1.5,
                repeat: isDraggingOver ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <motion.div
                animate={{
                  scale: isDraggingOver ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 1,
                  repeat: isDraggingOver ? Infinity : 0,
                  ease: "easeInOut",
                }}
                className="p-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/20"
              >
                <Upload size={28} className="text-white/90" />
              </motion.div>

              {/* Sparkle effects */}
              {isDraggingOver && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: [0, 20, 40],
                      y: [0, -10, -20],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0,
                    }}
                    className="absolute top-2 right-2"
                  >
                    <Sparkles size={12} className="text-yellow-400" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      x: [0, -15, -30],
                      y: [0, 8, 16],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: 0.5,
                    }}
                    className="absolute bottom-2 left-2"
                  >
                    <Sparkles size={10} className="text-blue-400" />
                  </motion.div>
                </>
              )}
            </motion.div>

            {/* Text with subtle animation */}
            <motion.div
              animate={{
                y: isDraggingOver ? [-1, 1, -1] : 0,
              }}
              transition={{
                duration: 2,
                repeat: isDraggingOver ? Infinity : 0,
                ease: "easeInOut",
              }}
              className="text-center"
            >
              <motion.h3
                animate={{
                  backgroundPosition: isDraggingOver ? "200% 0%" : "0% 0%",
                }}
                transition={{
                  duration: 2,
                  repeat: isDraggingOver ? Infinity : 0,
                  ease: "linear",
                }}
                className="text-xl font-medium bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent bg-[length:200%_100%]"
              >
                Drop media here
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-white/60 mt-2"
              >
                Images will be analyzed with AI
              </motion.p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
