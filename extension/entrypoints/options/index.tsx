import MindBoardPage from "@/components/mindboard";
import queryClient from "@/config/tanstack-query";
import MindboardCtxProvider from "@/context/MindboardCtx";
import { QueryClientProvider } from "@tanstack/react-query";
import { HotkeysProvider } from "react-hotkeys-hook";
import Spotlight from "@/components/spotlight";
import DevTool from "@/components/DevTool";

export default function Options() {
  return (
    <QueryClientProvider client={queryClient}>
      <HotkeysProvider initiallyActiveScopes={["settings"]}>
        <MindboardCtxProvider>
          <MindBoardPage />
        </MindboardCtxProvider>
        <Spotlight />
        {/* <DevTool /> */}
      </HotkeysProvider>
    </QueryClientProvider>
  );
}
