import { placeholderCreatives } from "./creatives";
import { MOTIVE_EVENTS } from "./events";
import { extractionPipeline } from "./extraction";
import { placeholderMonitoring } from "./monitoring";
import { sourceIngestion } from "./source-ingestion";

export { MOTIVE_EVENTS };

export const functions = [
  sourceIngestion,
  extractionPipeline,
  placeholderCreatives,
  placeholderMonitoring
];
