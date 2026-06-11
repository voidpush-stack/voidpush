import Link from "next/link";
import { HeroScene3D } from "@/components/ui/HeroScene3D";
import { Terminal } from "@/components/ui/Terminal";
import { Ticker } from "@/components/ui/Ticker";

export function HeroSection() {
  return (
    <>
      <div className="hero-shell">
        <div className="hero-backdrop" aria-hidden="true">
          <div className="hero-circuit hero-circuit-a" />
          <div className="hero-circuit hero-circuit-b" />
          <div className="hero-scanline" />
          <div className="hero-data-rain hero-data-rain-a" />
          <div className="hero-data-rain hero-data-rain-b" />
        </div>

        <div className="hero-object-stage">
          <HeroScene3D />
        </div>

        <div className="hero-status">
          <span className="status-dot" />
          v0.1.0-alpha / 2,847 active contributors / 9 relays online
        </div>

        <h1 className="hero-title">VoidPush</h1>

        <p className="hero-copy">
          Anonymous code contribution with metadata stripping, onion-routed git bundles,
          blind review, and portable reputation. Push to the void. Let the code carry the signal.
        </p>

        <div className="hero-actions">
          <Link href="#install" className="btn-primary">push to the void</Link>
          <Link href="#cli" className="btn-secondary">inspect the CLI</Link>
        </div>

        <Terminal />
      </div>
      <Ticker />
    </>
  );
}
