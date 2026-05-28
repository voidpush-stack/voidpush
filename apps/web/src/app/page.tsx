import { Nav }                from "@/components/ui/Nav";
import { Footer }             from "@/components/ui/Footer";
import { ScrollReveal }       from "@/components/ui/ScrollReveal";
import { LiveFeed }           from "@/components/ui/LiveFeed";
import { HeroSection }        from "@/components/sections/HeroSection";
import { ManifestoSection }   from "@/components/sections/ManifestoSection";
import { HowItWorksSection }  from "@/components/sections/HowItWorksSection";
import { FeaturesSection }    from "@/components/sections/FeaturesSection";
import { CLIPreviewSection }  from "@/components/sections/CLIPreviewSection";
import { AnonLogsSection }   from "@/components/sections/AnonLogsSection";
import { InstallCTASection }  from "@/components/sections/InstallCTASection";

// Floating ghost shapes (decorative, server-rendered)
function GhostShapes() {
  const shapes = [
    { width: 180, height: 200, color: "var(--ghost)", top: "12%",  left: "4%",   delay: "0s",  dur: "9s" },
    { width: 110, height: 130, color: "var(--teal)",  bottom: "22%",right: "6%", delay: "0s",  dur: "13s" },
    { width: 70,  height: 85,  color: "var(--ghost)", top: "55%",  right: "2%",  delay: "2s",  dur: "7s" },
  ] as const;

  return (
    <>
      {shapes.map((s, i) => (
        <span
          key={i}
          style={{
            position: "fixed",
            borderRadius: "50% 50% 0 0",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.025,
            background: s.color,
            width: s.width,
            height: s.height,
            ...("top" in s    ? { top: s.top }       : { bottom: (s as { bottom: string }).bottom }),
            ...("left" in s   ? { left: (s as { left: string }).left }   : { right: (s as { right: string }).right }),
            animation: `floatG ${s.dur} ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <GhostShapes />
      <Nav />

      <ScrollReveal>
        <main>
          <HeroSection />
          <ManifestoSection />
          <HowItWorksSection />
          <FeaturesSection />
          <CLIPreviewSection />
          <AnonLogsSection />

          {/* Live feed section header */}
          <section
            style={{ position: "relative", zIndex: 1, padding: "6rem 2rem 2rem", maxWidth: 1100, margin: "0 auto" }}
          >
            <div className="s-tag">Network Activity</div>
            <h2 className="s-title reveal">Right now,<br />somewhere.</h2>
          </section>

          <LiveFeed />
          <InstallCTASection />
        </main>
      </ScrollReveal>

      <Footer />
    </>
  );
}
