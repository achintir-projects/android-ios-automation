import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
    case "success":
    case "healthy":
      return "text-green-600 bg-green-100"
    case "in_progress":
    case "running":
    case "processing":
      return "text-blue-600 bg-blue-100"
    case "failed":
    case "error":
      return "text-red-600 bg-red-100"
    case "pending":
    case "queued":
      return "text-yellow-600 bg-yellow-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}
