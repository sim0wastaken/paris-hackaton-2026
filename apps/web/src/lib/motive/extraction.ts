import type { ZodType } from "zod";

import {
  adGroupsOutputSchema,
  conversationMapOutputSchema,
  featureMapOutputSchema,
  intentClassificationOutputSchema,
  landingGapsOutputSchema,
  phaseOutputSchemas,
  sourceRecapOutputSchema,
  type AdGroupsOutput,
  type ConversationMapOutput,
  type FeatureMapOutput,
  type IntentClassificationOutput,
  type LandingGapsOutput,
  type PhaseOutput,
} from "./extraction-schemas";
import type { ProjectRecord, SourceRecord } from "./projects";
import type {
  AdGroup,
  BrandFeature,
  Campaign,
  Conversation,
  CreativeVariant,
  ExtractionPhase,
  HumanReview,
  LandingGap,
  ProductFeedItem
} from "./types";

export const SPEC_04_PHASES = [
  "source_recap",
  "feature_map",
  "conversation_map",
  "intent_classification",
  "landing_gaps",
  "ad_groups"
] as const;

export type Spec04ExtractionPhase = (typeof SPEC_04_PHASES)[number];
export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type ExtractionRunRecord = {
  id: string;
  project_id: string;
  phase: ExtractionPhase;
  status: RunStatus;
  model: string | null;
  provider: string;
  prompt_version: string;
  input_json: Record<string, unknown>;
  output_json: Record<string, unknown>;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  attempt: number;
  inngest_run_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ExtractionReviewData = {
  project: ProjectRecord;
  sources: SourceRecord[];
  extraction_runs: ExtractionRunRecord[];
  brand_features: BrandFeature[];
  conversations: Conversation[];
  landing_gaps: LandingGap[];
  campaigns: Campaign[];
  ad_groups: AdGroup[];
  creative_variants: CreativeVariant[];
  product_feed_items: ProductFeedItem[];
  human_reviews: HumanReview[];
};

export type ExtractionRepository = {
  getProject(projectId: string): Promise<ProjectRecord | null>;
  getProcessedSources(projectId: string, sourceIds: string[]): Promise<SourceRecord[]>;
  getReviewData(projectId: string): Promise<ExtractionReviewData | null>;
  ensurePhaseRuns(
    projectId: string,
    phases: readonly Spec04ExtractionPhase[],
    context: {
      requestId: string;
      promptVersionByPhase: Record<Spec04ExtractionPhase, string>;
    }
  ): Promise<ExtractionRunRecord[]>;
  updateRunRunning(
    runId: string,
    patch: {
      model: string;
      prompt_version: string;
      input_json: Record<string, unknown>;
    }
  ): Promise<ExtractionRunRecord>;
  updateRunSucceeded(
    runId: string,
    patch: {
      output_json: Record<string, unknown>;
      metadata: Record<string, unknown>;
    }
  ): Promise<ExtractionRunRecord>;
  updateRunFailed(runId: string, error: ExtractionErrorPayload): Promise<ExtractionRunRecord>;
  updateProjectStatus(projectId: string, status: "extracting" | "review" | "failed"): Promise<void>;
  materializeFeatureMap(run: ExtractionRunRecord, output: FeatureMapOutput): Promise<string[]>;
  materializeConversationMap(run: ExtractionRunRecord, output: ConversationMapOutput): Promise<string[]>;
  materializeIntentClassification(run: ExtractionRunRecord, output: IntentClassificationOutput): Promise<string[]>;
  materializeLandingGaps(run: ExtractionRunRecord, output: LandingGapsOutput): Promise<string[]>;
  materializeAdGroups(run: ExtractionRunRecord, output: AdGroupsOutput): Promise<string[]>;
};

export type StructuredExtractionProvider = {
  isConfigured(): boolean;
  generate<T>(input: {
    phase: Spec04ExtractionPhase;
    requestId: string;
    model: string;
    schemaName: string;
    schema: ZodType<T>;
    system: string;
    prompt: string;
  }): Promise<{
    output: T;
    raw: unknown;
    responseId: string | null;
    usage: Record<string, unknown>;
    model: string;
  }>;
};

export type ExtractionPipelineInput = {
  projectId: string;
  sourceIds: string[];
  requestId: string;
  demoMode: boolean;
};

export type ExtractionPipelineResult =
  | { status: "succeeded"; projectId: string; phases: Spec04ExtractionPhase[] }
  | { status: "failed"; projectId: string; failedPhase: Spec04ExtractionPhase; error: ExtractionErrorPayload };

export type ExtractionErrorPayload = {
  code: string;
  message: string;
  retryable: boolean;
  phase: Spec04ExtractionPhase;
  attempt: number;
  provider_status?: number;
  retry_after_seconds?: number;
};

// Extraction system prompt — evidence-grounding rules apply to every phase.
// Drawn from B2B-marketing failure modes (logos, certifications, metrics are the legally-loaded inventions)
// and the "quote first, then act" pattern from Anthropic/OpenAI prompt-engineering guides.
const SYSTEM_PROMPT = [
  "You are Motive's campaign intelligence extractor for an OpenAI-first hackathon demo.",
  "Use only the provided source bundle and previous persisted phase outputs.",
  "",
  "EVIDENCE RULES (apply to every phase):",
  "1. For every claim, every constraint, every quoted voice, populate source_refs with the source.id of at least one source containing the supporting span. If no span exists, do NOT emit the claim — add it to assumptions[] or the phase's missing_*_context list with note \"no evidence in <source.id>\".",
  "2. Prefer paraphrase. If you quote verbatim, keep it under 15 words and store the quote in evidence (not in titles or descriptions).",
  "3. Never invent: customer names, integration names, prices, percentages, certifications (SOC2/ISO/GDPR/HIPAA), case-study metrics, dates, or guarantee language. If the source uses such words you may reuse them; otherwise leave the field empty and add to missing_context.",
  "4. confidence=high requires a verbatim or near-verbatim span. confidence=medium requires an explicit paraphrase. confidence=low is inferred and the evidence field MUST start with \"Inferred:\".",
  "5. If competing sources disagree, pick the most authoritative (homepage > docs > blog > forum) and note the conflict in assumptions.",
  "",
  "Return only data that conforms to the provided schema."
].join(" ");

export async function runExtractionPipeline(
  input: ExtractionPipelineInput,
  deps: {
    repository: ExtractionRepository;
    provider: StructuredExtractionProvider;
    model?: string;
    promptVersion?: string;
  }
): Promise<ExtractionPipelineResult> {
  const model = deps.model ?? process.env.OPENAI_EXTRACTION_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";
  const promptVersion = deps.promptVersion ?? process.env.OPENAI_EXTRACTION_PROMPT_VERSION ?? "2026-05-16-v2";
  const promptVersionByPhase = Object.fromEntries(
    SPEC_04_PHASES.map((phase) => [phase, `${phase}.${promptVersion}`])
  ) as Record<Spec04ExtractionPhase, string>;

  const project = await deps.repository.getProject(input.projectId);
  if (!project) throw new Error(`Project not found: ${input.projectId}`);

  await deps.repository.updateProjectStatus(input.projectId, "extracting");
  const runs = await deps.repository.ensurePhaseRuns(input.projectId, SPEC_04_PHASES, {
    requestId: input.requestId,
    promptVersionByPhase
  });
  const sourceBundle = await deps.repository.getProcessedSources(input.projectId, input.sourceIds);

  if (sourceBundle.length === 0) {
    const run = findRun(runs, "source_recap");
    const error = buildError("no_processed_sources", "No processed sources are available for extraction.", false, run);
    await deps.repository.updateRunFailed(run.id, error);
    await failDownstream(deps.repository, runs, "source_recap", input.requestId);
    await deps.repository.updateProjectStatus(input.projectId, "failed");
    return { status: "failed", projectId: input.projectId, failedPhase: "source_recap", error };
  }

  const outputs: Partial<Record<Spec04ExtractionPhase, PhaseOutput>> = {};
  let reviewData = await deps.repository.getReviewData(input.projectId);

  for (const phase of SPEC_04_PHASES) {
    const run = findRun(runs, phase);
    const existingOutput = parseExistingOutput(phase, run.output_json);
    if (run.status === "succeeded" && existingOutput) {
      outputs[phase] = existingOutput;
      continue;
    }

    const phaseInput = buildPhaseInput(phase, {
      project,
      sourceBundle,
      outputs,
      reviewData
    });
    const runningRun = await deps.repository.updateRunRunning(run.id, {
      model,
      prompt_version: promptVersionByPhase[phase],
      input_json: phaseInput
    });

    try {
      const providerResult = input.demoMode
        ? buildSeededPhaseResult(phase, project, sourceBundle)
        : await callOpenAIPhase(phase, {
            requestId: input.requestId,
            provider: deps.provider,
            model,
            phaseInput
          });

      const materializedIds = await materializePhase(deps.repository, runningRun, phase, providerResult.output);
      await deps.repository.updateRunSucceeded(runningRun.id, {
        output_json: providerResult.output as Record<string, unknown>,
        metadata: {
          request_id: input.requestId,
          provider_response_id: providerResult.responseId,
          provider_usage_json: providerResult.usage,
          materialized_ids: materializedIds,
          demo_replay: input.demoMode
        }
      });
      outputs[phase] = providerResult.output;
      reviewData = await deps.repository.getReviewData(input.projectId);
    } catch (caught) {
      const error = normalizeExtractionError(caught, phase, runningRun.attempt);
      await deps.repository.updateRunFailed(runningRun.id, error);
      await failDownstream(deps.repository, runs, phase, input.requestId);
      await deps.repository.updateProjectStatus(input.projectId, "failed");
      return { status: "failed", projectId: input.projectId, failedPhase: phase, error };
    }
  }

  await deps.repository.updateProjectStatus(input.projectId, "review");
  return { status: "succeeded", projectId: input.projectId, phases: [...SPEC_04_PHASES] };
}

function findRun(
  runs: ExtractionRunRecord[],
  phase: Spec04ExtractionPhase
): ExtractionRunRecord & { phase: Spec04ExtractionPhase } {
  const run = runs.find((item) => item.phase === phase);
  if (!run) throw new Error(`Missing extraction run for phase ${phase}`);
  return run as ExtractionRunRecord & { phase: Spec04ExtractionPhase };
}

function parseExistingOutput(phase: Spec04ExtractionPhase, value: Record<string, unknown>): PhaseOutput | null {
  const parsed = phaseOutputSchemas[phase].safeParse(value);
  return parsed.success ? parsed.data : null;
}

function buildPhaseInput(
  phase: Spec04ExtractionPhase,
  context: {
    project: ProjectRecord;
    sourceBundle: SourceRecord[];
    outputs: Partial<Record<Spec04ExtractionPhase, PhaseOutput>>;
    reviewData: ExtractionReviewData | null;
  }
): Record<string, unknown> {
  const sources = context.sourceBundle.map((source) => ({
    id: source.id,
    type: source.type,
    name: source.name,
    uri: source.uri,
    text: (source.extracted_text ?? source.raw_text ?? "").slice(0, 12_000),
    metadata: source.metadata
  }));

  const base = {
    project: {
      id: context.project.id,
      name: context.project.name,
      brand_url: context.project.brand_url,
      extra_context: context.project.extra_context,
      metadata: context.project.metadata
    },
    sources
  };

  switch (phase) {
    case "source_recap":
      return base;
    case "feature_map":
      return {
        ...base,
        source_recap: context.outputs.source_recap ?? {}
      };
    case "conversation_map":
      return {
        ...base,
        source_recap: context.outputs.source_recap ?? {},
        feature_map: context.outputs.feature_map ?? {}
      };
    case "intent_classification":
      return {
        ...base,
        source_recap: context.outputs.source_recap ?? {},
        feature_map: context.outputs.feature_map ?? {},
        conversations: context.outputs.conversation_map ?? context.reviewData?.conversations ?? []
      };
    case "landing_gaps":
      return {
        ...base,
        source_recap: context.outputs.source_recap ?? {},
        feature_map: context.outputs.feature_map ?? {},
        conversations: context.reviewData?.conversations ?? [],
        intent_classification: context.outputs.intent_classification ?? {}
      };
    case "ad_groups":
      return {
        ...base,
        source_recap: context.outputs.source_recap ?? {},
        features: context.reviewData?.brand_features ?? [],
        conversations: context.reviewData?.conversations ?? [],
        landing_gaps: context.reviewData?.landing_gaps ?? []
      };
  }
}

async function callOpenAIPhase(
  phase: Spec04ExtractionPhase,
  context: {
    requestId: string;
    provider: StructuredExtractionProvider;
    model: string;
    phaseInput: Record<string, unknown>;
  }
) {
  if (!context.provider.isConfigured()) {
    throw new ExtractionPipelineError("openai_not_configured", "OPENAI_API_KEY is not configured.", false);
  }

  const schema = schemaForPhase(phase);
  return context.provider.generate({
    phase,
    requestId: context.requestId,
    model: context.model,
    schemaName: phase,
    schema,
    system: SYSTEM_PROMPT,
    prompt: JSON.stringify({
      phase,
      instructions: promptForPhase(phase),
      input: context.phaseInput
    })
  });
}

function schemaForPhase(phase: Spec04ExtractionPhase): ZodType<PhaseOutput> {
  switch (phase) {
    case "source_recap":
      return sourceRecapOutputSchema;
    case "feature_map":
      return featureMapOutputSchema;
    case "conversation_map":
      return conversationMapOutputSchema;
    case "intent_classification":
      return intentClassificationOutputSchema;
    case "landing_gaps":
      return landingGapsOutputSchema;
    case "ad_groups":
      return adGroupsOutputSchema;
  }
}

function promptForPhase(phase: Spec04ExtractionPhase): string {
  switch (phase) {
    case "source_recap":
      // Dunford positioning + Revella 5 Rings ICP structure.
      // Schema doesn't yet have the new fields, so we instruct the model to write them
      // into source_quality.missing_context as scaffolding for future schema extension.
      return [
        "Summarize the source bundle into a positioning + ICP recap using two frameworks:",
        "",
        "POSITIONING (April Dunford):",
        "- competitors[]: include at least one non-software alternative (status quo, spreadsheet, manual work) if any source hints at it.",
        "- proof_points[]: facts only the source can prove — features, integrations, workflow specifics.",
        "- positioning_summary: state the buyer language, not feature language.",
        "",
        "ICP (Adele Revella 5 Rings) — for each icp_segments[] entry, the pain + desired_outcome fields must encode (where the source supports it):",
        "- the priority initiative / trigger that pushed the buyer off the status quo",
        "- the success factors they expect",
        "- the perceived barriers to switching",
        "- the decision criteria that decide the call",
        "If a ring lacks source evidence, leave it out and add a source_quality.missing_context entry. Do NOT fill rings from training-data plausibility."
      ].join("\n");
    case "feature_map":
      // Ulwick desired-outcome statement + Moesta Forces of Progress.
      return [
        "Extract campaign-relevant features, value props, USPs, use cases, proof points, and objections.",
        "",
        "Per-type rules:",
        "- type=feature: title = concrete capability noun phrase. buyer_relevance MUST cite one positioning theme from source_recap.positioning_summary.",
        "- type=value_prop or use_case: title shape = \"{minimize|increase|reduce} {metric|time|effort} {object} {context}\" (Ulwick Outcome-Driven Innovation). No vague \"boosts productivity\".",
        "- type=usp: must be defensible vs the competitors[] list in source_recap. If you cannot name what makes it unique vs that alternative, demote to type=feature.",
        "- type=proof_point: evidence MUST include a verifiable artifact (customer name + outcome, metric + source page, certification + issuer). If absent, do NOT emit — add to missing_feature_context.",
        "- type=objection: in evidence, prefix with one Force-of-Progress tag from {anxiety_of_new, habit_of_old, missing_push, weak_pull} (Bob Moesta). Cite the source span (review quote, FAQ, sales objection)."
      ].join("\n");
    case "conversation_map":
      // Joanna Wiebe voice-of-customer + Moesta switch interview + Gartner buying jobs.
      return [
        "Generate 4-8 grounded buying conversations. conversation_text reads as a buyer talking — first person, colloquial, using source-bundle language. Do NOT use brand marketing copy. Do NOT assign stage or intent_type here (phase 4 does that).",
        "",
        "Each conversation:",
        "- conversation_text: 1-2 buyer sentences paraphrased from source spans (FAQs, reviews, sales objection lists, founder anecdotes). Cite source_refs.",
        "- pain: the push — what's broken in the buyer's current world. Lift phrasing from the source when possible.",
        "- desired_outcome: the pull — a concrete outcome the buyer wants.",
        "- trigger: the switching moment if the source surfaces one; otherwise leave empty.",
        "- related_feature_temp_ids: link features that resolve the pain or address the anxiety.",
        "",
        "BUYER-VOICE BAN LIST. If conversation_text uses any of these marketing words, REWRITE in buyer voice or drop the conversation: leverage, streamline, empower, unlock, seamless, supercharge, revolutionary, game-changing, 10x.",
        "",
        "Diversity rule: across the conversation set, cover at least 3 distinct buyer_roles. If the source only supports one role, say so in missing_feature_context (upstream phase) — do not fabricate roles."
      ].join("\n");
    case "intent_classification":
      // Schwartz 5 awareness levels (B2B-ified) + MEDDPICC + runner-up reasoning.
      return [
        "Classify each conversation into stage + intent_type + buyer_role + constraints.",
        "",
        "Stage definitions (B2B Schwartz):",
        "- problem_aware: buyer feels pain, doesn't know solution categories yet",
        "- solution_compare: comparing solution APPROACHES (not vendors)",
        "- vendor_evaluation: comparing named vendors / specific products",
        "- pricing_check: budget / contract validation",
        "- security_review: compliance / permissions / data-handling gatekeeping",
        "- ready_to_buy: final commitment cues (\"when can we start\", \"send the contract\")",
        "- post_purchase: onboarding / expansion / churn risk",
        "",
        "For each classification, rationale MUST:",
        "1. Quote (≤15 words) the conversation span that drove the stage call.",
        "2. Name the runner-up stage you considered and one sentence why you rejected it.",
        "",
        "For each constraints[] entry, the evidence field MUST start with a MEDDPICC dimension prefix: \"MEDDPICC: {Metrics | Economic Buyer | Decision Criteria | Decision Process | Paper Process | Identified Pain | Champion | Competition} — …\". Mapping: budget → Metrics + Economic Buyer; timeline → Decision Process; integration/technical → Decision Criteria; compliance → Decision Criteria; approval_process → Paper Process; existing_tool → Competition.",
        "",
        "confidence:",
        "- high: explicit verbatim signal for both stage and intent_type",
        "- medium: clear inference from one signal",
        "- low: ambiguous between two stages — name both in rationale"
      ].join("\n");
    case "landing_gaps":
      // CXL ResearchXL heuristic axes + Cialdini 6 principles + fix_artifact_status anti-hallucination guard.
      return [
        "For each gap, link to a specific conversation_temp_id (trace to a real buyer concern, not generic CRO advice).",
        "",
        "Required structure:",
        "- description: name the gap from the buyer's POV plus one of the CXL ResearchXL heuristic axes in square brackets at the end: [clarity | relevance | value | friction | distraction | anxiety].",
        "- suggested_fix shape: \"{Cialdini principle}: {concrete artifact} in {page_area}\" using one of {social_proof, authority, reciprocity, scarcity, commitment, liking}. Examples: \"Social proof: add 3 logos of <ICP segment> customers above the fold.\" \"Authority: add SOC2 badge + auditor name in the trust strip.\"",
        "- ANTI-HALLUCINATION GUARD: only propose suggested_fix artifacts present in the source bundle (a real customer name, a real certification, a real integration). If the artifact is absent, suggested_fix MUST be prefixed with \"request from brand:\" — do not fabricate logos, badges, certifications, or metrics. Add the request to rationale as well.",
        "- rationale: must end with one of \"artifact_present_in_source\" or \"artifact_request_from_brand\" so downstream code can route accordingly.",
        "",
        "Severity calibration:",
        "- high = blocks a high-confidence conversation classified ready_to_buy / pricing_check / security_review",
        "- medium = blocks vendor_evaluation / solution_compare",
        "- low = problem_aware nice-to-have"
      ].join("\n");
    case "ad_groups":
      // Pain × Persona × Awareness matrix (Motion creative-strategy) + Wiebe message mining.
      return [
        "Propose 2-5 draft ad-group ideas. Each ad group = one cell in the matrix (intent_type × buyer_role × stage). Do NOT merge cells with different awareness stages even if intent_type matches.",
        "",
        "For each ad_group:",
        "- name: pattern is \"{buyer language for the pain} — {buyer_role} {stage}\". Example: \"Spreadsheet handoff is killing us — Revenue lead, Vendor evaluation\".",
        "- primary_intent: the intent_type of the linked conversation(s).",
        "- context_hints[]: at least one verbatim phrase (in quotes) lifted from an approved conversation.",
        "- must_include_claims[]: claim categories the creative MUST anchor on (proof_point name, integration, metric — only if present in approved features).",
        "- avoid_claims[]: claim categories the creative MUST NOT make (e.g., pricing claims when a pricing_clarity landing_gap is linked).",
        "- priority: high if the linked conversation is high-confidence and stage ∈ {pricing_check, ready_to_buy, security_review}, medium for vendor_evaluation/solution_compare, low for problem_aware.",
        "",
        "Reject your own draft if two ad groups share the same (primary_intent, buyer_role of linked conversation, stage of linked conversation) tuple. Re-split or merge until each tuple is unique."
      ].join("\n");
  }
}

async function materializePhase(
  repository: ExtractionRepository,
  run: ExtractionRunRecord,
  phase: Spec04ExtractionPhase,
  output: PhaseOutput
): Promise<string[]> {
  switch (phase) {
    case "source_recap":
      return [];
    case "feature_map":
      return repository.materializeFeatureMap(run, featureMapOutputSchema.parse(output));
    case "conversation_map":
      return repository.materializeConversationMap(run, conversationMapOutputSchema.parse(output));
    case "intent_classification":
      return repository.materializeIntentClassification(run, intentClassificationOutputSchema.parse(output));
    case "landing_gaps":
      return repository.materializeLandingGaps(run, landingGapsOutputSchema.parse(output));
    case "ad_groups":
      return repository.materializeAdGroups(run, adGroupsOutputSchema.parse(output));
  }
}

async function failDownstream(
  repository: ExtractionRepository,
  runs: ExtractionRunRecord[],
  failedPhase: Spec04ExtractionPhase,
  requestId: string
) {
  const failedIndex = SPEC_04_PHASES.indexOf(failedPhase);
  const downstream = SPEC_04_PHASES.slice(failedIndex + 1);
  for (const phase of downstream) {
    const run = findRun(runs, phase);
    if (run.status === "succeeded") continue;
    await repository.updateRunFailed(run.id, {
      code: "skipped_dependency_failed",
      message: `Skipped because ${failedPhase} did not complete.`,
      retryable: true,
      phase,
      attempt: run.attempt,
      retry_after_seconds: undefined
    });
    run.metadata = { ...run.metadata, skipped_after_request_id: requestId };
  }
}

function normalizeExtractionError(
  error: unknown,
  phase: Spec04ExtractionPhase,
  attempt: number
): ExtractionErrorPayload {
  if (error instanceof ExtractionPipelineError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      phase,
      attempt
    };
  }

  return {
    code: "extraction_phase_failed",
    message: error instanceof Error ? error.message : "Extraction phase failed.",
    retryable: true,
    phase,
    attempt
  };
}

function buildError(
  code: string,
  message: string,
  retryable: boolean,
  run: ExtractionRunRecord & { phase: Spec04ExtractionPhase }
): ExtractionErrorPayload {
  return {
    code,
    message,
    retryable,
    phase: run.phase,
    attempt: run.attempt
  };
}

class ExtractionPipelineError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly retryable: boolean
  ) {
    super(message);
    this.name = "ExtractionPipelineError";
  }
}

function buildSeededPhaseResult(
  phase: Spec04ExtractionPhase,
  project: ProjectRecord,
  sources: SourceRecord[]
): {
  output: PhaseOutput;
  raw: unknown;
  responseId: string | null;
  usage: Record<string, unknown>;
  model: string;
} {
  const output = buildSeededPhaseOutput(phase, project, sources);
  return {
    output,
    raw: { provider: "seeded_demo", phase },
    responseId: null,
    usage: {},
    model: "seeded-demo"
  };
}

function buildSeededPhaseOutput(
  phase: Spec04ExtractionPhase,
  project: ProjectRecord,
  sources: SourceRecord[]
): PhaseOutput {
  const sourceRefs = sources.map((source) => source.id);
  const firstSource = sourceRefs[0] ?? "seeded-source";
  const brandName = project.name || "AtlasDesk";

  if (phase === "source_recap") {
    return {
      brand_name: brandName,
      category: "B2B SaaS",
      homepage_url: project.brand_url,
      one_sentence_offer: `${brandName} helps small revenue teams turn Gmail conversations into CRM-ready follow-up.`,
      positioning_summary:
        "A Gmail-native CRM workflow for founder-led and revenue teams that need fast setup, spreadsheet migration, proof, and manager visibility without heavy CRM overhead.",
      icp_segments: [
        {
          segment: "Founder-led revenue teams",
          pain: "Deals go cold when follow-up lives in scattered Gmail threads.",
          desired_outcome: "A working sales follow-up workflow by Friday.",
          source_refs: sourceRefs,
          confidence: "high"
        },
        {
          segment: "Small B2B revenue leads",
          pain: "Spreadsheet notes and inbox activity are hard to manage together.",
          desired_outcome: "CRM-grade next steps without leaving Gmail.",
          source_refs: sourceRefs,
          confidence: "medium"
        }
      ],
      competitors: [
        {
          name: "Spreadsheets",
          reason: "The source mentions teams switching from spreadsheet follow-up notes.",
          source_refs: sourceRefs,
          confidence: "medium"
        }
      ],
      proof_points: [
        {
          claim: "Live in Gmail by Friday",
          evidence: "Seeded source states teams can launch before Friday.",
          source_refs: [firstSource],
          confidence: "high"
        }
      ],
      constraints: [
        {
          type: "timeline",
          value: "before Friday",
          evidence: "Launch before Friday is a repeated proof point.",
          source_refs: sourceRefs
        },
        {
          type: "integration",
          value: "HubSpot sync",
          evidence: "Buyers ask whether migration interrupts HubSpot sync.",
          source_refs: sourceRefs
        }
      ],
      source_quality: {
        coverage: "adequate",
        missing_context: ["pricing page", "security documentation"]
      },
      assumptions: ["The seeded source represents the demo brand's homepage and founder notes."]
    };
  }

  if (phase === "feature_map") {
    return {
      features: [
        seededFeature("feature_1", "feature", "Gmail-native workspace", "Sales follow-up lives directly inside Gmail.", "Reduces context switching for small teams.", "Gmail conversations into CRM-ready follow-up", firstSource, "high"),
        seededFeature("feature_2", "value_prop", "Live before Friday", "Fast setup helps urgent teams launch this week.", "Supports urgency-led acquisition angles.", "launch before Friday", firstSource, "high"),
        seededFeature("feature_3", "usp", "Spreadsheet migration", "Spreadsheet notes can become durable Gmail follow-up records.", "Targets migration-risk conversations.", "spreadsheet migration", firstSource, "medium"),
        seededFeature("feature_4", "proof_point", "Manager visibility", "Managers can see next steps without Salesforce overhead.", "Useful for revenue leads who need accountability.", "manager visibility without Salesforce overhead", firstSource, "medium"),
        seededFeature("feature_5", "objection", "Pricing clarity", "Pricing uncertainty is a conversion blocker.", "Motivates landing-page pricing proof.", "pricing clarity", firstSource, "high"),
        seededFeature("feature_6", "objection", "Security proof", "Security review material is required for cautious buyers.", "Feeds trust and compliance conversations.", "security proof", firstSource, "medium")
      ],
      missing_feature_context: ["Detailed pricing tiers", "Security certifications", "Implementation timeline"]
    };
  }

  if (phase === "conversation_map") {
    return {
      conversations: [
        seededConversation("conversation_1", "Can we get the Gmail workflow live before Friday for five reps?", "founder", "urgent setup", "Current follow-up is scattered in Gmail.", "A reliable workflow this week.", ["feature_1", "feature_2"], firstSource, "high"),
        seededConversation("conversation_2", "Can AtlasDesk import our spreadsheet notes without breaking HubSpot sync?", "revenue_lead", "migration question", "Spreadsheet follow-up is fragile.", "Move notes into Gmail with integration confidence.", ["feature_3"], firstSource, "high"),
        seededConversation("conversation_3", "What does this cost for a small team, and is there a minimum contract?", "finance", "pricing check", "Pricing is unclear.", "Know budget impact before evaluation.", ["feature_5"], firstSource, "medium"),
        seededConversation("conversation_4", "Security needs proof of how Gmail permissions are handled before approval.", "security", "security review", "Gmail access creates trust concerns.", "Review permission scope and compliance posture.", ["feature_6"], firstSource, "medium")
      ]
    };
  }

  if (phase === "intent_classification") {
    return {
      classifications: [
        seededClassification("conversation_1", "vendor_evaluation", "urgency_timeline", "founder", "timeline", "before Friday", "The buyer is evaluating setup speed.", firstSource, "high"),
        seededClassification("conversation_2", "solution_compare", "migration_risk", "revenue_lead", "integration", "HubSpot sync", "The buyer is comparing migration risk.", firstSource, "high"),
        seededClassification("conversation_3", "pricing_check", "budget_validation", "finance", "budget", "small team pricing", "The buyer needs budget clarity.", firstSource, "medium"),
        seededClassification("conversation_4", "security_review", "trust_check", "security", "compliance", "Gmail permissions", "The buyer needs security proof.", firstSource, "medium")
      ]
    };
  }

  if (phase === "landing_gaps") {
    return {
      gaps: [
        seededGap("gap_1", "conversation_1", "setup_path", "high", "The source promises fast setup but does not show the setup path.", "Add a Friday launch checklist with owner/time estimates.", "hero proof block", firstSource),
        seededGap("gap_2", "conversation_2", "integration_depth", "medium", "HubSpot coexistence is mentioned by buyers but not proved.", "Add a migration and sync compatibility section.", "integration section", firstSource),
        seededGap("gap_3", "conversation_3", "pricing_clarity", "high", "Pricing clarity is a known blocker but no pricing proof is present.", "Add small-team price anchors or an implementation package.", "pricing CTA", firstSource),
        seededGap("gap_4", "conversation_4", "security", "medium", "Security review needs Gmail permission evidence.", "Add a permissions and data handling FAQ.", "trust section", firstSource)
      ]
    };
  }

  return {
    ad_groups: [
      {
        temp_id: "ad_group_1",
        name: "Friday setup urgency",
        primary_intent: "urgency_timeline",
        context_hints: ["Gmail CRM live before Friday", "five-rep setup", "founder-led sales follow-up"],
        conversation_temp_ids: ["conversation_1"],
        angle: "Speed-to-value",
        rationale: "Targets buyers who need an immediate Gmail-native workflow.",
        must_include_claims: ["Gmail-native workflow", "live before Friday"],
        avoid_claims: ["Guaranteed revenue lift"],
        linked_landing_gap_temp_ids: ["gap_1"],
        priority: "high"
      },
      {
        temp_id: "ad_group_2",
        name: "Migration proof seekers",
        primary_intent: "migration_risk",
        context_hints: ["spreadsheet migration", "HubSpot sync", "Gmail follow-up records"],
        conversation_temp_ids: ["conversation_2"],
        angle: "Switch without workflow breakage",
        rationale: "Groups buyers worried about moving spreadsheet follow-up into Gmail.",
        must_include_claims: ["spreadsheet notes", "HubSpot sync context"],
        avoid_claims: ["One-click migration if unsupported"],
        linked_landing_gap_temp_ids: ["gap_2"],
        priority: "medium"
      }
    ]
  };
}

function seededFeature(
  temp_id: string,
  type: FeatureMapOutput["features"][number]["type"],
  title: string,
  description: string,
  buyer_relevance: string,
  evidence: string,
  sourceRef: string,
  confidence: FeatureMapOutput["features"][number]["confidence"]
) {
  // Vertical-expert default: only objections get a force_tag in the seeded demo.
  // The model will populate this richly when running for real; the seed just shows the field exists.
  const force_tag = type === "objection" ? "anxiety_of_new" as const : null;
  return {
    temp_id,
    type,
    title,
    description,
    buyer_relevance,
    evidence,
    source_refs: [sourceRef],
    confidence,
    force_tag
  };
}

function seededConversation(
  temp_id: string,
  conversation_text: string,
  buyer_role: string,
  trigger: string,
  pain: string,
  desired_outcome: string,
  related_feature_temp_ids: string[],
  sourceRef: string,
  confidence: ConversationMapOutput["conversations"][number]["confidence"]
) {
  return {
    temp_id,
    conversation_text,
    buyer_role,
    trigger,
    pain,
    desired_outcome,
    related_feature_temp_ids,
    source_refs: [sourceRef],
    confidence,
    anxiety: null,
    buying_job: null
  };
}

function seededClassification(
  conversation_temp_id: string,
  stage: IntentClassificationOutput["classifications"][number]["stage"],
  intent_type: IntentClassificationOutput["classifications"][number]["intent_type"],
  buyer_role: IntentClassificationOutput["classifications"][number]["buyer_role"],
  constraintType: IntentClassificationOutput["classifications"][number]["constraints"][number]["type"],
  constraintValue: string,
  rationale: string,
  sourceRef: string,
  confidence: IntentClassificationOutput["classifications"][number]["confidence"]
) {
  return {
    conversation_temp_id,
    stage,
    intent_type,
    buyer_role,
    constraints: [
      {
        type: constraintType,
        value: constraintValue,
        // Seeded demo shows the MEDDPICC prefix pattern so downstream UI can render it.
        evidence: `MEDDPICC: Decision Process — ${rationale}`,
        source_refs: [sourceRef],
        confidence
      }
    ],
    rationale,
    confidence,
    runner_up_stage: null,
    runner_up_reason: null
  };
}

function seededGap(
  temp_id: string,
  conversation_temp_id: string,
  gap_type: LandingGapsOutput["gaps"][number]["gap_type"],
  severity: LandingGapsOutput["gaps"][number]["severity"],
  description: string,
  suggested_fix: string,
  page_area: string,
  sourceRef: string
) {
  return {
    temp_id,
    conversation_temp_id,
    gap_type,
    severity,
    description,
    suggested_fix,
    page_area,
    source_refs: [sourceRef],
    rationale: `${description} ${suggested_fix}`,
    heuristic_axis: null,
    cialdini_principle: null,
    fix_artifact_status: null
  };
}
