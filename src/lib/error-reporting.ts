type ErrorReportOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

/**
 * Central place to report unhandled client-side errors (e.g. from React error
 * boundaries). Currently logs to the console; wire this up to your own error
 * tracker (Sentry, LogRocket, etc.) if you need production error monitoring.
 */
export function reportRuntimeError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ErrorReportOptions = {},
) {
  if (typeof window === "undefined") return;

  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("[runtime error]", message, {
    route: window.location.pathname,
    ...context,
    ...options,
    stack: error instanceof Error ? error.stack : undefined,
  });
}
