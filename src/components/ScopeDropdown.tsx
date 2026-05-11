import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Check } from "lucide-react";
import NewScopeDialog from "./NewScopeDialog";

const labItems = ["Lab name 1", "Lab name 2", "Lab name 3", "Lab name 4", "Lab name 5", "Lab name 6"];
const advancedItems = ["Payment group", "Flight Booking", "Saved Scope 1", "Saved Scope 2", "Saved Scope 3"];

interface ScopeDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const ScopeDropdown = ({ value, onChange }: ScopeDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"lab" | "advanced">("lab");
  const [search, setSearch] = useState("");
  const [showNewScope, setShowNewScope] = useState(false);
  const [selectedLabs, setSelectedLabs] = useState<string[]>(() =>
    value ? value.split(", ").filter((v) => labItems.includes(v)) : []
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const items = tab === "lab" ? labItems : advancedItems;
  const filtered = items.filter((i) => i.toLowerCase().includes(search.toLowerCase()));

  const toggleLab = (lab: string) => {
    const next = selectedLabs.includes(lab)
      ? selectedLabs.filter((l) => l !== lab)
      : [...selectedLabs, lab];
    setSelectedLabs(next);
    onChange(next.join(", "));
  };

  const displayValue = tab === "lab" && selectedLabs.length > 0
    ? (selectedLabs.length === 1 ? selectedLabs[0] : `${selectedLabs.length} labs selected`)
    : value;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-64 px-3 py-2 border border-border rounded bg-card text-sm text-foreground hover:border-ring transition-colors"
      >
        <span className={`truncate ${displayValue ? "text-foreground" : "text-muted-foreground"}`}>
          {displayValue || "Select scope"}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-lg shadow-lg z-50">
          <div className="flex border-b border-border">
            <button
              onClick={() => { setTab("lab"); setSearch(""); }}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === "lab" ? "text-link border-b-2 border-link" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Scope by Lab
            </button>
            <button
              onClick={() => { setTab("advanced"); setSearch(""); }}
              className={`flex-1 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                tab === "advanced" ? "text-link border-b-2 border-link" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Advanced Scope
            </button>
          </div>

          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1.5 border border-border rounded bg-card">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {tab === "advanced" && (
              <button
                onClick={() => { setShowNewScope(true); setOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-link hover:bg-muted transition-colors"
              >
                Create new scope...
              </button>
            )}
            {filtered.map((item) => (
              tab === "lab" ? (
                <button
                  key={item}
                  onClick={() => toggleLab(item)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    selectedLabs.includes(item) ? "bg-[hsl(var(--link))] border-[hsl(var(--link))]" : "border-border"
                  }`}>
                    {selectedLabs.includes(item) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {item}
                </button>
              ) : (
                <button
                  key={item}
                  onClick={() => { onChange(item); setOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {item}
                </button>
              )
            ))}
          </div>
        </div>
      )}

      <NewScopeDialog open={showNewScope} onClose={() => setShowNewScope(false)} />
    </div>
  );
};

export default ScopeDropdown;
