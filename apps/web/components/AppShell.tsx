"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "./Nav";
import { API_URL } from "../lib/api";

/**
 * Single place to control when the app chrome (Nav + shell layout) is shown.
 * Auth pages should be distraction-free.
 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";

  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password";

  useEffect(() => {
    if (isAuthRoute) return;
    const source = new EventSource(`${API_URL}/realtime/stream`, { withCredentials: true });
    source.addEventListener("error", () => {
      source.close();
    });
    return () => source.close();
  }, [isAuthRoute]);

  if (isAuthRoute) {
    return (
      <div className="min-h-screen w-full px-4 py-10">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center">
          <div className="w-full">{children}</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const source = new EventSource(`${API_URL}/realtime/stream`, { withCredentials: true });
    source.addEventListener("error", () => {
      source.close();
    });
    return () => source.close();
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-transparent text-white">
      <Nav />
      <main className="flex-1 px-4 pb-24 pt-6 md:pb-6">{children}</main>
    </div>
  );
}
