import { useEffect } from "react";
import { initSmoothScroll, ScrollTrigger } from "@/lib/scroll";
import { SHOW_WORK, SHOW_AMBIENT } from "@/lib/flags";
import { Nav } from "@/components/Nav";
import { BackToTop } from "@/components/BackToTop";
import { ConsentBanner } from "@/components/ConsentBanner";
import { AmbientField } from "@/components/AmbientField";
import { ProgressLine } from "@/components/ProgressLine";
import { HeroSignature } from "@/components/HeroSignature";
import { SignatureMeaning } from "@/components/SignatureMeaning";
import { SignatureLives } from "@/components/SignatureLives";
import { EarnSignature } from "@/components/EarnSignature";
import { Invitation } from "@/components/Invitation";
import { Footer } from "@/components/Footer";

export function App() {
  useEffect(() => {
    const cleanup = initSmoothScroll();
    // the Work chapter is conditionally rendered — measure after it settles
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return cleanup;
  }, []);

  return (
    <>
      {SHOW_AMBIENT && <AmbientField />}
      <ProgressLine />
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
