"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      duration={3500}
      visibleToasts={5}
      expand={true}
      toastOptions={{
        style: {
          background: "var(--color-card, #ffffff)",
          color: "var(--color-foreground, #111111)",
          border: "1px solid var(--color-border, #e5e5e5)",
          borderRadius: "1.25rem",
          padding: "0.85rem 1.25rem",
          fontSize: "0.8125rem",
          fontFamily: "var(--font-sans, inherit)",
          boxShadow: "0 14px 40px -6px rgba(0, 0, 0, 0.18)",
          textTransform: "none",
        },
        className: "text-xs font-medium normal-case tracking-normal",
      }}
    />
  );
}
