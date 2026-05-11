import type { QualityGateSettings } from "../QualityGateDialog";

export type MetricKey = "entire" | "change" | "failed";

export const METRIC_LABELS: Record<MetricKey, string> = {
  entire: "Overall Coverage",
  change: "Change Coverage",
  failed: "Failed Tests",
};

export interface WizardData {
  dateRange: string;
  scope: string;
  testStage: string;
  testProjectId: string;
  metrics: MetricKey[];
  thresholds: Partial<Record<MetricKey, QualityGateSettings>>;
  name: string;
}

export const emptyWizardData: WizardData = {
  dateRange: "",
  scope: "",
  testStage: "",
  testProjectId: "",
  metrics: [],
  thresholds: {},
  name: "",
};
