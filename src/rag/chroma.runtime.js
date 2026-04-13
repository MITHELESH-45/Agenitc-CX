const fs = require("fs");
const { spawn } = require("child_process");

const logger = require("../utils/logger");
const { getChromaDataPath, getChromaHost, getChromaPort, getChromaUrl } = require("./chroma.config");

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (err) {
    logger.error("chroma.ensure_dir_failed", { dirPath, err });
  }
}

async function waitForChroma({ timeoutMs = 15_000 } = {}) {
  const url = `${getChromaUrl()}/api/v1/heartbeat`;
  const startedAt = Date.now();

  // Node 22 has global fetch
  // Poll until Chroma responds or timeout; do not crash server if it never comes up.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (Date.now() - startedAt > timeoutMs) return false;
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(url, { method: "GET" });
      if (res.ok) return true;
    } catch (_) {
      // ignore until timeout
    }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 500));
  }
}

/**
 * Starts a local Chroma server (HTTP) with on-disk persistence.
 *
 * IMPORTANT:
 * - The Chroma JS client is REST-based; this starts Chroma inside the same deployment,
 *   so there is no external dependency.
 * - If Chroma fails to start, the app still boots; RAG will return a fallback message.
 */
async function startLocalChromaServer() {
  // The `npx chroma run` CLI currently does not support Windows x64.
  // Render runs Linux x64, which is supported. For local Windows dev,
  // run Chroma via Docker or Python and keep it on http://127.0.0.1:8000.
  if (process.platform === "win32") {
    logger.warn("chroma.autostart_skipped_windows", {
      message: "Auto-start for Chroma skipped on Windows; run Chroma separately on 127.0.0.1:8000"
    });
    return null;
  }

  const dataPath = getChromaDataPath();
  ensureDir(dataPath);

  const host = getChromaHost();
  const port = String(getChromaPort());

  logger.info("chroma.starting", { url: getChromaUrl(), dataPath });

  // Use npx so we don't rely on a global install.
  // `shell: true` makes this work on Windows and Linux.
  const child = spawn("npx", ["chroma", "run", "--path", dataPath, "--host", host, "--port", port], {
    stdio: "inherit",
    shell: true,
    windowsHide: true
  });

  child.on("error", (err) => {
    logger.error("chroma.process_error", { err });
  });

  const ready = await waitForChroma();
  if (ready) {
    logger.info("chroma.ready", { url: getChromaUrl(), dataPath });
  } else {
    logger.error("chroma.not_ready_timeout", { url: getChromaUrl(), dataPath });
  }

  return child;
}

module.exports = {
  startLocalChromaServer
};

