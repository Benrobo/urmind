import queryClient from "@/config/tanstack-query";
import App from "./App";
import DevTool from "./DevTool";
import { QueryClientProvider } from "@tanstack/react-query";
import { HotkeysProvider } from "react-hotkeys-hook";

import "../assets/font.css";
import "../assets/main.css";

export default function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <HotkeysProvider initiallyActiveScopes={["settings"]}>
        <App />
        {/* <DevTool /> */}
      </HotkeysProvider>
    </QueryClientProvider>
  );
}
