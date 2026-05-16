import { TopNav } from "@/components/sections/top-nav";
import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { Modules } from "@/components/sections/modules";
import { Workflow } from "@/components/sections/workflow";
import { SampleOutput } from "@/components/sections/sample-output";
import { Audience } from "@/components/sections/audience";
import { SprintOffer } from "@/components/sections/sprint-offer";
import { Founder } from "@/components/sections/founder";
import { FinalCta } from "@/components/sections/final-cta";
import { SiteFooter } from "@/components/sections/site-footer";

export default function Home() {
  return (
    <>
      <TopNav />
      <main>
        <Hero />
        <Problem />
        <Modules />
        <Workflow />
        <SampleOutput />
        <Audience />
        <SprintOffer />
        <Founder />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
