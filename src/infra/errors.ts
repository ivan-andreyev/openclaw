import fs from "node:fs";
import path from "node:path";
import { redactSensitiveText } from "../logging/redact.js";

export function extractErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") {
    return undefined;
  }
  const code = (err as { code?: unknown }).code;
  if (typeof code === "string") {
    return code;
  }
  if (typeof code === "number") {
    return String(code);
  }
  return undefined;
}

/**
 * Type guard for NodeJS.ErrnoException (any error with a `code` property).
 */
export function isErrno(err: unknown): err is NodeJS.ErrnoException {
  return Boolean(err && typeof err === "object" && "code" in err);
}

/**
 * Check if an error has a specific errno code.
 */
export function hasErrnoCode(err: unknown, code: string): boolean {
  return isErrno(err) && err.code === code;
}

export function formatErrorMessage(err: unknown): string {
  let formatted: string;
  if (err instanceof Error) {
    formatted = err.message || err.name || "Error";
  } else if (typeof err === "string") {
    formatted = err;
  } else if (typeof err === "number" || typeof err === "boolean" || typeof err === "bigint") {
    formatted = String(err);
  } else {
    try {
      formatted = JSON.stringify(err);
    } catch {
      formatted = Object.prototype.toString.call(err);
    }
  }
  // Security: best-effort token redaction before returning/logging.
  return redactSensitiveText(formatted);
}

export function formatUncaughtError(err: unknown): string {
  if (extractErrorCode(err) === "INVALID_CONFIG") {
    return formatErrorMessage(err);
  }
  if (err instanceof Error) {
    const stack = err.stack ?? err.message ?? err.name;
    return redactSensitiveText(stack);
  }
  return formatErrorMessage(err);
}

/**
 * Best-effort error output that survives closed file descriptors (EBADF).
 *
 * Tries console.error first.  When stdout/stderr FDs are already closed
 * (e.g. during full process restart with inherited stdio), falls back to
 * appending directly to the rolling log file via `fs.appendFileSync`.
 * If even that fails the message is silently dropped — crashing here would
 * only make things worse.
 */
export function safeErrorOutput(message: string): void {
  try {
    console.error(message);
    return;
  } catch (consoleErr: unknown) {
    if (
      !(consoleErr && typeof consoleErr === "object" &&
        (consoleErr as NodeJS.ErrnoException).code === "EBADF")
    ) {
      throw consoleErr;
    }
  }

  // console is dead (EBADF) — fall back to direct file append.
  try {
    const tmpBase =
      process.env.OPENCLAW_TMP_DIR ??
      (process.platform === "win32"
        ? path.join(process.env.TEMP ?? "C:\\tmp", "openclaw")
        : "/tmp/openclaw");
    const today = new Date().toISOString().slice(0, 10);
    const logPath = path.join(tmpBase, `openclaw-${today}.log`);
    fs.mkdirSync(tmpBase, { recursive: true });
    fs.appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`);
  } catch {
    // Nothing left to do — swallow silently rather than crash.
  }
}
