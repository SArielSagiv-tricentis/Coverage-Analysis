import { useState } from "react";
import { Check, Plus, Settings, Flag } from "lucide-react";
import QualityGateDialog, { type QualityGateSettings } from "../QualityGateDialog";
import type { WizardData, MetricKey } from "./types";

interface MetricsStepProps {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
  testStageNames: string[];
  appNames: string[];
}

const defaultQg: QualityGateSettings = {
  main: { enabled: false, target: 80, atRiskEnabled: false, atRisk: 60 },
  failedTests: { enabled: false, target: 5, atRiskEnabled: false, atRisk: 10 },
  testStages: { mode: "all", allThreshold: { enabled: false, target: 80, atRiskEnabled: false, atRisk: 60 }, specific: {} },
  apps: { mode: "all", allThreshold: { enabled: false, target: 80, atRiskEnabled: false, atRisk: 60 }, specific: {} },
};

const FullscreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
  </svg>
);

const TrackChangesIcon = () => (
  <svg width="24" height="24" viewBox="0 -960 960 960" fill="currentColor">
    <path d="M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880h40v331q18 11 29 28.5t11 40.5q0 33-23.5 56.5T480-400q-33 0-56.5-23.5T400-480q0-23 11-41t29-28v-86q-52 14-86 56.5T320-480q0 66 47 113t113 47q66 0 113-47t47-113q0-36-14.5-66.5T586-600l57-57q35 33 56 78.5t21 98.5q0 100-70 170t-170 70q-100 0-170-70t-70-170q0-90 57-156.5T440-717v-81q-119 15-199.5 105T160-480q0 134 93 227t227 93q134 0 227-93t93-227q0-69-27-129t-74-104l57-57q57 55 90.5 129.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80q-83 0-156-31.5Z"/>
  </svg>
);

const METRICS: { key: MetricKey; title: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "entire", title: "Overall Coverage", desc: "Track the coverage of your entire codebase beyond the recent changes.", icon: FullscreenIcon },
  { key: "change", title: "Change Coverage", desc: "Focus on the quality of new and modified code for this release.", icon: TrackChangesIcon },
  { key: "failed", title: "Failed Tests", desc: "Monitor code health by highlighting failing tests within your selected scope.", icon: Flag },
];

const MetricsStep = ({ data, update, testStageNames, appNames }: MetricsStepProps) => {
  const [editing, setEditing] = useState<MetricKey | null>(null);

  const hasCoverage = data.metrics.includes("entire") || data.metrics.includes("change");

  const toggleMetric = (key: MetricKey) => {
    if (key === "failed" && !hasCoverage && !data.metrics.includes("failed")) return;
    const has = data.metrics.includes(key);
    if (has) {
      const next = data.metrics.filter((m) => m !== key);
      const nextThr = { ...data.thresholds };
      delete nextThr[key];
      // If removing last coverage metric, also drop failed
      if ((key === "entire" || key === "change") && !next.includes("entire") && !next.includes("change")) {
        const idx = next.indexOf("failed");
        if (idx !== -1) {
          next.splice(idx, 1);
          delete nextThr["failed"];
        }
      }
      update({ metrics: next, thresholds: nextThr });
    } else {
      update({ metrics: [...data.metrics, key] });
    }
  };

  return (
    <div className="max-w-[960px] mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground">What matters most?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick your key metrics and set the goals you want to hit.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 items-start">
        {METRICS.map((m) => {
          const Icon = m.icon;
          const selected = data.metrics.includes(m.key);
          const hasThresholds = !!data.thresholds[m.key];
          const disabled = m.key === "failed" && !hasCoverage && !selected;
          return (
            <div key={m.key} className="flex flex-col gap-2">
              <button
                onClick={() => toggleMetric(m.key)}
                disabled={disabled}
                title={disabled ? "Select a coverage metric to enable Failed Tests" : undefined}
                className={`relative text-left p-5 rounded-lg transition-all bg-[#F6F9FC] border-2 ${
                  selected
                    ? "border-link shadow-sm"
                    : "border-transparent hover:border-muted-foreground/30"
                } ${disabled ? "opacity-50 cursor-not-allowed hover:border-transparent" : ""}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-6 h-6 text-[#3F3F46]" />
                  {selected && (
                    <Check className="w-5 h-5 text-link" strokeWidth={2.5} />
                  )}
                </div>
                <div className="text-base font-semibold text-foreground mb-1">{m.title}</div>
                <div className="text-sm text-muted-foreground leading-snug line-clamp-2 min-h-[2.6em]">{m.desc}</div>
              </button>
              {selected && (
                <button
                  onClick={() => setEditing(m.key)}
                  className="inline-flex items-center justify-center gap-1.5 text-sm text-link hover:text-link-hover font-medium py-1"
                >
                  {hasThresholds ? <Settings className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {hasThresholds ? "Edit Thresholds" : "Add Thresholds"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {editing && (
        <QualityGateDialog
          open={!!editing}
          onClose={() => setEditing(null)}
          settings={data.thresholds[editing] || defaultQg}
          onSave={(s) => update({ thresholds: { ...data.thresholds, [editing]: s } })}
          testStageNames={testStageNames}
          appNames={appNames}
        />
      )}
    </div>
  );
};

export default MetricsStep;
