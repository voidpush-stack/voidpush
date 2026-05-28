import * as vscode from "vscode";
import { execFile, ExecFileException } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCLI(): string {
  return vscode.workspace.getConfiguration("voidpush").get("cliPath", "vpush");
}

async function runVpush(args: string[]): Promise<{ stdout: string; stderr: string }> {
  const cli = getCLI();
  try {
    const result = await execFileAsync(cli, args, {
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
      timeout: 30_000,
    });
    return result;
  } catch (err) {
    const e = err as ExecFileException;
    throw new Error(e.stderr || e.message);
  }
}

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

// ─── Status bar ───────────────────────────────────────────────────────────────

let statusBarItem: vscode.StatusBarItem;

function updateStatusBar(text: string, tooltip: string, color?: string) {
  statusBarItem.text = text;
  statusBarItem.tooltip = tooltip;
  statusBarItem.color = color;
  statusBarItem.show();
}

async function refreshStatus() {
  try {
    const { stdout } = await runVpush(["status", "--json"]);
    const data = JSON.parse(stdout);
    if (data.active) {
      const ttlH = Math.max(0, Math.floor(data.ttl_remaining_secs / 3600));
      const color = ttlH < 2 ? new vscode.ThemeColor("statusBarItem.warningForeground") : undefined;
      updateStatusBar(
        `👻 ${data.void_id.slice(0, 12)}... (${ttlH}h)`,
        `Ghost identity active\nID: ${data.void_id}\nTTL: ${ttlH}h remaining`,
      );
    } else {
      updateStatusBar("👻 no identity", "No ghost identity. Run Ghost: Init.");
    }
  } catch {
    updateStatusBar("👻 ghost offline", "ghost CLI not found or no identity");
  }
}

// ─── Commands ─────────────────────────────────────────────────────────────────

async function cmdInit() {
  const ttl = await vscode.window.showInputBox({
    prompt: "Identity TTL in hours (default: 72)",
    value: "72",
    validateInput: (v) => isNaN(Number(v)) ? "Enter a number" : undefined,
  });
  if (!ttl) return;

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Generating ghost identity..." },
    async () => {
      try {
        const { stdout } = await runVpush(["init", "--ttl", ttl]);
        await refreshStatus();
        vscode.window.showInformationMessage(`👻 ${stdout.match(/Identity: (\S+)/)?.[1] ?? "Ghost"} — identity created`);
      } catch (err) {
        vscode.window.showErrorMessage(`void init failed: ${err}`);
      }
    }
  );
}

async function cmdPush() {
  if (!getWorkspaceRoot()) {
    vscode.window.showErrorMessage("Open a git repository first.");
    return;
  }

  const cfg = vscode.workspace.getConfiguration("voidpush");
  const branch = cfg.get("defaultBranch", "main");
  const hops   = cfg.get("defaultHops", 3);

  const confirm = await vscode.window.showQuickPick(
    ["Push anonymously (void push)", "Cancel"],
    { placeHolder: `Push to origin/${branch} through ${hops} relay hops` }
  );
  if (confirm !== "Push anonymously (void push)") return;

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Pushing anonymously..." },
    async (progress) => {
      try {
        progress.report({ message: "Stripping metadata..." });
        const { stdout } = await runVpush(["push", "origin", branch, "--hops", String(hops)]);
        const scoreMatch = stdout.match(/score: (\S+)/i);
        vscode.window.showInformationMessage(
          `👻 Push complete${scoreMatch ? ` · Quality score pending` : ""}`,
          "Check Score"
        ).then((choice) => {
          if (choice === "Check Score") cmdScore();
        });
      } catch (err) {
        vscode.window.showErrorMessage(`void push failed: ${err}`);
      }
    }
  );
}

async function cmdScore() {
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "Fetching quality score..." },
    async () => {
      try {
        const { stdout } = await runVpush(["score", "--json"]);
        const data = JSON.parse(stdout);

        const panel = vscode.window.createWebviewPanel(
          "ghostScore",
          `Ghost Score — ${data.void_id}`,
          vscode.ViewColumn.Beside,
          { enableScripts: false }
        );
        panel.webview.html = scoreWebview(data);
      } catch (err) {
        vscode.window.showWarningMessage(
          `Score not available yet. Scores appear within 24h of push. (${err})`
        );
      }
    }
  );
}

async function cmdStatus() {
  try {
    const { stdout } = await runVpush(["status", "--json"]);
    const data = JSON.parse(stdout);
    const ttlH = Math.floor((data.ttl_remaining_secs ?? 0) / 3600);
    vscode.window.showInformationMessage(
      `👻 ${data.void_id} · ${ttlH}h remaining · region: ${data.region ?? "auto"}`,
      "Expire", "Renew"
    ).then((choice) => {
      if (choice === "Expire") cmdExpire();
      if (choice === "Renew")  cmdInit();
    });
  } catch {
    vscode.window.showWarningMessage("No ghost identity found. Run Ghost: Init.");
  }
}

async function cmdExpire() {
  const confirm = await vscode.window.showWarningMessage(
    "Permanently destroy current ghost identity? This cannot be undone.",
    { modal: true },
    "Destroy identity"
  );
  if (confirm !== "Destroy identity") return;

  try {
    await runVpush(["expire", "--force"]);
    await refreshStatus();
    vscode.window.showInformationMessage("👻 Identity destroyed — you are now anonymous.");
  } catch (err) {
    vscode.window.showErrorMessage(`void expire failed: ${err}`);
  }
}

async function cmdOpenDocs() {
  vscode.env.openExternal(vscode.Uri.parse("https://voidpush.dev/docs"));
}

// ─── Score webview ────────────────────────────────────────────────────────────

function scoreWebview(data: Record<string, unknown>): string {
  const score      = data.score as number ?? 0;
  const breakdown  = data.breakdown as Record<string, number> ?? {};
  const feedback   = (data.feedback as string[]) ?? [];
  const rank       = data.rank_weekly as number;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: monospace; padding: 1.5rem; background: #080b10; color: #e2e8f0; }
  h1 { font-size: 1.2rem; color: #a78bfa; margin-bottom: 1rem; }
  .score-val { font-size: 3rem; font-weight: 800; color: #a78bfa; line-height: 1; }
  .row { display: flex; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(167,139,250,0.1); font-size: 0.85rem; }
  .label { color: #64748b; }
  .val { color: #e2e8f0; font-weight: 600; }
  .bar-wrap { flex: 1; height: 4px; background: #111820; border-radius: 2px; margin: 0 1rem; align-self: center; overflow: hidden; }
  .bar-fill { height: 100%; background: linear-gradient(90deg, #7c3aed, #a78bfa); border-radius: 2px; }
  .feedback { margin-top: 1rem; padding: 0.875rem; background: #0d1117; border-left: 2px solid #7c3aed; font-style: italic; color: #94a3b8; font-size: 0.82rem; line-height: 1.7; }
  .void-id { font-size: 0.72rem; color: #64748b; margin-bottom: 1.5rem; }
</style>
</head>
<body>
  <h1>Quality Score</h1>
  <div class="ghost-id">${data.void_id as string}</div>
  <div class="score-val">${score.toFixed(1)}<span style="font-size:1rem;color:#64748b"> / 10</span></div>
  ${rank ? `<div style="font-size:0.72rem;color:#64748b;margin-top:0.5rem">rank #${rank} this week</div>` : ""}
  <div style="margin-top:1.5rem">
    ${Object.entries(breakdown).map(([k, v]) => `
    <div class="row">
      <span class="label">${k}</span>
      <div class="bar-wrap"><div class="bar-fill" style="width:${(v / 10) * 100}%"></div></div>
      <span class="val">${(v as number).toFixed(1)}</span>
    </div>`).join("")}
  </div>
  ${feedback.length ? `<div class="feedback">"${feedback[0]}"</div>` : ""}
</body>
</html>`;
}

// ─── Extension activate / deactivate ─────────────────────────────────────────

export function activate(context: vscode.ExtensionContext) {
  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = "voidpush.status";
  context.subscriptions.push(statusBarItem);
  refreshStatus();

  // Auto-refresh status every 5 minutes
  const timer = setInterval(refreshStatus, 5 * 60 * 1000);
  context.subscriptions.push({ dispose: () => clearInterval(timer) });

  // Register commands
  const cmds: [string, () => Promise<void>][] = [
    ["voidpush.init",     cmdInit],
    ["voidpush.push",     cmdPush],
    ["voidpush.score",    cmdScore],
    ["voidpush.status",   cmdStatus],
    ["voidpush.expire",   cmdExpire],
    ["voidpush.openDocs", cmdOpenDocs],
  ];

  for (const [id, fn] of cmds) {
    context.subscriptions.push(vscode.commands.registerCommand(id, fn));
  }

  vscode.window.showInformationMessage("👻 VoidPush loaded. Your code speaks. Your identity doesn't.");
}

export function deactivate() {
  statusBarItem?.dispose();
}
