import { useState } from "react";
import { X, ChevronDown, ChevronRight, Search, Download, SlidersHorizontal, Check, Github, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

const MOCK_CONTRIBUTORS = [
  { name: "Sarah Chen", email: "sarah.chen@example.com", commits: 24 },
  { name: "Marcus Johnson", email: "marcus.j@example.com", commits: 18 },
  { name: "Priya Patel", email: "priya.patel@example.com", commits: 12 },
  { name: "David Kim", email: "david.kim@example.com", commits: 7 },
  { name: "Elena Rossi", email: "elena.rossi@example.com", commits: 3 },
];

interface DetailPanelProps {
  title: string;
  coverage: number;
  onClose: () => void;
  type: "testStage" | "app";
  showFailedTab?: boolean;
  showChangeMetric?: boolean;
  activeView?: "changes" | "entire";
}

interface CodeHierarchyItem {
  name: string;
  type: "package" | "folder" | "method";
  line?: number;
  coverage?: number;
  stages?: Record<string, number | boolean>;
  children?: CodeHierarchyItem[];
}

interface FailedTest {
  name: string;
}

interface Execution {
  dateRange: string;
  lab: string;
  cycle: string;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
}

const REAL_TEST_NAMES = [
  "testPaymentProcessing_withValidCard_shouldReturnSuccess",
  "testUserAuthentication_expiredToken_shouldReturn401",
  "testOrderCreation_insufficientStock_shouldThrowException",
  "testInventoryUpdate_concurrentRequests_shouldMaintainConsistency",
  "testEmailNotification_invalidRecipient_shouldLogError",
  "testCartCheckout_appliedDiscount_shouldCalculateCorrectTotal",
  "testAPIRateLimit_exceededThreshold_shouldReturn429",
  "testDatabaseConnection_timeout_shouldRetryThreeTimes",
  "testFileUpload_oversizedPayload_shouldRejectWith413",
  "testSearchIndex_specialCharacters_shouldEscapeCorrectly",
];

const FOLDER_NAMES = ["controllers", "services", "models", "utils"];
const APP_NAMES = ["inventory-mgr", "auth-service", "user-profile-api", "order-service"];

const buildPackage = (
  pkgName: string,
  pkgKey: string,
  isSingleStage: boolean,
  pkgCoverage: number,
  firstFolderCoverages: number[],
): CodeHierarchyItem => {
  const methods = ["getName", "getPayment", "processOrder", "validateInput", "handleCallback"];
  return {
    name: pkgName,
    type: "package",
    coverage: pkgCoverage,
    children: [
      {
        name: FOLDER_NAMES[0],
        type: "folder",
        coverage: firstFolderCoverages[0],
        children: methods.map((m, i) => ({
          name: m,
          type: "method" as const,
          line: 202 + i * 147,
          stages: isSingleStage
            ? { single: [true, false, true, true, false][i] }
            : {
                "All Test Stages": [true, false, true, true, true][i],
                "Regression Tests": [false, false, false, true, true][i],
                "Functional Tests": [true, false, true, true, false][i],
                "Component Tests": [false, false, true, true, false][i],
                "Unit Tests": [true, false, true, true, false][i],
              },
        })),
      },
      { name: FOLDER_NAMES[1], type: "folder", coverage: firstFolderCoverages[1] },
      { name: FOLDER_NAMES[2], type: "folder", coverage: firstFolderCoverages[2] },
      { name: FOLDER_NAMES[3], type: "folder", coverage: firstFolderCoverages[3] },
    ],
  };
};

const generateCodeHierarchy = (name: string, isSingleStage: boolean): CodeHierarchyItem[] => {
  const baseName = name.replace(" Details", "").replace("Details of ", "");

  if (isSingleStage) {
    // Test stage view → show several apps
    return APP_NAMES.map((app, idx) =>
      buildPackage(
        app,
        `${idx}`,
        true,
        [45, 72, 31, 58][idx],
        [
          [60, 6, 38, 38],
          [82, 44, 27, 65],
          [25, 18, 49, 12],
          [70, 33, 55, 41],
        ][idx],
      ),
    );
  }

  // App view → one package with diverse folders
  return [buildPackage(baseName, "0", false, 68, [80, 21, 57, 57])];
};


const generateFailedTests = (): FailedTest[] =>
  REAL_TEST_NAMES.slice(0, 5).map((name) => ({ name }));

const generateExecutions = (): Execution[] =>
  Array.from({ length: 10 }, (_, i) => ({
    dateRange: i === 0
      ? "Feb 23, 14:30 - Feb 23, 18:30"
      : `Feb ${22 - Math.floor(i / 3)}, 14:30 - Feb ${22 - Math.floor(i / 3)}, 18:44`,
    lab: i === 0 ? "Lab: QA03, QA02, QA01" : "Lab: QA03",
    cycle: `Cycle-${223 - i}`,
    tests: 123 + i * 3,
    passed: 45 + i * 2,
    failed: Math.max(0, 3 - Math.floor(i / 2)),
    skipped: 65 + i,
  }));

const isMethodTested = (item: CodeHierarchyItem): boolean => {
  if (!item.stages) return false;
  return Object.values(item.stages).some((v) => v === true);
};

const filterUntested = (items: CodeHierarchyItem[]): CodeHierarchyItem[] =>
  items
    .map((item) => {
      if (item.type === "method") {
        return isMethodTested(item) ? null : item;
      }
      const children = item.children ? filterUntested(item.children) : undefined;
      return { ...item, children };
    })
    .filter((i): i is CodeHierarchyItem => i !== null);

const CoverageTab = ({ title, isSingleStage }: { title: string; isSingleStage: boolean }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "0": true, "0-0": true });
  const [untestedOnly, setUntestedOnly] = useState(false);
  const rawHierarchy = generateCodeHierarchy(title, isSingleStage);
  const hierarchy = untestedOnly ? filterUntested(rawHierarchy) : rawHierarchy;

  const stageHeaders = isSingleStage
    ? [title.replace(" Details", "").replace("Details of ", "")]
    : ["All Test Stages", "Regression Tests", "Functional Tests", "Component Tests", "Unit Tests"];

  const toggleExpand = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const searchPlaceholder = "Search method";


  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Switch
            checked={untestedOnly}
            onCheckedChange={setUntestedOnly}
            className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3"
          />
          <span className="text-xs text-foreground">Uncovered Methods Only</span>
        </label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg w-56">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder={searchPlaceholder} className="text-sm text-muted-foreground bg-transparent outline-none flex-1 placeholder:text-muted-foreground" />
          </div>
          <button className="p-2 hover:bg-muted rounded transition-colors">
            <Download className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code Hierarchy</th>
              {stageHeaders.map((h) => (
                <th key={h} className="text-center px-3 py-3 font-medium text-muted-foreground whitespace-nowrap text-xs">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hierarchy.map((pkg, pi) => (
              <PackageRow
                key={pi}
                item={pkg}
                depth={0}
                pathKey={`${pi}`}
                expanded={expanded}
                toggleExpand={toggleExpand}
                stageHeaders={stageHeaders}
                isSingleStage={isSingleStage}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PackageRow = ({
  item,
  depth,
  pathKey,
  expanded,
  toggleExpand,
  stageHeaders,
  isSingleStage,
}: {
  item: CodeHierarchyItem;
  depth: number;
  pathKey: string;
  expanded: Record<string, boolean>;
  toggleExpand: (key: string) => void;
  stageHeaders: string[];
  isSingleStage: boolean;
}) => {
  const isExpanded = expanded[pathKey];
  const hasChildren = item.children && item.children.length > 0;
  const isMethod = item.type === "method";
  const [hovered, setHovered] = useState(false);
  const [contributorsOpen, setContributorsOpen] = useState(false);
  const showActions = hovered || contributorsOpen;

  return (
    <>
      <tr
        className="border-b border-border hover:bg-muted/30 transition-colors"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <button onClick={() => toggleExpand(pathKey)} className="p-0.5">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            {isMethod ? (
              <span className="text-muted-foreground text-xs font-mono">{"{ }"}</span>
            ) : (
              <span className="text-muted-foreground text-xs">
                {item.type === "folder" ? "📁" : ""}
              </span>
            )}
            <span className="text-foreground font-medium">{item.name}</span>
            {isMethod && item.line && (
              <div className={`flex items-center gap-1 transition-opacity ${showActions ? "opacity-100" : "opacity-0"}`}>
                <span className="text-muted-foreground text-xs">(line {item.line})</span>
                <a
                  href={`https://github.com/example-org/payment-gateway/blob/main/src/${item.name}.ts#L${item.line}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 rounded hover:bg-muted transition-colors"
                  title="View on GitHub"
                >
                  <Github className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
                <Popover open={contributorsOpen} onOpenChange={setContributorsOpen}>
                  <PopoverTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Contributors"
                    >
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-72 p-0">
                    <div className="px-4 py-2.5 border-b border-border">
                      <div className="text-sm font-semibold text-foreground">Contributors</div>
                      <div className="text-xs text-muted-foreground">{MOCK_CONTRIBUTORS.length} developers</div>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-border">
                      {MOCK_CONTRIBUTORS.map((c) => (
                        <div key={c.email} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="w-8 h-8 rounded-full bg-link flex items-center justify-center shrink-0">
                            <span className="text-primary-foreground text-xs font-semibold">
                              {c.name.split(" ").map((n) => n[0]).join("")}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{c.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{c.email}</div>
                          </div>
                          <div className="text-xs text-muted-foreground shrink-0">{c.commits} commits</div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </td>
        {isMethod && item.stages
          ? stageHeaders.map((h) => {
              const val = isSingleStage ? item.stages!["single"] : item.stages![h];
              return (
                <td key={h} className="text-center px-3 py-3">
                  {typeof val === "boolean" ? (
                    val ? (
                      <Check className="w-4 h-4 text-success mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-destructive mx-auto" />
                    )
                  ) : null}
                </td>
              );
            })
          : stageHeaders.map((h, i) =>
              i === 0 && item.coverage !== undefined ? (
                <td key={h} className="text-center px-3 py-3 text-foreground font-medium">
                  {item.coverage}%
                </td>
              ) : !isMethod && item.coverage !== undefined ? (
                <td key={h} className="text-center px-3 py-3 text-foreground">
                  {Math.max(5, item.coverage + ((i * 13) % 20) - 10)}%
                </td>
              ) : (
                <td key={h} className="text-center px-3 py-3" />
              )
            )}
      </tr>
      {isExpanded &&
        item.children?.map((child, ci) => (
          <PackageRow
            key={ci}
            item={child}
            depth={depth + 1}
            pathKey={`${pathKey}-${ci}`}
            expanded={expanded}
            toggleExpand={toggleExpand}
            stageHeaders={stageHeaders}
            isSingleStage={isSingleStage}
          />
        ))}
    </>
  );
};

const FailedTestsTab = () => {
  const tests = generateFailedTests();
  return (
    <div>
      <div className="flex items-center justify-end gap-3 mb-4">
        <button className="p-2 hover:bg-muted rounded transition-colors">
          <Download className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="border border-border rounded-lg divide-y divide-border">
        {tests.map((test, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-link flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">≡×</span>
            </div>
            <span className="text-foreground flex-1 font-mono text-xs">{test.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ExecutionsTab = () => {
  const executions = generateExecutions();
  return (
    <div>
      <div className="flex items-center justify-end gap-3 mb-4">
        <button className="p-2 hover:bg-muted rounded transition-colors">
          <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
        <button className="p-2 hover:bg-muted rounded transition-colors">
          <Download className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <div className="border border-border rounded-lg divide-y divide-border">
        {executions.map((exec, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-link flex items-center justify-center shrink-0">
              <span className="text-primary-foreground text-xs font-bold">≡×</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">{exec.dateRange}</div>
              <div className="text-xs text-muted-foreground">
                {exec.lab} • {exec.cycle}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
              <span>{exec.tests} Tests</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const DetailPanel = ({ title, coverage, onClose, type, showFailedTab = true, showChangeMetric = true, activeView = "changes" }: DetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<"coverage" | "failed" | "executions">("coverage");
  const failedCount = 5;
  const executionCount = 23;
  const isSingleStage = type === "testStage";
  const isApp = type === "app";

  const tabs = isApp
    ? [{ key: "coverage" as const, label: activeView === "changes" ? "Change Coverage" : "Overall Coverage" }]
    : [
        { key: "coverage" as const, label: activeView === "changes" ? "Change Coverage" : "Overall Coverage" },
        ...(showFailedTab ? [{ key: "failed" as const, label: `Failed Tests (${failedCount})` }] : []),
        { key: "executions" as const, label: `Executions (${executionCount})` },
      ];

  const displayTitle = title.replace("Details of ", "") + " Details";

  return (
    <div className="fixed inset-x-0 top-0 bottom-0 z-40">
      {/* Backdrop - click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Panel - right 3/4, starts right below the top nav */}
      <div className="absolute right-0 top-[49px] bottom-0 w-3/4 bg-surface-panel border-l border-border shadow-xl flex flex-col">
        {/* Header - on the panel bg */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border shrink-0">
          <h2 className="text-xl font-semibold text-foreground">{displayTitle}</h2>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content card - white, inset from edges */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-card rounded-lg shadow-sm p-8">
            {/* Tabs row with coverage bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-0 border-b border-border">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
                      activeTab === tab.key
                        ? "text-link border-link"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2 rounded-full bg-progress-track overflow-hidden">
                    <div
                      className="h-full rounded-full bg-progress-bar transition-all"
                      style={{ width: `${coverage}%` }}
                    />
                  </div>
                  <span className="font-semibold text-foreground">{coverage}%</span>
                </div>
                {type === "app" && showChangeMetric && (
                  <>
                    <span className="text-border">|</span>
                    <span className="text-muted-foreground"><span className="font-semibold text-foreground">12</span> Code Changes</span>
                    <span className="text-border">|</span>
                    <span className="text-muted-foreground"><span className="font-semibold text-foreground">3</span> Uncovered</span>
                  </>
                )}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "coverage" && <CoverageTab title={title} isSingleStage={isSingleStage} />}
            {activeTab === "failed" && <FailedTestsTab />}
            {activeTab === "executions" && <ExecutionsTab />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
