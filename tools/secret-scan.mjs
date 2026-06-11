import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const trackedSecretFiles =
  /(^|\/)(\.env|.*\.(pem|p12|pfx|secret|secrets)|.*\.tfvars|identity|zk-root|relay-private.*\.hex|private.*\.hex)$/i;

const riskyTokenPatterns = [
  /BEGIN (RSA|OPENSSH|EC|DSA|PRIVATE) KEY/,
  /ghp_[A-Za-z0-9_]{30,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9]{32,}/,
  /AKIA[0-9A-Z]{16}/,
  /[A-Za-z0-9_]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
];

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

const files = git(["ls-files"])
  .split(/\r?\n/)
  .filter(Boolean);

const badFiles = files.filter((file) => trackedSecretFiles.test(file));
if (badFiles.length > 0) {
  console.error("Tracked secret-like file path found:");
  for (const file of badFiles) console.error(`  ${file}`);
  process.exit(1);
}

const scanFiles = files.filter(
  (file) => file !== "Cargo.lock" && file !== "tools/secret-scan.mjs",
);

const matches = [];
for (const file of scanFiles) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (riskyTokenPatterns.some((pattern) => pattern.test(line))) {
      matches.push(`${file}:${index + 1}`);
    }
  }
}

if (matches.length > 0) {
  console.error("Potential secret token found:");
  for (const match of matches) console.error(`  ${match}`);
  process.exit(1);
}

console.log("Secret scan passed.");
