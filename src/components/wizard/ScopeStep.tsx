import { useEffect, useRef, useState } from "react";
import { ChevronRight, ChevronDown, Calendar, Code2, FlaskConical, Check, Search, Type } from "lucide-react";
import NewScopeDialog from "../NewScopeDialog";
import InlineDateRangePicker from "./InlineDateRangePicker";
import type { WizardData } from "./types";
import { computeRangeHint } from "@/lib/dateRangeHint";

interface ScopeStepProps {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
}

type Section = "date" | "code" | "test" | null;

const labItems = ["Lab name 1", "Lab name 2", "Lab name 3", "Lab name 4", "Lab name 5", "Lab name 6"];
const codeRules = ["Payment group", "Flight Booking", "Saved Scope 1", "Saved Scope 2"];
const testStages = ["Regression Tests", "Unit Tests", "Functional Tests", "Component Tests"];


const Card = ({
  icon, title, subtitle, open, onToggle, children, optional,
}: {
  icon: React.ReactNode; title: string; subtitle: string; open: boolean;
  onToggle: () => void; children?: React.ReactNode; optional?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open && ref.current) {
      // Wait for expand animation/layout, then scroll the card so its Save button is visible.
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      });
    }
  }, [open]);
  return (
    <div ref={ref} className="bg-surface-filter border border-border rounded-lg overflow-hidden scroll-mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-surface-panel transition-colors"
      >
        <div className="w-11 h-11 rounded-lg bg-[hsl(var(--icon-accent-bg))] flex items-center justify-center shrink-0 text-white">
          {icon}
        </div>
        <div className="flex-1 text-left">
          <div className="text-base font-semibold text-foreground">
            {title} {optional && <span className="text-muted-foreground font-normal">(Optional)</span>}
          </div>
          <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>
        </div>
        {open ? (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      {open && children && <div className="border-t border-border bg-card p-5">{children}</div>}
    </div>
  );
};

const Radio = ({ checked }: { checked: boolean }) => (
  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
    checked ? "border-link" : "border-muted-foreground/60"
  }`}>
    {checked && <div className="w-2 h-2 rounded-full bg-link" />}
  </div>
);

const ModeOption = ({
  selected, onClick, icon, title, subtitle,
}: { selected: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
      selected ? "bg-surface-panel" : "hover:bg-muted/50"
    }`}
  >
    <Radio checked={selected} />
    <div className="w-9 h-9 rounded-md bg-success/20 flex items-center justify-center shrink-0 text-success">
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="text-sm font-semibold text-foreground truncate">{title}</div>
      <div className="text-xs text-muted-foreground truncate">{subtitle}</div>
    </div>
  </button>
);

const MultiSelectList = ({
  label, placeholder, search, setSearch, items, selected, onToggle,
}: {
  label: string;
  placeholder: string;
  search: string;
  setSearch: (v: string) => void;
  items: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) => (
  <div>
    <label className="text-sm text-foreground mb-1 block">{label}</label>
    <div className="flex items-center gap-2 px-3 py-2 border border-border rounded bg-card mb-2">
      <Search className="w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
    <div className="max-h-44 overflow-y-auto space-y-1">
      {items.length === 0 && (
        <div className="px-2 py-3 text-xs text-muted-foreground text-center">No matches</div>
      )}
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onToggle(item)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-muted rounded transition-colors text-left"
        >
          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
            selected.includes(item) ? "bg-link border-link" : "border-border"
          }`}>
            {selected.includes(item) && <Check className="w-3 h-3 text-white" />}
          </div>
          {item}
        </button>
      ))}
    </div>
  </div>
);

const ScopeStep = ({ data, update }: ScopeStepProps) => {
  const [section, setSection] = useState<Section>(null);
  const [codeMode, setCodeMode] = useState<"lab" | "rules">(
    data.scope && codeRules.includes(data.scope) ? "rules" : "lab"
  );
  const [search, setSearch] = useState("");
  const [showNewScope, setShowNewScope] = useState(false);
  const [draftScope, setDraftScope] = useState<string>(data.scope);
  const [draftStages, setDraftStages] = useState<string[]>(
    data.testStage ? data.testStage.split(", ").filter(Boolean) : []
  );
  const [stageSearch, setStageSearch] = useState("");

  const draftLabs = draftScope && !codeRules.includes(draftScope)
    ? draftScope.split(", ").filter((v) => labItems.includes(v))
    : [];

  const toggleLab = (lab: string) => {
    const next = draftLabs.includes(lab)
      ? draftLabs.filter((l) => l !== lab)
      : [...draftLabs, lab];
    setDraftScope(next.join(", "));
  };

  const toggleStage = (s: string) =>
    setDraftStages(draftStages.includes(s) ? draftStages.filter((x) => x !== s) : [...draftStages, s]);

  const dateHint = computeRangeHint(data.dateRange);
  const dateSubtitle = data.dateRange
    ? `${data.dateRange}${dateHint ? ` (${dateHint})` : ""}`
    : "No date range selected yet.";
  const codeSubtitle = data.scope || "No code scope selected yet.";
  const testSubtitle = data.testStage || "No test scope selected.";

  const filteredLabs = labItems.filter((l) => l.toLowerCase().includes(search.toLowerCase()));
  const filteredRules = codeRules.filter((l) => l.toLowerCase().includes(search.toLowerCase()));
  const filteredStages = testStages.filter((l) => l.toLowerCase().includes(stageSearch.toLowerCase()));

  const saveCode = () => { update({ scope: draftScope }); setSection(null); };
  const saveTest = () => {
    update({ testStage: draftStages.join(", "), testProjectId: "" });
    setSection(null);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-3">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Where should we focus?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose the timeframe and code you want to see.
        </p>
      </div>

      <Card
        icon={<Calendar className="w-5 h-5" />}
        title="Date Range"
        subtitle={dateSubtitle}
        open={section === "date"}
        onToggle={() => setSection(section === "date" ? null : "date")}
      >
        <InlineDateRangePicker
          value={data.dateRange}
          onSave={(v) => { update({ dateRange: v }); setSection(null); }}
        />
      </Card>

      <Card
        icon={<Code2 className="w-5 h-5" />}
        title="Code Scope"
        subtitle={codeSubtitle}
        open={section === "code"}
        onToggle={() => { setDraftScope(data.scope); setSection(section === "code" ? null : "code"); }}
      >
        <div className="grid grid-cols-[320px_1fr] gap-0">
          <div className="space-y-2 pr-4">
            <ModeOption
              selected={codeMode === "lab"}
              onClick={() => { setCodeMode("lab"); setDraftScope(""); }}
              icon={<Calendar className="w-4 h-4" />}
              title="Pick by Lab"
              subtitle="Choose labs from the list."
            />
            <ModeOption
              selected={codeMode === "rules"}
              onClick={() => { setCodeMode("rules"); setDraftScope(""); }}
              icon={<Code2 className="w-4 h-4" />}
              title="Use Code Rules"
              subtitle="Use saved or custom rules."
            />
          </div>

          <div className="pl-6 border-l border-border">
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded bg-card mb-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
            {codeMode === "rules" && (
              <button
                onClick={() => setShowNewScope(true)}
                className="text-sm text-link hover:text-link-hover mb-2 block font-medium"
              >
                Create new code scope...
              </button>
            )}
            <div className="h-56 overflow-y-auto space-y-1">
              {codeMode === "lab"
                ? filteredLabs.map((lab) => (
                    <button
                      key={lab}
                      onClick={() => toggleLab(lab)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-foreground hover:bg-muted rounded transition-colors"
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        draftLabs.includes(lab) ? "bg-link border-link" : "border-border"
                      }`}>
                        {draftLabs.includes(lab) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {lab}
                    </button>
                  ))
                : filteredRules.map((rule) => (
                    <button
                      key={rule}
                      onClick={() => setDraftScope(rule)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${
                        draftScope === rule ? "bg-muted text-foreground" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      {rule}
                    </button>
                  ))}
            </div>
          </div>

          <div className="col-span-2 flex justify-end pt-3 -mx-5 -mb-5 px-5 pb-5 mt-3 bg-surface-filter rounded-b-lg">
            <button
              onClick={saveCode}
              disabled={!draftScope}
              className={`px-5 py-2 rounded text-sm font-medium transition-all ${
                draftScope
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      </Card>

      <Card
        icon={<FlaskConical className="w-5 h-5" />}
        title="Test Scope"
        subtitle={testSubtitle}
        open={section === "test"}
        onToggle={() => {
          setDraftStages(data.testStage ? data.testStage.split(", ").filter(Boolean) : []);
          setSection(section === "test" ? null : "test");
        }}
        optional
      >
        <MultiSelectList
          label="Test Stage"
          placeholder="Search test stages"
          search={stageSearch}
          setSearch={setStageSearch}
          items={filteredStages}
          selected={draftStages}
          onToggle={toggleStage}
        />
        <div className="flex justify-end pt-3 -mx-5 -mb-5 px-5 pb-5 mt-4 bg-surface-filter rounded-b-lg">
          <button
            onClick={saveTest}
            disabled={draftStages.length === 0}
            className={`px-5 py-2 rounded text-sm font-medium transition-all ${
              draftStages.length > 0
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            Save
          </button>
        </div>
      </Card>

      <NewScopeDialog open={showNewScope} onClose={() => setShowNewScope(false)} />
    </div>
  );
};

export default ScopeStep;
