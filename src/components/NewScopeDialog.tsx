import { useState, useRef, useEffect, useMemo } from "react";
import { X, Trash2, Plus, ChevronDown, Search, Check } from "lucide-react";

interface FilterRow {
  id: number;
  column: string;
  condition: string;
  value: string[];
}

interface FilterGroup {
  id: number;
  filters: FilterRow[];
}

const columnOptions = ["App", "Branch", "Lab", "Code Label"];
const allConditions = ["is one of", "is not one of", "contains", "starts with", "ends with"];

const getConditionsFor = (column: string) => {
  if (column === "Branch") {
    return allConditions.filter((c) => c !== "is one of" && c !== "is not one of");
  }
  if (column === "Code Label") {
    return allConditions.filter((c) => c !== "contains" && c !== "starts with" && c !== "ends with");
  }
  return allConditions;
};

const isMultiSelectCondition = (condition: string) =>
  condition === "is one of" || condition === "is not one of";

// Value options per column
type ValueCategory = { name: string; items: string[] };

const flatOptionsByColumn: Record<string, string[]> = {
  App: [
    "checkout-web",
    "marketing-site",
    "admin-portal",
    "ios-app",
    "android-app",
    "payments-svc",
    "auth-svc",
    "notifications-svc",
  ],
  Branch: ["main", "master", "release/2026.05", "release/2026.04"],
  Lab: ["lab-us-east", "lab-us-west", "lab-eu-central", "lab-eu-north"],
};

const hierarchicalOptionsByColumn: Record<string, ValueCategory[]> = {
  "Code Label": [
    { name: "Priority", items: ["critical", "high", "medium", "low"] },
    { name: "Domain", items: ["payments", "auth", "ui", "infra"] },
  ],
};

const isHierarchical = (column: string) => column === "Code Label";

interface NewScopeDialogProps {
  open: boolean;
  onClose: () => void;
}

const NewScopeDialog = ({ open, onClose }: NewScopeDialogProps) => {
  const [groups, setGroups] = useState<FilterGroup[]>([
    { id: 1, filters: [{ id: 1, column: "", condition: "", value: [] }] },
  ]);

  const addFilter = (groupId: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, filters: [...g.filters, { id: Date.now(), column: "", condition: "", value: [] }] }
          : g
      )
    );
  };

  const removeFilter = (groupId: number, filterId: number) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, filters: g.filters.filter((f) => f.id !== filterId) } : g
      )
    );
  };

  const updateFilter = (
    groupId: number,
    filterId: number,
    patch: Partial<FilterRow>
  ) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              filters: g.filters.map((f) => (f.id === filterId ? { ...f, ...patch } : f)),
            }
          : g
      )
    );
  };

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      { id: Date.now(), filters: [{ id: Date.now() + 1, column: "", condition: "", value: [] }] },
    ]);
  };

  const clearAll = () => {
    setGroups([{ id: 1, filters: [{ id: 1, column: "", condition: "", value: [] }] }]);
  };

  const hasValues = groups.some((g) =>
    g.filters.some((f) => f.column && f.condition && f.value.length > 0)
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-foreground/20 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="flex items-start justify-between p-6 pb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">New Code Scope</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create rules to dynamically identify the code you want to track.
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-6 pb-4 space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="bg-secondary/50 rounded-lg p-4 space-y-3">
              {group.filters.map((filter, idx) => {
                const conditions = filter.column ? getConditionsFor(filter.column) : allConditions;
                const useMulti = isMultiSelectCondition(filter.condition);
                return (
                  <div key={filter.id} className="flex items-center gap-2">
                    {idx === 0 && <span className="text-sm text-foreground w-12 shrink-0">Where</span>}
                    {idx > 0 && <span className="text-sm text-muted-foreground w-12 shrink-0">And</span>}

                    <SelectField
                      placeholder="Column"
                      value={filter.column}
                      options={columnOptions}
                      onChange={(v) => {
                        // Reset condition/value if invalid for new column
                        const validConds = getConditionsFor(v);
                        const nextCond = validConds.includes(filter.condition) ? filter.condition : "";
                        updateFilter(group.id, filter.id, { column: v, condition: nextCond, value: [] });
                      }}
                    />
                    <SelectField
                      placeholder="Condition"
                      value={filter.condition}
                      options={conditions}
                      disabled={!filter.column}
                      onChange={(v) =>
                        updateFilter(group.id, filter.id, { condition: v, value: [] })
                      }
                    />
                    {useMulti ? (
                      <MultiSelectValue
                        column={filter.column}
                        value={filter.value}
                        onChange={(v) => updateFilter(group.id, filter.id, { value: v })}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Value"
                        value={filter.value[0] || ""}
                        disabled={!filter.condition}
                        onChange={(e) =>
                          updateFilter(group.id, filter.id, { value: e.target.value ? [e.target.value] : [] })
                        }
                        className="flex-1 min-w-0 px-3 py-2 border border-border rounded text-sm bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-ring disabled:opacity-50"
                      />
                    )}
                    <button
                      onClick={() => removeFilter(group.id, filter.id)}
                      className="p-1.5 hover:bg-muted rounded text-muted-foreground transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => addFilter(group.id)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-4 h-4" /> New Filter
              </button>
            </div>
          ))}

          <button
            onClick={addGroup}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" /> New Group
          </button>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button onClick={clearAll} className="text-sm text-foreground hover:text-link transition-colors">
            Clear all
          </button>
          <button
            disabled={!hasValues}
            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            Save as New Scope
          </button>
        </div>
      </div>
    </div>
  );
};

const useClickOutside = (ref: React.RefObject<HTMLElement>, onOutside: () => void) => {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
};

const SelectField = ({
  placeholder,
  value,
  options,
  onChange,
  disabled,
}: {
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-border rounded text-sm bg-card hover:border-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={value ? "text-foreground truncate" : "text-muted-foreground truncate"}>
          {value || placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-popover border border-border rounded shadow-lg z-50">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const MultiSelectValue = ({
  column,
  value,
  onChange,
}: {
  column: string;
  value: string[];
  onChange: (v: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const hierarchical = isHierarchical(column);
  const categories = hierarchicalOptionsByColumn[column] || [];
  const flatItems = flatOptionsByColumn[column] || [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({
        ...c,
        items: c.items.filter((i) => i.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)),
      }))
      .filter((c) => c.items.length > 0);
  }, [categories, search]);

  const filteredFlat = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return flatItems;
    return flatItems.filter((i) => i.toLowerCase().includes(q));
  }, [flatItems, search]);

  const toggle = (item: string) => {
    if (value.includes(item)) onChange(value.filter((v) => v !== item));
    else onChange([...value, item]);
  };

  const toggleCategory = (cat: ValueCategory) => {
    const allSelected = cat.items.every((i) => value.includes(i));
    if (allSelected) {
      onChange(value.filter((v) => !cat.items.includes(v)));
    } else {
      const next = new Set([...value, ...cat.items]);
      onChange(Array.from(next));
    }
  };

  const disabled = !column;

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-border rounded text-sm bg-card hover:border-ring transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className={`truncate ${value.length ? "text-foreground" : "text-muted-foreground"}`}>
          {value.length === 0
            ? "Value"
            : value.length === 1
            ? value[0]
            : `${value.length} selected`}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-0.5 hover:bg-muted rounded text-muted-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded shadow-lg z-50">
          <div className="flex items-center gap-2 px-2 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {hierarchical ? (
              <>
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                )}
                {filtered.map((cat) => {
                  const allSelected = cat.items.every((i) => value.includes(i));
                  const someSelected = !allSelected && cat.items.some((i) => value.includes(i));
                  return (
                    <div key={cat.name} className="py-1">
                      <button
                        onClick={() => toggleCategory(cat)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <span
                          className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                            allSelected
                              ? "bg-primary border-primary"
                              : someSelected
                              ? "bg-primary/30 border-primary"
                              : "border-border"
                          }`}
                        >
                          {allSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                        </span>
                        {cat.name}
                      </button>
                      {cat.items.map((item) => {
                        const checked = value.includes(item);
                        return (
                          <button
                            key={item}
                            onClick={() => toggle(item)}
                            className="w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                          >
                            <span
                              className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                                checked ? "bg-primary border-primary" : "border-border"
                              }`}
                            >
                              {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                            </span>
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {filteredFlat.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No results</div>
                )}
                {filteredFlat.map((item) => {
                  const checked = value.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggle(item)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <span
                        className={`w-3.5 h-3.5 border rounded flex items-center justify-center ${
                          checked ? "bg-primary border-primary" : "border-border"
                        }`}
                      >
                        {checked && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </span>
                      {item}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewScopeDialog;
