import { toast, type ExternalToast } from "sonner"

export type ToastKind = "success" | "info" | "warning" | "error"

export const TOAST_DURATION_MS: Record<ToastKind, number> = {
  success: 4000,
  info: 5000,
  warning: 7000,
  error: 10000,
}

function show(
  kind: ToastKind,
  message: string,
  options?: ExternalToast,
): string | number {
  return toast[kind](message, {
    id: `${kind}:${message}`,
    duration: TOAST_DURATION_MS[kind],
    ...options,
  })
}

export const notify = {
  success: (message: string, options?: ExternalToast) =>
    show("success", message, options),
  info: (message: string, options?: ExternalToast) =>
    show("info", message, options),
  warning: (message: string, options?: ExternalToast) =>
    show("warning", message, options),
  error: (message: string, options?: ExternalToast) =>
    show("error", message, options),
  dismiss: (id?: string | number) => toast.dismiss(id),
}