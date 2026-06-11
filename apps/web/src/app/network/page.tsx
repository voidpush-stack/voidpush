"use client";

import { useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import { Footer } from "@/components/ui/Footer";
import { Nav } from "@/components/ui/Nav";

const RELAYS = [
  { id: "R1", city: "Tokyo", country: "JP", region: "ap", lat: 35.68, lng: 139.69, latency: 12, trust: 9.8, uptime: 99.97, type: "core", online: true },
  { id: "R2", city: "Sao Paulo", country: "BR", region: "sa", lat: -23.55, lng: -46.63, latency: 88, trust: 9.6, uptime: 99.81, type: "community", online: true },
  { id: "R3", city: "Frankfurt", country: "DE", region: "eu", lat: 50.11, lng: 8.68, latency: 22, trust: 9.9, uptime: 99.99, type: "core", online: true },
  { id: "R4", city: "Singapore", country: "SG", region: "ap", lat: 1.35, lng: 103.82, latency: 18, trust: 9.7, uptime: 99.94, type: "core", online: true },
  { id: "R5", city: "Amsterdam", country: "NL", region: "eu", lat: 52.37, lng: 4.9, latency: 19, trust: 9.8, uptime: 99.98, type: "core", online: true },
  { id: "R6", city: "Mumbai", country: "IN", region: "ap", lat: 19.08, lng: 72.88, latency: 44, trust: 9.5, uptime: 99.76, type: "community", online: true },
  { id: "R7", city: "Chicago", country: "US", region: "us", lat: 41.88, lng: -87.63, latency: 31, trust: 9.6, uptime: 99.91, type: "core", online: true },
  { id: "R8", city: "Sydney", country: "AU", region: "ap", lat: -33.87, lng: 151.21, latency: 71, trust: 9.4, uptime: 99.83, type: "community", online: true },
  { id: "R9", city: "Lagos", country: "NG", region: "af", lat: 6.52, lng: 3.38, latency: 102, trust: 9.2, uptime: 99.55, type: "community", online: false },
];

const REGION_COLOR: Record<string, string> = {
  ap: "var(--ghost)",
  eu: "var(--teal)",
  us: "var(--blue)",
  sa: "var(--yellow)",
  af: "#fb923c",
};

const MAP_WIDTH = 900;
const MAP_HEIGHT = 420;
const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.8;
const REGIONS = ["all", "ap", "eu", "us", "sa", "af"];

type Relay = (typeof RELAYS)[number];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function relayPoint(relay: Relay) {
  return {
    x: ((relay.lng + 180) / 360) * MAP_WIDTH,
    y: ((90 - relay.lat) / 180) * MAP_HEIGHT,
  };
}

export default function NetworkPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef({ active: false, moved: false, x: 0, y: 0 });

  const filtered = filter === "all" ? RELAYS : RELAYS.filter((relay) => relay.region === filter);
  const selectedRelay = RELAYS.find((relay) => relay.id === selected);

  function zoomBy(delta: number) {
    setView((current) => ({ ...current, zoom: clamp(current.zoom + delta, MIN_ZOOM, MAX_ZOOM) }));
  }

  function resetMapView() {
    setView({ x: 0, y: 0, zoom: 1 });
  }

  function handleMapPointerDown(event: PointerEvent<SVGSVGElement>) {
    dragRef.current = { active: true, moved: false, x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleMapPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragRef.current.active || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawDx = event.clientX - dragRef.current.x;
    const rawDy = event.clientY - dragRef.current.y;
    const dx = (rawDx * MAP_WIDTH) / rect.width;
    const dy = (rawDy * MAP_HEIGHT) / rect.height;

    if (Math.abs(rawDx) + Math.abs(rawDy) > 2) dragRef.current.moved = true;
    dragRef.current.x = event.clientX;
    dragRef.current.y = event.clientY;
    setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  }

  function handleMapPointerUp(event: PointerEvent<SVGSVGElement>) {
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleMapWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    zoomBy(event.deltaY > 0 ? -0.12 : 0.12);
  }

  function selectRelay(id: string) {
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setSelected((current) => (current === id ? null : id));
  }

  return (
    <>
      <Nav />
      <div style={{ paddingTop: "5rem", minHeight: "100vh", position: "relative", zIndex: 1 }}>
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

          <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", marginBottom: "2rem", padding: "1.5rem", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.63rem", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                relay network map - drag to pan, scroll to zoom, click a node
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <button type="button" onClick={() => zoomBy(-0.18)} aria-label="Zoom out relay map" style={mapButtonStyle}>-</button>
                <span style={{ minWidth: 52, textAlign: "center", fontSize: "0.65rem", color: "var(--muted)", fontFamily: "var(--mono)" }}>{Math.round(view.zoom * 100)}%</span>
                <button type="button" onClick={() => zoomBy(0.18)} aria-label="Zoom in relay map" style={mapButtonStyle}>+</button>
                <button type="button" onClick={resetMapView} style={resetButtonStyle}>reset</button>
              </div>
            </div>

            <div style={{ position: "relative", overflow: "hidden", border: "1px solid rgba(167,139,250,0.08)", background: "rgba(2,4,7,0.24)", touchAction: "none" }}>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                onPointerDown={handleMapPointerDown}
                onPointerMove={handleMapPointerMove}
                onPointerUp={handleMapPointerUp}
                onPointerCancel={handleMapPointerUp}
                onWheel={handleMapWheel}
                style={{ width: "100%", height: "auto", display: "block", cursor: dragRef.current.active ? "grabbing" : "grab", userSelect: "none", touchAction: "none" }}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="relayGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(167,139,250,0.22)" />
                    <stop offset="100%" stopColor="rgba(167,139,250,0)" />
                  </radialGradient>
                </defs>
                <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} fill="transparent" />
                <g transform={`translate(${view.x} ${view.y}) scale(${view.zoom})`}>
                  <rect x="-60" y="-40" width={MAP_WIDTH + 120} height={MAP_HEIGHT + 80} fill="url(#relayGlow)" opacity="0.35" />
                  {[105, 210, 315, 420, 525, 630, 735].map((x) => <line key={x} x1={x} y1="0" x2={x} y2={MAP_HEIGHT} stroke="rgba(167,139,250,0.05)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
                  {[84, 168, 252, 336].map((y) => <line key={y} x1="0" y1={y} x2={MAP_WIDTH} y2={y} stroke="rgba(167,139,250,0.05)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}

                  {RELAYS.filter((relay) => relay.online).flatMap((relay, index, onlineRelays) =>
                    onlineRelays.slice(index + 1, index + 3).map((nextRelay) => {
                      const p1 = relayPoint(relay);
                      const p2 = relayPoint(nextRelay);
                      return <line key={`${relay.id}-${nextRelay.id}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(167,139,250,0.16)" strokeWidth="1" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />;
                    })
                  )}

                  {RELAYS.map((relay) => {
                    const { x, y } = relayPoint(relay);
                    const color = relay.online ? REGION_COLOR[relay.region] : "var(--muted)";
                    const isSelected = selected === relay.id;
                    return (
                      <g key={relay.id} onClick={() => selectRelay(relay.id)} style={{ cursor: "pointer" }} role="button" aria-label={`Inspect ${relay.id} ${relay.city}`}>
                        {isSelected && <circle cx={x} cy={y} r="22" fill="none" stroke={color} strokeWidth="1" opacity="0.32" vectorEffect="non-scaling-stroke" />}
                        {relay.online && <circle cx={x} cy={y} r="18" fill={color} opacity="0.08" />}
                        <circle cx={x} cy={y} r="8" fill="var(--bg)" stroke={color} strokeWidth={isSelected ? 2.5 : 1.5} strokeDasharray={relay.type === "community" ? "3 2" : "0"} vectorEffect="non-scaling-stroke" />
                        {relay.online && <circle cx={x} cy={y} r="3" fill={color} />}
                        <text x={x} y={y - 15} textAnchor="middle" fontSize="9" fill={color} fontFamily="Space Mono,monospace" pointerEvents="none">{relay.id}</text>
                        <text x={x} y={y + 21} textAnchor="middle" fontSize="8" fill="rgba(148,163,184,0.86)" fontFamily="Space Mono,monospace" pointerEvents="none">{relay.city}</text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

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

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {REGIONS.map((region) => (
                <button key={region} onClick={() => setFilter(region)} style={{ padding: "0.35rem 0.875rem", border: `1px solid ${filter === region ? "var(--ghost)" : "var(--border)"}`, background: filter === region ? "rgba(167,139,250,0.1)" : "transparent", color: filter === region ? "var(--ghost)" : "var(--muted)", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase", transition: "all 0.15s" }}>
                  {region}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>{filtered.filter((relay) => relay.online).length}/{filtered.length} online</span>
          </div>

          <div style={{ border: "1px solid var(--border)", background: "var(--bg2)", overflowX: "auto" }}>
            <div style={tableHeaderRowStyle}>
              <span>ID</span><span>Location</span><span>Region</span><span>Latency</span><span>Trust</span><span>Uptime</span><span>Status</span>
            </div>
            {filtered.map((relay) => (
              <div key={relay.id} onClick={() => setSelected(selected === relay.id ? null : relay.id)} style={{ ...tableDataRowStyle, background: selected === relay.id ? "rgba(167,139,250,0.05)" : "transparent" }}>
                <span style={{ color: REGION_COLOR[relay.region], fontWeight: 700 }}>{relay.id}</span>
                <span style={{ color: "var(--text)" }}>{relay.city}, {relay.country}</span>
                <span style={{ color: "var(--muted)", textTransform: "uppercase", fontSize: "0.65rem" }}>{relay.region}</span>
                <span style={{ color: relay.latency < 30 ? "var(--green)" : relay.latency < 80 ? "var(--yellow)" : "var(--muted)" }}>{relay.latency}ms</span>
                <span style={{ color: relay.trust >= 9.7 ? "var(--green)" : "var(--teal)" }}>{relay.trust}</span>
                <span style={{ color: "var(--muted)" }}>{relay.uptime}%</span>
                <span style={{ color: relay.online ? "var(--green)" : "var(--muted)" }}>{relay.online ? "online" : "offline"}</span>
              </div>
            ))}
          </div>

          {selectedRelay && (
            <div style={{ marginTop: "1.5rem", border: "1px solid var(--border)", background: "var(--bg2)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--display)", fontSize: "1.25rem", fontWeight: 700, color: REGION_COLOR[selectedRelay.region] }}>{selectedRelay.id}</span>
                <span style={{ fontSize: "0.82rem", color: "var(--text)" }}>{selectedRelay.city}, {selectedRelay.country}</span>
                <span style={{ fontSize: "0.63rem", padding: "0.2rem 0.6rem", background: selectedRelay.type === "core" ? "rgba(167,139,250,0.1)" : "rgba(100,116,139,0.1)", color: selectedRelay.type === "core" ? "var(--ghost)" : "var(--muted)", border: "1px solid var(--border)", marginLeft: "auto" }}>{selectedRelay.type}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
                {[
                  { label: "Latency", val: `${selectedRelay.latency}ms` },
                  { label: "Trust", val: `${selectedRelay.trust}/10` },
                  { label: "Uptime", val: `${selectedRelay.uptime}%` },
                  { label: "Region", val: selectedRelay.region.toUpperCase() },
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

const mapButtonStyle = {
  width: 32,
  height: 32,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  cursor: "pointer",
  fontFamily: "var(--mono)",
};

const resetButtonStyle = {
  height: 32,
  padding: "0 0.7rem",
  border: "1px solid var(--border)",
  background: "transparent",
  color: "var(--muted)",
  cursor: "pointer",
  fontFamily: "var(--mono)",
  fontSize: "0.62rem",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};

const tableHeaderRowStyle = {
  display: "grid",
  gridTemplateColumns: "60px minmax(160px,1fr) 80px 80px 80px 90px 80px",
  minWidth: 720,
  padding: "0.5rem 1rem",
  borderBottom: "1px solid var(--border)",
  fontSize: "0.6rem",
  color: "var(--muted)",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
};

const tableDataRowStyle = {
  display: "grid",
  gridTemplateColumns: "60px minmax(160px,1fr) 80px 80px 80px 90px 80px",
  minWidth: 720,
  padding: "0.875rem 1rem",
  borderBottom: "1px solid rgba(167,139,250,0.05)",
  fontSize: "0.75rem",
  cursor: "pointer",
  transition: "background 0.15s",
};
