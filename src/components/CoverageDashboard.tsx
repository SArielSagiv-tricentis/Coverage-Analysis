import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronRight, Check, Flag, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import FilterSidebar, { FilterSummary, type FilterState } from "./FilterSidebar";
import DetailPanel from "./DetailPanel";
import QualityGateDialog, { getBarColor, resolveThreshold, type QualityGateSettings, type ThresholdConfig } from "./QualityGateDialog";
import type { MetricKey } from "./wizard/types";

interface TestStage {
  name: string;
  coverage: number;
  untestedMethods: number;
  failedTests: number;
  testOptimization?: boolean;
}

interface AppItem {
  name: string;
  methods: number;
  untested: number;
  coverage: number;
}

type SortOption = "highest" | "lowest" | "az" | "za";

const SORT_LABELS: Record<SortOption, string> = {
  highest: "Highest Coverage",
  lowest: "Lowest Coverage",
  az: "A to Z",
  za: "Z to A",
};

const baseTestStages: TestStage[] = [
  { name: "Regression Tests", coverage: 68, untestedMethods: 88, failedTests: 12, testOptimization: true },
  { name: "Unit Tests", coverage: 65, untestedMethods: 96, failedTests: 0 },
  { name: "Functional Tests", coverage: 54, untestedMethods: 127, failedTests: 5, testOptimization: true },
  { name: "Component Tests", coverage: 23, untestedMethods: 212, failedTests: 3 },
];

const baseApps: AppItem[] = [
  { name: "inventory-mgr", methods: 6, untested: 1, coverage: 86 },
  { name: "payment-gateway", methods: 88, untested: 21, coverage: 68 },
  { name: "auth-service", methods: 32, untested: 21, coverage: 44 },
  { name: "user-profile-api", methods: 54, untested: 37, coverage: 32 },
];

const baseOverall = { coverage: 78, tested: 244, total: 276 };
const entireCodeOverall = { coverage: 62, tested: 198, total: 320 };

const emptyFilters: FilterState = {
  testStages: [],
  labs: [],
  apps: [],
  qualityGates: [],
};

const defaultQGSettings: QualityGateSettings = {
  main: { enabled: false, target: 80, atRiskEnabled: false, atRisk: 60 },
  failedTests: { enabled: false, target: 5, atRiskEnabled: false, atRisk: 10 },
  testStages: { mode: "all", allThreshold: { enabled: false, target: 80, atRiskEnabled: false, atRisk: 60 }, specific: {} },
  apps: { mode: "all", allThreshold: { enabled: false, target: 80, atRiskEnabled: false, atRisk: 60 }, specific: {} },
};

function hasThresholdsConfigured(qg: QualityGateSettings): boolean {
  if (qg.main?.enabled) return true;
  if (qg.failedTests?.enabled) return true;
  for (const group of [qg.testStages, qg.apps]) {
    if (group?.allThreshold?.enabled) return true;
    if (Object.values(group?.specific || {}).some((t: ThresholdConfig) => t?.enabled)) return true;
  }
  return false;
}

interface CoverageDashboardProps {
  viewName: string;
  scope: string;
  dateRange: string;
  selectedMetrics?: MetricKey[];
  initialFilters?: FilterState;
  initialQgSettings?: QualityGateSettings;
  initialEntireQgSettings?: QualityGateSettings;
  onSettingsChange?: (filters: FilterState, qgSettings: QualityGateSettings, entireQgSettings: QualityGateSettings) => void;
}

function hashFilters(filters: FilterState): number {
  const str = JSON.stringify(filters);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Google Material "left_panel_open" style icon */
const FilterPanelOpenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-link">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1.5" />
    <polyline points="14,10 16,12 14,14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Google Material "left_panel_close" style icon */
const FilterPanelCloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-link">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1.5" />
    <polyline points="16,10 14,12 16,14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function sortItems<T extends { name: string; coverage: number }>(items: T[], sort: SortOption): T[] {
  const sorted = [...items];
  switch (sort) {
    case "highest": return sorted.sort((a, b) => b.coverage - a.coverage);
    case "lowest": return sorted.sort((a, b) => a.coverage - b.coverage);
    case "az": return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "za": return sorted.sort((a, b) => b.name.localeCompare(a.name));
  }
}

const SortDropdown = ({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
          <path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" fill="currentColor" />
        </svg>
        {SORT_LABELS[value]}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg z-50">
          {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                value === opt ? "text-primary font-medium" : "text-foreground"
              }`}
            >
              {value === opt && <Check className="w-3.5 h-3.5" />}
              <span className={value !== opt ? "pl-5" : ""}>{SORT_LABELS[opt]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CoverageDashboard = ({ scope, dateRange, selectedMetrics, initialFilters, initialQgSettings, initialEntireQgSettings, onSettingsChange }: CoverageDashboardProps) => {
  const metrics: MetricKey[] = selectedMetrics && selectedMetrics.length > 0 ? selectedMetrics : ["change", "entire"];
  const showEntire = metrics.includes("entire");
  const showChange = metrics.includes("change");
  const showFailed = metrics.includes("failed");
  const showTabs = showEntire && showChange;
  const defaultTab: "changes" | "entire" = showChange ? "changes" : "entire";

  const [filterVisible, setFilterVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"changes" | "entire">(defaultTab);
  const [summaryTab, setSummaryTab] = useState<"testStage" | "component">("testStage");
  const [filters, setFilters] = useState<FilterState>({ ...emptyFilters, ...(initialFilters || {}) });
  const [selectedItem, setSelectedItem] = useState<{ name: string; coverage: number; type: "testStage" | "app" } | null>(null);
  const [qgOpen, setQgOpen] = useState(false);
  const [qgSettings, setQgSettings] = useState<QualityGateSettings>({ ...defaultQGSettings, ...(initialQgSettings || {}) });
  const [entireQgSettings, setEntireQgSettings] = useState<QualityGateSettings>({ ...defaultQGSettings, ...(initialEntireQgSettings || {}) });
  const [sortOption, setSortOption] = useState<SortOption>("highest");

  useEffect(() => { setActiveTab(defaultTab); }, [defaultTab]);

  const currentQgSettings = activeTab === "entire" ? entireQgSettings : qgSettings;
  const setCurrentQgSettings = activeTab === "entire" ? setEntireQgSettings : setQgSettings;

  useEffect(() => {
    onSettingsChange?.(filters, qgSettings, entireQgSettings);
  }, [filters, qgSettings, entireQgSettings]);

  const hasActiveFilters = Object.values(filters).some((v) => v.length > 0);
  const isEntireCode = activeTab === "entire";

  const { testStages, apps, overall } = useMemo(() => {
    const h = hashFilters(filters);
    const baseOvr = isEntireCode ? entireCodeOverall : baseOverall;

    if (!hasActiveFilters) {
      const stages = isEntireCode
        ? baseTestStages.map((s) => ({ ...s, coverage: Math.max(10, s.coverage - 12), untestedMethods: s.untestedMethods + 30 }))
        : baseTestStages;
      const appItems = isEntireCode
        ? baseApps.map((a) => ({ ...a, coverage: Math.max(10, a.coverage - 15), untested: a.untested + 8 }))
        : baseApps;
      return { testStages: stages, apps: appItems, overall: baseOvr };
    }

    let stages = filters.testStages.length > 0
      ? baseTestStages.filter((s) => filters.testStages.includes(s.name))
      : [...baseTestStages];

    stages = stages.map((s, i) => ({
      ...s,
      coverage: Math.min(99, Math.max(10, s.coverage + ((h + i * 17) % 30) - 15 - (isEntireCode ? 12 : 0))),
      untestedMethods: Math.max(5, s.untestedMethods + ((h + i * 13) % 40) - 20 + (isEntireCode ? 30 : 0)),
      failedTests: Math.max(0, s.failedTests + ((h + i * 7) % 6) - 3),
    }));

    const appItems = baseApps.map((a, i) => ({
      ...a,
      coverage: Math.min(99, Math.max(10, a.coverage + ((h + i * 11) % 20) - 10 - (isEntireCode ? 15 : 0))),
      untested: Math.max(0, a.untested + ((h + i * 9) % 10) - 5 + (isEntireCode ? 8 : 0)),
    }));

    const totalMethods = stages.reduce((a, s) => a + s.untestedMethods, 0) + 150;
    const tested = totalMethods - stages.reduce((a, s) => a + s.untestedMethods, 0);
    const coverage = Math.round((tested / totalMethods) * 100);

    return { testStages: stages, apps: appItems, overall: { coverage, tested, total: totalMethods } };
  }, [filters, hasActiveFilters, isEntireCode]);

  const uncovered = overall.total - overall.tested;
  const mainThreshold = currentQgSettings.main;
  const mainBarColor = getBarColor(overall.coverage, mainThreshold);
  const mainNumberColor = mainThreshold.enabled
    ? mainBarColor
    : "hsl(var(--primary))";

  const getStageThreshold = (name: string): ThresholdConfig | undefined => resolveThreshold(currentQgSettings.testStages, name);
  const getAppThreshold = (name: string): ThresholdConfig | undefined => resolveThreshold(currentQgSettings.apps, name);

  const handleItemClick = (name: string, coverage: number, type: "testStage" | "app") => {
    setSelectedItem({ name, coverage, type });
  };

  const sortedTestStages = sortItems(testStages, sortOption);
  const sortedApps = sortItems(apps, sortOption);

  return (
    <div className="flex gap-4">
      <FilterSidebar visible={filterVisible} filters={filters} onFiltersChange={setFilters} showThresholds={hasThresholdsConfigured(currentQgSettings)} />

      <div className="flex-1 min-w-0 space-y-4">
        {/* Sub-header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <button
              onClick={() => setFilterVisible(!filterVisible)}
              className="flex items-center gap-1.5 text-link hover:text-link-hover font-medium transition-colors"
            >
              {filterVisible ? <FilterPanelCloseIcon /> : <FilterPanelOpenIcon />}
              Filter
            </button>
            <span className="text-foreground font-medium">{scope}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{dateRange}</span>
            {hasActiveFilters && (
              <>
                <span className="text-muted-foreground">•</span>
                <FilterSummary filters={filters} />
              </>
            )}
          </div>

          {!selectedItem && showTabs && (
            <div className="flex items-center gap-1 text-sm">
              <button
                onClick={() => setActiveTab("changes")}
                className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
                  activeTab === "changes"
                    ? "text-link border-b-2 border-link"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Change Coverage
              </button>
              <button
                onClick={() => setActiveTab("entire")}
                className={`px-3 py-1.5 rounded-sm font-medium transition-colors ${
                  activeTab === "entire"
                    ? "text-link border-b-2 border-link"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Overall Coverage
              </button>
            </div>
          )}
        </div>

        {/* Top metric cards */}
        <div className={`grid gap-4 ${showFailed && (showEntire || showChange) ? "md:grid-cols-[2fr_1fr]" : "grid-cols-1"}`}>
          {(showEntire || showChange) && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {isEntireCode ? "Overall Coverage" : "Change Coverage"}
                </h3>
                {isEntireCode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor" className="text-muted-foreground">
                    <path d="M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880h40v331q18 11 29 28.5t11 40.5q0 33-23.5 56.5T480-400q-33 0-56.5-23.5T400-480q0-23 11-41t29-28v-86q-52 14-86 56.5T320-480q0 66 47 113t113 47q66 0 113-47t47-113q0-36-14.5-66.5T586-600l57-57q35 33 56 78.5t21 98.5q0 100-70 170t-170 70q-100 0-170-70t-70-170q0-90 57-156.5T440-717v-81q-119 15-199.5 105T160-480q0 134 93 227t227 93q134 0 227-93t93-227q0-69-27-129t-74-104l57-57q57 55 90.5 129.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80q-83 0-156-31.5Z"/>
                  </svg>
                )}
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-5xl font-bold"
                  style={{ color: mainNumberColor }}
                >
                  {overall.coverage}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {overall.tested} covered / {overall.total} methods
                </span>
              </div>

              <div className="mb-1">
                <div className="relative w-full h-2 rounded-full bg-progress-track overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{ width: `${overall.coverage}%`, backgroundColor: mainBarColor }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {mainThreshold.enabled
                    ? `Threshold > ${mainThreshold.target}%`
                    : "No Threshold"}
                </span>
                <span>{uncovered} uncovered</span>
              </div>
            </div>
          )}

          {showFailed && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Failed Tests</h3>
                <Flag className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-5xl font-bold" style={{ color: mainNumberColor }}>
                  {testStages.reduce((a, s) => a + s.failedTests, 0)}
                </span>
                <span className="text-sm text-muted-foreground">across all test stages</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
                <span>
                  {currentQgSettings.failedTests?.enabled
                    ? `Threshold < ${currentQgSettings.failedTests.target}`
                    : "No Threshold"}
                </span>
                <span>2% test failures</span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs: Test Stages / Apps */}
        <div className="flex items-center justify-between mt-8">
          <div className="inline-flex border border-[hsl(var(--segment-border))] rounded-full overflow-hidden">
            <button
              onClick={() => setSummaryTab("testStage")}
              className={`flex items-center justify-center gap-1.5 w-[120px] h-8 text-sm font-medium transition-colors ${
                summaryTab === "testStage"
                  ? "bg-[hsl(var(--segment-active))] text-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {summaryTab === "testStage" && <Check className="w-3.5 h-3.5" />}
              Test Stages
            </button>
            <button
              onClick={() => setSummaryTab("component")}
              className={`flex items-center justify-center gap-1.5 w-[120px] h-8 text-sm font-medium transition-colors ${
                summaryTab === "component"
                  ? "bg-[hsl(var(--segment-active))] text-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {summaryTab === "component" && <Check className="w-3.5 h-3.5" />}
              Apps
            </button>
          </div>

          <SortDropdown value={sortOption} onChange={setSortOption} />
        </div>

        {/* List */}
        <div className="border border-border rounded-lg divide-y divide-border bg-card mt-6">
          {summaryTab === "testStage"
            ? sortedTestStages.map((stage) => {
                const th = getStageThreshold(stage.name);
                const barColor = getBarColor(stage.coverage, th);
                return (
                  <div
                    key={stage.name}
                    onClick={() => handleItemClick(stage.name, stage.coverage, "testStage")}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--icon-accent-bg))] flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <line x1="5" y1="19" x2="11" y2="5" />
                        <line x1="10" y1="19" x2="16" y2="5" />
                        <line x1="15" y1="19" x2="21" y2="5" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{stage.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {stage.untestedMethods} Uncovered Methods
                        {showFailed && (
                          <>
                            <span className="mx-2">•</span>
                            {stage.failedTests} Failed Tests
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {isEntireCode && stage.testOptimization && (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center justify-center"
                                style={{ color: '#3F3F46' }}
                              >
                                <Zap size={16} />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              Test Optimization was enabled for this stage. Only impacted tests were executed, which reduces the entire coverage.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <div className="w-28 h-1.5 rounded-full bg-progress-track overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${stage.coverage}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground w-10 text-right">
                        {stage.coverage}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })
            : sortedApps.map((app) => {
                const th = getAppThreshold(app.name);
                const barColor = getBarColor(app.coverage, th);
                return (
                  <div
                    key={app.name}
                    onClick={() => handleItemClick(app.name, app.coverage, "app")}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--icon-accent-bg))] flex items-center justify-center shrink-0">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                        <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground">{app.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {app.methods} Methods
                        <span className="mx-2">•</span>
                        {app.untested} Uncovered
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-28 h-1.5 rounded-full bg-progress-track overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${app.coverage}%`, backgroundColor: barColor }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground w-10 text-right">
                        {app.coverage}%
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Detail Panel - Full overlay */}
      {selectedItem && (
        <DetailPanel
          title={`Details of ${selectedItem.name}`}
          coverage={selectedItem.coverage}
          onClose={() => setSelectedItem(null)}
          type={selectedItem.type}
          showFailedTab={!selectedMetrics || selectedMetrics.includes("failed")}
          showChangeMetric={showChange && !isEntireCode}
          activeView={activeTab}
        />
      )}

      {/* Quality Gate Dialog */}
      <QualityGateDialog
        open={qgOpen}
        onClose={() => setQgOpen(false)}
        settings={currentQgSettings}
        onSave={setCurrentQgSettings}
        testStageNames={baseTestStages.map((s) => s.name)}
        appNames={baseApps.map((a) => a.name)}
      />
    </div>
  );
};

export default CoverageDashboard;
