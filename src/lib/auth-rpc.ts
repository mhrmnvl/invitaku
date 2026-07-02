import { createServerFn } from "@tanstack/react-start";
import { requireUserSession } from "./auth-server";

export const checkSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await requireUserSession();
    return { authenticated: true };
  } catch (err: any) {
    console.error("[checkSessionFn] verification error:", err.message || err);
    return { authenticated: false };
  }
});
