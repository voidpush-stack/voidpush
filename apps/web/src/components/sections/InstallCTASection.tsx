"use client";

import { useState } from "react";
import Link from "next/link";

const INSTALL_CMD = "curl -fsSL https://voidpush.dev/install.sh | sh";

export function InstallCTASection() {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(INSTALL_CMD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div id="install" className="install-section">
      <div className="install-section__line" />

      <h2 className="install-title">
        Enter the
        <br />
        <span>void.</span>
      </h2>

      <p className="install-copy">One command. No account. Gone in 72 hours.</p>

      <div className="install-command-wrap">
        <button onClick={copy} className="install-command" aria-label="Copy install command">
          <span>$</span>
          <code>{INSTALL_CMD}</code>
        </button>
        <span className={`install-copy-state ${copied ? "install-copy-state--copied" : ""}`}>
          {copied ? "Copied" : "Click to copy"}
        </span>
      </div>

      <div className="install-actions">
        <Link href="/docs" className="install-action install-action--primary">
          Read docs
        </Link>
        <Link
          href="https://github.com/voidpush-stack/voidpush"
          target="_blank"
          rel="noreferrer"
          className="install-action"
        >
          Star on GitHub
        </Link>
        <Link
          href="https://x.com/voidpush_"
          target="_blank"
          rel="noreferrer"
          className="install-action"
        >
          Follow on X
        </Link>
      </div>
    </div>
  );
}
