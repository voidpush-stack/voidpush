export interface BlogPost {
  slug:      string;
  title:     string;
  date:      string;
  category:  "protocol" | "anonymity" | "release" | "community";
  excerpt:   string;
  readMins:  number;
  content:   string;
}

export const POSTS: BlogPost[] = [
  {
    slug: "why-anonymous-code-review-matters",
    title: "Why anonymous code review produces better software",
    date: "2026-05-01",
    category: "anonymity",
    readMins: 6,
    excerpt: "When reviewers know who wrote the code, they stop reviewing the code. They review the person. Here's what the research says — and what we built instead.",
    content: `
## The seniority problem

In a 2019 study by Microsoft Research, code review comments on identical patches varied significantly based on whether the author was identified as a senior or junior engineer. Senior engineers' patches received 40% fewer critical comments — not because the code was better, but because reviewers self-censored.

This isn't malicious. It's deeply human. When you see a name you recognise, your brain activates social context before technical context. You remember the last conversation you had. You think about the org chart. You consider whether this person is having a hard week.

None of that makes you a better code reviewer.

## What blind review changes

VoidPush strips author metadata before the diff reaches any reviewer. What remains is pure signal: the structure of the code, the quality of the tests, the clarity of the commit message.

In our alpha, reviewers who didn't know they were reviewing the same patch rated it an average of 1.2 points higher when the "author" was presented as a senior engineer vs. an unknown. That gap disappears entirely when authorship is hidden.

## The reproducibility angle

Anonymous review also solves a subtler problem: reviewers become more consistent. When you can't anchor on author identity, you're forced to develop and apply consistent mental models of code quality. Your feedback becomes more transferable, more teachable, more objective.

This is why academic peer review has used anonymity for decades. VoidPush brings the same principle to software.

## What we don't hide

VoidPush hides identity, not accountability. Every anonymous push is cryptographically attributed to a void ID. If malicious code is pushed, the ZK chain can be used to establish a pattern of behaviour without revealing the developer's real identity. The code itself is always public.

We're not building a system for bad actors. We're building a system where good actors get judged on merit alone.
    `.trim(),
  },
  {
    slug: "voidpush-protocol-v01",
    title: "Introducing the VoidPush Protocol v0.1",
    date: "2026-05-08",
    category: "protocol",
    readMins: 8,
    excerpt: "A technical walkthrough of how VoidPush achieves anonymity without sacrificing accountability — onion routing, metadata stripping, and ZK reputation linking.",
    content: `
## Overview

The VoidPush Protocol is an open specification for anonymous code contribution. It defines three components: the identity layer, the transport layer, and the reputation layer.

## Identity layer: ephemeral keypairs

Each ghost session begins with \`void init\`, which generates an Ed25519 keypair locally. The private key never leaves the machine. The public key is hashed to produce a void ID — a short, human-readable identifier like \`void_7f3a2b9c\`.

Identities are ephemeral by default, expiring after 72 hours. This limits the attack surface for correlation attacks: even if an adversary could link two pushes to the same void ID, that ID is gone within 3 days.

## Transport layer: multi-hop relay chain

Every push is routed through a minimum of 3 relay nodes before reaching its destination. Each relay node:

1. Receives an onion-encrypted payload
2. Decrypts one layer using its X25519 private key (ECDH + ChaCha20-Poly1305)
3. Reads the next-hop address from the inner header
4. Forwards the remaining ciphertext

The final relay (exit node) decrypts the innermost layer, strips all remaining metadata, and performs the actual git push.

No single relay knows both the origin IP and the destination repository. The first relay knows the origin but not the destination. The last relay knows the destination but not the origin.

## Reputation layer: ZK chain linking

The ephemeral identity model creates a problem: how does a developer accumulate reputation across sessions without revealing a persistent identity?

VoidPush solves this with zero-knowledge proof linking. When generating a new void ID, the developer can optionally link it to a ZK chain — a cryptographic structure that proves continuity of identity without revealing which void IDs belong to the same person.

The score engine verifies these proofs before aggregating reputation across sessions.

## Open standard

The protocol is versioned and open. Community relay operators can implement their own nodes by following the relay node specification. The ZK proof format is documented and verifiable by third parties.
    `.trim(),
  },
  {
    slug: "alpha-launch",
    title: "VoidPush alpha: 2,847 ghosts, 14k anonymous commits",
    date: "2026-05-15",
    category: "release",
    readMins: 4,
    excerpt: "Three weeks since alpha launch. Here's what we've learned, what broke, and what comes next.",
    content: `
## By the numbers

Three weeks in: 2,847 active contributors across 9 relay nodes in 7 countries. 14,203 anonymous commits. Average quality score: 8.3/10. Not bad for a protocol that didn't exist a month ago.

The relay network held up. Tokyo (R1) peaked at 4,200 requests/hour during the first weekend and didn't blink. Frankfurt (R3) had a 23-minute degradation on Day 11 — a misconfigured TLS cert — fixed in 8 minutes once we noticed.

## What surprised us

The most active contributors aren't using VoidPush to hide from employers or avoid accountability. They're using it to submit contributions to projects where they'd otherwise be dismissed — projects maintained by people who've never heard of them, or where the maintainer has publicly disparaged self-taught developers.

One ghost in the top 10 told us: "I've had PRs to this project ignored for two years. Under a void ID, my last three got merged in under 48 hours. Same code. Different name."

## What broke

FOK order handling — just kidding, wrong project. What actually broke: our metadata stripping missed \`GIT_AUTHOR_DATE\` in certain edge cases with rebase-merged commits. Fixed in v0.1.1.

The ZK linking system worked but was slower than expected — proof generation takes ~200ms on low-end hardware. We're optimising.

## What comes next

Federation. Community-operated relay nodes are coming in Phase 3. If you want to run a relay, the spec is being finalised. Reach out.
    `.trim(),
  },
  {
    slug: "federation-preview",
    title: "Federation preview: run your own relay node",
    date: "2026-05-22",
    category: "community",
    readMins: 5,
    excerpt: "Phase 3 brings federated relays. Anyone can run a node. Here's what that means, how trust scores work, and how to apply.",
    content: `
## Why federation matters

A centralised relay network is a single point of failure — and a single point of trust. If VoidPush controls all the relays, you have to trust VoidPush. That's not the deal we're offering.

Federation means the relay network can exist without us. If VoidPush disappeared tomorrow, the community-operated nodes would continue routing pushes.

## How trust scores work

Every relay node has a trust score (0–10) computed from:

- **Uptime** (40%): rolling 30-day availability
- **Latency** (30%): median response time vs. regional average
- **Integrity** (30%): cryptographic audit log verification

The trust score determines how often a node is selected for relay chains. New nodes start at 5.0 and earn trust over time.

## How to apply

Fill out the federation application (link below). We'll review your infrastructure, verify your node setup, and assign a relay ID. Community nodes are clearly marked in the explorer.

Requirements: VPS with at least 1 CPU, 512MB RAM, static IP, port 8000 open. We recommend nodes in underrepresented regions — we have good coverage in EU and AP, need more in SA, AF, and ME.
    `.trim(),
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}

export function getCategoryColor(category: BlogPost["category"]): string {
  return {
    protocol:  "var(--ghost)",
    anonymity: "var(--teal)",
    release:   "var(--green)",
    community: "var(--yellow)",
  }[category];
}
