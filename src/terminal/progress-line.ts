let activeStream: NodeJS.WriteStream | null = null;

export function registerActiveProgressLine(stream: NodeJS.WriteStream): void {
  if (!stream.isTTY) {
    return;
  }
  activeStream = stream;
}

export function clearActiveProgressLine(): void {
  if (!activeStream?.isTTY) {
    return;
  }
  try {
    activeStream.write("\r\x1b[2K");
  } catch (err: unknown) {
    // Guard against EBADF when stream FD is closed during process restart.
    if (err && typeof err === "object" && (err as NodeJS.ErrnoException).code === "EBADF") {
      return;
    }
    throw err;
  }
}

export function unregisterActiveProgressLine(stream?: NodeJS.WriteStream): void {
  if (!activeStream) {
    return;
  }
  if (stream && activeStream !== stream) {
    return;
  }
  activeStream = null;
}
