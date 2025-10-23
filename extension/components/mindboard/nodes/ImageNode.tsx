import React, { useState, useEffect } from "react";
import NodeWrapper from "./NodeWrapper";
import { shortenText } from "@/lib/utils";
import { useMindboardContext } from "@/context/MindboardCtx";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { contextViewsStore } from "@/store/context-views.store";
import useStorageStore from "@/hooks/useStorageStore";
import { motion } from "motion/react";
import { ImageIcon, Sparkles } from "lucide-react";
import { sendMessageToBackgroundScriptWithResponse } from "@/helpers/messaging";
import ActivitySpinner from "@/components/spinner";
import { UrmindDB } from "@/types/database";

dayjs.extend(relativeTime);

type ImageNodeData = {
  context: UrmindDB["contexts"]["value"]; // Properly typed context with assetId
  metadata: {};
};

type ImageNodeProps = {
  id: string;
  data: ImageNodeData;
  position: { x: number; y: number };
  type: string;
};

export default function ImageNode(props: ImageNodeProps) {
  const { data, id, type } = props;
  const { context } = data;
  const { openRightSidebar } = useMindboardContext();
  const { value: viewState } = useStorageStore(contextViewsStore);
  const [isViewed, setIsViewed] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkViewed = async () => {
      const viewed = await contextViewsStore.isViewed(context?.id);
      setIsViewed(viewed);
    };
    checkViewed();
  }, [context?.id, viewState]);

  useEffect(() => {
    const loadAsset = async () => {
      if (context?.assetId) {
        try {
          const response = await sendMessageToBackgroundScriptWithResponse({
            action: "db-operation",
            payload: {
              operation: "get-asset-by-id",
              data: { assetId: context.assetId },
            },
          });

          if (response?.success && response.result) {
            setImageUrl((response.result as any).dataUrl);
          }
        } catch (error) {
          console.error("Error loading asset:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    loadAsset();
  }, [context?.assetId]);

  const handleClick = () => {
    openRightSidebar({ id, type, data });
  };

  return (
    <NodeWrapper
      type="artifact:image"
      context={context}
      header={{
        title: context?.title,
        subtitle: context?.summary,
        createdAt: dayjs(context?.createdAt).fromNow(),
        favicon: null,
      }}
      badge={
        !isViewed && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="bg-red-305 text-white text-[7px] font-bold px-2 py-0.5 rounded-full"
          >
            NEW
          </motion.div>
        )
      }
    >
      <motion.button
        onClick={handleClick}
        className="w-full flex flex-col gap-3 cursor-pointer border-none outline-none text-start hover:bg-white/5 rounded-xl transition-all duration-200 group"
      >
        {/* Image container with premium styling */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900"
        >
          {loading ? (
            <div className="w-full h-32 flex items-center justify-center">
              <ActivitySpinner size="sm" color="white" />
            </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={context?.title}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-110"
              />
            </>
          ) : (
            <div className="w-full h-32 flex flex-col items-center justify-center gap-2">
              <ImageIcon size={24} className="text-white/40" />
              <div className="text-white/40 text-xs">No image</div>
            </div>
          )}
        </motion.div>

        <div className="space-y-1">
          <h3 className="text-sm font-medium text-white/90 leading-tight">
            {context?.title}
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            {shortenText(context?.summary, 50)}
          </p>
        </div>
      </motion.button>
    </NodeWrapper>
  );
}
