function formatContext(ctx) {
  if (!ctx) return "";
  if (typeof ctx === "string") return ` ${ctx}`;
  try {
    return ` ${JSON.stringify(ctx)}`;
  } catch {
    return " [unserializable context]";
  }
}

function write(level, message, context) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${level.toUpperCase()} ${message}${formatContext(context)}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}

module.exports = {
  info(message, context) {
    write("info", message, context);
  },
  warn(message, context) {
    write("warn", message, context);
  },
  error(errOrMessage, context) {
    if (errOrMessage instanceof Error) {
      write("error", errOrMessage.message, {
        ...context,
        stack: errOrMessage.stack
      });
      return;
    }
    write("error", String(errOrMessage), context);
  }
};

