import { TopNav } from "@/components/sections/top-nav";
import { Hero } from "@/components/sections/hero";
import { TheDemo } from "@/components/sections/the-demo";
import { Filter } from "@/components/sections/filter";
import { Offer } from "@/components/sections/offer";
import { Founder } from "@/components/sections/founder";
import { FinalCta } from "@/components/sections/final-cta";
import { SiteFooter } from "@/components/sections/site-footer";

export default function Home() {
  return (
    <>
      <TopNav />
      <main>
        <Hero />
        <TheDemo />
        <Filter />
        <Offer />
        <Founder />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
