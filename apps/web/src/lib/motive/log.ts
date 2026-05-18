// Structured logger for Motive. See RELIABILITY.md Invariant 8 and
// docs/design-docs/golden-principles.md R2.
//
// Every log line is JSON with at minimum: level, time, message, request_id
// (when known), actor, route. Server-side writes to stdout/stderr; browser
// uses console with the same structured payload so the log shape is uniform.
//
// The `no-unstructured-log` ESLint rule bans direct console.* usage in app
// code and points violators here.

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown> & {
  request_id?: string;
  actor?: "user" | "system" | "agent" | "demo";
  route?: string;
};

const isServer =
  typeof process !== "undefined" &&
  typeof process.versions !== "undefined" &&
  typeof process.versions.node === "string";

function emit(level: LogLevel, fields: LogFields, message: string): void {
  const payload = {
    level,
    time: new Date().toISOString(),
    message,
    ...fields,
  };

  if (isServer) {
    const line = JSON.stringify(payload) + "\n";
    const stream =
      level === "error" || level === "warn" ? process.stderr : process.stdout;
    stream.write(line);
    return;
  }

  // Browser: keep using console but always with the structured payload.
  // The eslint rule `motive/no-unstructured-log` is disabled for this file
  // via the eslint.config.mjs `ignores` pattern.
  const method: (...args: unknown[]) => void =
    (console[level] as ((...args: unknown[]) => void) | undefined) ?? console.log;
  method(payload);
}

export const log = {
  debug: (fields: LogFields, message: string): void => emit("debug", fields, message),
  info: (fields: LogFields, message: string): void => emit("info", fields, message),
  warn: (fields: LogFields, message: string): void => emit("warn", fields, message),
  error: (fields: LogFields, message: string): void => emit("error", fields, message),
};
