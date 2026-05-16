import { placeholderCreatives } from "./creatives";
import { seededDemoReplay } from "./demo-replay";
import { MOTIVE_EVENTS } from "./events";
import { extractionPipeline } from "./extraction";
import { placeholderMonitoring } from "./monitoring";
import { sourceIngestion } from "./source-ingestion";

export { MOTIVE_EVENTS };

export const functions = [
  sourceIngestion,
  extractionPipeline,
  seededDemoReplay,
  placeholderCreatives,
  placeholderMonitoring
];
