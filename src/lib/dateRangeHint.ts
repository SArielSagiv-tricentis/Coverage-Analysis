import {
  format,
  subDays,
  subMonths,
  subWeeks,
  subHours,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
} from "date-fns";

const fmt = (d: Date) => format(d, "MMM d, yyyy");

export const computeRangeHint = (value: string): string | null => {
  if (!value) return null;
  const now = new Date();

  const lastMatch = value.match(/^Last (\d+) (hours|days|weeks|months)$/i);
  if (lastMatch) {
    const n = parseInt(lastMatch[1], 10);
    const unit = lastMatch[2].toLowerCase();
    let start = now;
    if (unit === "hours") start = subHours(now, n);
    else if (unit === "days") start = subDays(now, n);
    else if (unit === "weeks") start = subWeeks(now, n);
    else if (unit === "months") start = subMonths(now, n);
    return `${fmt(start)} – ${fmt(now)}`;
  }
  if (/^Last 24 hours$/i.test(value)) {
    return `${fmt(subHours(now, 24))} – ${fmt(now)}`;
  }

  switch (value) {
    case "Yesterday": {
      return fmt(subDays(now, 1));
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
