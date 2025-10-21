import { Outlet, createRootRoute } from "@tanstack/react-router";

import Header from "../components/Header";
import Footer from "../components/Footer";

export const Route = createRootRoute({
  component: () => (
    <>
      <Header />
      <Outlet />
      <Footer />
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
