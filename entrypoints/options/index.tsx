import MindBoardPage from "@/components/mindboard";
import queryClient from "@/config/tanstack-query";
import MindboardCtxProvider from "@/context/MindboardCtx";
import { QueryClientProvider } from "@tanstack/react-query";

export default function Options() {
  return (
    <QueryClientProvider client={queryClient}>
      <MindboardCtxProvider>
        <MindBoardPage />
      </MindboardCtxProvider>
    </QueryClientProvider>
  );
}
