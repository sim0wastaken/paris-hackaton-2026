import { describe, expect, it } from "vitest";

import { pruneScrapedMarkdown } from "./scrape-pruning";

const INTARGET_SAMPLE = [
  "# Customer Journey Consultancy - Intarget",
  "",
  "[![Image 1: logo](https://www.intarget.net/app/themes/intarget/public/images/logo.0978a0.svg)![Image 2: intarget logo](https://www.intarget.net/app/themes/intarget/public/images/logo-mobile.304c80.svg)](https://www.intarget.net/)",
  "",
  "[contacts](https://www.intarget.net/contacts/)",
  "",
  "[en](https://www.intarget.net/en/)/ [it](https://www.intarget.net/)/ [cn](https://www.intarget.net.cn/)",
  "",
  "![Image 5: close-menu](https://www.intarget.net/app/themes/intarget/public/images/x-icon.ea3612.svg)",
  "",
  "[facebook](https://www.facebook.com/intargetnet/)[instagram](https://www.instagram.com/intarget_group/)[youtube](https://www.youtube.com/user/InTargetGroup)[linkedin](https://www.linkedin.com/company/624089/admin/)",
  "",
  "# INNOVATING THE FUTURE",
  "",
  "CUSTOMER JOURNEY CONSULTANCY DAL 2001",
  "",
  "**Independent. Inspired. International.**",
  "",
  "## Insight",
  "",
  "Scroll down to discover our world",
  "",
  "Necessari",
  "Misurazione",
  "**Vendita** delle mie informazioni personali",
  "**Condivisione** delle mie informazioni personali",
  "Trattamento delle mie informazioni personali per la **pubblicità personalizzata**",
  "Marketing",
  "Premi ancora per continuare 0/1",
  "Scopri di più",
  "Rifiuta tutto Accetta tutto"
].join("\n");

describe("pruneScrapedMarkdown", () => {
  it("returns empty string for empty input", () => {
    expect(pruneScrapedMarkdown("")).toBe("");
    expect(pruneScrapedMarkdown(undefined as unknown as string)).toBe("");
  });

  it("strips image markdown", () => {
    const out = pruneScrapedMarkdown("Hello ![alt](https://x.com/logo.svg) world");
    expect(out).not.toContain("![alt]");
    expect(out).toContain("Hello");
    expect(out).toContain("world");
  });

  it("drops naked image URLs", () => {
    const out = pruneScrapedMarkdown("Title\n\nhttps://cdn.x.com/banner.png\n\nBody");
    expect(out).not.toContain("banner.png");
    expect(out).toContain("Title");
    expect(out).toContain("Body");
  });

  it("drops social-link clusters", () => {
    const out = pruneScrapedMarkdown("Heading\n[facebook](https://fb)\n[twitter](https://t)\nReal copy");
    expect(out).not.toContain("facebook");
    expect(out).not.toContain("twitter");
    expect(out).toContain("Heading");
    expect(out).toContain("Real copy");
  });

  it("drops cookie banner / consent boilerplate", () => {
    const out = pruneScrapedMarkdown("Brand X is great\nAccetta tutto\nTrattamento dati\nReal copy");
    expect(out.toLowerCase()).not.toContain("accetta");
    expect(out.toLowerCase()).not.toContain("trattamento");
    expect(out).toContain("Brand X is great");
    expect(out).toContain("Real copy");
  });

  it("collapses repeated blank lines and duplicate consecutive lines", () => {
    const raw = "Line A\n\n\n\nLine B\nLine B\nLine B\nLine C";
    const out = pruneScrapedMarkdown(raw);
    expect(out).toBe("Line A\n\nLine B\nLine C");
  });

  it("hard-caps at maxChars with head+tail preservation", () => {
    const head = "HEAD-CONTENT-".repeat(200);
    const middle = "z".repeat(2000);
    const tail = "TAIL-CONTENT-".repeat(200);
    const out = pruneScrapedMarkdown(`${head}\n${middle}\n${tail}`, { maxChars: 1000 });
    expect(out.length).toBeLessThanOrEqual(1000 + "\n\n[…truncated]\n\n".length);
    expect(out).toContain("[…truncated]");
    expect(out).toContain("HEAD-CONTENT-");
    expect(out).toContain("TAIL-CONTENT-");
  });

  it("preserves brand-signal lines from the intarget.net sample", () => {
    const out = pruneScrapedMarkdown(INTARGET_SAMPLE);
    expect(out).toContain("Customer Journey Consultancy");
    expect(out).toContain("INNOVATING THE FUTURE");
    expect(out).toContain("Independent. Inspired. International.");
  });

  it("removes navigation, image, social, and cookie noise from the intarget.net sample", () => {
    const out = pruneScrapedMarkdown(INTARGET_SAMPLE);
    expect(out).not.toMatch(/!\[/);
    expect(out).not.toContain("logo.0978a0.svg");
    expect(out.toLowerCase()).not.toContain("facebook");
    expect(out.toLowerCase()).not.toContain("instagram");
    expect(out.toLowerCase()).not.toContain("accetta");
    expect(out.toLowerCase()).not.toContain("rifiuta");
    expect(out.toLowerCase()).not.toContain("trattamento");
  });

  it("is idempotent", () => {
    const once = pruneScrapedMarkdown(INTARGET_SAMPLE);
    const twice = pruneScrapedMarkdown(once);
    expect(twice).toBe(once);
  });
});
