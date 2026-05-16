# Submission Checklist

Mapped to the hackathon manual requirements.

## Eligibility

- [ ] Submit before 19:00.
- [ ] Team size is 5 or fewer.
- [ ] Confirm the project was created during the hackathon.
- [ ] Confirm at least one partner technology was used.
- [ ] Confirm OpenAI is the primary partner technology used in the product loop.

## Repository

- [ ] Repository is public.
- [ ] Root `README.md` explains the project and quick start.
- [ ] `submission/README.md` links to all judge-facing docs.
- [ ] Setup instructions are complete in `submission/SETUP_AND_INSTALLATION.md`.
- [ ] API documentation is complete in `submission/API_REFERENCE.md`.
- [ ] Architecture documentation is complete in `submission/TECHNICAL_ARCHITECTURE.md`.
- [ ] Partner technology usage is documented in `submission/PARTNER_TECHNOLOGIES.md`.
- [ ] Limitations and deferred work are stated honestly.

## Demo Video

- [ ] Record a 2-minute Loom or equivalent.
- [ ] Explain the product problem.
- [ ] Show intake from brand URL/context.
- [ ] Show extraction/review workspace.
- [ ] Show at least one human review action.
- [ ] Show ad groups and creative variants.
- [ ] Show fake deploy and monitoring dashboard.
- [ ] End with the OpenAI-first and future Pioneer training-data narrative.

## Local Verification

- [ ] `npx pnpm@11.1.2 install`
- [ ] `npx pnpm@11.1.2 test`
- [ ] `npx pnpm@11.1.2 typecheck`
- [ ] `npx pnpm@11.1.2 lint`
- [ ] `npx pnpm@11.1.2 build`
- [ ] Seeded demo path checked with `npx pnpm@11.1.2 demo:reset`

## Live Demo Prep

- [ ] `.env.local` has Supabase values.
- [ ] `OPENAI_API_KEY` is present for live generation, or `DEMO_MODE=seeded` is selected.
- [ ] `ENABLE_DEMO_RESET=true` only where reset is intended.
- [ ] Inngest dev server is running for local background jobs.
- [ ] Browser is preloaded at `http://localhost:3000`.
- [ ] Backup seeded project ID is available: `00000000-0000-0000-0000-000000000001`.
