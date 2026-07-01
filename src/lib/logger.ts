type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function getMinLevel(): LogLevel {
  if (process.env.NODE_ENV === "production") {
    return "info";
  }

  return "debug";
}

function shouldLog(level: LogLevel) {
  return LEVELS[level] >= LEVELS[getMinLevel()];
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (!shouldLog(level)) {
    return;
  }

  const payload = context ? `${message} ${JSON.stringify(context)}` : message;

  if (level === "error") {
    console.error(payload);
    return;
  }

  if (level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    write("debug", message, context);
  },
  info(message: string, context?: Record<string, unknown>) {
    write("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>) {
    write("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>) {
    write("error", message, context);
  },
};
