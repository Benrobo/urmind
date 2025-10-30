import { Outlet, createRootRoute } from "@tanstack/react-router";

import Header from "../components/Header";
import Footer from "../components/Footer";
import { Analytics } from "@vercel/analytics/react";

export const Route = createRootRoute({
  component: () => (
    <>
      <Header />
      <Outlet />
      <Footer />
      <Analytics />
    </>
  ),
  head: () => ({
    meta: [
      {
        title: "UrMind",
        description: "Your mind in your browser.",
      },
    ],
  }),
});
