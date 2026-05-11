import { useState } from "react";
import { Calendar as CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const lastPresets = ["Last 24 hours", "Last 7 days", "Last 14 days", "Last 30 days", "Last 3 months", "Last 6 months"];
const fixedPresets = ["Yesterday", "Previous Week", "Previous Month", "Previous Quarter"];
const sincePresets = ["Today", "Current Week", "Current Month", "Current Quarter"];
const unitTypes = ["hours", "days", "weeks", "months"] as const;
type UnitType = (typeof unitTypes)[number];

const formatTimeOption = (hour24: number, minute: number) => {
  const period = hour24 < 12 ? "AM" : "PM";
  let h: number;
  if (period === "AM") {
    h = hour24; // 0..11, keep 0 as "00"
  } else {
    h = hour24 === 12 ? 12 : hour24 - 12; // PM: 12 stays, 13->1
  }
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
};
const hourOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour24 = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return formatTimeOption(hour24, minute);
});
const DEFAULT_TIME = "00:00 AM";
const isWithinLast48h = (d?: Date) => {
  if (!d) return false;
  const now = Date.now();
  const t = d.getTime();
  return t <= now && t >= now - 48 * 60 * 60 * 1000;
};

type Mode = "fixed" | "since" | "last";

interface InlineDateRangePickerProps {
  value: string;
  onSave: (value: string) => void;
}

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

const InlineDateRangePicker = ({ value, onSave }: InlineDateRangePickerProps) => {
  const [mode, setMode] = useState<Mode>(() => {
    if (value.startsWith("Since")) return "since";
    if (value.includes("–")) return "fixed";
    return "last";
  });

  // Last mode
  const isPreset = value && lastPresets.includes(value);
  const customMatch = !isPreset && value ? value.match(/^Last\s+(\d+)\s+(hours|days|weeks|months)$/i) : null;
  const [lastChoice, setLastChoice] = useState<string>(isPreset ? value : "");
  const [customMode, setCustomMode] = useState<boolean>(!!customMatch);
  const [customNum, setCustomNum] = useState<string>(customMatch ? customMatch[1] : "");
  const [customUnit, setCustomUnit] = useState<UnitType>(
    customMatch ? (customMatch[2].toLowerCase() as UnitType) : "days"
  );

  // Fixed mode state
  const isFixedPreset = value && fixedPresets.includes(value);
  const [fixedPreset, setFixedPreset] = useState<string>(isFixedPreset ? value : "");
  const [fixedCustom, setFixedCustom] = useState<boolean>(!isFixedPreset && value.includes("–"));
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState(DEFAULT_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_TIME);

  // Since mode state
  const sincePresetMatch = value.startsWith("Since ") ? sincePresets.find((p) => value === `Since ${p}`) : undefined;
  const [sincePreset, setSincePreset] = useState<string>(sincePresetMatch ?? "");
  const [sinceCustom, setSinceCustom] = useState<boolean>(value.startsWith("Since") && !sincePresetMatch);
  const [sinceDate, setSinceDate] = useState<Date>();
  const [sinceTime, setSinceTime] = useState(DEFAULT_TIME);

  const computeFixed = () => {
    if (fixedCustom) {
      if (!startDate || !endDate) return "";
      const s = format(startDate, "MMM d, yyyy") + (startTime ? ` ${startTime}` : "");
      const e = format(endDate, "MMM d, yyyy") + (endTime ? ` ${endTime}` : "");
      return `${s} – ${e}`;
    }
    return fixedPreset;
  };
  const computeSince = () => {
    if (sinceCustom) {
      if (!sinceDate) return "";
      const s = format(sinceDate, "MMM d, yyyy") + (sinceTime ? ` ${sinceTime}` : "");
      return `Since ${s}`;
    }
    return sincePreset ? `Since ${sincePreset}` : "";
  };
  const computeLast = () => {
    if (customMode) {
      const n = parseInt(customNum, 10);
      if (!n || n <= 0) return "";
      return `Last ${n} ${customUnit}`;
    }
    return lastChoice;
  };

  const draftValue =
    mode === "fixed" ? computeFixed() :
    mode === "since" ? computeSince() :
    computeLast();

  const canSave = !!draftValue;

  const handleSave = () => {
    if (draftValue) onSave(draftValue);
  };

  return (
    <div className="grid grid-cols-[320px_1fr] gap-0">
      <div className="space-y-2 pr-4">
        <ModeOption
          selected={mode === "fixed"}
          onClick={() => setMode("fixed")}
          icon={<CalendarIcon className="w-4 h-4" />}
          title="Fixed"
          subtitle="Specific start and end date."
        />
        <ModeOption
          selected={mode === "since"}
          onClick={() => setMode("since")}
          icon={<CalendarIcon className="w-4 h-4" />}
          title="Since"
          subtitle="Start date until now."
        />
        <ModeOption
          selected={mode === "last"}
          onClick={() => setMode("last")}
          icon={<ArrowLeft className="w-4 h-4" />}
          title="Last"
          subtitle="Most recent hours, days, or weeks."
        />
      </div>

      <div className="min-h-[260px] pl-6 border-l border-border">
        {mode === "last" && (
          <div className="space-y-1">
            <button
              onClick={() => { setCustomMode(true); setLastChoice(""); }}
              className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors text-link font-medium ${
                customMode ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              Custom...
            </button>
            {customMode && (
              <div className="flex items-center gap-2 px-2 py-2">
                <span className="text-sm text-foreground">Last</span>
                <input
                  type="number" min="1" placeholder="0"
                  value={customNum}
                  onChange={(e) => setCustomNum(e.target.value)}
                  className="w-20 px-2 py-1.5 border border-border rounded bg-card text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring text-center"
                />
                <select
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as UnitType)}
                  className="px-2 py-1.5 border border-border rounded bg-card text-sm text-foreground outline-none focus:border-ring"
                >
                  {unitTypes.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            )}
            {lastPresets.map((opt) => (
              <button
                key={opt}
                onClick={() => { setLastChoice(opt); setCustomMode(false); }}
                className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors text-foreground ${
                  !customMode && lastChoice === opt ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {mode === "since" && (
          <div className="space-y-1">
            <button
              onClick={() => { setSinceCustom(true); setSincePreset(""); }}
              className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors text-link font-medium ${
                sinceCustom ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              Custom...
            </button>
            {sinceCustom && (
              <div className="flex items-center gap-2 px-2 py-2">
                <label className="text-xs font-medium text-muted-foreground w-10 shrink-0">Start</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex-1 flex items-center justify-between px-3 py-2 border border-border rounded bg-card text-sm text-left hover:border-ring transition-colors",
                        !sinceDate && "text-muted-foreground"
                      )}
                    >
                      {sinceDate ? format(sinceDate, "MMM d, yyyy") : "Pick date"}
                      <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom">
                    <Calendar mode="single" selected={sinceDate} onSelect={setSinceDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <select
                  value={sinceTime}
                  onChange={(e) => setSinceTime(e.target.value)}
                  disabled={!isWithinLast48h(sinceDate)}
                  className="w-24 px-2 py-2 border border-border rounded bg-card text-sm text-foreground outline-none focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            )}
            {sincePresets.map((opt) => (
              <button
                key={opt}
                onClick={() => { setSincePreset(opt); setSinceCustom(false); }}
                className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors text-foreground ${
                  !sinceCustom && sincePreset === opt ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {mode === "fixed" && (
          <div className="space-y-1">
            <button
              onClick={() => { setFixedCustom(true); setFixedPreset(""); }}
              className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors text-link font-medium ${
                fixedCustom ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              Custom...
            </button>
            {fixedCustom && (
              <div className="space-y-2 px-2 py-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground w-10 shrink-0">Start</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 flex items-center justify-between px-3 py-2 border border-border rounded bg-card text-sm text-left hover:border-ring transition-colors",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        {startDate ? format(startDate, "MMM d, yyyy") : "Pick date"}
                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" side="bottom">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={!isWithinLast48h(startDate)}
                    className="w-24 px-2 py-2 border border-border rounded bg-card text-sm text-foreground outline-none focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground w-10 shrink-0">End</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "flex-1 flex items-center justify-between px-3 py-2 border border-border rounded bg-card text-sm text-left hover:border-ring transition-colors",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        {endDate ? format(endDate, "MMM d, yyyy") : "Pick date"}
                        <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" side="bottom">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={!isWithinLast48h(endDate)}
                    className="w-24 px-2 py-2 border border-border rounded bg-card text-sm text-foreground outline-none focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
            )}
            {fixedPresets.map((opt) => (
              <button
                key={opt}
                onClick={() => { setFixedPreset(opt); setFixedCustom(false); }}
                className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors text-foreground ${
                  !fixedCustom && fixedPreset === opt ? "bg-muted" : "hover:bg-muted/60"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-2 flex justify-end pt-3 mt-3 -mx-5 -mb-5 px-5 pb-5 bg-surface-filter rounded-b-lg">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`px-5 py-2 rounded text-sm font-medium transition-all ${
            canSave
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default InlineDateRangePicker;
