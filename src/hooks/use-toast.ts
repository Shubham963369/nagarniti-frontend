"use client";

import { toast as sonnerToast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export function useToast() {
  const toast = ({ title, description, variant, duration = 4000 }: ToastOptions) => {
    if (variant === "destructive") {
      return sonnerToast.error(title, {
        description,
        duration,
      });
    }
    return sonnerToast.success(title, {
      description,
      duration,
    });
  };

  return { toast };
}

// Export toast functions for direct use
export const toast = {
  // Basic toasts
  success: (title: string, description?: string) => {
    sonnerToast.success(title, { description });
  },

  error: (title: string, description?: string) => {
    sonnerToast.error(title, { description });
  },

  info: (title: string, description?: string) => {
    sonnerToast.info(title, { description });
  },

  warning: (title: string, description?: string) => {
    sonnerToast.warning(title, { description });
  },

  // Loading toast with promise
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  // Loading toast that you manually dismiss
  loading: (message: string) => {
    return sonnerToast.loading(message);
  },

  // Dismiss a specific toast or all toasts
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};
