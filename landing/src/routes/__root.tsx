import { Outlet, createRootRoute } from "@tanstack/react-router";

import Header from "../components/Header";

export const Route = createRootRoute({
  component: () => (
    <>
      <Header />
      <Outlet />
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
