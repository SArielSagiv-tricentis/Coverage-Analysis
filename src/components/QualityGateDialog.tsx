import { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";

export interface ThresholdConfig {
  enabled: boolean;
  target: number;
  atRiskEnabled: boolean;
  atRisk: number;
}

export type ApplyMode = "all" | "specific";

export interface CategoryThresholds {
  mode: ApplyMode;
  allThreshold: ThresholdConfig;
  specific: Record<string, ThresholdConfig>;
}

export interface QualityGateSettings {
  main: ThresholdConfig;
  failedTests: ThresholdConfig;
  testStages: CategoryThresholds;
  apps: CategoryThresholds;
}

interface QualityGateDialogProps {
  open: boolean;
  onClose: () => void;
  settings: QualityGateSettings;
  onSave: (settings: QualityGateSettings) => void;
  testStageNames: string[];
  appNames: string[];
}

const defaultThreshold: ThresholdConfig = { enabled: false, target: 80, atRiskEnabled: false, atRisk: 60 };

const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
  <button
    onClick={onToggle}
    className={`relative w-10 h-5 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
  >
    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "left-5" : "left-0.5"}`} />
  </button>
);

const ThresholdInputs = ({
  config,
  onChange,
  showAtRisk = true,
}: {
  config: ThresholdConfig;
  onChange: (c: ThresholdConfig) => void;
  showAtRisk?: boolean;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <Toggle on={config.enabled} onToggle={() => onChange({ ...config, enabled: !config.enabled })} />
      <span className="text-sm text-foreground">Coverage Target</span>
      {config.enabled ? (
        <div className="flex items-center gap-1 ml-auto">
          <input
            type="number" min={1} max={100} value={config.target}
            onChange={(e) => onChange({ ...config, target: Math.min(100, Math.max(1, Number(e.target.value))) })}
            className="w-16 px-2 py-1 border border-border rounded text-sm text-foreground bg-card text-center outline-none focus:border-ring"
          />
          <span className="text-sm text-muted-foreground">%</span>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground ml-auto">Off</span>
      )}
    </div>
    {config.enabled && showAtRisk && (
      <div className="flex items-center gap-3 pl-1">
        <Toggle on={config.atRiskEnabled} onToggle={() => onChange({ ...config, atRiskEnabled: !config.atRiskEnabled })} />
        <span className="text-sm text-foreground">At-Risk Minimum</span>
        {config.atRiskEnabled ? (
          <div className="flex items-center gap-1 ml-auto">
            <input
              type="number" min={1} max={config.target - 1} value={config.atRisk}
              onChange={(e) => onChange({ ...config, atRisk: Math.min(config.target - 1, Math.max(1, Number(e.target.value))) })}
              className="w-16 px-2 py-1 border border-border rounded text-sm text-foreground bg-card text-center outline-none focus:border-ring"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground ml-auto">Off</span>
        )}
      </div>
    )}
  </div>
);

const ItemPicker = ({
  names,
  selected,
  onToggle,
}: {
  names: string[];
  selected: string[];
  onToggle: (name: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const label = selected.length === 0 ? "Select items..." : `${selected.length} selected`;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm border border-border rounded bg-card text-foreground"
      >
        <span>{label}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-card border border-border rounded shadow-lg max-h-48 overflow-y-auto">
          {names.map((name) => {
            const isSelected = selected.includes(name);
            return (
              <button
                key={name}
                onClick={() => onToggle(name)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted/50 text-left"
              >
                <div className={`w-4 h-4 border rounded flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="text-foreground">{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const CategorySection = ({
  title,
  names,
  category,
  onChange,
}: {
  title: string;
  names: string[];
  category: CategoryThresholds;
  onChange: (c: CategoryThresholds) => void;
}) => {
  const selectedNames = Object.keys(category.specific);

  const toggleItem = (name: string) => {
    const next = { ...category.specific };
    if (next[name]) {
      delete next[name];
    } else {
      next[name] = { ...defaultThreshold, enabled: true, target: category.allThreshold.target };
    }
    onChange({ ...category, specific: next });
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3">{title}</h3>
      <div className="flex items-center gap-4 mb-3">
        <label className="flex items-center gap-2 cursor-pointer" onClick={() => onChange({ ...category, mode: "all" })}>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${category.mode === "all" ? "border-primary" : "border-muted-foreground"}`}>
            {category.mode === "all" && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <span className="text-sm text-foreground">Apply to All</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer" onClick={() => onChange({ ...category, mode: "specific" })}>
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${category.mode === "specific" ? "border-primary" : "border-muted-foreground"}`}>
            {category.mode === "specific" && <div className="w-2 h-2 rounded-full bg-primary" />}
          </div>
          <span className="text-sm text-foreground">Specific</span>
        </label>
      </div>

      {category.mode === "all" ? (
        <div className="border border-border rounded-lg p-4">
          <ThresholdInputs config={category.allThreshold} onChange={(c) => onChange({ ...category, allThreshold: c })} />
        </div>
      ) : (
        <div className="space-y-3">
          <ItemPicker names={names} selected={selectedNames} onToggle={toggleItem} />
          {selectedNames.map((name) => (
            <div key={name} className="border border-border rounded-lg p-4">
              <div className="text-sm font-medium text-foreground mb-2">{name}</div>
              <ThresholdInputs
                config={category.specific[name]}
                onChange={(c) => onChange({ ...category, specific: { ...category.specific, [name]: c } })}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const QualityGateDialog = ({
  open,
  onClose,
  settings,
  onSave,
  testStageNames,
  appNames,
}: QualityGateDialogProps) => {
  const [local, setLocal] = useState<QualityGateSettings>(settings);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-xl w-[520px] max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Thresholds Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Overall Threshold
          </h3>
          <div className="border border-border rounded-lg p-4">
            <ThresholdInputs config={local.main} onChange={(c) => setLocal({ ...local, main: c })} />
          </div>

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3">
            Failed Tests Threshold
          </h3>
          <div className="border border-border rounded-lg p-4">
            <ThresholdInputs config={local.failedTests} onChange={(c) => setLocal({ ...local, failedTests: c })} showAtRisk={false} />
          </div>

          <CategorySection
            title="Test Stages"
            names={testStageNames}
            category={local.testStages}
            onChange={(c) => setLocal({ ...local, testStages: c })}
          />

          <CategorySection
            title="Apps"
            names={appNames}
            category={local.apps}
            onChange={(c) => setLocal({ ...local, apps: c })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onSave(local); onClose(); }}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default QualityGateDialog;

/** Resolve the effective threshold for a specific item */
export const resolveThreshold = (
  category: CategoryThresholds,
  name: string
): ThresholdConfig | undefined => {
  if (category.mode === "all") {
    return category.allThreshold.enabled ? category.allThreshold : undefined;
  }
  const specific = category.specific[name];
  return specific?.enabled ? specific : undefined;
};

/** Determine bar color based on coverage vs threshold */
export const getBarColor = (
  coverage: number,
  threshold: ThresholdConfig | undefined
): string => {
  if (!threshold || !threshold.enabled) return "hsl(var(--progress-bar))";
  if (coverage >= threshold.target) return "hsl(var(--threshold-green))";
  if (threshold.atRiskEnabled && coverage >= threshold.atRisk) return "hsl(var(--threshold-orange))";
  return "hsl(var(--threshold-red))";
};
