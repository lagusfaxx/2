"use client";

import { ReactNode, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { motion } from "framer-motion";
import { connectRealtime } from "@/lib/realtime";

export function AppShell({ children, userId }: { children: ReactNode; userId?: string }) {
  useEffect(() => {
    if (userId) {
      connectRealtime(userId);
    }
  }, [userId]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 px-6 py-8"
      >
        {children}
      </motion.main>
      <BottomNav />
    </div>
  );
}
