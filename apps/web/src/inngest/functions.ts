import { placeholderCreatives } from "./creatives";
import { MOTIVE_EVENTS } from "./events";
import { placeholderExtraction } from "./extraction";
import { placeholderMonitoring } from "./monitoring";
import { sourceIngestion } from "./source-ingestion";

export { MOTIVE_EVENTS };

export const functions = [
  sourceIngestion,
  placeholderExtraction,
  placeholderCreatives,
  placeholderMonitoring
];
