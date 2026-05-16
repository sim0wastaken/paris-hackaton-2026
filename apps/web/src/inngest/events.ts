export const MOTIVE_EVENTS = {
  projectCreated: "motive/project.created",
  sourceIngestRequested: "motive/source.ingest.requested",
  extractionRequested: "motive/extraction.requested",
  creativesRequested: "motive/creatives.requested",
  fakeDeploymentRequested: "motive/deployment.fake_requested",
  monitoringRequested: "motive/monitoring.requested",
  demoExtractionReplayRequested: "demo/extraction.replay.requested"
} as const;
