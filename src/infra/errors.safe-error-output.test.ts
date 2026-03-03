import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { safeErrorOutput } from "./errors.js";

describe("safeErrorOutput", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENCLAW_TMP_DIR;
  });

  it("writes to console.error on the happy path", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    safeErrorOutput("hello world");
    expect(spy).toHaveBeenCalledWith("hello world");
  });

  it("falls back to file append when console.error throws EBADF", () => {
    const ebadf = Object.assign(new Error("write EBADF"), { code: "EBADF" });
    vi.spyOn(console, "error").mockImplementation(() => {
      throw ebadf;
    });

    const tmpDir = path.join(process.env.TEMP ?? "/tmp", "openclaw-test-safe-error-output");
    process.env.OPENCLAW_TMP_DIR = tmpDir;

    const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    const appendSpy = vi.spyOn(fs, "appendFileSync").mockImplementation(() => {});

    safeErrorOutput("ebadf fallback message");

    expect(mkdirSpy).toHaveBeenCalledWith(tmpDir, { recursive: true });
    expect(appendSpy).toHaveBeenCalledTimes(1);
    const writtenPath = appendSpy.mock.calls[0]![0] as string;
    const writtenData = appendSpy.mock.calls[0]![1] as string;

    // Log file name contains today's date
    const today = new Date().toISOString().slice(0, 10);
    expect(writtenPath).toBe(path.join(tmpDir, `openclaw-${today}.log`));

    // Written data contains the original message with a timestamp prefix
    expect(writtenData).toContain("ebadf fallback message");
    expect(writtenData).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(writtenData).toMatch(/\n$/);
  });

  it("re-throws non-EBADF errors from console.error", () => {
    const otherError = new Error("some other error");
    vi.spyOn(console, "error").mockImplementation(() => {
      throw otherError;
    });

    expect(() => safeErrorOutput("should re-throw")).toThrow(otherError);
  });

  it("re-throws non-object thrown values from console.error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {
      throw "string error"; // eslint-disable-line no-throw-literal
    });

    expect(() => safeErrorOutput("should re-throw string")).toThrow("string error");
  });

  it("silently swallows when both console.error and file fallback fail", () => {
    const ebadf = Object.assign(new Error("write EBADF"), { code: "EBADF" });
    vi.spyOn(console, "error").mockImplementation(() => {
      throw ebadf;
    });

    // File fallback also fails
    vi.spyOn(fs, "mkdirSync").mockImplementation(() => {
      throw new Error("disk full");
    });

    // Should not throw — silently drops the message
    expect(() => safeErrorOutput("total failure")).not.toThrow();
  });

  it("uses OPENCLAW_TMP_DIR env when set", () => {
    const ebadf = Object.assign(new Error("write EBADF"), { code: "EBADF" });
    vi.spyOn(console, "error").mockImplementation(() => {
      throw ebadf;
    });

    const customDir = "/custom/openclaw/logs";
    process.env.OPENCLAW_TMP_DIR = customDir;

    const mkdirSpy = vi.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    vi.spyOn(fs, "appendFileSync").mockImplementation(() => {});

    safeErrorOutput("custom dir test");

    expect(mkdirSpy).toHaveBeenCalledWith(customDir, { recursive: true });
  });
});
