import { cn, shortenText } from "@/lib/utils";
import { Activity, Bug, CheckCheck, CircleX, Dot, X } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import ActivitySpinner from "../spinner";
import { useActivities } from "@/hooks/useActivities";

// This is meant to have similar feature like the windows activity managers which shows lists of processes running in the background.
// but in this case, it will be for the background activities of the extension.
// things like page-indexing (what been indexed), save-to-urmind (what been saved).
// it would also show the status of the activities as well as any error that occurs as a subtitle so the user is aware that X didn;t happened.
export default function ActivityManager() {
  const [isOpen, setIsOpen] = useState(false);
  const { activities, loading, error } = useActivities();

  const pendingActivities = activities.filter(
    (activity) => activity.status === "in-progress"
  );

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-auto p-2 fixed top-[.3em] right-[-.1em] z-[9999] ">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={togglePanel}
        className="w-8 h-7 flex flex-center rounded-[3px] bg-white-100/10 hover:bg-white-100/20 transition-colors relative border-none outline-none ring-0"
      >
        <Activity className="w-4 h-4 text-white-100" />

        {/* indicator dot */}
        {pendingActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Dot
              size={40}
              className={cn(
                "absolute top-0 -translate-y-[1.7em] translate-x-[1.5em] right-0",
                true && "text-green-100"
              )}
            />
          </motion.div>
        )}
      </motion.button>

      {/* panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="min-w-[250px] max-w-[350px] min-h-[250px] max-h-[600px] bg-gray-100 rounded-[3px] shadow-lg mt-2 border border-white-100/10 fixed top-10 right-2 backdrop-blur-sm"
          >
            {/* header */}
            <div className="w-full px-3 py-3 h-auto border-b border-white-100/10 shadow-sm">
              <h2 className="text-white-100 text-sm font-medium">
                UrMind Activities
              </h2>
            </div>

            {/* content */}
            <div className="w-full h-[240px] flex flex-col gap-4 px-2 py-3 overflow-y-scroll customScrollbar">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <ActivitySpinner
                    size="sm"
                    color="bg-white-100"
                    speed="normal"
                  />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full text-red-305 text-sm">
                  Error: {error}
                </div>
              ) : activities.length === 0 ? (
                <div className="flex items-center justify-center h-full text-white/60 text-sm">
                  No activities
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {activities.map((activity, index) => (
                    <ActivityItem
                      key={activity.id}
                      title={activity.title}
                      description={activity.description || ""}
                      status={activity.status}
                      createdAt={new Date(activity.createdAt).toLocaleString()}
                      isLast={index === activities.length - 1}
                      moreItems={activities.length > 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type ActivityItemProps = {
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  createdAt: string;
  isLast: boolean;
  moreItems: boolean;
};

function ActivityItem({
  title,
  description,
  status,
  createdAt,
  isLast,
  moreItems,
}: ActivityItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        layout: { duration: 0.2 },
      }}
      layout
      className={cn("w-full h-auto relative", true && "pb-4")}
    >
      <div className="w-full flex items-center justify-start">
        <div className="w-7 h-7 rounded-full mr-3 flex items-center justify-center">
          {status === "in-progress" && (
            <ActivitySpinner size="sm" color="bg-white-100" speed="normal" />
          )}
          {status === "failed" && <Bug className="w-4 h-4 text-red-305" />}
          {status === "completed" && (
            <CheckCheck className="w-4 h-4 text-green-100" />
          )}
        </div>

        {/* vertical line */}
        {!isLast && moreItems && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className={cn(
              "w-[1px] h-[20px] bg-white-100/20 absolute left-3.5 top-9 origin-top"
            )}
          />
        )}

        <motion.div
          className="flex-1 min-w-0 flex flex-col items-start justify-start"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="text-xs font-medium text-white-100">{title}</div>
          <div className="text-[10px] text-white/50">
            {shortenText(description, 35)}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
