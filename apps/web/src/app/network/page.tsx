"use client";

import { useState } from "react";
import { Nav } from "@/components/ui/Nav";
import { Footer } from "@/components/ui/Footer";

const RELAYS = [
  { id: "R1", city: "Tokyo",      country: "JP", region: "ap", lat: 35.68,  lng: 139.69, latency: 12,  trust: 9.8, uptime: 99.97, type: "core",      online: true  },
  { id: "R2", city: "São Paulo",  country: "BR", region: "sa", lat: -23.55, lng: -46.63, latency: 88,  trust: 9.6, uptime: 99.81, type: "community", online: true  },
  { id: "R3", city: "Frankfurt",  country: "DE", region: "eu", lat: 50.11,  lng: 8.68,   latency: 22,  trust: 9.9, uptime: 99.99, type: "core",      online: true  },
  { id: "R4", city: "Singapore",  country: "SG", region: "ap", lat: 1.35,   lng: 103.82, latency: 18,  trust: 9.7, uptime: 99.94, type: "core",      online: true  },
  { id: "R5", city: "Amsterdam",  country: "NL", region: "eu", lat: 52.37,  lng: 4.90,   latency: 19,  trust: 9.8, uptime: 99.98, type: "core",      online: true  },
  { id: "R6", city: "Mumbai",     country: "IN", region: "ap", lat: 19.08,  lng: 72.88,  latency: 44,  trust: 9.5, uptime: 99.76, type: "community", online: true  },
  { id: "R7", city: "Chicago",    country: "US", region: "us", lat: 41.88,  lng: -87.63, latency: 31,  trust: 9.6, uptime: 99.91, type: "core",      online: true  },
  { id: "R8", city: "Sydney",     country: "AU", region: "ap", lat: -33.87, lng: 151.21, latency: 71,  trust: 9.4, uptime: 99.83, type: "community", online: true  },
  { id: "R9", city: "Lagos",      country: "NG", region: "af", lat: 6.52,   lng: 3.38,   latency: 102, trust: 9.2, uptime: 99.55, type: "community", online: false },
];

const REGION_COLOR: Record<string, string> = {
  ap: "var(--ghost)",
  eu: "var(--teal)",
  us: "var(--blue)",
  sa: "var(--yellow)",
  af: "#fb923c",
};

export default function NetworkPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? RELAYS : RELAYS.filter(r => r.region === filter);
  const selectedRelay = RELAYS.find(r => r.id === selected);

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg2)", padding: "3rem 2rem 2rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div className="s-tag">Network Explorer</div>
            <h1 style={{ fontFamily: "var(--display)", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.75rem" }}>
              9 relays. Zero trace.
            </h1>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.8, maxWidth: 520 }}>
              Every push routes through at least 3 hops across different jurisdictions. Your origin IP is mathematically unrecoverable at the destination.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", marginBottom: "2rem" }}>
            {[
              { val: "9", label: "Total Relays" },
              { val: "8", label: "Online Now" },
              { val: "99.9%", label: "Avg Uptime" },
              { val: "38ms", label: "Avg Latency" },
            ].map(({ val, label }) => (
              <div key={label} style={{ padding: "1.5rem", background: "var(--bg2)", textAlign: "center" }}>
                <span style={{ fontFamily: "var(--display)", fontSize: "2rem", fontWeight: 800, color: "var(--ghost)", display: "block", marginBottom: "0.25rem" }}>{val}</span>
                <span style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Relay map SVG */}
          <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", marginBottom: "2rem", padding: "1.5rem", position: "relative" }}>
            <div style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1rem" }}>
              relay network map — click a node to inspect
            </div>
            <svg viewBox="0 0 900 420" style={{ width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
              {/* World map outline (simplified) */}
              <rect x="0" y="0" width="900" height="420" fill="transparent" />
              {/* Grid lines */}
              {[105,210,315,420,525,630,735].map(x => <line key={x} x1={x} y1="0" x2={x} y2="420" stroke="rgba(167,139,250,0.04)" strokeWidth="1" />)}
              {[84,168,252,336].map(y => <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="rgba(167,139,250,0.04)" strokeWidth="1" />)}

              {/* Connections between online relays */}
              {RELAYS.filter(r => r.online).flatMap((r, i, arr) =>
                arr.slice(i + 1, i + 3).map(r2 => {
                  const x1 = ((r.lng + 180) / 360) * 900;
                  const y1 = ((90 - r.lat) / 180) * 420;
                  const x2 = ((r2.lng + 180) / 360) * 900;
                  const y2 = ((90 - r2.lat) / 180) * 420;
                  return <line key={`${r.id}-${r2.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(167,139,250,0.12)" strokeWidth="1" strokeDasharray="4 4" />;
                })
              )}

              {/* Relay nodes */}
              {RELAYS.map(relay => {
                const x = ((relay.lng + 180) / 360) * 900;
                const y = ((90 - relay.lat) / 180) * 420;
                const color = relay.online ? REGION_COLOR[relay.region] : "var(--muted)";
                const isSelected = selected === relay.id;
                return (
                  <g key={relay.id} onClick={() => setSelected(isSelected ? null : relay.id)} style={{ cursor: "pointer" }}>
                    {isSelected && <circle cx={x} cy={y} r="18" fill="none" stroke={color} strokeWidth="1" opacity="0.3" />}
                    <circle cx={x} cy={y} r="8" fill="var(--bg)" stroke={color} strokeWidth={isSelected ? 2 : 1.5} strokeDasharray={relay.type === "community" ? "3 2" : "0"} />
                    {relay.online && <circle cx={x} cy={y} r="3" fill={color} />}
                    <text x={x} y={y - 14} textAnchor="middle" fontSize="9" fill={color} fontFamily="Space Mono,monospace">{relay.id}</text>
                    <text x={x} y={y + 20} textAnchor="middle" fontSize="8" fill="rgba(100,116,139,0.8)" fontFamily="Space Mono,monospace">{relay.city}</text>
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
              {[
                { label: "core network", dash: false, color: "var(--ghost)" },
                { label: "community node", dash: true, color: "var(--ghost)" },
                { label: "offline", dash: false, color: "var(--muted)" },
              ].map(({ label, dash, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.63rem", color: "var(--muted)" }}>
                  <svg width="20" height="12"><circle cx="10" cy="6" r="5" fill="var(--bg2)" stroke={color} strokeWidth="1.5" strokeDasharray={dash ? "2 1" : "0"} /></svg>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Filter + Table */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {["all","ap","eu","us","sa","af"].map(r => (
                <button key={r} onClick={() => setFilter(r)}
                  style={{ padding: "0.35rem 0.875rem", border: `1px solid ${filter === r ? "var(--ghost)" : "var(--border)"}`, background: filter === r ? "rgba(167,139,250,0.1)" : "transparent", color: filter === r ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.15s" }}>
                  {r}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{filtered.filter(r => r.online).length}/{filtered.length} online</span>
          </div>

          <div style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 80px 90px 80px", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", fontSize: "0.6rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              <span>ID</span><span>Location</span><span>Region</span><span>Latency</span><span>Trust</span><span>Uptime</span><span>Status</span>
            </div>
            {filtered.map(relay => (
              <div key={relay.id} onClick={() => setSelected(selected === relay.id ? null : relay.id)}
                style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 80px 80px 90px 80px", padding: "0.875rem 1rem", borderBottom: "1px solid rgba(167,139,250,0.05)", fontSize: "0.75rem", cursor: "pointer", background: selected === relay.id ? "rgba(167,139,250,0.05)" : "transparent", transition: "background 0.15s" }}>
                <span style={{ color: REGION_COLOR[relay.region], fontWeight: 700 }}>{relay.id}</span>
                <span style={{ color: "var(--text)" }}>{relay.city}, {relay.country}</span>
                <span style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: "0.65rem" }}>{relay.region}</span>
                <span style={{ color: relay.latency < 30 ? "var(--green)" : relay.latency < 80 ? "var(--yellow)" : "var(--muted)" }}>{relay.latency}ms</span>
                <span style={{ color: relay.trust >= 9.7 ? "var(--green)" : "var(--teal)" }}>{relay.trust}</span>
                <span style={{ color: "var(--muted)" }}>{relay.uptime}%</span>
                <span style={{ color: relay.online ? "var(--green)" : "var(--muted)" }}>
                  {relay.online ? "● online" : "○ offline"}
                </span>
              </div>
            ))}
          </div>

          {/* Selected relay detail */}
          {selectedRelay && (
            <div style={{ marginTop: "1.5rem", border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
                <span style={{ fontFamily: "var(--display)", fontSize: "1.25rem", fontWeight: 700, color: REGION_COLOR[selectedRelay.region] }}>{selectedRelay.id}</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text)" }}>{selectedRelay.city}, {selectedRelay.country}</span>
                <span style={{ fontSize: "0.63rem", padding: "0.2rem 0.6rem", background: selectedRelay.type === "core" ? "rgba(167,139,250,0.1)" : "rgba(100,116,139,0.1)", color: selectedRelay.type === "core" ? "var(--ghost)" : "var(--muted)", border: "1px solid var(--border)", marginLeft: "auto" }}>{selectedRelay.type}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
                {[
                  { label: "Latency",  val: `${selectedRelay.latency}ms` },
                  { label: "Trust",    val: `${selectedRelay.trust}/10` },
                  { label: "Uptime",   val: `${selectedRelay.uptime}%` },
                  { label: "Region",   val: selectedRelay.region.toUpperCase() },
                ].map(({ label, val }) => (
                  <div key={label} style={{ padding: "0.875rem", background: "var(--bg)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.35rem" }}>{label}</div>
                    <div style={{ fontSize: "1rem", fontFamily: "var(--display)", fontWeight: 700, color: "var(--ghost)" }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
