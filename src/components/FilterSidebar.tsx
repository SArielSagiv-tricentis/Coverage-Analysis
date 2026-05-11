import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface FilterState {
  testStages: string[];
  labs: string[];
  apps: string[];
  qualityGates: string[];
}

const TEST_STAGE_OPTIONS = [
  "Regression Tests",
  "Unit Tests",
  "Functional Tests",
  "Component Tests",
];

const LAB_OPTIONS = ["Lab Alpha", "Lab Beta", "Lab Gamma", "Lab Delta"];

const APP_OPTIONS = [
  "inventory-mgr",
  "payment-gateway",
  "auth-service",
  "user-profile-api",
];

const QUALITY_GATE_OPTIONS = ["Passed", "Failed", "Warning", "Pending"];

interface FilterSidebarProps {
  visible: boolean;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  showThresholds?: boolean;
}

const MultiSelectDropdown = ({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const filteredOptions = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? selected[0]
      : `${selected.length} selected`;

  return (
    <div className="mb-6" ref={ref}>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full px-3 py-2 border border-border rounded text-sm text-muted-foreground bg-card hover:border-ring transition-colors"
        >
          <span className={selected.length > 0 ? "text-foreground" : ""}>
            {displayText}
          </span>
          <span className="flex items-center gap-1 shrink-0">
            {selected.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([]);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange([]);
                  }
                }}
                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown className="w-4 h-4" />
          </span>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg z-50">
            <div className="p-2 border-b border-border flex items-center gap-2">
              {(() => {
                const allSelected = filteredOptions.length > 0 && filteredOptions.every((o) => selected.includes(o));
                const toggleAll = () => {
                  if (allSelected) {
                    onChange(selected.filter((s) => !filteredOptions.includes(s)));
                  } else {
                    onChange(Array.from(new Set([...selected, ...filteredOptions])));
                  }
                };
                return (
                  <button
                    onClick={toggleAll}
                    aria-label="Select all"
                    title="Select all"
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      allSelected ? "bg-primary border-primary" : "border-border bg-card"
                    }`}
                  >
                    {allSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </button>
                );
              })()}
              <div className="flex-1 flex items-center gap-2 px-2 py-1.5 border border-border rounded bg-card">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground min-w-0"
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => toggle(option)}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        selected.includes(option)
                          ? "bg-primary border-primary"
                          : "border-border"
                      }`}
                    >
                      {selected.includes(option) && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                    {option}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChipMultiSelect = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) => {
  const toggle = (option: string) => {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {selected.length > 0 && (
          <button
            onClick={() => onChange([])}
            aria-label="Clear selection"
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => toggle(option)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-ring"
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const FilterSummary = ({ filters }: { filters: FilterState }) => {
  const items: { label: string; values: string[] }[] = [];
  if (filters.testStages.length > 0)
    items.push({ label: "Test Stage", values: filters.testStages });
  if (filters.labs.length > 0)
    items.push({ label: "Lab", values: filters.labs });
  if (filters.apps.length > 0)
    items.push({ label: "App", values: filters.apps });
  if (filters.qualityGates.length > 0)
    items.push({ label: "Threshold", values: filters.qualityGates });

  if (items.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 flex-wrap">
        {items.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground cursor-default">
                {item.values.length === 1
                  ? item.values[0]
                  : `${item.values.length} ${item.label}s`}
              </span>
            </TooltipTrigger>
            {item.values.length > 1 && (
              <TooltipContent>
                <p>{item.values.join(", ")}</p>
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
};

const FilterSidebar = ({
  visible,
  filters,
  onFiltersChange,
  showThresholds = false,
}: FilterSidebarProps) => {
  if (!visible) return null;

  const update = (key: keyof FilterState) => (values: string[]) => {
    onFiltersChange({ ...filters, [key]: values });
  };

  return (
    <div className="w-72 shrink-0 bg-surface-filter border border-border rounded-lg p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">Filter</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Refine the dashboard data by applying filters below.
      </p>
      <MultiSelectDropdown
        label="Test Stage"
        placeholder="Select a test stage"
        options={TEST_STAGE_OPTIONS}
        selected={filters.testStages}
        onChange={update("testStages")}
      />
      <MultiSelectDropdown
        label="Lab"
        placeholder="Select a lab"
        options={LAB_OPTIONS}
        selected={filters.labs}
        onChange={update("labs")}
      />
      {showThresholds && (
        <ChipMultiSelect
          label="Thresholds"
          options={QUALITY_GATE_OPTIONS}
          selected={filters.qualityGates}
          onChange={update("qualityGates")}
        />
      )}
    </div>
  );
};

export default FilterSidebar;
