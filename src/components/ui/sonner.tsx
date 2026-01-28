"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: "hsl(var(--background))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--border))",
        },
        classNames: {
          toast: "group toast",
          title: "text-sm font-semibold",
          description: "text-sm text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          success: "border-green-500 bg-green-50 text-green-900",
          error: "border-red-500 bg-red-50 text-red-900",
          loading: "border-blue-500 bg-blue-50 text-blue-900",
        },
      }}
      expand={false}
      richColors
      closeButton
    />
  );
}
