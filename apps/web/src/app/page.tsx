import type { Metadata } from "next";

import { TopNav } from "@/components/sections/top-nav";
import { Hero } from "@/components/sections/hero";
import { TheDemo } from "@/components/sections/the-demo";
import { Filter } from "@/components/sections/filter";
import { Offer } from "@/components/sections/offer";
import { Founder } from "@/components/sections/founder";
import { FinalCta } from "@/components/sections/final-cta";
import { SiteFooter } from "@/components/sections/site-footer";

import "./marketing.css";

export const metadata: Metadata = {
  title: "Motive — show up where AI gets asked",
  description:
    "Motive finds the buying conversations where your product belongs — then ships the campaigns, copy, and page fixes you need to win them. Before the channel fills up.",
  metadataBase: new URL("https://motive.app"),
  openGraph: {
    title: "Motive — get found on ChatGPT",
    description:
      "Map the prompts where your product belongs. Ship the campaigns, copy, and page fixes that earn the recommendation.",
    type: "website",
  },
};

export default function MarketingHome() {
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
