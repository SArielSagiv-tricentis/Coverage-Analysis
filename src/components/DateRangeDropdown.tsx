import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  subDays,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
} from "date-fns";

const fmt = (d: Date) => format(d, "MMM d, yyyy");

const computeRangeHint = (value: string): string | null => {
  if (!value) return null;
  const now = new Date();
  const lastMatch = value.match(/^Last (\d+) (days|months)$/);
  if (lastMatch) {
    const n = parseInt(lastMatch[1], 10);
    const start = lastMatch[2] === "days" ? subDays(now, n) : subMonths(now, n);
    return `${fmt(start)} – ${fmt(now)}`;
  }
  switch (value) {
    case "Yesterday": {
      const y = subDays(now, 1);
      return fmt(y);
    }
    case "Previous Week": {
      const s = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      const e = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
      return `${fmt(s)} – ${fmt(e)}`;
    }
    case "Previous Month": {
      const ref = subMonths(now, 1);
      return `${fmt(startOfMonth(ref))} – ${fmt(endOfMonth(ref))}`;
    }
    case "Previous Quarter": {
      const ref = subMonths(now, 3);
      return `${fmt(startOfQuarter(ref))} – ${fmt(endOfQuarter(ref))}`;
    }
    case "Since Today":
      return fmt(now);
    case "Since Current Week":
      return `${fmt(startOfWeek(now, { weekStartsOn: 1 }))} – ${fmt(now)}`;
    case "Since Current Month":
      return `${fmt(startOfMonth(now))} – ${fmt(now)}`;
    case "Since Current Quarter":
      return `${fmt(startOfQuarter(now))} – ${fmt(now)}`;
  }
  return null;
};

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const lastOptions = ["Last 7 days", "Last 14 days", "Last 30 days", "Last 3 months", "Last 6 months"];
const fixedPresets = ["Yesterday", "Previous Week", "Previous Month", "Previous Quarter"];
const sincePresets = ["Today", "Current Week", "Current Month", "Current Quarter"];

const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const period = i < 12 ? "AM" : "PM";
  const h = i % 12 === 0 ? 12 : i % 12;
  return `${String(h).padStart(2, "0")}:00 ${period}`;
});

interface DateRangeDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const DateRangeDropdown = ({ value, onChange }: DateRangeDropdownProps) => {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"fixed" | "since" | "last">("last");
  const [fixedMode, setFixedMode] = useState<"preset" | "custom">("preset");
  const [sinceMode, setSinceMode] = useState<"preset" | "custom">("preset");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sinceDate, setSinceDate] = useState<Date>();
  const [sinceTime, setSinceTime] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        const popoverContent = document.querySelector('[data-radix-popper-content-wrapper]');
        if (popoverContent && popoverContent.contains(target)) return;
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (tab === "fixed" && fixedMode === "custom" && startDate && endDate) {
      const s = format(startDate, "MMM d, yyyy") + (startTime ? ` ${startTime}` : "");
      const e = format(endDate, "MMM d, yyyy") + (endTime ? ` ${endTime}` : "");
      onChange(`${s} – ${e}`);
    }
  }, [startDate, endDate, startTime, endTime, fixedMode, tab]);

  useEffect(() => {
    if (tab === "since" && sinceMode === "custom" && sinceDate) {
      const s = format(sinceDate, "MMM d, yyyy") + (sinceTime ? ` ${sinceTime}` : "");
      onChange(`Since ${s}`);
    }
  }, [sinceDate, sinceTime, sinceMode, tab]);

  const renderInlineRow = (
    label: string,
    date: Date | undefined,
    setDate: (d: Date | undefined) => void,
    time: string,
    setTime: (t: string) => void,
  ) => (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-muted-foreground w-12 shrink-0">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex-1 flex items-center justify-between px-3 py-2 border border-border rounded bg-card text-sm text-left hover:border-ring transition-colors",
              !date && "text-muted-foreground"
            )}
          >
            {date ? format(date, "MMM d, yyyy") : "Pick date"}
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <select
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-24 px-2 py-2 border border-border rounded bg-card text-sm text-foreground outline-none focus:border-ring transition-colors"
      >
        <option value="">--:--</option>
        {hourOptions.map((h) => <option key={h} value={h}>{h}</option>)}
      </select>
    </div>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 min-w-64 px-3 py-2 border border-border rounded bg-card text-sm hover:border-ring transition-colors"
      >
        <span className={`flex-1 text-left whitespace-nowrap ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value || "Select range"}
          {value && computeRangeHint(value) && (
            <span className="ml-1.5 text-muted-foreground font-normal">({computeRangeHint(value)})</span>
          )}
        </span>
        <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-80 bg-popover border border-border rounded-lg shadow-lg z-50">
          <div className="flex border-b border-border">
            {(["fixed", "since", "last"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                  tab === t ? "text-link border-b-2 border-link" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {tab === "fixed" ? (
            <div className="py-1">
              <button
                onClick={() => setFixedMode("custom")}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                  fixedMode === "custom" ? "text-link font-medium" : "text-foreground"
                )}
              >
                Custom...
              </button>
              {fixedMode === "custom" && (
                <div className="px-3 py-2 space-y-2 border-y border-border bg-surface-filter">
                  {renderInlineRow("Start", startDate, setStartDate, startTime, setStartTime)}
                  {renderInlineRow("End", endDate, setEndDate, endTime, setEndTime)}
                </div>
              )}
              {fixedPresets.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setFixedMode("preset"); onChange(opt); setOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : tab === "since" ? (
            <div className="py-1">
              <button
                onClick={() => setSinceMode("custom")}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors",
                  sinceMode === "custom" ? "text-link font-medium" : "text-foreground"
                )}
              >
                Custom...
              </button>
              {sinceMode === "custom" && (
                <div className="px-3 py-2 space-y-2 border-y border-border bg-surface-filter">
                  {renderInlineRow("Start", sinceDate, setSinceDate, sinceTime, setSinceTime)}
                </div>
              )}
              {sincePresets.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setSinceMode("preset"); onChange(`Since ${opt}`); setOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-1">
              {lastOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangeDropdown;
