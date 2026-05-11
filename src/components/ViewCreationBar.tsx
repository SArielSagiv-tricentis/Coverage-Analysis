import ScopeDropdown from "./ScopeDropdown";
import DateRangeDropdown from "./DateRangeDropdown";

interface ViewCreationBarProps {
  viewName: string;
  scope: string;
  dateRange: string;
  onViewNameChange: (v: string) => void;
  onScopeChange: (v: string) => void;
  onDateRangeChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ViewCreationBar = ({
  viewName, scope, dateRange,
  onViewNameChange, onScopeChange, onDateRangeChange,
  onSave, onCancel,
}: ViewCreationBarProps) => {
  const canSave = viewName.trim() && scope && dateRange;

  return (
    <div className="flex items-center gap-4 px-6 py-3 bg-surface-filter border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">View</span>
        <input
          type="text"
          placeholder="Enter a view name"
          value={viewName}
          onChange={(e) => onViewNameChange(e.target.value)}
          className="w-56 px-3 py-2 border border-border rounded text-sm bg-card text-foreground placeholder:text-muted-foreground outline-none focus:border-ring"
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Scope</span>
        <ScopeDropdown value={scope} onChange={onScopeChange} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Date Range</span>
        <DateRangeDropdown value={dateRange} onChange={onDateRangeChange} />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onSave}
          disabled={!canSave}
          className={`px-5 py-2 rounded text-sm font-medium transition-all ${
            canSave
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ViewCreationBar;
