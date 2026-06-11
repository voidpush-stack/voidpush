import { execFileSync, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import net from "node:net";

const root = resolve(import.meta.dirname, "..");
const isWindows = process.platform === "win32";
const exe = isWindows ? ".exe" : "";
const vpush = join(root, "target", "debug", `vpush${exe}`);
const relay = join(root, "target", "debug", `void-relay${exe}`);

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? root,
    env: { ...process.env, ...options.env },
    stdio: options.stdio ?? "pipe",
    encoding: options.encoding ?? "utf8",
  });
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
    server.on("error", reject);
  });
}

async function waitForRelay(port, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/relay/info`);
      if (response.ok) return await response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Relay did not become ready: ${lastError?.message ?? "unknown error"}`);
}

function clean(path) {
  if (path && existsSync(path)) rmSync(path, { recursive: true, force: true });
}

let relayProcess;
let workdir;

try {
  console.log("Building vpush and void-relay...");
  run("cargo", ["build", "-p", "vpush", "-p", "void-relay"], { stdio: "inherit" });

  workdir = mkdtempSync(join(tmpdir(), "voidpush-e2e-"));
  const home = join(workdir, "home");
  const remote = join(workdir, "remote.git");
  const source = join(workdir, "source");
  mkdirSync(home);

  console.log(`Using temp workspace: ${workdir}`);
  run("git", ["init", "--bare", remote]);
  run("git", ["init", "-b", "main", source]);
  writeFileSync(join(source, "README.md"), "# relay e2e\n");
  run("git", ["add", "README.md"], { cwd: source });
  run("git", ["commit", "-m", "initial commit"], {
    cwd: source,
    env: {
      GIT_AUTHOR_NAME: "VoidPush Test",
      GIT_AUTHOR_EMAIL: "test@voidpush.local",
      GIT_COMMITTER_NAME: "VoidPush Test",
      GIT_COMMITTER_EMAIL: "test@voidpush.local",
    },
  });
  run("git", ["remote", "add", "origin", remote], { cwd: source });

  const port = await freePort();
  const privateKey = randomBytes(32).toString("hex");
  relayProcess = spawn(relay, [], {
    cwd: root,
    env: {
      ...process.env,
      RELAY_ID: "R-local",
      RELAY_REGION: "local",
      RELAY_PRIVATE_KEY: privateKey,
      PORT: String(port),
      RUST_LOG: "warn",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let relayOutput = "";
  relayProcess.stdout.on("data", (chunk) => {
    relayOutput += chunk.toString();
  });
  relayProcess.stderr.on("data", (chunk) => {
    relayOutput += chunk.toString();
  });

  const relayInfo = await waitForRelay(port);
  const relayUrl = `http://127.0.0.1:${port}`;
  const relays = JSON.stringify([
    {
      id: "R-local",
      city: "Local",
      url: relayUrl,
      public_key: relayInfo.public_key,
      latency_ms: 1,
      trust: 10,
      online: true,
    },
  ]);

  const vpushEnv = {
    HOME: home,
    USERPROFILE: home,
    VPUSH_HOME: join(home, ".vpush"),
    VPUSH_RELAYS_JSON: relays,
    VPUSH_ALLOW_SINGLE_HOP: "1",
  };

  console.log("Creating isolated VoidPush identity...");
  run(vpush, ["init", "--persist"], { cwd: source, env: vpushEnv, stdio: "inherit" });

  console.log("Pushing through local onion relay...");
  run(vpush, ["push", "origin", "main", "--hops", "1"], {
    cwd: source,
    env: vpushEnv,
    stdio: "inherit",
  });

  const subject = run("git", [
    "--git-dir",
    remote,
    "log",
    "-1",
    "--pretty=%s",
    "refs/heads/main",
  ]).trim();
  if (subject !== "initial commit") {
    throw new Error(`Unexpected remote commit subject: ${subject}`);
  }

  console.log("E2E relay push passed.");
} catch (error) {
  console.error(error?.stack ?? error);
  if (relayProcess) {
    console.error("Relay output:");
    console.error(relayProcess.spawnfile ? "" : "relay process did not spawn");
  }
  process.exitCode = 1;
} finally {
  if (relayProcess && !relayProcess.killed) relayProcess.kill();
  if (process.env.VPUSH_KEEP_E2E_TMP !== "1") clean(workdir);
}
