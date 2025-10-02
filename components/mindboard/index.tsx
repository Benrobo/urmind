import React from "react";
import MindboardCanvas from "./Board";
import MindBoardSidebar from "./Sidebar";

export default function MindBoardPage() {
  return (
    <div className="w-screen h-screen relative flex items-start justify-start bg-dark-100.1">
      <MindBoardSidebar />
      <MindboardCanvas />
    </div>
  );
}
