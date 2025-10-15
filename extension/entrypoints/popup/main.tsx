import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import Popup from ".";
import "~/assets/main.css";
import "~/assets/font.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Popup />
    <Toaster />
  </React.StrictMode>
);
