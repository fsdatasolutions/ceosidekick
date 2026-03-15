import type { Page } from "playwright";

export interface TimedAction {
  /** Milliseconds from the start of recording when this action should execute */
  timestamp: number;
  /** Playwright action to perform */
  action: (page: Page) => Promise<void>;
  /** Description for logging */
  description: string;
}

export interface FeatureConfig {
  /** Unique identifier (used for filenames) */
  id: string;
  /** Human-readable title */
  title: string;
  /** Starting route after login (e.g., "/dashboard") */
  route: string;
  /** Full narration text for TTS generation */
  narration: string;
  /** Estimated total recording duration in ms */
  estimatedDurationMs: number;
  /** Timed Playwright actions synchronized with narration */
  actions: TimedAction[];
}
