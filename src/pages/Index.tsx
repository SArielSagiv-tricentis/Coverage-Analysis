import { useState, useEffect } from "react";
import { HelpCircle, ChevronDown, RotateCw, Plus, Trash2, Check, AlertTriangle, X, Info, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TopNav from "@/components/TopNav";
import WelcomeState from "@/components/WelcomeState";
import LoadingState from "@/components/LoadingState";
import CoverageDashboard from "@/components/CoverageDashboard";
import ViewWizard from "@/components/wizard/ViewWizard";
import HelpDialog from "@/components/HelpDialog";
import ExportMenu from "@/components/ExportMenu";
import type { WizardData, MetricKey } from "@/components/wizard/types";
import type { FilterState } from "@/components/FilterSidebar";
import type { QualityGateSettings } from "@/components/QualityGateDialog";

interface SavedView {
  name: string;
  scope: string;
  dateRange: string;
  metrics: MetricKey[];
  wizardData: WizardData;
  filters?: FilterState;
  qgSettings?: QualityGateSettings;
  entireQgSettings?: QualityGateSettings;
  createdBy?: string;
  createdAt?: string;
}

type Mode = "welcome" | "wizard" | "loading" | "saved";

const Index = () => {
  const defaultView: SavedView = {
    name: "My First View",
    scope: "All Labs",
    dateRange: "Last 30 days",
    metrics: ["entire", "change", "failed"],
    wizardData: {
      dateRange: "Last 30 days",
      scope: "All Labs",
      testStage: "",
      testProjectId: "",
      metrics: ["entire", "change", "failed"],
      thresholds: {},
      name: "My First View",
    },
    createdBy: "John Smith",
    createdAt: "Jan 14, 2026",
  };

  const changeOnlyView: SavedView = {
    name: "Change Coverage Only",
    scope: "All Labs",
    dateRange: "Last 7 days",
    metrics: ["change"],
    wizardData: {
      dateRange: "Last 7 days",
      scope: "All Labs",
      testStage: "",
      testProjectId: "",
      metrics: ["change"],
      thresholds: {},
      name: "Change Coverage Only",
    },
    createdBy: "Maria Garcia",
    createdAt: "Feb 02, 2026",
  };

  const changeAndEntireView: SavedView = {
    name: "Change + Overall Coverage",
    scope: "All Labs",
    dateRange: "Last 14 days",
    metrics: ["change", "entire"],
    wizardData: {
      dateRange: "Last 14 days",
      scope: "All Labs",
      testStage: "",
      testProjectId: "",
      metrics: ["change", "entire"],
      thresholds: {},
      name: "Change + Overall Coverage",
    },
    createdBy: "Alex Chen",
    createdAt: "Feb 18, 2026",
  };

  const allMetricsView: SavedView = {
    name: "Full Quality Overview",
    scope: "All Labs",
    dateRange: "Last 30 days",
    metrics: ["change", "entire", "failed"],
    wizardData: {
      dateRange: "Last 30 days",
      scope: "All Labs",
      testStage: "",
      testProjectId: "",
      metrics: ["change", "entire", "failed"],
      thresholds: {},
      name: "Full Quality Overview",
    },
    createdBy: "Priya Patel",
    createdAt: "Mar 05, 2026",
  };

  const changeThresholdQg = {
    main: { enabled: true, target: 80, atRiskEnabled: true, atRisk: 60 },
    failedTests: { enabled: false, target: 5, atRiskEnabled: false, atRisk: 10 },
    testStages: { mode: "all" as const, allThreshold: { enabled: true, target: 80, atRiskEnabled: true, atRisk: 60 }, specific: {} },
    apps: { mode: "all" as const, allThreshold: { enabled: true, target: 80, atRiskEnabled: true, atRisk: 60 }, specific: {} },
  };

  const changeWithThresholdView: SavedView = {
    name: "Change Coverage with Threshold",
    scope: "All Labs",
    dateRange: "Last 30 days",
    metrics: ["change"],
    wizardData: {
      dateRange: "Last 30 days",
      scope: "All Labs",
      testStage: "",
      testProjectId: "",
      metrics: ["change"],
      thresholds: { change: changeThresholdQg },
      name: "Change Coverage with Threshold",
    },
    qgSettings: changeThresholdQg,
    createdBy: "Sam Wilson",
    createdAt: "Mar 22, 2026",
  };

  const seededViews = [defaultView, changeOnlyView, changeAndEntireView, allMetricsView, changeWithThresholdView];

  const [mode, setMode] = useState<Mode>("saved");
  const [isEditing, setIsEditing] = useState(false);
  const [editingInitial, setEditingInitial] = useState<WizardData | undefined>(undefined);
  const [savedViews, setSavedViews] = useState<SavedView[]>(seededViews);
  const [activeView, setActiveView] = useState<SavedView | null>(defaultView);
  const [viewDropdownOpen, setViewDropdownOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Creating Your Coverage Analysis...");
  const [showLoadingStages, setShowLoadingStages] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1000);
  };

  const handleWizardComplete = (data: WizardData) => {
    const view: SavedView = {
      name: data.name,
      scope: data.scope,
      dateRange: data.dateRange,
      metrics: data.metrics,
      wizardData: data,
      filters: isEditing ? activeView?.filters : undefined,
      qgSettings: data.thresholds.change || (isEditing ? activeView?.qgSettings : undefined),
      entireQgSettings: data.thresholds.entire || (isEditing ? activeView?.entireQgSettings : undefined),
    };
    setLoadingMessage(isEditing ? "Updating Your Coverage Analysis..." : "Generating Your Coverage Analysis...");
    setShowLoadingStages(true);
    setMode("loading");
    setTimeout(() => {
      if (isEditing && activeView) {
        setSavedViews((prev) => prev.map((v) => (v.name === activeView.name ? view : v)));
      } else {
        setSavedViews((prev) => [...prev, view]);
      }
      setActiveView(view);
      setIsEditing(false);
      setEditingInitial(undefined);
      setLastUpdated(new Date());
      setShowLoadingStages(false);
      setMode("saved");
    }, 40000);
  };

  const handleWizardCancel = () => {
    if (isEditing && activeView) {
      setIsEditing(false);
      setEditingInitial(undefined);
      setMode("saved");
    } else if (savedViews.length > 0) {
      selectView(savedViews[0]);
    } else {
      setMode("welcome");
    }
  };

  const startNewView = () => {
    setViewDropdownOpen(false);
    setIsEditing(false);
    setEditingInitial(undefined);
    setActiveView(null);
    setMode("welcome");
  };

  const startWizardFromWelcome = () => {
    setIsEditing(false);
    setEditingInitial(undefined);
    setActiveView(null);
    setMode("wizard");
  };

  const handleEdit = () => {
    if (activeView) {
      setEditingInitial(activeView.wizardData);
      setIsEditing(true);
      setMode("wizard");
    }
  };

  const handleDeleteView = (viewToDelete: SavedView, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedViews((prev) => prev.filter((v) => v.name !== viewToDelete.name));
    if (activeView?.name === viewToDelete.name) {
      const remaining = savedViews.filter((v) => v.name !== viewToDelete.name);
      if (remaining.length > 0) {
        selectView(remaining[0]);
      } else {
        setActiveView(null);
        setMode("welcome");
        setViewDropdownOpen(false);
      }
    }
  };

  const selectView = (view: SavedView) => {
    setActiveView(view);
    setViewDropdownOpen(false);
    setLoadingMessage("Loading Your Coverage Analysis...");
    setShowLoadingStages(false);
    setMode("loading");
    setTimeout(() => {
      setLastUpdated(new Date());
      setMode("saved");
    }, 1200);
  };

  const showViewBar = true;

  return (
    <div className="min-h-screen bg-background">
      <TopNav />

      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-link">Coverage Analysis</h1>
          <button
            onClick={() => setHelpOpen(true)}
            className="p-1 hover:bg-muted rounded"
            aria-label="Open help"
            title="Help & documentation"
          >
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {showViewBar && (
          <>
            <div className="flex items-center gap-3 px-6 py-3 bg-surface-filter border border-border rounded-lg">
              <span className="text-sm text-muted-foreground font-medium">View</span>
              <div className="relative">
                <button
                  onClick={() => setViewDropdownOpen(!viewDropdownOpen)}
                  className="flex items-center gap-2 w-72 px-3 py-2 border border-border rounded text-sm text-foreground bg-card hover:border-ring transition-colors"
                >
                  <span className={`flex-1 text-left ${activeView ? "text-foreground" : "text-muted-foreground"}`}>
                    {activeView?.name || "Select or create a view"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                {viewDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-lg shadow-lg z-50">
                    <TooltipProvider delayDuration={150}>
                      {savedViews.map((v) => (
                        <div
                          key={v.name}
                          className="flex items-center justify-between hover:bg-muted transition-colors group"
                        >
                          <button
                            onClick={() => selectView(v)}
                            className="flex-1 text-left px-4 py-2 text-sm text-foreground"
                          >
                            {v.name}
                          </button>
                          {(v.createdBy || v.createdAt) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span
                                  onClick={(e) => e.stopPropagation()}
                                  className="px-1 py-2 text-muted-foreground hover:text-foreground cursor-default opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p className="text-xs">
                                  Created by {v.createdBy ?? "Unknown"}
                                  {v.createdAt ? ` on ${v.createdAt}` : ""}.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <button
                            onClick={(e) => handleDeleteView(v, e)}
                            className="px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ))}
                    </TooltipProvider>
                    <div className="border-t border-border">
                      <button
                        onClick={startNewView}
                        className="w-full text-left px-4 py-2 text-sm text-link hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Create new view
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {mode === "saved" && activeView && (
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={handleEdit} className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-link transition-colors mr-3">
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <ExportMenu
                    viewName={activeView.name}
                    scope={activeView.scope}
                    dateRange={activeView.dateRange}
                    metrics={activeView.metrics}
                  />
                  <div className="flex items-center gap-2 ml-4">
                    {isRefreshing ? (
                      <span className="text-xs text-muted-foreground">Updating...</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Last updated: {lastUpdated.toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                    )}
                    <button onClick={handleRefresh} className="p-1.5 hover:bg-muted rounded transition-colors">
                      <RotateCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-4">
          {mode === "welcome" && (
            <div className="bg-card border border-border rounded-lg min-h-[calc(100vh-220px)] flex">
              <WelcomeState onGetStarted={startWizardFromWelcome} />
            </div>
          )}
          {mode === "wizard" && (
            <ViewWizard
              initial={editingInitial}
              isEditing={isEditing}
              testStageNames={["Regression Tests", "Unit Tests", "Functional Tests", "Component Tests"]}
              appNames={["inventory-mgr", "payment-gateway", "auth-service", "user-profile-api"]}
              onComplete={handleWizardComplete}
              onCancel={handleWizardCancel}
            />
          )}
          {mode === "loading" && (
            <div className="bg-card border border-border rounded-lg min-h-[calc(100vh-220px)] flex">
              <LoadingState message={loadingMessage} showStages={showLoadingStages} />
            </div>
          )}
          {mode === "saved" && activeView && (
            <CoverageDashboard
              viewName={activeView.name}
              scope={activeView.scope}
              dateRange={activeView.dateRange}
              selectedMetrics={activeView.metrics}
              initialFilters={activeView.filters}
              initialQgSettings={activeView.qgSettings}
              initialEntireQgSettings={activeView.entireQgSettings}
              onSettingsChange={(filters, qgSettings, entireQgSettings) => {
                const updated = { ...activeView, filters, qgSettings, entireQgSettings };
                setActiveView(updated);
                setSavedViews((prev) => prev.map((v) => (v.name === activeView.name ? updated : v)));
              }}
            />
          )}
        </div>
      </div>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default Index;
