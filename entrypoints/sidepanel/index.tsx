import { useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import { SidepanelSearchInput } from "@/components/sidepanel";

function Sidepanel() {
  return (
    <div className="w-full h-screen bg-dark-101">
      <SidepanelSearchInput />
    </div>
  );
}

export default Sidepanel;
