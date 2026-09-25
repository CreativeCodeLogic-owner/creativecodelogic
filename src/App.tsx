import { useEffect } from "react";
import { initSmoothScroll, ScrollTrigger, scrollToInitialHash } from "@/lib/scroll";
import { SHOW_WORK, SHOW_AMBIENT } from "@/lib/flags";
import { Nav } from "@/components/Nav";
import { BackToTop } from "@/components/BackToTop";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AmbientField } from "@/components/AmbientField";
// import { ProgressLine } from "@/components/ProgressLine"; // benched per team feedback 2026-08
import { HeroSignature } from "@/components/HeroSignature";
import { SignatureMeaning } from "@/components/SignatureMeaning";
import { SignatureLives } from "@/components/SignatureLives";
import { EarnSignature } from "@/components/EarnSignature";
import { Invitation } from "@/components/Invitation";
import { Footer } from "@/components/Footer";

export function App() {
  useEffect(() => {
    const cleanup = initSmoothScroll();
    // the Work chapter is conditionally rendered — measure after it settles,
    // then honour a deep link (#work only when the Work chapter is shown)
    const raf = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      scrollToInitialHash(SHOW_WORK ? ["#work", "#process", "#contact"] : ["#process", "#contact"]);
    });
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  return (
    <>
      {SHOW_AMBIENT && <AmbientField />}
      {/* ProgressLine benched per team feedback 2026-08; revive by re-mounting. */}
      <Nav />
      <main>
        <HeroSignature />
        <SignatureMeaning />
        {SHOW_WORK && <SignatureLives />}
        <EarnSignature />
        <Invitation />
      </main>
      <Footer />
      <BackToTop />
      <ConsentBanner />
    </>
  );
}
