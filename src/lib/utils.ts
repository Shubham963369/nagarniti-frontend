import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;

  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(2)} K`;
  }
  return `₹${num.toLocaleString("en-IN")}`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    planned: "bg-gray-100 text-gray-800",
    started: "bg-blue-100 text-blue-800",
    ongoing: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    on_hold: "bg-orange-100 text-orange-800",
    cancelled: "bg-red-100 text-red-800",
    pending: "bg-gray-100 text-gray-800",
    under_review: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    resolved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getFundSourceColor(source: string): string {
  const colors: Record<string, string> = {
    BMC: "bg-blue-100 text-blue-800",
    "State Government": "bg-purple-100 text-purple-800",
    "Central Government": "bg-green-100 text-green-800",
    "MLA Fund": "bg-orange-100 text-orange-800",
    "MP Fund": "bg-red-100 text-red-800",
    Other: "bg-gray-100 text-gray-800",
  };
  return colors[source] || "bg-gray-100 text-gray-800";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-gray-100 text-gray-800";
}
